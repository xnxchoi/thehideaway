import { CollectionSlug } from "payload";

export const collectionTypeToFrontEnd = (collection: CollectionSlug,type:'singular'|'plural'='singular')=>
{
  const singular = type === 'singular'
  switch (collection) {
    case "posts":
      return singular? "essay":"essays"
    case "tags":
      return "tagged"
    case "categories":
      return singular? "theme":"themes"
    case "surf":
      return "surf"
    default:
      return collection
  }
}