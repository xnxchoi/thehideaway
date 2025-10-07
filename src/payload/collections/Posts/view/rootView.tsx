import type { DocumentViewServerProps } from "payload";

import { Gutter } from "@payloadcms/ui";
import React from "react";

export const CustomDefaultEditView: React.FC<DocumentViewServerProps> = () => {
  return (
    <Gutter>
      <div></div>
    </Gutter>
  );
};
