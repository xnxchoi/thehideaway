import {getPayload} from "payload"
import configProvider from "@payload-config"
import {roleToAuthority} from "@/payload/plugins/locker/fields/authority/utils"
import {User} from "better-auth/types"

export const canCreateOrg = async (user: User) => {
	const payload = await getPayload({config: configProvider})
	const canCreate = await payload.findByID({
		collection: "users",
		id: user.id,
	}).then(
		(res) =>
			roleToAuthority(res?.role ?? "user") >= roleToAuthority("author"),
	).catch((err) => {
		console.error(err)
		return false
	})
	return canCreate
}
