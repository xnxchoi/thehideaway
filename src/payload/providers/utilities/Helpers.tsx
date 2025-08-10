export const wait = (ms = 0) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

export const lerp = (start: number, end: number, amount = 0.1) => {
	return start + (end - start) * amount;
};
