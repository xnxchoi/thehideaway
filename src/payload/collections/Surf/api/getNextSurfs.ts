"use server";
import { getPayload, PaginatedDocs } from "payload";
import configPromise from "@payload-config";
import { Surf } from "@/payload-types";

import { cache } from "react";

export const getNextSurfs: (props: {
  id: string;
  relatedSurfs?: Surf["relatedSurfs"];
}) => Promise<Array<string>> = cache(
  async (props: { id: string; relatedSurfs?: Surf["relatedSurfs"] }) => {
    const { id, relatedSurfs } = props;
    const payloadSurfs: string[] = [];
    const payload = await getPayload({ config: configPromise });

    if (relatedSurfs && relatedSurfs.length > 0) {
      const ids = relatedSurfs.flatMap((surf) =>
        typeof surf.value === "string" || false ? surf.value : surf.value.id
      );

      // Query related content directly from collections instead of search
      try {
        // Get related surfs
        const relatedSurfDocs = await payload.find({
          collection: "surf",
          where: {
            and: [
              {
                id: {
                  in: ids
                }
              },
              {
                _status: {
                  equals: "published"
                }
              }
            ]
          },
          select: {
            id: true,
            slug: true
          }
        });

        // Get related posts
        const relatedPostDocs = await payload.find({
          collection: "posts",
          where: {
            and: [
              {
                id: {
                  in: ids
                }
              },
              {
                _status: {
                  equals: "published"
                }
              }
            ]
          },
          select: {
            id: true,
            slug: true
          }
        });

        // Combine results
        const relatedIds = [
          ...relatedSurfDocs.docs.map((doc) => doc.id),
          ...relatedPostDocs.docs.map((doc) => doc.id)
        ];

        payloadSurfs.push(...relatedIds);
      } catch (e) {
        console.error({
          message: `Error while retrieving related surfs for ${id}`,
          error: e
        });
      }
    }

    const lim = Math.max(0, 5 - (relatedSurfs?.length ?? 0));

    // Get additional surfs to fill up to the limit
    try {
      const nextSurfs = await payload.find({
        collection: "surf",
        draft: false,
        limit: lim,
        select: {
          id: true,
          slug: true
        },
        pagination: false,
        overrideAccess: true,
        where: {
          and: [
            {
              id: {
                not_in: [id, ...payloadSurfs]
              }
            },
            {
              _status: {
                equals: "published"
              }
            }
          ]
        }
      });

      if (nextSurfs && nextSurfs.docs && nextSurfs.docs.length > 0) {
        const additionalIds = nextSurfs.docs.map((doc) => doc.id);
        payloadSurfs.push(...additionalIds);
      }
    } catch (e) {
      payload.logger.error({
        message: `Error while retrieving content sans relatedSurfs for ${id}`,
        error: e
      });
    }

    return payloadSurfs;
  }
);
