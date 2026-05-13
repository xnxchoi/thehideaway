// import { CollectionConfig, Where } from "payload";

// export const Prices: CollectionConfig = {
//     slug: "prices",
//     admin: {
//         useAsTitle: "nickname",
//         description: "Price Object",
//         defaultColumns: ["nickname", "active", "createdAt"],
//         hidden: ({ user }) => user?.role !== 'admin',
//     },
//     defaultPopulate: {
//         id: true,
//         'tiers.name': true,
//         'tiers.type': true,
//         'tiers.interval': true,
//         'tiers.interval_count': true,
//         'tiers.unit_amount': true,
//         'tiers.trial_period_days': true,
//         'tiers.active': true,
//         nickname: true,
//         active: true,
//         'tiers.currency_options.currency': true,
//         'tiers.currency_options.flat_amount': true,

//     },
//     access: {
//         create: ({ req }) => {
//             const user = req?.user;
//             if (user?.role === 'admin') return true;
//             return false;
//         },
//         read: ({ req }) => {
//             const user = req?.user;
//             if (user?.role === 'admin') return true;
//             return {
//                 and: [
//                     {
//                         _status: {
//                             equals: "published",
//                         }
//                     }
//                 ]
//             } as Where;
//         },
//         update: ({ req }) => {
//             const user = req?.user;
//             if (user?.role === 'admin') return true;
//             return false;
//         },
//         delete: ({ req }) => {
//             const user = req?.user;
//             if (user?.role === 'admin') return true;
//             return false;
//         },
//     },
//     fields: [

//         {
//             name: "nickname",
//             type: "text",
//             required: true,
//             index: true,
//         },
//         // {
//         //     name: "product",
//         //     type: "relationship",
//         //     relationTo: [],
//         // },
//         {
//             name: "active",
//             type: "checkbox",
//             defaultValue: true,
//             required: true,
//             index: true,
//         },
//         {
//             name: "tiers",
//             type: "array",
//             fields: [
//                 {
//                     name: "name",
//                     type: "text",
//                     required: true,
//                     index: true,
//                 }, {
//                     name: "active",
//                     defaultValue: true,
//                     required: true,
//                     type: "checkbox",
//                     index: true,
//                 }, {
//                     type: "array",
//                     name: "currency_options",
//                     fields: [
//                         {
//                             name: "currency",
//                             type: "select",
//                             options: ["krw", "usd", "eur"],
//                             hasMany: false,
//                             defaultValue: "krw",
//                             required: true,
//                         }, {
//                             name: "flat_amount",
//                             type: "number",
//                             required: true,
//                             min: 0,
//                             index: true,
//                         }, {
//                             name: "flat_amount_decimal",
//                             type: "text",
//                         }
//                     ]
//                 },
//                 {
//                     name: "type",
//                     type: "select",
//                     options: ["one_time", "recurring"],
//                     hasMany: false,
//                     defaultValue: "one_time",
//                     required: true,
//                 }, {
//                     name: "interval",
//                     type: "select",
//                     options: ["day", "week", "month", "year"],
//                     hasMany: false,
//                     defaultValue: "month",

//                     index: true,
//                 }, {
//                     name: "interval_count",
//                     type: "number",
//                     min: 1,
//                     defaultValue: 1,
//                     index: true,
//                 }, {
//                     name: "trial_period_days",
//                     type: "number",
//                     required: true,
//                     defaultValue: 0,
//                     min: 0,
//                     index: true,
//                 }, {
//                     name: "unit_amount",
//                     type: "number",
//                     required: true,
//                     defaultValue: 1,
//                     min: 1,
//                     index: true,
//                 }, {
//                     name: "unit_amount_decimal",
//                     type: "text",
//                     required: true,
//                     defaultValue: "1",
//                     index: true,
//                 }
//             ],
//             index: true,
//         }
//     ],
//     timestamps: true,
//     versions: {
//         drafts: true,
//         maxPerDoc: 25,

//     }
// }

// /****
//  *
//  *     {
//             name: "recurring",
//             type: "group",
//             fields: [
//                 {
//                     name: "interval",
//                     type: "select",
//                     options: ["day", "week", "month", "year"],
//                     hasMany: false,
//                     defaultValue: "month",

//                 },
//                 {
//                     name: "interval_count",
//                     type: "number",
//                     defaultValue: 1,
//                 },
//                 {
//                     name: "trial_period_days",
//                     type: "number",
//                     access: {
//                         create: () => true,
//                     }
//                 }
//             ]
//         }, {
//             name: "type",
//             type: "select",
//             options: ["one_time", "recurring"],
//             hasMany: false,
//             defaultValue: "one_time",
//             required: true,
//         }, {
//             name: "unit_amount",
//             type: "number",
//             required: true,
//             defaultValue: 1,
//         }, {
//             name: "billing_scheme",
//             type: "select",
//             options: ["per_unit", "tiered"],
//             hasMany: false,
//             defaultValue: "per_unit",
//             required: true,
//         }, {
//             name: "currency_options",
//             type: "group",
//             fields: [
//                 {
//                     name: "krw",
//                     type: "group",
//                     fields: currencyOptionsField
//                 },
//                 {
//                     name: "usd",
//                     type: "group",
//                     fields: currencyOptionsField
//                 },
//                 {
//                     name: "eur",
//                     type: "group",
//                     fields: currencyOptionsField
//                 },
//             ],
//         },
//         {
//             name: "custom_unit_amount",
//             type: "group",
//             fields: [
//                 {
//                     name: "maximum",
//                     type: "number",
//                 },
//                 {
//                     name: "minimum",
//                     type: "number",
//                     defaultValue: 1,
//                     min: 1,
//                 },
//                 {
//                     name: "preset",
//                     type: "number",
//                     defaultValue: 1,
//                 },
//             ]
//         },
//  *
//  *     {
//             name: "tiers",
//             type: "array",
//             fields: [
//                 {
//                     name: "flat_amount",
//                     type: "number",
//                 },
//                 {
//                     name: "flat_amount_decimal",
//                     type: "text",
//                 },
//                 {
//                     name: "unit_amount",
//                     type: "number",
//                     defaultValue: 1,
//                     min: 1,
//                 },
//                 {
//                     name: "unit_amount_decimal",
//                     type: "text",
//                     defaultValue: "1",
//                 },
//                 {
//                     name: "up_to",
//                     type: "number",
//                     min: 1,
//                     defaultValue: 1,
//                 },
//             ]
//         },
//  *
//  *       {
//             name: "tiers_mode",
//             type: "select",
//             options: ["graduated", "volume"],
//             hasMany: false,
//             defaultValue: "graduated",

//         },
//         {
//             name: "transform_quantity",
//             type: "group",
//             fields: [
//                 {
//                     name: "divide_by",
//                     type: "number",
//                 },
//                 {
//                     name: "round",
//                     type: "select",
//                     options: ["up", "down"],
//                     hasMany: false,
//                     defaultValue: "up",
//                 },
//             ]
//         }, {
//             name: "unit_amount_decimal",
//             type: "text",
//         },
//  *
//  *
//  *  {
//             name: "tax_behavior",
//             type: "select",
//             options: ["unspecified", "exclusive", "inclusive"],
//             hasMany: false,
//             defaultValue: "unspecified",
//             required: true,
//             hooks: {
//                 beforeChange: [({ data, value, req, originalDoc, operation, }) => {
//                     const user = req?.user;
//                     if (!user) throw new Error("Unauthorized");
//                     if (user.role !== 'admin') throw new Error("Unauthorized");
//                     let finalValue = value && ['unspecified', 'exclusive', 'inclusive'].includes(value) ? value : 'unspecified';
//                     if (operation === 'update') {
//                         if (originalDoc) {
//                             if (originalDoc.tax_behavior !== 'unspecified') {
//                                 finalValue = originalDoc.tax_behavior;
//                             } else {
//                                 finalValue = value;
//                             }
//                         }
//                     }
//                     return finalValue;
//                 }]
//             }

//         },
//  */
import { CollectionConfig } from "payload";
import { isAdmin } from "@/payload/plugins/locker/access/accessCheckers";

export const Prices: CollectionConfig = {
  slug: "prices",
  admin: { useAsTitle: "id" }, // Or use another field as title if you add one
  // Prices are referenced by Plans (which are public-readable), so reads
  // must stay open. Writes are admin-only — without this block, Payload's
  // default lets any authenticated user mutate the price table, which is
  // catalog tampering as a money-flow attack.
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin
  },
  fields: [
    {
      name: "currencies",
      type: "array",
      required: true,
      defaultValue: [
        {
          currency: "KRW",
          amount: 0 ,
        }
      ],
      fields: [
        { name: "amount", type: "number", required: true,min: 0 },
        {
          name: "currency",
          type: "relationship",
          relationTo: "currency",
          required: true,
          hasMany: false,
          index: true
        },
        {
          name: "display_amount",
          type: "text",
          virtual: true,
          hooks: {
            beforeChange: [
              ({ req, data, siblingData }) => {
                delete siblingData["display_amount"];
              }
            ],
            afterRead: [
              ({ data, req, siblingData }) => {
                const currency = siblingData["currency"]?.name;
                const numb = siblingData["amount"];
                if (!currency || !numb) return;
                const locale =
                  currency === "EUR"
                    ? "fr-FR"
                    : currency === "KRW"
                      ? "ko-KR"
                      : currency === "USD"
                        ? "en-US"
                        : "en-IN";
                return new Intl.NumberFormat(locale, {
                  style: "currency",
                  currency: currency
                }).format(numb);
              }
            ]
          }
        }
      ]
    }
  ]
};
