import type { CollectionConfig } from "payload";

export const SeriesItem: CollectionConfig = {
  slug: "series-item",
  fields: [
    {
      name: "item",
      type: "relationship",
      relationTo: ["posts", "surf"],
      hasMany: false,
      index: true,
      required: true,
      maxDepth: 0
    }
    // {
    //   name: "series",
    //   type: "relationship",
    //   relationTo: "series",
    //   hasMany: false,
    //   filterOptions: ({ req, id, data }: FilterOptionsProps<Series>) =>
    //     ({
    //       or: [
    //         {
    //           owner: { equals: req.user?.id }
    //         },
    //         {
    //           author: {
    //             equals: req.user?.id
    //           }
    //         }
    //       ]
    //     }) as Where,
    //   index: true,
    //   required: true,
    //   maxDepth: 0
    // }
  ]
};
