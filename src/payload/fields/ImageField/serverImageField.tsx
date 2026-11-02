import { ImageCollectionSlug } from "@/types/collections/image-collections";
import {
  CollectionSlug,
  FilterOptionsResult,
  UIFieldServerProps,
  Where
} from "payload";
import ImageField from "@/payload/fields/ImageField/index";
import { getServerSideURL } from "@/utilities/getURL";

type Prop = UIFieldServerProps & {
  relationTo?: ImageCollectionSlug;
  urlPath: string;
  idPath: string;
};
export default async function ServerImageField(props: Prop) {
  const {
    relationTo = "userMedia",
    siblingData,
    path,
    urlPath,
    idPath,
    payload,
    user
  } = props;
  if (!user) return <></>;
  const serverURL = getServerSideURL();

  const whereQuery: Where = {
    and: [
      {
        filesize: {
          less_than: 2560000
        }
      },
      {
        author: {
          equals: user.id
        }
      },
      {
        mimeType: {
          contains: "image"
        }
      }
    ]
  };
  const urlValue = siblingData[urlPath];
  const idValue = siblingData[idPath];
  const filterOptions: FilterOptionsResult = {
    [relationTo]: whereQuery
  };
  return (
    <ImageField
      path={path}
      filterOptions={filterOptions}
      relationTo={relationTo as ImageCollectionSlug}
      serverURL={serverURL}
      idPath={idPath}
      urlPath={urlPath}
      {...(urlValue && { urlValue })}
      {...(idValue && { idValue })}
    />
  );
}
