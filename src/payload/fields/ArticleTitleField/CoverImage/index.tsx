import type {
  ImageBaseSelect,
  ImageCollectionSlug
} from "@/types/payload-api-helpers";
import { getServerSideURL } from "@/utilities/getURL";
import {
  FilterOptionsResult,
  Where, type UploadFieldServerProps
} from "payload";
import { CoverImageClient } from "./coverClient";
import {randomNumber} from "@/utilities/randomNumber";
import {
	getFallbackFromUnsplash, type UnsplashFetchResult
} from "@/payload/collections/Media/hooks/getFallbackFromUnsplash";

type Prop = UploadFieldServerProps & {
  relationTo?: ImageCollectionSlug;
};
export default async function CoverImageServerComponent(props: Prop) {
  const {
	  relationTo = "userMedia",
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
	const whereBase: Where & { and: Where[] } = {
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
	const whereQuery = whereBase;
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
	let imageValue: null | ImageBaseSelect = null;
	let fallbackValue: undefined | UnsplashFetchResult;
  if (value) {
    const res = await payload.findByID({
      collection: relationTo,
      id: value as string,
      depth: 1
    });
    if (res) {
      imageValue = res as ImageBaseSelect;
    }
  } else {
	  const assetCount = await payload.count({
		  collection: "assets", where: whereBase
	  }).then((r) => r.totalDocs).catch((e) => {
		  payload.logger.error({
			  message: "Failed to get asset count", error: e
		  });
		  return 0;
	  });
	  if (assetCount > 0) {
		  const page = randomNumber(0, assetCount);
		  const res = await payload.find({
			  collection: "assets", where: whereBase, limit: 1, page, depth: 1
		  });
		  if (res.docs.length > 0) {
			  imageValue = res.docs[0] as ImageBaseSelect;
		  }
	  } else {
		  fallbackValue = await getFallbackFromUnsplash().catch((e) => {
			  payload.logger.error({
				  message: "error attempting to fetch fallback from unsplash", error: e
			  });
			  return null;
		  });
	  }
  }
  return (
    <CoverImageClient
      path={path}
      filterOptions={filterOptions} user={{
	    name: user.name || "",
	    id: user.id,
	    slug: ("slug" in user && user.slug) || "",
	    image: ("image" in user && user.image) || ""
    }}
      relationTo={relationTo}
      serverURL={serverURL}
      field={field}
      value={imageValue} fallback={fallbackValue}
    />
  );
}
