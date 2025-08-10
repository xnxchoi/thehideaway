import {FieldAccessArgs} from "node_modules/payload/dist/fields/config/types";
import {FieldAccess} from "payload";
import {Post} from "@/payload-types";
import {roleToAuthority} from "@/payload/plugins/locker/fields/authority/utils";
import {RP_Roles} from "@/stores/Notification/NotificationStore";

const contentReadAccess: FieldAccess = ({
	siblingData,
	data,
	doc,
	req,
}: FieldAccessArgs) => {
	const {user, payload} = req;
	const idc = doc as Post;
	if (idc._status !== "published") {
		if (!user) {
			return false;
		}
		return user.id === idc.author;
	}
	if (idc.locked) {
		//locked related stuff
		if (user?.role === "admin") return true;
		const authLevel = idc.authority ?? 0;
		const allowed = idc.allowList ?? [];
		if (authLevel > 0) {
			if (roleToAuthority((user?.role as RP_Roles) ?? "user") >= authLevel) {
				return true;
			}
		}
		return allowed.some((all) => all === user?.id);
	} else {
		return true;
	}
};
