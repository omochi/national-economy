import { Observable, Subject } from "rx";

import { toError } from "../../out/common/Error"; 
import { Json } from "../../out/common/Json";
import { Socket, SocketMessage } from "../../out/common/Socket";

import { bufferToData, bufferFromData } from "./DataImpl";

import { 
	connection as WebSocketConnection,
	IMessage as WebSocketMessage } from "websocket";

export class SocketImpl implements Socket {
	
	constructor(connection: WebSocketConnection) {
		this.connection_ = connection;
		this.onMessage_ = new Subject<SocketMessage>();
		this.onClose_ = new Subject<void>();
		this.onError_ = new Subject<Error>();

		connection.on("message", (message: WebSocketMessage) => {
			if (message.type == "utf8") {
				this.onMessage_.onNext({ string: message.utf8Data });
			} else if (message.type == "binary") {
				this.onMessage_.onNext({ data: bufferToData(message.binaryData) });
			} else {
				throw new Error(`invalid message ${message.type}`);
			}
		});
		connection.on("close", (code: number, desc: string) => {
			this.onClose_.onNext(null);
		});
		connection.on("error", (error: Error) => {
			this.handleError(error);
		});
	}

	onMessage(): Observable<SocketMessage> {
		return this.onMessage_;
	}
	onClose(): Observable<void> {
		return this.onClose_;
	}
	onError(): Observable<Error> {
		return this.onError_;
	}

	close() {
		this.connection_.close();
	}

	send(message: SocketMessage) {
		if (message.string != null) {
			this.connection_.send(message.string);
		} else {
			this.connection_.send(bufferFromData(message.data));
		}
	}

	private handleError(error: Error) {
		this.onError_.onNext(error);
		this.close();
	}

	private connection_: WebSocketConnection;
	private onMessage_: Subject<SocketMessage>;
	private onClose_: Subject<void>;
	private onError_: Subject<Error>;
};