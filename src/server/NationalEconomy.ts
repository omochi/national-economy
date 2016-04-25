import { Timer } from "../../out/common/Timer";
import { Message, MessageConnection,
	PingMessage } from "../../out/common/Message";

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
	createConnectionHandler(connection: MessageConnection): ConnectionHandler {
		return new AppConnectionHandler(this, connection);
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

	private restartKeepAliveTimer() {
		console.log("restart keep alive")
		if (this.keepAliveTimer_ != null) {
			this.keepAliveTimer_.cancel();
			this.keepAliveTimer_ = null;
		}
		this.keepAliveTimer_ = Timer.create(4, () => { this.onKeepAliveTimer(); });
	}

	private onKeepAliveTimer() {
		console.log("out");
		this.engine().closeConnection(this.connection_);
	}

	private app_: NationalEconomyApp;
	private connection_: MessageConnection;
	private keepAliveTimer_: Timer;
}