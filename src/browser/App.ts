class App {

	run() {
		const socket = new WebSocket(this.getWebSocketUrl(window.location));
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

}
export = App;