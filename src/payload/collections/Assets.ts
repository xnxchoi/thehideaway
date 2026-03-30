import path from "path";
import {CollectionConfig} from "payload";
import {fileURLToPath} from "url";
import {uuidv7} from "uuidv7";
import {hideIfNotAdmin} from "./helpers";
import { idField } from "@/payload/fields/IDField";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
export const Assets: CollectionConfig = {
  slug: "assets",
  defaultPopulate: {
    url: true,
    filename: true,
    mimeType: true,
    width: true,
    thumbnailURL: true,
	  size: true,
	  source: true,
    blurDataURL: true,
    height: true,
	  darkmode: true,
	  alt: true, caption: true
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => {
      if (!user) {
        return false;
      }
      if (user?.role === "admin") {
        return true;
      }
      return false;
    },
    update: ({ req: { user } }) => {
      if (!user) {
        return false;
      }
      if (user?.role === "admin") {
        return true;
      }
      return false;
    },
    delete: ({ req: { user } }) => {
      if (!user) {
        return false;
      }
      if (user?.role === "admin") {
        return true;
      }
      return false;
    }
  },
  admin: {
    hidden: hideIfNotAdmin,
	  useAsTitle: "filename",
  },
	fields: [
    idField(),
    
    {
      name: "alt",
      type: "text",
      required: true,
      defaultValue: ({ req }) => {
        return "";
      }
    },
    {
      name: "caption",
      type: "text"
    },
    {
	    name: "compiled",
	    type: "join",
	    collection: "compilations",
	    on: "items",
    }
  ],

  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: path.resolve(dirname, "../../../public/assets/media"),

  },
  hooks: {
    beforeOperation: [],
    beforeChange: []
  }
};
