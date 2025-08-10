import {getRequestConfig} from "next-intl/server";
import {match} from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import {headers} from "next/headers";

export default getRequestConfig(async () => {
	const locales = ["en", "ko", "ko-KR", "en-US"];
	const headersList = await headers();
	const negotiator = new Negotiator({headers: headersList}).language(locales);

	const locale = match(negotiator, locales, "en");
	console.log(locale);

	return {
		locale,
		messages: (await import(`../../messages/${locale}.json`)).default,
	};
});
