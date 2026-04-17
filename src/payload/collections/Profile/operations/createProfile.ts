import { User } from "@/payload-types";
import { createRichtext } from "@/payload/collections/Users/helpers/createRichtext";
import { randomNumber } from "@/utilities/randomNumber";
import { DateTime } from "luxon";
import { CollectionAfterChangeHook } from "payload";
import { uuidv7 } from "uuidv7";

type AfterChangeArgs = Parameters<CollectionAfterChangeHook<User>>[0];
type ReqArgs = Pick<AfterChangeArgs, "req" | "doc">;
type Rest = Partial<AfterChangeArgs>;
export const createProfileHook: CollectionAfterChangeHook<User> = async ({
  req,
  doc,
  operation,
  context,
  previousDoc
}) => {
  const payload = req.payload;
  if (operation === "create" && context.createProfile) {
    if (!doc?.id) {
      return doc;
    }
    context.overrideAccess = true;

    try {
      await createProfile({ doc, req });
      return doc;
    } catch (err) {
      payload.logger.error(err);
      return doc;
    }
  } else if (operation === "update") {
    const id = doc?.id;
    req.context.overrideAccess = true;
    if (previousDoc?.banned !== doc?.banned && doc?.banned) {
      try {
        await payload.update({
          collection: "profile",
          where: {
            author: {
              equals: id
            }
          },
          data: {
            _status: "draft"
          },
          overrideAccess: true,
          req
        });
        return doc;
      } catch (err) {
        payload.logger.error(err);
        return doc;
      }
    }
  }
  return doc;
};
export const createProfile = async ({ req, doc }: Rest & ReqArgs) => {
  const payload = req.payload;
  const colorArrays: [string, string][] = [
    ["#d40000", "#9ecbd9"],
    ["#AA3422", "#77A6A6"],
    ["#9ecbd9", "#e7d5ba"],
    ["#f6b08a", "#fdf1e8"],
    ["#fdf1e8", "#9ecbd9"],
    ["#d40000", "#ffb400"],
    ["#d40000", "#9eff00"],
    ["#F57B66", "#C3EAD2"],
    ["#4D8593", "#F38B2B"],
    ["#AAE935", "#ADE9FF"],
    ["#F5C78E", "#E74B58"],
    ["#C67006", "#9CE8E3"],
    ["#F57B66", "#C3EAD2"],
    ["#d40000", "#f6b08a"],
    ["#d40000", "#9aa989"]
  ];
  const r = randomNumber(0, colorArrays.length - 1);
  const a = randomNumber(0, 1);
  const c = a === 0 ? 1 : 0;
  const curProfileCount = await payload
    .count({
      collection: "profile",
      where: {
        author: {
          equals: doc.id
        }
      }
    })
    .then((count) => count.totalDocs)
    .catch((err) => {
      return 0;
    });
  await payload.create({
    collection: "profile",
    draft: false,
    overrideAccess: true,
    data: {
      author: doc.id,
      slug: doc.slug,
      title: `@${doc.username}#${curProfileCount + 1}`,
      hero: {
        title: `${doc.firstName} ${doc.lastName}`,
        subtitle: "The hideaway",
        gradient1: colorArrays[r]![a],
        gradient2: colorArrays[r]![c]
      },
      slides: [
        {
          id: uuidv7(),
          title: `About ${doc.firstName}`,
          content: createRichtext([
            `${doc.firstName} ${doc.lastName} is a ${doc?.role ?? "user"} of The Hideaway since ${
              doc?.createdAt
                ? DateTime.fromISO(doc.createdAt).toLocaleString(
                    DateTime.DATE_MED
                  )
                : DateTime.now().toLocaleString(DateTime.DATE_MED)
            }`
          ]),
          visuals: null
        },
        {
          id: uuidv7(),
          title: `${doc.firstName}: Archive`,
          content: createRichtext([
            `${doc.firstName}'s writings and creations to this date`
          ]),
          visuals: null
        }
      ]
    },
    context: {
      ...req.context,
      overrideAccess: true
    },
    req
  });
};
