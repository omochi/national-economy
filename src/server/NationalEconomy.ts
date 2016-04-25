import { Engine, App, ConnectionHandler } from "./Engine";
import { Message, MessageConnection } from "../../out/common/Message";

export class NationalEconomyApp implements App {
	init(engine: Engine) {
		this.engine_ = engine;
	}
	createSessionData(): any {
		return {

		};
	}
	createConnectionHandler(connection: MessageConnection): ConnectionHandler {
		return {
			onMessage: (message: Message) => {
				console.log(message);
			},
			onDestroy: () => {
				console.log("onDestroy");
			}
		};
	}
	private engine_: Engine;
}
