import { MessageConnection } from "../../out/common/Message";
export class AppSession {

	constructor() {
		this.messageConnections_ = [];
	}

	messageConnections(): MessageConnection[] {
		return this.messageConnections_;
	}
	
	private messageConnections_: MessageConnection[];
}