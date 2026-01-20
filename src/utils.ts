export interface AppError extends Error {
	status?: number;
	state?: Record<string, unknown>;
}

export function numberToLetter(num: number): string {
	let ret = "";
	let n = num;
	let a = 1;
	let b = 26;
	while (true) {
		n -= a;
		if (n < 0) break;
		ret = String.fromCharCode(Math.floor((n % b) / a) + 65) + ret;
		a = b;
		b *= 26;
	}
	return ret;
}

export function detectValues(
	val: string | undefined | null,
): string | number | boolean | null {
	if (val === "" || val === undefined || val === null) return null;
	if (val === "TRUE") return true;
	if (val === "FALSE") return false;
	if (/^\d+\.\d+$/.test(val)) return parseFloat(val);
	if (/^\d+$/.test(val)) return parseInt(val, 10);
	return val;
}

export function throwError(
	message: string,
	errorCode?: number,
	state?: Record<string, unknown>,
): never {
	const err: AppError = new Error(message);
	err.status = errorCode;
	if (state) {
		err.state = state;
	}
	throw err;
}

export function getParams<T extends object>(
	input: T,
	possibleParams: (keyof T)[],
): Partial<T> {
	const output: Partial<T> = {};
	possibleParams.forEach((k) => {
		if (input[k] !== null && input[k] !== undefined) {
			output[k] = input[k];
		}
	});
	return output;
}
