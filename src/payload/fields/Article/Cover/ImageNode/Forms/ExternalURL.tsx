import {BaseImageSchema} from "../DarkRoom";
import {z} from "zod/v4";
import {ClientUser} from "payload";
import {useCallback, useMemo, useState} from "react";
import {DeepKeys, revalidateLogic, useForm, ValidationError} from "@tanstack/react-form";
import {isEmpty} from "lodash-es";
import {uuidv7} from "uuidv7";
import {stringify} from "qs-esm";
import {getClientSideURL} from "@/utilities/getURL";

const ExternalImageSchema = z.object({
	...BaseImageSchema,
	collection: z.literal("exMedia"),
	author: z.string(),
	alt: z.string(),
	darkmode: z.boolean(),
	source: z.object({

		link: z.url({
			protocol: /^https?$/,
			hostname: z.regexes.domain
		}),
		provider: z.literal(["external", "unsplash"]),
	}),
	file: z.file().mime(["image/*"]).max(3_000_000),

})
const FormVSchema = z.object({
	url: z.url({
		protocol: /^https?$/,
		hostname: z.regexes.domain
	}),

})
type FormValues = {
	url: string | null
}
export const ExternalURLForm = ({user}: { user: Pick<ClientUser, "name" | "id"> }) => {
	const {userName, userId} = useMemo(() => ({
		userName: user.name,
		userId: user.id,
	}), [user])
	const defaultValues: FormValues = {
		url: null
	}
	const urlRegex = useMemo(() => /^(http(s?):\/\/)?(www\.)?(([-a-zA-Z0-9@:%_]{2,256})\.)*([-a-zA-Z0-9@:%_]{2,256})\.([a-z]){2,16}((\/([-a-zA-Z0-9@:%_]+))*)(\?([-a-zA-Z0-9@:%_]+)((=([-a-zA-Z0-9@:%_]*))?)(&([-a-zA-Z0-9@:%_]+)((=([-a-zA-Z0-9@:%_]*))?))*)?((#([-a-zA-Z0-9@:%_]+))?)$/, [])
	const siteUrl = useMemo(() => getClientSideURL(), []);
	const [file, setFile] = useState<File | null>(null);
	const onExternalUrlInput = useCallback(async (v: string) => {

		if (!v.match(/^http(s?):\/\//)) {
			v = "https://" + v;
		}
		const input = v.trim();
		// Trim to avoid hidden whitespace tricks
		const value = encodeURI(input);
		if (!urlRegex.test(value)) throw new Error("Invalid URL");
		const url = new URL(value);
		// Hard rule: only http or https
		if (url.protocol !== "http" && url.protocol !== "https") throw new Error("URL must start with http or https, or no protocol specified.");
		// Reject empty hostname or localhost-ish attempts
		if (!url.hostname || url.hostname.match(/^localhost$|^\d+\.\d+\.\d+\.\d+$/)) throw new Error("Invalid host; localhost is not allowed.");
		// Reject obviously malformed paths (browser won't reject these)
		if (/\s/.test(url.pathname)) throw new Error("Space cannot be used in the path.")

		try {
			const uid = uuidv7();
			const r = await fetch(`${siteUrl}/api/image-courier${stringify({url: value}, {
				addQueryPrefix: true,
			})}`, {method: "GET", credentials: "include"})

			if (r.ok) {
				const blob = await r.blob();

				return new File([blob], `external-${uid}.jpg`, {type: blob.type || "image/jpeg"})
			}
		} catch (error) {
			console.error("Error uploading image:", error);
			throw new Error("Failed to upload the url image. Please try again.");
		}
	}, [siteUrl, urlRegex])
	const form = useForm({
		defaultValues,
		validationLogic: revalidateLogic({
			mode: "submit",
			modeAfterSubmission: "change",
		}), onSubmit: async ({value: formValues}) => {
			const url = formValues.url;
			if (url) {
				const r = await onExternalUrlInput(url)
			}
		},
		validators: {
			onDynamic: async ({value: formValues}) => {
				const errors: Partial<Record<DeepKeys<FormValues>, ValidationError>> = {};

				(
					["url"] as const
				).forEach((requiredField) => {
					if (!formValues[requiredField]) {
						errors[requiredField] = "This is a required field.";
					}
				});

				if (formValues.url) {
					const urlResult = FormVSchema.safeParse({url: formValues.url})
					if (!urlResult.success) {
						errors.url = urlResult.error
					}
				}

				return isEmpty(errors) ? undefined : {form: errors, fields: errors};
			},
		}
	})
	return <form aria-label="Upload image"
	             className="flex w-full max-w-3xs sm:max-w-[20rem] flex-col gap-5"
	             noValidate onSubmit={(e) => {
		e.preventDefault()
		form.handleSubmit();
	}}>

	</form>
}