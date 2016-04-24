export class Data {
	constructor(opaque: any) {
		this.opaque_ = opaque;
	}

	opaque(): any {
		return this.opaque_;
	}

	private opaque_: any;
}