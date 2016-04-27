import { CompositeDisposable } from "rx";

import { Timer } from "../../out/common/Timer";
import { Message, MessageConnection,
	PingMessage
 } from "../../out/common/Message";

 import { SocketImpl } from "./SocketImpl";

export class Engine {

	run() {
		this.expectingServerClose_ = false;

		this.disposable_ = new CompositeDisposable();

		const url = this.getWebSocketUrl(window.location);
		console.log(`url = ${url}`);
		const socket = new SocketImpl(new WebSocket(url));
		
		const conn = new MessageConnection(socket);
		this.connection_ = conn;
		
		[
		conn.onMessage().subscribeOnNext(msg => {
			this.handleConnectionMessage(msg);
		}),
		conn.onError().subscribeOnNext(err => {
			this.handleError(err);
		}),
		conn.onClose().subscribeOnNext(() => {
			this.handleConnectionClose();
		})
		].forEach(x => { this.disposable_.add(x); });
	
		this.keepAliveSendTimer_ = new Timer();
		this.keepAliveTimeoutTimer_ = new Timer();
		this.startKeepAliveSendTimer();
	}

	private shutdown() {
		this.keepAliveSendTimer_.cancel();
		this.keepAliveTimeoutTimer_.cancel();
		this.disposable_.dispose();
	}

	private handleError(error: Error) {
		this.showAlert(`エラー ${error}`);
		this.shutdown();
	}

	private handleConnectionMessage(message: Message) {
		if (message instanceof PingMessage) {
			this.keepAliveTimeoutTimer_.cancel();
		}
	}

	private handleConnectionClose() {
		if (!this.expectingServerClose_) {
			this.showAlert("サーバーとの接続が切れてしまいました。");	
		}
		this.shutdown();
	}

	private showAlert(msg: string) {
		window.alert(msg);	
	}

	private startKeepAliveSendTimer() {
		this.keepAliveSendTimer_.start(10, () => {
			this.connection_.send(new PingMessage());
			this.keepAliveTimeoutTimer_.start(5, () => {
				this.connection_.close();
				this.handleConnectionClose();
			});
			this.startKeepAliveSendTimer();
		});
	}

	private getWebSocketUrl(location: Location): string {
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

	private disposable_: CompositeDisposable;
	private connection_: MessageConnection;
	private keepAliveSendTimer_: Timer;
	private keepAliveTimeoutTimer_: Timer;
	private expectingServerClose_: boolean;

}
