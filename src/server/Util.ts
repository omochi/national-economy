import * as getRandomValues from "get-random-values";

export function rand(n: number): number {
	const mem = new Uint8Array(4);
	getRandomValues(mem);
	const value: number = 
		(
			(mem[0] << 24) |
			(mem[1] << 16) |
			(mem[2] << 8) |
			mem[3]
		) >>> 0;
	return value % n;
}

export function makeRandomString(len: number): string {
	const chars = 
		"abcdefghijklmnopqrstuvwxyz" +
		"ABCDEFGHIJKLMNOPQRTSUVWXYZ" +
		"0123456789";
	let ret = "";
	for (let i = 0; i < len; i++) {
		const dice = rand(chars.length);
		ret += chars[dice];
	}
	return ret;
}
