import * as Koa from "koa";
import * as koaStatic from "koa-static";
import { server as WebSocketServer } from "websocket";
import * as http from "http";

import { rand, makeRandomString } from "./Util"; 
import { Timer } from "../../out/common/Timer";
import { AppSession } from "./AppSession";
import { SessionManager } from "./SessionManager";


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
		webSocketServer.on("request", (request: any) => {
			console.log(`websocket request`, request);
			request.reject();
			return;
		});

		httpServer.listen(port);
	}

	private sessionManager: SessionManager<AppSession>;
}
export = App;