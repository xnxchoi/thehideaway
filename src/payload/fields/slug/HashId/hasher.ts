"use server"

import {cache} from "react";
import {createMD5} from "hash-wasm";
import {DateTime} from "luxon";
import {init} from "@paralleldrive/cuid2";
import {HASH_ID_LENGTH} from "@/payload/fields/slug/HashId/constants";
import {nanoid} from "nanoid";

export const hasher = cache(async () => await createMD5())
export const createHashId = cache(async (param?: string) => {
	const h = await hasher();
	h.update([DateTime.now().toUnixInteger().toString(), param || nanoid(11)].join('|'));
	const hashBytes = h.digest('binary');

	// 5. Use Node's Buffer to encode the raw bytes into Base64.
	const base64Encoded = Buffer.from(hashBytes).toString('base64');

	// 6. Make it URL-safe and remove padding.
	const urlSafeEncoded = base64Encoded.replace(/\+/g, '-') // Replace + with -
		.replace(/\//g, '_') // Replace / with _
		.replace(/=/g, '');  // Remove = padding
	const id = urlSafeEncoded.search(/[a-zA-Z0-9]/);
	const finalStr = urlSafeEncoded.startsWith('-') ?
		urlSafeEncoded.substring(id) : urlSafeEncoded;
	if (finalStr.length < HASH_ID_LENGTH) {
		return init({length: (HASH_ID_LENGTH - finalStr.length)}) + finalStr;
	}
	return finalStr.substring(0, HASH_ID_LENGTH);
})