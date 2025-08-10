export type HandleError =
	| {
	valid: false;

	handle: string;
}
	| { error: string };
export type HandleSuccess = {
	valid: true;
	handle: string;
};
export type HandleResponse = HandleSuccess | HandleError;
