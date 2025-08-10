import type {SanitizedConfig} from 'payload'

import payload from 'payload'
import {seedRP} from '@/payload/endpoints/seeder'

// Script must define a "script" function export that accepts the sanitized config
export const script = async (config: SanitizedConfig) => {
	await payload.init({config})
	await seedRP({payload})
	payload.logger.info('Succesffully seeded!')
	process.exit(0)
}
