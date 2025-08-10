import {CollectionConfig, Where} from "payload";
import {ensureFirstCycle} from "./hooks";
import {isAdmin} from "@/payload/plugins/locker/access/accessCheckers";
import {createInvoiceForCycle} from "./hooks/subscriptionCycleHooks";
import {SubscriptionCycle} from "@/payload-types";
// for Plans & Prices
const adminOnlyAccess = {
	create: isAdmin,
	read: () => true, // Publicly readable if you want to show Plans/Prices to all users
	update: isAdmin,
	delete: isAdmin,
};

// for Subscriptions
const subscriptionAccess = {
	create: isAdmin, // Only backend/admin should create Subscriptions
	read: ({req}) => {
		if (isAdmin({req})) return true;
		return {
			user: {
				equals: req.user?.id,
			},
		};
	},
	update: ({req}) => {
		if (isAdmin({req})) return true;
		return {
			user: {
				equals: req.user?.id,
			},
		};
	},
	delete: isAdmin,
};
export const Subscriptions: CollectionConfig = {
	slug: "subscriptions",
	access: subscriptionAccess,
	fields: [
		{
			name: "user",
			type: "relationship",
			relationTo: "users",
			required: true,
			index: true,
			maxDepth: 0,
		},
		{
			name: "plan",
			type: "relationship",
			relationTo: "plans",
			required: true,
			index: true,
			hasMany: false,
		},
		{
			name: "start_date",
			type: "date",
			required: true,
		},
		{
			name: "subscription_status",
			type: "select",
			required: true,
			defaultValue: "active",
			options: ["active", "paused", "canceled"],
		},
		{
			name: "is_due",
			type: "checkbox",
			defaultValue: false,
			access: {
				update: ({req}) => {
					return req.user?.role === "admin";
				},
			},
		},
		{
			name: "paid",
			type: "checkbox",
			defaultValue: false, // hooks: {
			//   afterChange: [
			//     async ({ value, siblingData, req, originalDoc }) => {
			//       if (value === true && originalDoc.is_due === true) {
			//         // Prevent advancing if subscription is paused/canceled
			//         if (originalDoc.subscription_status !== "active") {
			//           console.log(
			//             `Skipping cycle advance for subscription ${originalDoc.id} — status is ${originalDoc.subscription_status}`,
			//           );
			//           return;
			//         }
			//
			//         const plan = await req.payload.findByID({
			//           collection: "plans",
			//           id: siblingData.plan as unknown as string,
			//         });
			//
			//         if (plan?.type !== "recurring") return;
			//
			//         const lastCycle = originalDoc.subscription_cycles?.slice(-1)?.[0];
			//         if (!lastCycle) return;
			//
			//         const intervalMonths = plan?.recurring?.interval || 1;
			//
			//         const newCycleStart = new Date(lastCycle.cycle_end);
			//         const newCycleEnd = new Date(newCycleStart);
			//         newCycleEnd.setMonth(newCycleEnd.getMonth() + intervalMonths);
			//
			//         await req.payload.update({
			//           collection: "subscriptions",
			//           id: originalDoc.id,
			//           data: {
			//             subscription_cycles: [
			//               ...originalDoc.subscription_cycles,
			//               {
			//                 cycle_start: newCycleStart.toISOString(),
			//                 cycle_end: newCycleEnd.toISOString(),
			//               },
			//             ],
			//             is_due: false,
			//             paid: false,
			//             last_due_check: new Date().toISOString(), // see next section
			//           },
			//         });
			//       }
			//     },
			//   ],
			// },
		},
		{
			name: "last_due_check",
			label: "Last Due Check (System)",
			type: "date",
			admin: {
				readOnly: true,
			},
		},
		{
			name: "cycles",
			type: "relationship",
			relationTo: "subscription-cycle",
			hasMany: true,
			index: true,
			maxDepth: 0,
		},
		{
			name: "current_cycle",
			type: "relationship",
			relationTo: "subscription-cycle",
			hasMany: false,
			unique: true,
			filterOptions: ({data, siblingData, user, id}) => {
				const subs = data.cycles;
				if (Array.isArray(subs)) {
					const where = {
						id: {
							in: subs.map((sub) => {
								return sub as SubscriptionCycle["id"];
							}),
						},
					} as Where;
					return where;
				}
				return false;
			},
		},
		{
			name: "next_cycle_end",
			label: "Next Cycle End (Computed)",
			type: "ui",

			admin: {
				components: {
					Field: {
						path: "@/payload/fields/SubscriptionCycle/index.tsx#SubscriptionCycle",
						clientProps: {
							path: "subscription_cycles",
						},
					},
				},
			},
		},
	],
};
export const SubscriptionSchedule: CollectionConfig = {
	slug: "subscription-cycle",
	fields: [
		{
			name: "invoice",
			type: "relationship",
			relationTo: "invoices",
			hasMany: false,
			unique: true,
			required: true,
		},
		{name: "cycle_start", type: "date", required: true},
		{name: "cycle_duration", type: "number", required: true},
		{
			name: "cycle_unit",
			type: "select",
			hasMany: false,
			required: true,
			defaultValue: "month",
			options: ["month", "day", "week", "year"],
		},
		{
			name: "cycle_end",
			type: "date",
		},
	],
	access: {
		read: ({req}) => req?.user?.role === "admin",
		update: ({req}) => req?.user?.role === "admin",
		delete: ({req}) => req?.user?.role === "admin",
		create: ({req}) => req?.user?.role === "admin",
	},
};
