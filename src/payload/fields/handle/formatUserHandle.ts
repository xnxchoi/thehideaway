import type {FieldHook, Where} from "payload"
import {createCuid} from "@/utilities/stringUtilities"
import {generateSmartSlugCandidates} from "./smartGenerateHandles"

export function formatUserHandleLite(input: string): string {
	return input.toLowerCase().trim().replace(/[^a-z0-9-._]/g, "") // 1. remove invalid characters
		.replace(/\.+/g, ".") // 2. collapse consecutive dots
}

export function formatUserHandleMinimal(input: string): string {
	return input.toLowerCase().trim().replace(/[^a-z0-9-._]/g, "") // 1. remove invalid characters
		.replace(/\.+/g, ".") // 2. collapse consecutive dots
		.replace(/^([\.-]+)(?=[_a-z0-9])/, "").replace(/(?<=[a-z0-9_])([\.-]+)$/, "")
}

export function formatUserHandle(input: string): string {
	return input.toLowerCase().trim().replace(/[^a-z0-9._]/g, "") // 1. remove invalid characters
		.replace(/\.+/g, ".") // 2. collapse consecutive dots


		.replace(/((?<![a-z0-9.])){1,2}(\.)+(?=[a-z0-9])/g,
			".") // 5. remove dots not between alphanumerics
		.replace(/(?<=[a-z0-9])(\.)+(?![a-z0-9.]){1,2}/g,
			".") // 5. remove dots not between alphanumerics
		.replace(/^\.*/g, "") // 3. remove leading dots
		.replace(/\.*$/g, "") // 4. remove trailing dots
		.slice(0, 30) // 8. max length
}

export const HANDLE_TEST_REGEX =
	/^(?!.*\.\.)(?!.*[A-Z])(?!.*\.$)[^\W][\w.]{0,29}$/

export const formatUserHandleHook: FieldHook =
	async ({
		data,
		operation,
		siblingData,
		originalDoc,
		value,
		previousValue,
		overrideAccess,
		req,
	}) => {

		let toValue = value
		if (operation === "create" && !value) {
			if (data?.email) {
				const handle = data.email.split("@")[0]
				if (handle && handle.length > 0) {
					toValue = handle
				}
			}
		}
		const handle = formatUserHandle(toValue)

		const payload = req.payload
		const doesItExist = async (hande: string) => {
			let where = {
				or: [
					{
						slug: {
							equals: hande,
						},
						name: {
							equals: hande,
						},
					},
				],
			} as Where
			if (operation === "update") {
				where = {
					and: [
						{
							id: {
								not_in: [originalDoc.id],
							},
						},
						{
							...where,
						},
					],
				}
			}
			return await payload.count({
				collection: "users",
				overrideAccess: true,
				where: where,
			}).then((r) => r.totalDocs > 0).catch((e) => {
				console.error({
					message: `Error while checking if handle ${handle} exists`,
					error: e,
				})
				return true
			})
		}
		if (handle.length > 2) {
			const exists = await doesItExist(handle)

			if (!exists) {
				return handle
			}
		}
		/** if handle is longer than 2 charcters and has passed the uniqueness check, function has already returned the value at this point */
		/** If the operation is update we fall back to the previous value*/
		if (operation === "update") {
			const alt = previousValue || originalDoc?.slug || originalDoc?.name
			if (typeof alt === "string") {
				/** formatting again for safety... */
				const fin = formatUserHandle(alt)
				if (fin.length > 2 && fin !== handle) {
					/** If the formatted value is different from the current value, we return it (length is accounted for since we require alt to be longer than 2 characters) */
					return fin
				}
			}
		}
		/** Either the operation is create, or the previous value didn't pass the test at this point */
		const candidates = generateSmartSlugCandidates({
			base: handle,
			username:
				data?.name ??
				data?.firstName ??
				data?.lastName ??
				undefined,
			email: siblingData?.email ?? undefined,
			maxAttempts: 5,
		})
		for (const candidate of candidates) {
			const exists =
				candidate.length > 2
					? await doesItExist(formatUserHandle(candidate))
					: true
			if (!exists) {
				return candidate
			}
		}
		/** This is a true limbo; client-side validation was somehow bypassed, the smart generation didn't work... (highly unlikely at early stages of the platform)  */
		/** This is where the random generation begins */
		/** We generate a random UUID, format it and check back for uniqueness... maximum retry 3 times*/
		let isOkay = false
		let retry = 0
		let newHandle = formatUserHandle(createCuid())
		while (!isOkay && retry < 3) {
			const exists = newHandle.length > 2 ? await doesItExist(newHandle) : true
			if (!exists) {
				isOkay = true
			} else {
				newHandle = formatUserHandle(createCuid())
			}
			retry++
		}
		if (isOkay) {
			return newHandle
		}
		/** If we fail to generate a unique handle, we throw an error */
		throw new Error("Failed to generate a unique handle")
	}

export function sanitizeHandle(input: string): string {
	return input.toLowerCase().trim().replace(/[^a-z0-9._]/g, "") // 1. remove invalid characters
		.replace(/\.+/g, ".") // 2. collapse consecutive dots
		.replace(/^\.*/g, "") // 3. remove leading dots
		.replace(/\.*$/g, "") // 4. remove trailing dots
		.replace(/_(\.)_/g, ".").replace(/((?<![a-z0-9.])){1,2}(\.)+(?=[a-z0-9])/g,
			".") // 5. remove dots not between alphanumerics
		.replace(/(?<=[a-z0-9])(\.)+(?![a-z0-9.]){1,2}/g,
			".") // 5. remove dots not between alphanumerics
		.replace(/\._/g, "_") // 6. remove any lingering dot-underscore patterns
		.replace(/_\./g, "_") // 7. remove underscore-dot patterns
		.slice(0, 30) // 8. max length
}
