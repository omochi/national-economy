import { makeRandomString } from "./Util";
import { Timer } from "../../out/common/Timer";

export class SessionEntry<T> {
	constructor(id: string, value: T) {
		this.id_ = id;
		this.value_ = value;
		this.touch(60);
	}

	get id(): string {
		return this.id_;
	}
	get value(): T {
		return this.value_;
	}
	get lastAccessTime(): Date {
		return this.lastAccessTime_;
	}
	get expiringTime(): Date {
		return this.expiringTime_;
	} 

	touch(extend: number) {
		this.lastAccessTime_ = new Date();
		this.expiringTime_ = new Date(this.lastAccessTime_.getTime() + extend * 1000.0);
	}

	private id_: string;
	private value_: T;
	private lastAccessTime_: Date;
	private expiringTime_: Date;
};

export class SessionManager<T> {
	constructor(valueClass: { new (): T }) {
		this.closed = false;
		this.valueClass = valueClass;
		this.entries = {};

		this.sessionIdKey = "sid";
		this.sessionLifeTime = 60;
		this.gcTimer = Timer.createRepeatForever(10, () => {
			this.onGc();
		});
	}

	close() {
		if (this.closed) {
			return;
		}
		this.gcTimer.cancel();
		this.gcTimer = null;
		this.closed = true;
	}

	asKoaMiddleware(): (ctx: any, next: any) => any {
		return this.koaMiddlewareBody.bind(this);
	}

	openSession(id: string): SessionEntry<T> {
		const entry = this.entries[id];
		if (entry != null) {
			entry.touch(this.sessionLifeTime);
			console.log(`open session ${id}`);
		}

		return entry;
	}

	createSession(): SessionEntry<T> {
		const id = makeRandomString(20);
		const entry = new SessionEntry<T>(id, new this.valueClass());
		this.entries[id] = entry;

		console.log(`create session ${id}`);
		entry.touch(this.sessionLifeTime);

		return entry;
	}
	
	deleteSession(id: string) {
		console.log(`delete session ${id}`);
		delete this.entries[id];
	}

	private koaMiddlewareBody(ctx: any, next: any): any {
		const sessionId = ctx.cookies.get(this.sessionIdKey);
		if (sessionId != null) {
			const entry = this.openSession(sessionId);
			if (entry != null) {
				return next();
			}
		}

		const entry = this.createSession();

		ctx.cookies.set(this.sessionIdKey, entry.id);

		return next();
	}

	private onGc() {
		const now = new Date();
		Object.keys(this.entries).forEach((id) => {
			const entry = this.entries[id];
			if (entry.expiringTime.getTime() <= now.getTime()) {
				this.deleteSession(entry.id);
			}
		});
	}
	
	closed: boolean;
	valueClass: { new (): T };
	sessionIdKey: string;
	sessionLifeTime: number;
	entries: { [id: string]: SessionEntry<T> };
	gcTimer: Timer;
};