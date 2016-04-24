export function toError(x: any): Error {
	if (x instanceof Error) {
		return <Error>x;
	} else {
		return new Error(x.toString());
	}
}
