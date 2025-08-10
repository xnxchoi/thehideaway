'use server'
import {revalidateTag} from 'next/cache'
import type {GlobalAfterChangeHook} from 'payload'

export const revalidateFooter: GlobalAfterChangeHook = async ({doc, req: {payload}}) => {
	payload.logger.info(`Revalidating footer`)

	revalidateTag('global_footer')

	return doc
}
