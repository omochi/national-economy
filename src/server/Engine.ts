import * as _ from "lodash";
import * as Koa from "koa";
import * as koaStatic from "koa-static";
import { 
	server as WebSocketServer, 
	request as WebSocketRequest,
	connection as WebSocketConnection } from "websocket";
import * as http from "http";
import { CompositeDisposable, Disposable } from "rx";

import { toError } from "../../out/common/Error"; 
import { Timer } from "../../out/common/Timer";
import { Message, MessageConnection } from "../../out/common/Message";

import { rand, makeRandomString } from "./Util";
import { SessionManager } from "./Session";
import { SocketImpl } from "./SocketImpl";

export interface App {
	init(engine: Engine): void;

	createSessionData(): any;

	createConnectionHandler(connection: MessageConnection, sessionId: string): ConnectionHandler;
}

export interface ConnectionHandler {
	onMessage(message: Message): void;
	onDestroy(): void;
}

export interface ConnectionEntry {
	connection: MessageConnection;
	handler: ConnectionHandler;
	disposable: Disposable;
	sessionId: string;
}

export class Engine {
	constructor(app: App) {
		this.app_ = app;
	}
	connections(): ConnectionEntry[] {
		return this.connections_;
	}
	run() {
		this.app_.init(this);
		this.diposable_ = new CompositeDisposable();
		this.sessionManager_ = new SessionManager(() => { 
			this.app_.createSessionData() });
		this.connections_ = [];

		const koaApp = new Koa();
		koaApp.use(this.sessionManager_.asKoaMiddleware());
		koaApp.use(koaStatic("static", {}));
		const port = 3003;
		console.log(`start listen at ${port}`);

		const httpServer = http.createServer(koaApp.callback());

		const webSocketServer = new WebSocketServer({
			httpServer: httpServer 
			});
		webSocketServer.on("request", (request: WebSocketRequest) => {
			let sid: string = null;
			request.cookies.forEach((cookie) => {
				if (cookie.name == "sid") {
					sid = cookie.value;
					return;
				}
			});

			if (sid == null) {
				request.reject(403, "no sid");
				return;
			}

			let session = this.sessionManager_.openSession(sid);
			if (session == null) {
				request.reject(403, "invalid session id");
				return;
			}
			
			const socket = new SocketImpl(request.accept(null, null));
			this.createConnection(socket, sid);
		});

		httpServer.listen(port);
	}

	closeConnection(connection: MessageConnection) {
		connection.close();
		this.destroyConnection(connection);
	}

	private createConnection(socket: SocketImpl, sessionId: string) {
		const disposable = new CompositeDisposable();
		const conn = new MessageConnection(socket);
		let handler: ConnectionHandler = null;
		this.diposable_.add(disposable);

		[	conn.onMessage().subscribeOnNext((x) => {
				handler.onMessage(x);
			}),
			conn.onClose().subscribeOnNext(() => {
				this.destroyConnection(conn);
			}),
			conn.onError().subscribeOnNext((err) => {
				this.destroyConnection(conn);
			})
		].forEach(x => { disposable.add(x) });

		handler = this.app_.createConnectionHandler(conn, sessionId);

		this.connections_.push({
			connection: conn,
			handler: handler,
			disposable: disposable,
			sessionId: sessionId
		});
	}

	private destroyConnection(connection: MessageConnection) {
		const index = _.findIndex(this.connections_,
			x => { return x.connection == connection; });
		if (index == -1) { 
			return; 
		}

		const entry = this.connections_[index];
		if (entry.handler != null) {
			entry.handler.onDestroy();
		}
		
		entry.disposable.dispose();
		this.diposable_.remove(entry.disposable);
		this.connections_.splice(index, 1);
	}

	private app_: App;
	private diposable_: CompositeDisposable;
	private sessionManager_: SessionManager;
	private connections_: ConnectionEntry[];

}
