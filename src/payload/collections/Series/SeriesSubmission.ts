import type {CollectionConfig} from "payload";

export const SeriesSubmissionConfig: CollectionConfig = {
  slug: "series-submissions",
  fields: [
    {
      name: "series",
      type: "relationship",
      relationTo: "series",
      hasMany: false,
      maxDepth: 1,
      required: true,
      index: true,
      admin: {
        hidden: true
      },
      access: {
        read: () => true,
        update: () => false
      }
    },
    {
      name: "entry",
      type: "relationship",
      relationTo: ["posts", "surf", "playlists", "userMedia"],
      hasMany: false,
      maxDepth: 1,
      required: true,
      index: true,
      admin: {
        hidden: true
      },
      access: {
        read: () => true,
        update: () => false
      }
    },
    {
      name: "status",
      type: "select",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" }
      ],
      defaultValue: "pending",
      admin: {},
      access: {
        read: () => true
        // update: async ({ data, req, id, doc, siblingData }) => {
        //   if (req.context.overrideAccess === true) return true;
        //   const user = req.user;
        //   const payload = req.payload;
        //   if (!user || !payload || !id) return false;

        //   let seriesId = data?.series || doc?.series;
        //   if (!seriesId) {
        //     seriesId = (
        //       await payload.findByID({
        //         collection: "series-submissions",
        //         id,
        //         select: {
        //           series: true
        //         }
        //       })
        //     ).series;
        //   }

        //   if (!seriesId) return false;
        //   const series = await payload.findByID({
        //     collection: "series",
        //     id: seriesId,
        //     select: {
        //       authors: true,
        //       editors: true,
        //       owner: true,
        //       visibility: true,
        //       status: true
        //     }
        //   });
        // }
      }
    }
  ],
  timestamps: true,
  versions: {
    drafts: false
  }
};
