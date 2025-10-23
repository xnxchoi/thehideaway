import type {
  ImageBaseSelect,
  ImageCollectionSlug
} from "@/types/payload-api-helpers";
import { getServerSideURL } from "@/utilities/getURL";
import {
  FilterOptionsResult,
  Where,
  type UploadFieldServerProps,
  type UploadFieldSingleValidation
} from "payload";
import { CoverImageClient } from "./coverClient";

type Prop = UploadFieldServerProps & {
  relationTo?: ImageCollectionSlug;
};
export default async function CoverImageServerComponent(props: Prop) {
  const {
    relationTo = "media",
    user,
    field: { validate },
    clientField: field,
    value,
    path,
    payload,
    permissions
  } = props;

  if (!user) return <></>;
  const serverURL = getServerSideURL();

  const whereQuery: Where & { and: Where[] } = {
    and: [
      {
        filesize: {
          less_than: 2560000
        }
      },

      {
        mimeType: {
          contains: "image"
        }
      }
    ]
  };
  if (relationTo === "userMedia") {
    whereQuery.and.push({
      author: {
        equals: user.id
      }
    });
  }
  const filterOptions: FilterOptionsResult = {
    [relationTo]: whereQuery
  };
  let imageValue: undefined | null | ImageBaseSelect;
  if (value) {
    const res = await payload.findByID({
      collection: relationTo,
      id: value as string,
      depth: 1
    });
    if (res) {
      imageValue = res as ImageBaseSelect;
    }
  }
  return (
    <CoverImageClient
      path={path}
      filterOptions={filterOptions}
      relationTo={relationTo}
      serverURL={serverURL}
      field={field}
      value={imageValue}
    />
  );
}
