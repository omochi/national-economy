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
	constructor(delay: number, proc: () => void, repeatForever: boolean, repeatNum: number) {
		this.delay = delay;
		this.proc = proc;
		this.repeatForever = repeatForever;
		this.repeatNum = repeatNum;

		this.timeout = null;
		this.repeatCount = 0;
	}

	started(): boolean {
		return this.timeout != null;
	}

	start() {
		if (this.started()) {
			throw new Error("already started");
		}
		this.setTimeout();
	}

	cancel() {
		if (this.timeout != null) {
			this.timeout.cancel();
			this.timeout = null;
		}
		this.repeatCount = 0;
	}

	static create(delay: number, proc: () => void): Timer {
		const timer = new Timer(delay, proc, false, 1);
		timer.start();
		return timer;
	}

	static createRepeat(delay: number, num: number, proc: () => void): Timer {
		const timer = new Timer(delay, proc, false, num);
		timer.start();
		return timer;
	}

	static createRepeatForever(delay: number, proc: () => void): Timer {
		const timer = new Timer(delay, proc, true, 0);
		timer.start();
		return timer;
	}

	private setTimeout() {
		this.timeout = new Timeout(this.delay, () => {
			this.onTimeout();
		});
	}

	private onTimeout() {
		this.proc();
		this.repeatCount += 1;
		this.timeout = null;

		if (this.repeatForever || this.repeatCount < this.repeatNum) {
			this.setTimeout();
		}
	}

	private delay: number;
	private proc: () => void;
	private repeatForever: boolean;
	private repeatNum: number;

	private timeout: Timeout;
	private repeatCount: number;
}