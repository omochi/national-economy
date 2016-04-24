import { Data } from "../../out/common/Data";

export function bufferToData(buffer: Buffer): Data {
	return new Data(buffer);
}

export function bufferFromData(data: Data): Buffer {
	if (data.opaque() instanceof Buffer) {
		return <Buffer>data.opaque();
	} else {
		throw new Error("type error");
	}
}
