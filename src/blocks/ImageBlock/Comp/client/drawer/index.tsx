import { INSERT_RP_IMAGE_COMMAND } from "./commands";
import { $createRPImageNode } from "../node/RP_ImageNode";
import { RP_InternalImageNodeData } from "../../server/node/RP_ImageNode";
import { ImageCollectionSlug } from "@/types/collections/image-collections";
import { LexicalEditor } from "@payloadcms/richtext-lexical/lexical";
import { $getNodeByKey } from "lexical";

export const insertRPImage = <T extends ImageCollectionSlug>({
  editor,
  relationTo,
  replaceNodeKey,
  value,
  meta
}: {
  editor: LexicalEditor;
  relationTo: T;
  replaceNodeKey: null | string;
} & (
  | {
      value: string;
      meta?: RP_InternalImageNodeData;
    }
  | { value?: undefined; meta?: undefined }
)) => {
  if (!replaceNodeKey) {
    if (value) {
      if (!!meta) {
        editor.dispatchCommand(INSERT_RP_IMAGE_COMMAND, {
          ...meta,
          span: 100,
          width: meta.width || 100,
          height: meta.height || 100,
          alt: meta.alt || "",
          caption: meta.caption || "",
          darkmode: meta.darkmode || false,

          src: meta.src as string,
          relationTo,
          placeholder: false,
          value
        });
      } else {
        editor.dispatchCommand(INSERT_RP_IMAGE_COMMAND, {
          relationTo,
          value,
          placeholder: false,
          span: 100,
          src: "",
          alt: ""
        });
      }
    }
  } else {
    if (value) {
      editor.update(() => {
        const node = $getNodeByKey(replaceNodeKey);
        if (node) {
          node.replace(
            $createRPImageNode({
              data: {
                ...((meta && meta) || {}),
                relationTo,
                value,
                src: "",
                span: 100,
                alt: ""
              }
            })
          );
        }
      });
    } else {
      editor.update(() => {
        const node = $getNodeByKey(replaceNodeKey);
        if (node) {
          node.replace(
            $createRPImageNode({
              data: {
                relationTo: relationTo,
                placeholder: true
              }
            })
          );
        }
      });
    }
  }
};
//
// export const ImageTab = () => {
// 	const [editor] = useLexicalComposerContext()
//
// 	const setMenuOpen = useDarkRoom(r => r.setOpen)
// 	const activeCollection = useDarkRoom(r => r.activeCollection);
// 	const closeMenu = useCallback(() => {
// 		setMenuOpen(false)
// 	}, [setMenuOpen])
// 	const cancelUpload = useCallback(() => {
//
// 	}, [])
// 	const openMenu = useCallback(({
// 		                              formID
// 	                              }: { formID: string; }) => {
//
// 	}, [])
// 	const {closeListDrawer, ListDrawer, openListDrawer} = useLexicalListDrawer({
// 		collectionSlugs: [],
// 		uploads: true,
// 	})
//
// 	useEffect(() => {
// 		return editor.registerCommand<{
// 			replace: { nodeKey: string } | false
// 		}>(
// 			INSERT_RP_IMAGE_WITH_TAB_COMMAND,
// 			(payload) => {
// 				setReplaceNodeKey(payload?.replace ? payload?.replace.nodeKey : null)
// 				openListDrawer()
// 				return true
// 			},
// 			COMMAND_PRIORITY_EDITOR,
// 		)
// 	}, [editor, openListDrawer])
// //<NonNullable<ListDrawerProps['onSelect']>>
// 	const onSelect = useCallback(async ({collection, doc}: {
// 			collection: ImageCollectionSlug;
// 			doc: ProcessedImageDoc;
// 		}) => {
// 			insertRPImage({
// 				editor,
// 				relationTo: collection,
//
// 				value: doc.id,
// 				meta: {
// 					width: doc.width || undefined,
// 					height: doc.height || undefined,
// 					src: doc.src,
// 					alt: doc.alt,
// 					caption: doc.caption,
// 					darkmode: doc.darkmode,
// 					blurDataUrl: doc.blurDataUrl,
// 					showCaption: false,
// 				}
// 			})
// 		},
// 		[editor,],
// 	)
//
// 	return <></>
// }
