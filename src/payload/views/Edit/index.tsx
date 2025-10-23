import type { DocumentViewServerProps } from "payload";
import { DefaultEditView } from "./index.client";
import { FC } from "react";

export const EditView: FC<DocumentViewServerProps> = (
  props: DocumentViewServerProps
) => {
  const {
    BeforeDocumentControls,
    Description,
    EditMenuItems,
    PreviewButton,
    PublishButton,
    SaveButton,
    SaveDraftButton,
    Upload,
    UploadControls
  } = props;
  return (
    <DefaultEditView
      BeforeDocumentControls={BeforeDocumentControls}
      Description={Description}
      EditMenuItems={EditMenuItems}
      PreviewButton={PreviewButton}
      PublishButton={PublishButton}
      SaveButton={SaveButton}
      SaveDraftButton={SaveDraftButton}
      Upload={Upload}
      UploadControls={UploadControls}
      documentSubViewType={props.documentSubViewType}
      formState={props.formState}
      viewType={props.viewType}
    />
  );
};
