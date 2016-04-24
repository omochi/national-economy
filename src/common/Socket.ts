import { Observable } from "rx";
import { Data } from "./Data";

export interface SocketMessage {
	string ?: string;
	data ?: Data;
}

export interface Socket {
	onMessage(): Observable<SocketMessage>;
	onClose(): Observable<void>;
	onError(): Observable<Error>;

	close(): void;
	send(message: SocketMessage): void;
}
