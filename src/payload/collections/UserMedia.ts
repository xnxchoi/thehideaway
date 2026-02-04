import {User} from "@/payload-types";
import {authorFields} from "@/payload/fields/AuthorField/AuthorField";
import {sanitizeAuthor} from "@/payload/fields/AuthorField/hooks";
import {authenticated, standardUpdateAccess} from "@/payload/plugins/locker/access/accessCheckers";
import {extractImageInfo} from "@/utilities/extractImageInfo";
import path from "path";
import {CollectionConfig} from "payload";
import {fileURLToPath} from "url";
import {uuidv7} from "uuidv7";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
export const userMediaBasepath = path.resolve(dirname, "../../../public/users");
export const UserMedia: CollectionConfig = {
  slug: "userMedia",

  defaultPopulate: {
    url: true,
    filename: true,
    mimeType: true,
    width: true,
    thumbnailURL: true,
    blurDataURL: true,
    height: true,
    darkmode: true
  },
  folders: true,
  admin: {
    baseFilter: ({ req }) => {
      if (req.user?.role === "admin") return null;
      return {
        author: {
          equals: req.user?.id
        }
      };
    }
  },
  access: {
    create: authenticated,
    delete: standardUpdateAccess,
    read: () => true,
    update: standardUpdateAccess
  },
  fields: [
	  {
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
	  ...authorFields(),

	  {
      name: "bookmarks",
      collection: "bookmarks",
      type: "join",
      on: "target"
    }
  ],
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: path.resolve(dirname, "../../../public/users"),

  },
  hooks: {
    beforeOperation: [
      async ({ operation, context, req }) => {
        if (operation === "create" || operation === "update") {
          if (req.file && req.file.mimetype.indexOf("image") > -1) {
            const targetUser =
              (req.data?.author as User["id"] | undefined) ??
              req.user?.id ??
              null;
            if (!targetUser) {
              throw new Error("Target user not found.");
            }
            const targetUserDoc = await req.payload.findByID({
              collection: "users",
              id: targetUser,
              overrideAccess: true,
              select: {
                id: true,
                banned: true
              }
            });
            if (!targetUserDoc) {
              req.payload.logger.error("Target user not found.");
              throw new Error("Target user not found.");
            }
            if (targetUserDoc?.banned) {
              req.payload.logger.error("This user is banned.");
              throw new Error("This user is banned.");
            }
            if (req.file.name.startsWith("unsplash-")) {
              const unsplashId = req.file.name.split("-")[1];
              unsplashId && (context.sourceId = unsplashId);
            }

            const file = req.file as unknown as { md5: string };
            const hash = file.md5;
            req.file.name = `${targetUserDoc.id.toString()}_${hash.slice(
              0,
              2
            )}_${hash.slice(2, 4)}_${req.file.name}`;

            const { darkmode } = await extractImageInfo({ req: req });
            if (typeof darkmode === "boolean") {
              context.darkmode = darkmode;
            }
          }
        }
      }
    ],
    beforeValidate: [
      async ({ req, context, operation, data, originalDoc }) => {
        let dt = data;
	      if (operation === "create" && dt) {
		      return dt;
        } else {
          dt = {
            ...dt,
            source: {
              ...originalDoc.source
            }
          };
        }
        return dt;
      }
    ],
    beforeChange: [
      sanitizeAuthor(false),
      // populatePublishedAt,
      async ({ data, operation, req, context, originalDoc }) => {
        if (operation === "create" || operation === "update") {
          const user = req.user;

          const target =
            operation === "create"
              ? data.author || user?.id
              : (originalDoc.author as User["id"]) || user?.id;
          if (!target) {
            throw new Error("Target user not found.");
          }
          const targetUser = await req.payload.findByID({
            collection: "users",
            overrideAccess: true,
            id: target,
            select: {
              id: true,
              banned: true
            }
          });
          if (!targetUser) {
            req.payload.logger.error("Target user not found.");
            throw new Error("Target user not found.");
          }
          if (targetUser && targetUser.banned) {
            if (targetUser.id === user?.id) {
              req.payload.logger.error("This user is banned.");
              throw new Error("This user is banned.");
            }
          }

          if (req.file && req.file.mimetype.indexOf("image") > -1) {
            const darkm = context?.darkmode ?? false;
            data.darkmode = darkm;
            if (operation === "update") {
              if (
                darkm !== originalDoc.darkmode ||
                req.file.name !== originalDoc.filename
              ) {
                context.didChange = true;
              }
            }
          }
        }
        return data;
      }
    ],
    // afterChange: [
    //   async ({ doc, previousDoc, operation, req, context, collection }) => {
    //     function move(dir: string, filename: string) {
    //       const oldPath = path.resolve(dir, filename);
    //       const matches = [
    //         ...filename.matchAll(/^([^_]*)_([^_]*)_([^_]*)_(.*)$/gm),
    //       ][0];
    //       if (!matches) {
    //         const errmsg = "Invalid filename.";
    //         console.error(errmsg);
    //         throw new Error(errmsg);
    //       }
    //       const folder1 = matches[1];
    //       const folder2 = matches[2];
    //       const folder3 = matches[3];
    //       const filePath = matches[4];
    //       if (!folder1 || !folder2 || !folder3 || !filePath) {
    //         const invalids: string[] = [];
    //         if (!folder1) invalids.push("userID");
    //         if (!folder2) invalids.push("hash1");
    //         if (!folder3) invalids.push("hash2");
    //         if (!filePath) invalids.push("filePath");
    //         const errormessage = `Invalid filename did not match regex, invalid fields: ${invalids.join(", ")}`;
    //         console.error(errormessage);
    //         throw new Error(errormessage);
    //       }
    //       const newFolder = path.resolve(dir, folder1, folder2, folder3);
    //       const newPath = path.resolve(newFolder, filePath);
    //       mkdirSync(newFolder, {
    //         recursive: true,
    //       });
    //       renameSync(oldPath, newPath);
    //     }
    //     if (doc.filename) {
    //       if (collection.upload.staticDir) {
    //         move(collection.upload.staticDir, doc.filename);
    //         const sizes = doc.sizes as Record<string, { filename: string }>;
    //         Object.values(sizes).forEach((item) => {
    //           move(collection.upload.staticDir ?? "", item.filename);
    //         });
    //       }
    //     }
    //
    //     return doc;
    //   },
    // ],
    afterDelete: [
      // async ({ doc, collection }) => {
      //   function del(dir: string, filename: string) {
      //     const matches = [
      //       ...filename.matchAll(/^([^_]*)_([^_]*)_([^_]*)_(.*)$/gm),
      //     ][0];
      //     if (!matches) {
      //       console.error(
      //         "Invalid filename, skipping deletion of file: ",
      //         filename,
      //       );
      //       return;
      //     }
      //     const folder1 = matches[1];
      //     const folder2 = matches[2];
      //     const folder3 = matches[3];
      //     const filePath = matches[4];
      //     if (!folder1 || !folder2 || !folder3 || !filePath) {
      //       const invalids: string[] = [];
      //       if (!folder1) invalids.push("userID");
      //       if (!folder2) invalids.push("hash1");
      //       if (!folder3) invalids.push("hash2");
      //       if (!filePath) invalids.push("filePath");
      //       console.error(
      //         `Invalid filename did not match regex, invalid fields: ${invalids.join(", ")}, skipping deletion of file: `,
      //         filename,
      //       );
      //       return;
      //     }
      //     const newFolder = path.resolve(dir, folder1, folder2, folder3);
      //
      //     rmSync(path.resolve(newFolder, filePath), { force: true });
      //   }
      //
      //   if (collection.upload.staticDir) {
      //     del(collection.upload.staticDir, doc.filename);
      //     const sizes = doc.sizes as Record<string, { filename: string }>;
      //     Object.values(sizes).forEach((item) => {
      //       del(collection.upload.staticDir ?? "", item.filename);
      //     });
      //   }
      //   return doc;
      // },
    ]
    // afterOperation: [webpConversionHook]
  }
};
