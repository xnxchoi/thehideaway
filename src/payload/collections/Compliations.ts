import {CollectionConfig, Where} from "payload";
import {isAdminOrEditor} from "@/payload/plugins/locker/access/accessCheckers";
import {hideIfNotAdmin} from "@/payload/collections/helpers";
import {slugField} from "@/payload/fields";

export const Compliation: CollectionConfig = {
    slug: "compilations",
    defaultPopulate: {},
    access: {
        read: ({req}) => {
            const user = req.user;
            if (!user) {
                return {
                    visibility: {
                        equals: "public"
                    }
                } as Where
            }
            switch (user.role) {
                case 'admin':
                case 'editor':
                    return true;
                case 'author':
                case 'patron':
                    return {
                        visibility: {
                            not_equals: "private"
                        }
                    } as Where;
                default:
                    return {
                        visibility: {
                            equals: "public"
                        }
                    } as Where;
            }
        },
        update: isAdminOrEditor,
        delete: isAdminOrEditor,
        create: isAdminOrEditor,
    },
    admin: {
        hidden: hideIfNotAdmin,
    }, fields: [{
        name: "id",
        type: "text",
        required: true,
        unique: true,
        index: true,
    }, {
        name: "title",
        type: "text",
        required: true, index: true,
    }, {
        name: "description",
        type: "text",
    }, {
        name: "visibility",
        type: "select", index: true, required: true,
        options: ["public", "private", "exclusive"],
        defaultValue: "public",
    },
        ...slugField(),
        {
            name: "entries",
            type: "join",
            on: "compilation",
            collection: 'assets'
        }
    ],
}