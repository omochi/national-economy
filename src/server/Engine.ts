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

	createConnectionHandler(connection: MessageConnection): ConnectionHandler;
}

export interface ConnectionHandler {
	onMessage(message: Message): void;
	onDestroy(): void;
}

interface ConnectionEntry {
	connection: MessageConnection;
	handler: ConnectionHandler;
	disposable: Disposable;
	sessionId: string;
}

export class Engine {
	constructor(app: App) {
		this.app_ = app;
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

	private createConnection(socket: SocketImpl, sessionId: string) {
		const connection = new MessageConnection(socket);	

		const disposable = new CompositeDisposable();
		this.diposable_.add(disposable);

		let handler: ConnectionHandler = null;

		[	connection.onMessage().subscribeOnNext((x) => {
				handler.onMessage(x);
			}),
			connection.onClose().subscribeOnNext(() => {
				this.destroyConnection(connection);
			}),
			connection.onError().subscribeOnNext((err) => {
				this.destroyConnection(connection);
			})
		].forEach(x => { disposable.add(x) });

		handler = this.app_.createConnectionHandler(connection);

		this.connections_.push({
			connection: connection,
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
		entry.handler.onDestroy();
		this.diposable_.remove(entry.disposable);
		this.connections_.splice(index, 1);
	}

	private app_: App;
	private diposable_: CompositeDisposable;
	private sessionManager_: SessionManager;
	private connections_: ConnectionEntry[];

}
