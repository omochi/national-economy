import { Observable, Subject } from "rx";

import { toError } from "../../out/common/Error"; 
import { Json } from "../../out/common/Json";
import { Socket, SocketMessage } from "../../out/common/Socket";

import { blobToData, blobFromData } from "./DataImpl";

export class SocketImpl implements Socket {
	
	constructor(socket: WebSocket) {
		this.socket_ = socket;
		this.onMessage_ = new Subject<SocketMessage>();
		this.onClose_ = new Subject<void>();
		this.onError_ = new Subject<Error>();

		socket.onmessage = (ev: MessageEvent) => {
			const data = ev.data;
			if (typeof data == "string") {
				this.onMessage_.onNext({ string: <string>data });
			} else if (data instanceof Blob) {
				this.onMessage_.onNext({ data: blobToData(data) });
			} else {
				throw new Error(`invalid data type ${data}`);
			}
		};
		socket.onclose = (ev: CloseEvent) => {
			this.onClose_.onNext(null);
		};
		socket.onerror = (ev: Event) => {
			console.log(ev);
			this.handleError(new Error(ev.toString()));
		};
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
		this.socket_.close();
	}

	send(message: SocketMessage) {
		if (message.string != null) {
			this.socket_.send(message.string);
		} else {
			this.socket_.send(blobFromData(message.data));
		}
	}

	private handleError(error: Error) {
		this.onError_.onNext(error);
		this.close();
	}

	private socket_: WebSocket;
	private onMessage_: Subject<SocketMessage>;
	private onClose_: Subject<void>;
	private onError_: Subject<Error>;
};
