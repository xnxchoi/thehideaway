"use client";

import { useField } from "@payloadcms/ui";
import { useEffect, useState } from "react";

export default function DynamicLabel() {
  const { setValue } = useField({ path: "displayUsername" });
  const { value: userHandle } = useField<string>({ path: "username" });

  const [validated, setValidated] = useState(true);

  useEffect(() => {
    if (validated) {
      setValue(`@${userHandle}`);
    }
  }, [setValue, userHandle, validated]);
  return <></>;
}
