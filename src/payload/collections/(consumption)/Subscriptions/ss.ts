// import { CollectionConfig, FieldHookArgs } from "payload";
// import { currencyField } from "../../fields/Currency";
// import { TrialFields } from "../../fields/Trial";
// import { DateTime } from "luxon";
// export const Subscriptions: CollectionConfig = {
//     slug: "subscriptions",
//     labels: {
//         singular: "Subscription",
//         plural: "Subscriptions",
//     },
//     defaultPopulate: {
//         id: true,
//         customer: true,
//         description: true,
//         state: true,
//     },
//     access: {
//         create: ({ req }) => {
//             return req.user?.role === "admin";
//         },
//         read: ({ req, data, }) => {
//             if (!req.user) {
//                 return false;
//             }
//             if (req.user.role === "admin") {
//                 return true;
//             }
//             return {
//                 customer: {
//                     equals: req.user.id,
//                 },
//             }
//         },
//         update: ({ req }) => {
//             return req.user?.role === "admin";
//         },
//         delete: ({ req }) => {
//             return req.user?.role === "admin";
//         },
//     },
//     admin: {
//         useAsTitle: "id",
//     },
//     fields: [
//         {
//             name: "id",
//             type: "text",
//             required: true,
//             unique: true,
//             index: true,
//             defaultValue: () => {
//                 return crypto.randomUUID();
//             },
//             access: {

//                 update: () => false,
//             }
//         },

//         {
//             type: 'relationship',
//             name: "customer",
//             relationTo: "users",
//             hasMany: false,
//             maxDepth: 0,

//             index: true,
//             required: true,
//         },
//         {
//             name: "description",
//             type: "text",
//             required: true,
//         },
//         {
//             name: "state",
//             type: "select",
//             options: ["incomplete", "incomplete_expired", "trialing", "active", "past_due", "canceled", "unpaid", "paused"],
//             defaultValue: "active",
//             required: true,
//         },
//         {
//             name: "days_until_due",
//             type: "number",
//             index: true,
//         },
//         {
//             name: "default_payment_method",
//             type: "select",
//             options: ["bank_transfer", "cash"],
//             defaultValue: "bank_transfer",
//             required: true,
//             hasMany: false,
//         },
//         {
//             name: 'start_date',
//             type: 'date',
//             required: true,
//             index: true,
//             access: {
//                 update: () => false,
//             }
//         }, {
//             name: 'cancel_at',
//             type: 'date',

//         }, {
//             name: 'cancel_at_period_end',
//             type: 'checkbox',
//             defaultValue: false,
//             required: true,
//             index: true,
//         },
//         {
//             name: "ended_at",
//             type: "date",
//             index: true,
//         }, {
//             name: "canceled_at",
//             type: "date",
//             index: true,
//         }, ...TrialFields,
//         {
//             name: "billing_cycle_anchor",
//             type: "date",
//             required: true,
//             defaultValue: new Date(),

//             hooks: {
//                 beforeChange: [
//                     ({ operation, data, siblingData, req, value, overrideAccess, originalDoc, previousValue }: FieldHookArgs) => {
//                         if (operation === "create" || (operation === "update" && (overrideAccess || req.user?.role === "admin"))) {
//                             const now = DateTime.now();
//                             if (value) {
//                                 const val = DateTime.fromObject({
//                                     year: now.year,
//                                     month: value.month || now.month,
//                                     day: value.day_of_month || now.day,
//                                     hour: value.hour || now.hour,
//                                     minute: value.minute || now.minute,
//                                     second: value.second || now.second,
//                                 });
//                                 if (val.isValid) {
//                                     return val.toJSDate();
//                                 }
//                                 if (val.hour > 23) {
//                                     return new Error("Hour must be less than 23");
//                                 }
//                                 if (val.minute > 59) {
//                                     return new Error("Minute must be less than 59");
//                                 }
//                                 if (val.second > 59) {
//                                     return new Error("Second must be less than 59");
//                                 }
//                                 if (val.month > 12) {
//                                     return new Error("Month must be less than 12");
//                                 }
//                                 if (val.month < 1) {
//                                     return new Error("Month must be greater than 0");
//                                 }
//                                 if (val.day < 1) {
//                                     return new Error("Day of month must be greater than 0");
//                                 }
//                                 if (val.day > 31) {
//                                     return new Error("Day of month must be less than 31");
//                                 }

//                             }
//                         }
//                         return previousValue || originalDoc?.billing_cycle_anchor;
//                     }

//                 ]
//             }
//         }, {
//             name: "billing_cycle_anchor_config",
//             type: "group",
//             fields: [
//                 {
//                     name: "day_of_month",
//                     type: "number",
//                     min: 1,
//                     max: 31,
//                     required: true,
//                     defaultValue: 1,

//                 },
//                 {
//                     name: "hour",
//                     type: "number",
//                     min: 0,
//                     max: 23,
//                     required: true,
//                     defaultValue: 0,

//                 },
//                 {
//                     name: "minute",
//                     type: "number",
//                     min: 0,
//                     max: 59,
//                     required: true,
//                     defaultValue: 0,

//                 },
//                 {
//                     name: "second",
//                     type: "number",
//                     min: 0,
//                     max: 59,
//                     required: true,
//                     defaultValue: 0,

//                 },
//                 {
//                     name: "month",
//                     type: "number",
//                     min: 1,
//                     max: 12,
//                     required: true,
//                     defaultValue: 1,

//                 },

//             ],
//             hooks: {
//                 beforeChange: [
//                     ({ operation, data, siblingData, req, value, overrideAccess, originalDoc, previousValue }: FieldHookArgs) => {
//                         const now = DateTime.now();
//                         const val = DateTime.fromObject({
//                             day: value.day_of_month || now.day,
//                             month: value.month || now.month,
//                             hour: value.hour || now.hour,
//                             minute: value.minute || now.minute,
//                             second: value.second || now.second,
//                         })
//                         if (operation === "create" || (operation === "update" && (overrideAccess || req.user?.role === "admin"))) {
//                             if (val.isValid) {
//                                 return {
//                                     day_of_month: val.day,
//                                     month: val.month,
//                                     hour: val.hour,
//                                     minute: val.minute,
//                                     second: val.second,
//                                 }
//                             }
//                         }
//                         return originalDoc?.billing_cycle_anchor_config || previousValue || {
//                             day_of_month: now.day,
//                             month: now.month,
//                             hour: now.hour,
//                             minute: now.minute,
//                             second: now.second,
//                         };
//                     }
//                 ]
//             }
//         }

//     ],
// }
// export const SubscriptionItem: CollectionConfig = {
//     slug: "subscription-items",
//     labels: {
//         singular: "Subscription Item",
//         plural: "Subscription Items",
//     },
//     fields: [
//         {
//             name: "current_period_start",
//             type: "date",
//             required: true,
//         },
//         {
//             name: "current_period_end",
//             type: "date",
//             required: true,
//         },
//         {
//             name: "quantity",
//             type: "number",
//             required: true,
//             defaultValue: 1,
//             min: 1,
//         },

//     ]
//     , timestamps: true,
//     versions: {
//         drafts: true,
//         maxPerDoc: 10,
//     }

// }

// export const SubscriptionSchedules: CollectionConfig = {
//     slug: "subscription-schedules",
//     labels: {
//         singular: "Subscription Schedule",
//         plural: "Subscription Schedules",
//     },
//     fields: [
//         {
//             name: "current_phase",
//             type: "group",
//             fields: [
//                 {
//                     name: "start_date",
//                     type: "date",
//                     required: true,
//                 },
//                 {
//                     name: "end_date",
//                     type: "date",
//                 }
//             ]
//         }, {
//             name: "customer",
//             type: "relationship",
//             relationTo: "users",
//             hasMany: false,
//             maxDepth: 0,
//             required: true,
//         },

//     ],
// }

// /****
//  *
//  */
