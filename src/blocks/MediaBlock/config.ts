import type { Block } from "payload";
import { uuidv7 } from "uuidv7";

export const MediaBlock: Block = {
  slug: "mediaBlock",
  interfaceName: "Media",
  fields: [
    {
      name: "id",
      type: "text",
      defaultValue: () => uuidv7(),
      access: {
        update: () => false
      },
      required: true,
      admin: {
        hidden: true
      }
    },
    {
      name: "media",
      type: "upload",
      relationTo: "media",
      required: true
    }
  ]
};
