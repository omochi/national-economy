import { Observable, Subject, Disposable, CompositeDisposable } from "rx";
import { Json } from "./Json";
import { toError } from "./Error";
import { Socket, SocketMessage } from "./Socket";

export interface Message {
	type(): MessageType;
	toJson(): Json;
}

export interface MessageType {
	key(): string;
	fromJson(json: Json): Message;
}

export class MessageConnection {
	constructor(socket: Socket) {
		this.socket_ = socket;
		this.disposable_ = new CompositeDisposable();
		this.onMessage_ = new Subject<Message>();
		this.onClose_ = new Subject<void>();
		this.onError_ = new Subject<Error>();
		this.messageDecoder_ = new MessageDecoder();

		let sub: Disposable = null;

		sub = this.socket_.onMessage().subscribeOnNext((message: SocketMessage) => {
			if (message.string != null) {
				try {
					const json = Json.parse(message.string);
					const msg = this.messageDecoder_.decode(json);
					this.onMessage_.onNext(msg);
				} catch (e) {
					this.handleError(toError(e));
				}
			} else {
				this.handleError(new Error(`invalid message`));
			}
		});
		this.disposable_.add(sub);

		sub = this.socket_.onClose().subscribeOnNext((_: void) => {
			this.onClose_.onNext(null);
			this.close();
		});
		this.disposable_.add(sub);

		sub = this.socket_.onError().subscribeOnNext((error: Error) => {
			this.handleError(error);
		});
		this.disposable_.add(sub);
	}

	onMessage(): Observable<Message> {
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
		this.disposable_.dispose();
	}
	send(message: Message) {
		const jsonStr: string = Json.object({
			"type": Json.string(message.type().key()),
			"body": message.toJson()
		}).format();
		this.socket_.send({ string: jsonStr });
	}

	private handleError(error: Error) {
		this.onError_.onNext(error);
		this.close();
	}

	private socket_: Socket;
	private disposable_: CompositeDisposable;
	private onMessage_: Subject<Message>;
	private onClose_: Subject<void>;
	private onError_: Subject<Error>;
	private messageDecoder_: MessageDecoder;
}

export class MessageDecoder {
	
	constructor() {
		this.decoderTable_ = {};

		this.register(PingMessage);
		this.register(KickMessage);
	}

	decode(json: Json): Message {
		const type: string = json.queryKey("type").string();
		const body: Json = json.queryKey("body");

		const decoder = this.decoderTable_[type];
		if (decoder == null) {
			throw new Error(`unknown type ${type}`);
		}

		return decoder(body);
	}

	private register(messageType: MessageType) {
		this.decoderTable_[messageType.key()] = (json: Json) => {
			return messageType.fromJson(json);
		}
	}

	private decoderTable_: { [type: string]: (json: Json) => Message };
}

export class PingMessage implements Message {
	type(): MessageType {
		return PingMessage;
	}
	toJson(): Json {
		return Json.object({}); 
	}
	static key(): string {
		return "Ping"; 
	}
	static fromJson(json: Json): PingMessage {
		return new PingMessage();
	}
}

export class KickMessage implements Message {
	constructor(public reason: string) {
	}
	type(): MessageType {
		return KickMessage;
	}
	toJson(): Json {
		return Json.object({
			"reason": Json.string(this.reason)
		});
	}
	static key(): string {
		return "Kick";
	}
	static fromJson(json: Json): KickMessage {
		return new KickMessage(
			json.queryKey("reason").string()
		);
	}
}




