import * as Koa from "koa";
import * as koaStatic from "koa-static";
import { 
	server as WebSocketServer, 
	request as WebSocketRequest,
	connection as WebSocketConnection } from "websocket";
import * as http from "http";

import { toError } from "../../out/common/Error"; 
import { Timer } from "../../out/common/Timer";
import { MessageConnection } from "../../out/common/Message";

import { rand, makeRandomString } from "./Util";
import { AppSession } from "./AppSession";
import { SessionManager } from "./Session";
import { SocketImpl } from "./SocketImpl";


class App {

	run() {
		this.sessionManager = new SessionManager(AppSession);

		const koaApp = new Koa();
		koaApp.use(this.sessionManager.asKoaMiddleware());
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

			let session = this.sessionManager.openSession(sid);
			if (session == null) {
				request.reject(403, "invalid session id");
				return;
			}
			
			const socket = new SocketImpl(request.accept(null, null));
			const connection = new MessageConnection(socket);
			
			session.value().messageConnections().push(connection);
		});

		httpServer.listen(port);
	}

	private sessionManager: SessionManager<AppSession>;
}
export = App;