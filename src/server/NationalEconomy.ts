import { Timer } from "../../out/common/Timer";
import { Message, MessageConnection,
	PingMessage, KickMessage } from "../../out/common/Message";

import { Engine, App, ConnectionHandler } from "./Engine";

export class NationalEconomyApp implements App {
	init(engine: Engine) {
		this.engine_ = engine;
	}
	engine(): Engine {
		return this.engine_;
	}
	createSessionData(): any {
		return {

		};
	}
	createConnectionHandler(connection: MessageConnection, sessionId: string): ConnectionHandler {
		const handler = new AppConnectionHandler(this, connection);
		
		const otherConnections = this.engine().connections()
			.filter(x => { 
				return (x.handler instanceof AppConnectionHandler) &&
					(x.sessionId == sessionId)
			})
			.forEach(x => {
				const handler = <AppConnectionHandler>x.handler;

			});
		
		return handler;
	}
	private engine_: Engine;
}

class AppConnectionHandler implements ConnectionHandler {
	constructor(app: NationalEconomyApp, connection: MessageConnection) {
		this.app_ = app;
		this.connection_ = connection;
		this.keepAliveTimeoutTimer_ = new Timer();
		this.startKeepAliveTimeoutTimer();
	}

	app(): NationalEconomyApp {
		return this.app_;
	}
	engine(): Engine {
		return this.app().engine();
	}
	connection(): MessageConnection {
		return this.connection_;
	}

	onMessage(message: Message) {
		if (message instanceof PingMessage) {
			this.connection().send(new PingMessage());
			this.startKeepAliveTimeoutTimer();
		}
	}

	onDestroy() {
		console.log("onDestroy");
		this.keepAliveTimeoutTimer_.cancel();
	}

	kickDuplicatedConnection() {
		this.connection().send(new KickMessage("画面を2つ開く事はできません。"));
	}

	private startKeepAliveTimeoutTimer() {
		this.keepAliveTimeoutTimer_.start(30, () => {
			this.engine().closeConnection(this.connection_); });
	}

	private app_: NationalEconomyApp;
	private connection_: MessageConnection;
	private keepAliveTimeoutTimer_: Timer;
}