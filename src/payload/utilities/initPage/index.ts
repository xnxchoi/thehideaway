import type {CollectionSlug, InitPageResult, VisibleEntities} from 'payload'

import {notFound} from 'next/navigation'
import {isEntityHidden} from 'payload'
import * as qs from 'qs-esm'

import type {Args} from '@/payload/utilities/initPage/types'

import {initReq} from '@/payload/utilities/initReq'
import {getRouteInfo} from '@/payload/utilities/initPage/handleAdminPage'
import {handleAuthRedirect} from '@/payload/utilities/initPage/handleAuthRedirect'
import {isCustomAdminView} from '@/payload/utilities/initPage/isCustomAdminView'
import {isPublicAdminRoute} from '@/payload/utilities/initPage/shared'

export const initPage = async ({
	config: configPromise,
	importMap,
	route,
	searchParams,
	useLayoutReq,
}: Args): Promise<InitPageResult> => {
	const queryString = `${qs.stringify(searchParams ?? {}, {addQueryPrefix: true})}`

	const {
		cookies,
		locale,
		permissions,
		req,
		req: {payload},
	} = await initReq({
		configPromise,
		importMap,
		key: useLayoutReq ? 'RootLayout' : 'initPage',
		overrides: {
			fallbackLocale: false,
			req: {
				query: qs.parse(queryString, {
					depth: 10,
					ignoreQueryPrefix: true,
				}),
			},
			urlSuffix: `${route}${searchParams ? queryString : ''}`,
		},
	})

	const {
		collections,
		globals,
		routes: {admin: adminRoute},
	} = payload.config

	const languageOptions = Object.entries(payload.config.i18n.supportedLanguages || {}).reduce(
		(acc, [language, languageConfig]) => {
			if (Object.keys(payload.config.i18n.supportedLanguages).includes(language)) {
				//@ts-expect-error payload hasn't typed this
				acc.push({
					label: languageConfig.translations.general.thisLanguage,
					value: language,
				})
			}

			return acc
		},
		[],
	)

	const visibleEntities: VisibleEntities = {
		//@ts-expect-error payload hasn't typed this
		collections: collections.map(({slug, admin: {hidden}}) =>
			!isEntityHidden({hidden, user: req.user}) ? slug : null,
		).filter(Boolean),
		//@ts-expect-error payload hasn't typed this
		globals: globals.map(({slug, admin: {hidden}}) =>
			!isEntityHidden({hidden, user: req.user}) ? slug : null,
		).filter(Boolean),
	}

	let redirectTo: string | null = null

	if (
		!permissions.canAccessAdmin &&
		!isPublicAdminRoute({adminRoute, config: payload.config, route}) &&
		!isCustomAdminView({adminRoute, config: payload.config, route})
	) {
		redirectTo = searchParams && handleAuthRedirect({
			config: payload.config,
			route,
			searchParams: searchParams as any,
			user: req.user as any,
		}) || null
	}

	const {collectionConfig, collectionSlug, docID, globalConfig, globalSlug} = getRouteInfo({
		adminRoute,
		config: payload.config,
		defaultIDType: payload.db.defaultIDType,
		payload,
		route,
	})

	if ((collectionSlug && !collectionConfig) || (globalSlug && !globalConfig)) {
		return notFound()
	}

	return {
		collectionConfig,
		cookies,
		docID,
		globalConfig,
		languageOptions,
		locale,
		permissions,
		redirectTo: redirectTo ?? undefined,
		req,
		translations: req.i18n.translations,
		visibleEntities,
	}
}
