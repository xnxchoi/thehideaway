import {CollectionConfig} from "payload";
import {uuidv7} from "uuidv7";
import {hideIfNotAdmin} from "./helpers";

export const EmailQuota: CollectionConfig = {
  slug: 'email-quota',
  admin: {
    hidden:hideIfNotAdmin,
    useAsTitle: 'date',
    defaultColumns: ['date', 'used', 'updatedAt'],
  },
  access: {
    read: ({req}) => {
      const overrideAccess = req.context.overrideAccess;
      if (overrideAccess) return true;
      const user = req.user;
      return user?.role === "admin";
    },
    create: ({req}) => {
			const user = req.user;
      const overrideAccess = req.context.overrideAccess;
			if (overrideAccess) return true;
			return user?.role === "admin";
		},
    update: ({req}) => {
			const user = req.user;
      const overrideAccess = req.context.overrideAccess;
			if (overrideAccess) return true;
			if (!user) {
				return false;
			}
			return user.role === "admin";
		},
    delete: ({req}) => {
			const user = req.user;
      const overrideAccess = req.context.overrideAccess;
			if (overrideAccess) return true;
			if (!user) {
				return false;
			}
			return user.role === "admin";
		},
  },
	fields: [{
		name: "id",
		type: "text",
		defaultValue: uuidv7,
		access: {
			update: () => false
		},
		required: true,
		admin: {
			hidden: true
		}
	},
    {
      name: 'date',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Date in YYYY-MM-DD format',
      },
    },
    {
      name: 'used',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        description: 'Number of emails sent on this date',
      },
    },
  ],
};
