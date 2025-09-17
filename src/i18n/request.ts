import {getRequestConfig} from "next-intl/server";
import {match} from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import {headers} from "next/headers";
export const locales = ["en", "ko"] as const;
export default getRequestConfig(async () => {

	const headersList = await headers();
	const negotiator = new Negotiator({headers: headersList}).language(locales);

 	const locale = match(negotiator, locales, "en") as typeof locales[number];
	console.log(locale);

	return {
		locale,
		messages: (await import(`../../messages/${locale}.json`)).default,
	};
});
