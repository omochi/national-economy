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
		this.keepAliveTimer_ = null;
		this.restartKeepAliveTimer();
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
			this.restartKeepAliveTimer();
		}
	}

	onDestroy() {
		console.log("onDestroy");
		this.keepAliveTimer_.cancel();
		this.keepAliveTimer_ = null;
	}

	kickDuplicatedConnection() {
		this.connection().send(new KickMessage("画面を2つ開く事はできません。"));
	}

	private restartKeepAliveTimer() {
		console.log("restart keep alive")
		if (this.keepAliveTimer_ != null) {
			this.keepAliveTimer_.cancel();
			this.keepAliveTimer_ = null;
		}
		this.keepAliveTimer_ = Timer.create(4, () => { this.onKeepAliveTimer(); });
	}

	private onKeepAliveTimer() {
		console.log("keep alive timeout");
		this.engine().closeConnection(this.connection_);
	}

	private app_: NationalEconomyApp;
	private connection_: MessageConnection;
	private keepAliveTimer_: Timer;
}