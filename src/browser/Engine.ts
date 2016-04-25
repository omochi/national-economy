import { Message, MessageConnection,
	PingMessage
 } from "../../out/common/Message";

 import { SocketImpl } from "./SocketImpl";


export class Engine {

	run() {
		const url = this.getWebSocketUrl(window.location);
		console.log(`url = ${url}`);
		const socket = new SocketImpl(new WebSocket(url));
		this.connection_ = new MessageConnection(socket);
		this.connection_.send(new PingMessage());
	}

	getWebSocketUrl(location: Location): string {
		const isSsl: boolean = (() => {
			if (location.protocol == "https:") {
				return true;
			} else {
				return false;
			}
		})();

		const strs: string[] = [];

		if (isSsl) {
			strs.push("wss://");
		} else {
			strs.push("ws://");
		}

		strs.push(location.hostname);

		const port = location.port;
		if (port != null) {
			strs.push(`:${port}`);
		}

		strs.push(location.pathname);

		return strs.join("");
	}

	private connection_: MessageConnection;

}
