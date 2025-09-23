"use server";
import { getPayload, PaginatedDocs } from "payload";
import configPromise from "@payload-config";
import { Delta } from "@/payload-types";

import { cache } from "react";

export const getNextDeltas: (props: {
  id: string;
  relatedDeltas?: Delta["relatedDeltas"];
}) => Promise<Array<string>> = cache(
  async (props: { id: string; relatedDeltas?: Delta["relatedDeltas"] }) => {
    const { id, relatedDeltas } = props;
    const payloadDeltas: string[] = [];
    const payload = await getPayload({ config: configPromise });

    if (relatedDeltas && relatedDeltas.length > 0) {
      const ids = relatedDeltas.flatMap((delta) =>
        typeof delta.value === "string" || false ? delta.value : delta.value.id
      );

      // Query related content directly from collections instead of search
      try {
        // Get related deltas
        const relatedDeltaDocs = await payload.find({
          collection: "delta",
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
          ...relatedDeltaDocs.docs.map((doc) => doc.id),
          ...relatedPostDocs.docs.map((doc) => doc.id)
        ];

        payloadDeltas.push(...relatedIds);
      } catch (e) {
        console.error({
          message: `Error while retrieving related deltas for ${id}`,
          error: e
        });
      }
    }

    const lim = Math.max(0, 5 - (relatedDeltas?.length ?? 0));

    // Get additional deltas to fill up to the limit
    try {
      const nextDeltas = await payload.find({
        collection: "delta",
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
                not_in: [id, ...payloadDeltas]
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

      if (nextDeltas && nextDeltas.docs && nextDeltas.docs.length > 0) {
        const additionalIds = nextDeltas.docs.map((doc) => doc.id);
        payloadDeltas.push(...additionalIds);
      }
    } catch (e) {
      payload.logger.error({
        message: `Error while retrieving content sans relatedDeltas for ${id}`,
        error: e
      });
    }

    return payloadDeltas;
  }
);
