// import {type NextRequest, NextResponse} from 'next/server'
// import {CollectionSlug, getPayload} from "payload";
// import {LockedCollections} from "@/payload/plugins";
// import {currentUser} from "@/lib/auth/context/servers";
// import config from '@payload-config'
// import {lockedFieldsSelect} from "@/payload/plugins/locker/types";
// import {ALLOWED, projectt} from "@/app/components/core/s";
//
//
// export async function GET(req: NextRequest, {params}: { params: Promise<{ collection: string; id: string }> }) {
// 	try {
// 		const {collection: cl, id} = await params
// 		const payload = await getPayload({config})
// 		if (!cl) {
// 			return NextResponse.json({error: "Invalid collection"}, {status: 404, })
// 		}
// 		// 3) Validate collection slug
// 		if (!ALLOWED.has(cl as CollectionSlug)) {
// 			return NextResponse.json({error: 'unsupported collection'}, {status: 404})
// 		}
// 		const collection = cl as LockedCollections
// 		// 4) Optional: cap/canonicalize query options from client
//
// 		const session = await currentUser()
// 		const user = session ?? null
// 		const select=lockedFieldsSelect[collection]
// 		// 6) Read via local API but DO NOT override access
// 		const doc = await payload.findByID({
// 			collection: collection, id, overrideAccess: false, user, req: {user}, select
// 		})
// 		if(!doc)throw new Error('not found')
//
// 		// 7) Shape the response per collection
// 		const {data} = projectt(collection, doc)
// 		return NextResponse.json({data, collection},)
// 	} catch (err: any) {
// 		// Normalize common errors
// 		const msg = typeof err?.message === 'string' ? err.message : 'server error'
// 		const code = err?.status ?? (msg.toLowerCase().includes('not found') ? 404 : 500)
// 		return NextResponse.json({error: msg}, {status: code})
// 	}
// }
