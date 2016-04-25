import { Engine, App } from "./Engine";
import { MessageConnection } from "../../out/common/Message";

class SessionData {

}

export class NationalEconomyApp implements App {
	constructor(engine: Engine<NationalEconomyApp>) {
		this.engine_ = engine;
	}
	createSessionData(): any {
		return new SessionData();
	}
	onConnection(connection: MessageConnection) {

	}
	private engine_: Engine<NationalEconomyApp>;
}