export class Timeout {
	constructor(delay: number, proc: () => void) {
		this.proc = proc;
		this.canceled = false;
		this.timerId = setTimeout(() => {
			this.onFire();
		}, delay * 1000.0);
	}
	cancel() {
		if (this.canceled) {
			return;
		}
		clearTimeout(this.timerId);
		this.canceled = true;
	}
	private onFire() {
		if (this.canceled) {
			return;
		}
		this.proc();
	}

	private proc: () => void;
	private timerId: number;
	private canceled: boolean;
}

export class Timer {
	constructor() {
		this.timeout_ = null;
		this.proc_ = null;
	}

	started(): boolean {
		return this.timeout_ != null;
	}

	start(delay: number, proc: () => void) {
		if (this.started()) {
			this.cancel();
		}
		this.proc_ = proc;
		this.timeout_ = new Timeout(delay, () => {
			this.onTimeout();
		});
	}

	cancel() {
		if (this.timeout_ != null) {
			this.timeout_.cancel();
			this.timeout_ = null;
		}
	}

	private onTimeout() {
		this.timeout_ = null;
		this.proc_();
	}

	private proc_: () => void;
	private timeout_: Timeout;
}