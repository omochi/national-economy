import { Data } from "../../out/common/Data";

export function blobToData(blob: Blob): Data {
	return new Data(blob);
}

export function blobFromData(data: Data): Blob {
	if (data.opaque() instanceof Blob) {
		return <Blob>data.opaque();
	} else {
		throw new Error("type error");
	}
}

