import { slugField } from "@/payload/fields/slug";
import { AccessArgs, CollectionConfig, Where } from "payload";

import { Series, type Admin, type User } from "@/payload-types";
import { uuidv7 } from "uuidv7";
import { getServerSideURL } from "../../../utilities/getURL";
import type { RelAuthor } from "../../../types/collections/posts";
import { getSeriesBookMarks } from "./endpoints/getSeriesBookmarks";
import { populatePublishedAt } from "../../../hooks/populatePublishedAt";
import { sanitizeAuthor } from "../../fields/AuthorFields/hooks";

// Helper function to check if user has permission in series
const hasSeriesPermission = (
  user:
    | (Partial<User> & { collection: "users" })
    | (Partial<Admin> & { collection: "admins" }),
  seriesData: any,
  requiredRole: "owner" | "editor" | "author"
) => {
  if (!user || !seriesData) return false;
  if (user.collection === "admins") return true;
  // Owner has all permissions
  if (seriesData.owner === user.id || seriesData.owner?.id === user.id)
    return true;

  // Check editors
  if (requiredRole === "editor" || requiredRole === "author") {
    const editors = seriesData.editors || [];
    if (
      editors.some(
        (editor: RelAuthor) =>
          (typeof editor === "string" ? editor : editor.id) === user.id
      )
    )
      return true;
  }

  // Check authors
  if (requiredRole === "author") {
    const authors = seriesData.authors || [];
    if (
      authors.some(
        (author: RelAuthor) =>
          (typeof author === "string" ? author : author.id) === user.id
      )
    )
      return true;
  }

  return false;
};

export const SeriesConfig: CollectionConfig = {
  slug: "series",
  labels: {
    singular: "Publication",
    plural: "Publications"
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: [
      "title",
      "owner",
      "visibility",
      "authorCount",
      "updatedAt"
    ],
    description:
      "Manage publications like Medium - collaborative content hubs with multiple authors and editors"
  },
  access: {
    read: ({ req: { user } }: AccessArgs) => {
      if (!user) {
        // Public can only see published public publications
        return {
          and: [
            { _status: { equals: "published" } },
            { visibility: { equals: "public" } }
          ]
        } as Where;
      }

      if (user?.role === "admin") return true;

      if (["editor", "author"].includes(user?.role || "")) {
        return {
          or: [
            // Public published publications
            {
              and: [
                { _status: { equals: "published" } },
                { visibility: { equals: "public" } }
              ]
            },
            // Publications where user is owner
            { owner: { equals: user.id } },
            // Publications where user is editor
            { editors: { contains: user.id } },
            // Publications where user is author
            { authors: { contains: user.id } },
            // Unlisted publications where user has access
            {
              and: [
                { visibility: { equals: "unlisted" } },
                {
                  or: [
                    { owner: { equals: user.id } },
                    { editors: { contains: user.id } },
                    { authors: { contains: user.id } }
                  ]
                }
              ]
            }
          ]
        } as Where;
      }

      return {
        and: [
          { _status: { equals: "published" } },
          { visibility: { equals: "public" } }
        ]
      } as Where;
    },

    create: ({ req: { user } }: AccessArgs) => {
      if (!user) return false;
      return ["admin", "editor", "author"].includes(user.role || "");
    },

    update: ({ req: { user } }: AccessArgs) => {
      if (!user) return false;
      if (user?.role === "admin") return true;

      // Users can only update publications where they are owner or editor
      return {
        or: [{ owner: { equals: user.id } }, { editors: { contains: user.id } }]
      } as Where;
    },

    delete: ({ req: { user } }: AccessArgs) => {
      if (!user) return false;
      if (user?.role === "admin") return true;

      // Only owners can delete publications
      return {
        owner: { equals: user.id }
      };
    }
  },
  fields: [
    {
      name: "id",
      type: "text",
      admin: {
        hidden: true
      },
      defaultValue: () => uuidv7(),
      access: {
        create: () => true,
        update: () => false
      },
      index: true,
      required: true
    },
    {
      name: "title",
      type: "text",
      required: true,
      admin: {
        description: "The name of the series"
      }
    },

    {
      name: "description",
      type: "textarea",
      admin: {
        description: "A brief description of what the series is about"
      },
      defaultValue: () => "",
      required: true,
      index: true,
      maxLength: 250,
      access: {
        read: () => true,
        update: ({ req, doc }) => {
          const user = req.user;

          if (!user || !doc) return false;
          return hasSeriesPermission(user, doc, "editor");
        }
      }
    },
    {
      name: "tagline",
      type: "text",
      admin: {
        description: "A short, catchy tagline for your series"
      },
      defaultValue: () => ""
    },

    // Publication Management
    {
      name: "owner",
      type: "relationship",
      relationTo: "users",
      admin: {
        position: "sidebar",
        description: "The owner has full control over the series"
      },
      hasMany: false,
      index: true,
      maxDepth: 1,
      required: true,
      access: {
        read: () => true,
        update: ({ req, doc }) => {
          // Only admins can change ownership
          const user = req.user;
          if (!user || !doc) return false;
          if (user.role === "admin") return true;
          // Only owner can manage editors
          return doc.owner === user.id || doc.owner?.id === user.id;
        }
      }
    },

    {
      name: "editors",
      type: "relationship",
      relationTo: "users",
      admin: {
        position: "sidebar",
        description: "Editors can manage content and authors"
      },
      hasMany: true,
      maxDepth: 1,
      index: true,
      access: {
        read: () => true,
        update: ({ req, doc }) => {
          if (!req.user || !doc) return false;
          if (req.user.role === "admin") return true;
          // Only owner can manage editors
          return doc.owner === req.user.id || doc.owner?.id === req.user.id;
        }
      },
      required: true,
      maxRows: 3,
      minRows: 1
    },

    {
      name: "authors",
      type: "relationship",
      relationTo: "users",
      admin: {
        position: "sidebar",
        description: "Authors can submit and edit their own content"
      },
      hasMany: true,
      maxDepth: 1,
      index: true,
      access: {
        read: () => true,
        update: ({ req, doc }) => {
          if (!req.user || !doc) return false;
          if (req.user.role === "admin") return true;
          if (req.user.collection === "admins") return true;
          // Owner and editors can manage authors
          return hasSeriesPermission(req.user, doc, "editor");
        }
      },
      maxRows: 5,
      minRows: 1
    },

    // Series Settings
    {
      name: "visibility",
      type: "select",
      options: [
        { label: "Public", value: "public" },
        { label: "Unlisted", value: "unlisted" },
        { label: "Private", value: "private" }
      ],

      admin: {
        position: "sidebar",
        description: "Who can discover and read this series"
      },
      access: {
        read: () => true,
        update: ({ req, doc }) => {
          if (req.context.overrideAccess === true) return true;
          if (!req.user || !doc) return false;
          return hasSeriesPermission(req.user, doc, "owner");
        }
      },
      required: true,
      index: true,
      defaultValue: () => "private"
    },

    {
      name: "submissionPolicy",
      type: "select",
      options: [
        { label: "Authors Only", value: "authors" },
        { label: "Editors Only", value: "editors" },
        { label: "Closed - Owner Only", value: "owner" }
      ],
      defaultValue: "authors",
      admin: {
        position: "sidebar"
      },
      required: true,
      index: true
    },

    {
      name: "autoApprove",
      type: "checkbox",
      defaultValue: () => false,
      admin: {
        position: "sidebar",
        description: "Automatically approve submissions from authors"
      },
      required: true,
      index: true
    },

    {
      name: "cover",
      type: "text",
      defaultValue: () => "",

      admin: {
        hidden: true
      }
    },
    {
      name: "covere",
      type: "ui",
      admin: {
        position: "sidebar",
        components: {
          Field: {
            path: "@/payload/fields/ImageField/serverImageField.tsx",
            serverProps: {
              relationTo: "media",
              idPath: "cover",
              urlPath: getServerSideURL()
            }
          }
        }
      }
    },

    // Statistics and Metadata
    {
      name: "authorCount",
      type: "number",
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: "Total number of authors"
      }
    },

    {
      name: "entryCount",
      type: "number",
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: "Total number of published articles"
      }
    },

    {
      name: "website",
      type: "text",
      admin: {
        description: "Publication website URL"
      }
    },

    {
      name: "socialLinks",
      type: "array",
      fields: [
        {
          name: "platform",
          type: "select",
          options: [
            { label: "Twitter", value: "twitter" },
            { label: "Facebook", value: "facebook" },
            { label: "LinkedIn", value: "linkedin" },
            { label: "Instagram", value: "instagram" },
            { label: "YouTube", value: "youtube" },
            { label: "Other", value: "other" }
          ],
          required: true
        },
        {
          name: "url",
          type: "text",
          required: true
        }
      ],
      maxRows: 5
    },

    {
      name: "bookmarks",
      collection: "bookmarks",
      type: "join",
      on: "target"
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime"
        }
      }
    },
    ...slugField("title", {
      slugOverrides: {
        access: {
          read: () => true,
          create: () => true,
          update: ({ req, data, doc, siblingData }) => {
            const context = req.context;
            if (context.overrideAccess === true) return true;
            const user = req.user;
            if (!user || !user.id || !user.role) return false;
            if (user.role === "admin") return true;
            const seriesDoc = doc as Series;
            if (user.collection === "admins") return true;
            return hasSeriesPermission(user, seriesDoc, "owner");
          }
        }
      }
    })
    // {
    //   name: "entries",
    //   type: "array",
    //   fields: [
    //     {
    //       name: "article",
    //       type: "relationship",
    //       relationTo: ["posts", "delta"],
    //       hasMany: false
    //       // filterOptions: ({ req, data, id }) => {
    //       //   const user = req.user;
    //       //   if (!user || !user.id || !user.role || !data) return false;

    //       //   if (["admin", "editor"].includes(user.role)) {
    //       //     return true; // Admins can see all articles
    //       //   }
    //       //   const authorList = data.authors as UserOverview[];
    //       //   const authorIds = authorList.map((author) => author.id);
    //       //   const owner = data.owner as UserOverview
    //       //   ;
    //       //   const editorList = data.editors as UserOverview[];
    //       //   const editorIds = editorList.map((editor) => editor.id);
    //       //   if(user.id === owner.id){
    //       //     return {
    //       //       and:[

    //       //       ]
    //       //     }
    //       //   }

    //       //     return {
    //       //       or: [
    //       //         { author: { equals: user.id } },
    //       //         { _status: { equals: "published" } }
    //       //       ]
    //       //     } as Where;
    //       //   }
    //       //   return false;
    //       // }
    //     },
    //     {
    //       name: "featured",
    //       type: "checkbox",
    //       defaultValue: false,
    //       admin: {
    //         description: "Feature this article in the publication"
    //       }
    //     },
    //     {
    //       name: "addedBy",
    //       type: "relationship",
    //       relationTo: "users",
    //       required: true,
    //       hasMany: false,
    //       index: true,
    //       access: {
    //         read: () => true,
    //         update: () => false
    //       },
    //       maxDepth: 0,
    //       admin: {
    //         readOnly: true,
    //         description: "Who added this article to the publication"
    //       }
    //     },
    //     {
    //       name: "addedAt",
    //       type: "date",
    //       admin: {
    //         readOnly: true,
    //         description: "When this article was added"
    //       }
    //     }
    //   ],
    //   maxRows: 1000,
    //   admin: {
    //     description: "Articles published in this publication"
    //   }
    // }
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 3000,
        showSaveDraftButton: true
      },
      schedulePublish: true
    },
    maxPerDoc: 15
  },
  endpoints: [
    {
      path: "/:id/bookmarks",
      method: "get",
      handler: getSeriesBookMarks
    }
  ],
  hooks: {
    beforeValidate: [],
    beforeChange: [
      sanitizeAuthor(true),
      populatePublishedAt,
      // Auto-populate author count
      async ({ data, operation, originalDoc, req }) => {
        if (data.authors) {
          data.authorCount = data.authors.length;
        }

        // Auto-populate addedBy and addedAt for new articles
        if (data.articles && req.user) {
          data.articles = data.articles.map((article: any, index: number) => {
            const originalArticle = originalDoc?.articles?.[index];
            if (
              !originalArticle ||
              originalArticle.article !== article.article
            ) {
              // New article being added
              return {
                ...article,
                addedBy: req.user?.id,
                addedAt: new Date().toISOString()
              };
            }
            return article;
          });
        }

        return data;
      }
    ],
    afterChange: [
      // Update article count after changes
      async ({ doc, operation, req }) => {
        if (doc.articles) {
          const publishedCount = doc.articles.length;
          // Update the document with the new count
          await req.payload.update({
            collection: "series",
            id: doc.id,
            data: {
              entryCount: publishedCount
            }
          });
        }
      }
    ]
  }
};

// const seriesManagerFields:Field[]=[
//   {
//     name:"submitted",
//     type:"checkbox",
//     defaultValue:false,
//     access:{
//       read:()=>true
//       ,update:isAuthorOrEditor,
//       create:isAuthorOrEditor
//     },admin:{
//       components:{
//        Field:{
//         path:"@/payload/adminOnly/Checkbox",
//         serverProps:{
//           allowedRoles:["admin","editor","author"],
//           allowAuthor:true
//         }
//        }
//       },
//       position:"sidebar"
//     },

//   },{
//     name:"series",
//     type:"relationship",
//     relationTo:"series",
//     hasMany:false,
//     maxDepth:0,
//     admin:{
//       position:"sidebar",
//       components:{
//         Field:{path:"@/payload/adminOnly/Relationship", serverProps:{allowedRoles:["admin","editor","author"]}}
//       }
//     },
//     access:{
//       read:()=>true,
//       update:isAuthorOrEditor,
//       create:isAuthorOrEditor
//     },
//     filterOptions:async ({req, data,siblingData,id,user})=>{
//       if(!user){
//         return false;
//       }
//       if(user.role === "admin"||user.role === "editor"){
//         return true;
//       }
//       if(user.role==='author'){
//         return {
//           or:[{
//             authors:{
//               equals:user.id
//             }
//           },{
//             owner:{
//               equals:user.id
//             }
//           },]
//         } as Where
//       }
//       return false;
//     },
//     validate:async (val,{defaultValue,id,siblingData, operation,data,req,overrideAccess,previousValue,relationTo})=>{
//       const isSubmitting=siblingData?.submitted;
//       const payload=req.payload;
//       if(!isSubmitting){
//         return Boolean(val)? "The article is not being submitted; please check the submission status first." : true;
//       }
//       if(operation==='update'){
//         if(!id)return true;
//         const previousState=await payload.findVersions({collection:relationTo as Extract<CollectionSlug,"delta"|"playlists"|"tracks"|"userMedia"|"posts">,where:{parent:{
//           equals:id
//         }},
//         overrideAccess:true,
//         limit:1,
//         pagination:false,
//         select:{
//           submitted:true,
//           series:true,
//           _status:true,
//         },
//       }).catch(err=>{
//         payload.logger.error(`Error finding document for ${relationTo}: id ${id}`);
//         return null;
//       });
//       if(previousState){
//           if(previousState._status!==){

//       }}
//       const user=req.user;
//       if(!user){
//         return "You must be logged in to submit a series";
//       }
//       if(operation==='create'){
//         const userisgood=roleToAuthority("author")<=roleToAuthority(user.role);
//         if(!userisgood){
//           return "You do not have permission to submit a series";
//         }

//       }

//     }
//   }
// ]
// export const seriesPlugin=(pluginOptions:{
//   enabled?:boolean;
//   targetCollections?:IndexedCollections[];
// }):Plugin=>(incomingConfig)=>{
//   const config = {...incomingConfig};
//   const collections = [...(config.collections || [])];
//   if(pluginOptions.enabled === false){
//     return;
//   }
//   const targetCollections = pluginOptions.targetCollections || [];
//   let serious=collections.find(r=>r.slug === "series");
//   if(!serious){
//     collections.push(SeriesConfig);
//     serious = SeriesConfig;
//   }
//   targetCollections.forEach(slug=>{
//     const targetCollection = collections.find(r=>r.slug === `${slug}`);
//     if(targetCollection){
//       const fields=[...(targetCollection.fields||[])];

//       fields.push({
//         name:"submittedToSeries",
//         type:"relationship",
//         relationTo:"series"
//       });
//     }
//   });

// }
