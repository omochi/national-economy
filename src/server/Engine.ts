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
import { MessageConnection } from "../../out/common/Message";

import { rand, makeRandomString } from "./Util";
import { SessionManager } from "./Session";
import { SocketImpl } from "./SocketImpl";

export interface App {
	createSessionData(): any;

	onConnection(connection: MessageConnection): void;

}

export class Engine<
	AppType extends App
> {
	run(app: AppType) {
		this.app_ = app;
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

		});

		httpServer.listen(port);
	}

	private createConnection(socket: SocketImpl) {
		const connection = new MessageConnection(socket, sid);	
		this.connections_.push(connection);

		const disposable = new CompositeDisposable();

		const destroyConnection = () => {
			this.diposable_.remove(disposable);
		};

		let sub: Disposable = null;
		sub = connection.onClose().subscribeOnNext(() => {
			destroyConnection();
		});
		disposable.add(sub);
		sub = connection.onError().subscribeOnNext((err) => {
			destroyConnection();
		});
		disposable.add(sub);

		this.diposable_.add(disposable);

		this.app_.onConnection(connection);
	}

	private app_: AppType;
	private diposable_: CompositeDisposable;
	private sessionManager_: SessionManager;
	private connections_: MessageConnection[];

}
