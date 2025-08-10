import {Config} from 'payload'

export const formatAdminURL = (args: {
	adminRoute: NonNullable<Config['routes']>['admin']
	basePath?: string
	path: '' | `/${string}` | null | undefined
	serverURL?: Config['serverURL']
}): string => {
	const {adminRoute, basePath = '', path: pathFromArgs, serverURL} = args
	const path = pathFromArgs || ''

	if (adminRoute) {
		if (adminRoute === '/') {
			if (!path) {
				return `${serverURL || ''}${basePath}${adminRoute}`
			}
		} else {
			return `${serverURL || ''}${basePath}${adminRoute}${path}`
		}
	}

	return `${serverURL || ''}${basePath}${path}`
}
