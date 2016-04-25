import { makeRandomString } from "./Util";
import { Timer } from "../../out/common/Timer";

export class SessionEntry {
	constructor(id: string, data: any) {
		this.id_ = id;
		this.data_ = data;
		this.touch(60);
	}

	id(): string {
		return this.id_;
	}
	data(): any {
		return this.data_;
	}
	lastAccessTime(): Date {
		return this.lastAccessTime_;
	}
	expiringTime(): Date {
		return this.expiringTime_;
	} 

	touch(extend: number) {
		this.lastAccessTime_ = new Date();
		this.expiringTime_ = new Date(this.lastAccessTime_.getTime() + extend * 1000.0);
	}

	private id_: string;
	private data_: any;
	private lastAccessTime_: Date;
	private expiringTime_: Date;
};

export class SessionManager {
	constructor(createData: () => any) {
		this.closed_ = false;
		this.createData_ = createData;
		this.entries_ = {};

		this.sessionIdKey_ = "sid";
		this.sessionLifeTime_ = 60;
		this.gcTimer_ = Timer.createRepeatForever(10, () => {
			this.onGc();
		});
	}

	close() {
		if (this.closed_) {
			return;
		}
		this.gcTimer_.cancel();
		this.gcTimer_ = null;
		this.closed_ = true;
	}

	asKoaMiddleware(): (ctx: any, next: any) => any {
		return this.koaMiddlewareBody.bind(this);
	}

	openSession(id: string): SessionEntry {
		const entry = this.entries_[id];
		if (entry != null) {
			entry.touch(this.sessionLifeTime_);
			// console.log(`open session ${id}`);
		}

		return entry;
	}

	createSession(): SessionEntry {
		const id = makeRandomString(20);
		const entry = new SessionEntry(id, this.createData_());
		this.entries_[id] = entry;

		console.log(`create session ${id}`);
		entry.touch(this.sessionLifeTime_);

		return entry;
	}
	
	deleteSession(id: string) {
		console.log(`delete session ${id}`);
		delete this.entries_[id];
	}

	private koaMiddlewareBody(ctx: any, next: any): any {
		const sessionId = ctx.cookies.get(this.sessionIdKey_);
		if (sessionId != null) {
			const entry = this.openSession(sessionId);
			if (entry != null) {
				return next();
			}
		}

		const entry = this.createSession();

		ctx.cookies.set(this.sessionIdKey_, entry.id());

		return next();
	}

	private onGc() {
		const now = new Date();
		Object.keys(this.entries_).forEach((id) => {
			const entry = this.entries_[id];
			if (entry.expiringTime().getTime() <= now.getTime()) {
				this.deleteSession(entry.id());
			}
		});
	}
	
	private closed_: boolean;
	private createData_: () => any;
	private sessionIdKey_: string;
	private sessionLifeTime_: number;
	private entries_: { [id: string]: SessionEntry };
	private gcTimer_: Timer;
};