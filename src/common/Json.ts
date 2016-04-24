export enum JsonType {
	Null,
	Boolean,
	Number,
	String,
	Array,
	Object
}

export type JsonArray = Json[];
export type JsonDictionary = { [key: string]: Json };

export class Json {
	static null(): Json {
		return new Json(JsonType.Null, null);
	}
	static boolean(value: boolean): Json {
		return new Json(JsonType.Boolean, value);
	}
	static number(value: number): Json {
		return new Json(JsonType.Number, value);
	}
	static string(value: string): Json {
		return new Json(JsonType.String, value);
	}
	static array(value: JsonArray): Json {
		return new Json(JsonType.Array, value);
	}
	static object(value: JsonDictionary): Json {
		return new Json(JsonType.Object, value);
	}

	type(): JsonType {
		return this.type_;
	}
	boolean(): boolean {
		if (this.type() == JsonType.Boolean) {
			return <boolean>(this.value_);
		} else {
			throw new Error("type error");
		}
	}
	number(): number {
		if (this.type() == JsonType.Number) {
			return <number>(this.value_);
		} else {
			throw new Error("type error");
		}
	}
	string(): string {
		if (this.type() == JsonType.String) {
			return <string>(this.value_);
		} else {
			throw new Error("type error");
		}
	}
	array(): JsonArray {
		if (this.type() == JsonType.Array) {
			return <JsonArray>(this.value_);
		} else {
			throw new Error("type error");
		}
	}
	object(): JsonDictionary {
		if (this.type() == JsonType.Object) {
			return <JsonDictionary>(this.value_);
		} else {
			throw new Error("type error");
		}
	}

	static parse(string: string): Json {
		return Json.fromJsObject(JSON.parse(string));
	}

	static fromJsObject(obj: any): Json {
		if (obj instanceof Array) {
			const array: JsonArray = [];
			(<Array<any>>obj).forEach((x) => {
				array.push(Json.fromJsObject(x));
			});
			return Json.array(array);
		} else if (obj instanceof Object) {
			const dict: JsonDictionary = {};
			Object.keys(obj).forEach((k: any) => {
				if (typeof k == "string") {
					const v: any = (<any>obj)[k];
					dict[k] = Json.fromJsObject(v);
				}
			});
			return Json.object(dict);
		} else if (typeof obj == "string") {
			return Json.string(<string>(obj));
		} else if (typeof obj == "number") {
			return Json.number(<number>(obj));
		} else if (typeof obj == "boolean") {
			return Json.boolean(<boolean>(obj));
		} else {
			return Json.null();
		}
	}

	format(): string {
		return JSON.stringify(this.toJsObject(), null, "  ");
	}

	toJsObject(): any {
		switch (this.type()) {
		case JsonType.Null:
			return null;
		case JsonType.Boolean:
			return this.boolean();
		case JsonType.Number:
			return this.number();
		case JsonType.String:
			return this.string();
		case JsonType.Array:
			return this.array().map((x) => { return x.toJsObject(); });
		case JsonType.Object:
			const sobj: JsonDictionary = this.object();
			const dobj: Object = {};
			Object.keys(sobj).forEach((k: string) => {
				(<any>dobj)[k] = (sobj[k]).toJsObject();
			});
			return dobj;
		}
	}

	readOptional<T>(read: (json: Json) => T): T {
		if (this.type() == JsonType.Null) {
			return null;
		}
		return read(this);
	}

	readArray<T>(readElement: (json: Json) => T): T[] {
		return this.array().map((x) => { return readElement(x); });
	}

	readDictionary<T>(readElement: (json: Json) => T): { [key: string]: T } {
		const obj = this.object();
		const dict: { [key: string]: T } = {};
		Object.keys(obj).forEach((k: string) => {
			const v: Json = obj[k];
			dict[k] = readElement(v);
		});
		return dict;
	}

	queryIndex(index: number): Json {
		return this.array()[index];
	}

	queryKey(key: string): Json {
		return this.object()[key];
	}

	constructor(type: JsonType, value: any) {
		this.type_ = type;
		this.value_ = value;
	}

	private type_: JsonType;
	private value_: any;	
}



