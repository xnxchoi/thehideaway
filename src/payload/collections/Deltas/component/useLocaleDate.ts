'use client'

import {DateTimeMaybeValid, DateTime} from "luxon";
import {useNow, useFormatter, useLocale} from "next-intl";

export const useLocaleDate = (timestamp: string) => {
	const date = DateTime.fromISO(timestamp, {setZone: true})
	const now = useNow();
	const diff = date.diffNow()
	const formatter = useFormatter()
	const locale = useLocale();
	const jsD = date.toJSDate()
	if (diff.days < 1) {
		if (DateTime.fromJSDate(now).hasSame(date, 'day')) {
			return date.toLocaleString(DateTime.TIME_24_WITH_SHORT_OFFSET, {locale})
		}
	}
	if (diff.weeks < 2) {
		return formatter.relativeTime(jsD, now)
	}
	if (DateTime.fromJSDate(now).hasSame(date, 'year')) {
		return date.setLocale(locale).toFormat('LLL d')
	}
	return date.setLocale(locale).toLocaleString(DateTime.DATE_MED)
}