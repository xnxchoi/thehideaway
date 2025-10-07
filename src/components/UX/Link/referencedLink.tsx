import { Link } from "@/components/UX/Link/Link";
import type { ButtonProps } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Ref, RefAttributes } from "react";
import { getUrlFromPageData } from "@/utilities/Helpers";
import { BackendLink } from "@/stores/RP_Ui";
import { PayloadLinkProps, RPLinkProps } from "@/components/UX/Link/types";

export type CMSLinkBase = {
  button?: true;
  variant?: ButtonProps["variant"];
  label?: string;
  size?: ButtonProps["size"];
} & Partial<RPLinkProps> & { link: PayloadLinkProps } & Partial<
    RefAttributes<HTMLButtonElement | HTMLAnchorElement>
  >;

type CXi<T extends CMSLinkBase> = T extends {
  button: true;
  variant: ButtonProps["variant"];
  size: ButtonProps["size"];
}
  ? ReturnType<typeof Button>
  : T extends { href: string }
    ? ReturnType<typeof Link>
    : null;

export type CMSOutLink<T extends CMSLinkBase> = BackendLink<T["link"]> & CXi<T>;

export const ReferencedLink = (props: CMSLinkBase) => {
  const {
    button,
    link,
    children,
    className,
    onClick,
    onMouseEnter,
    onMouseLeave,
    label,
    ...rest
  } = props;
  let href: null | undefined | string = null;
  const { type, reference, url } = link;
  switch (type) {
    case "reference": {
      if (!reference) return null;
      const a =
        typeof reference.value === "string"
          ? reference.value
          : typeof reference.value === "object"
            ? reference.value.slug
            : reference.value;
      href = getUrlFromPageData(
        reference.relationTo,
        `${encodeURIComponent(a + "")}`
      );
      break;
    }
    case "custom": {
      if (!url) return null;
      href = url;
      break;
    }
  }
  if (!href) return null;

  /* Ensure we don't break any styles set by richText */
  const { size, variant } = rest;

  const propsToPass = {
    onMouseLeave,
    onMouseEnter,
    onClick
  };
  if (button && size && variant) {
    return (
      <Button
        asChild
        className={className}
        size={size}
        variant={variant}
        ref={props.ref as Ref<HTMLButtonElement>}
        {...propsToPass}
      >
        <Link className={cn(className)} href={href}>
          {label && label}
          {children && children}
        </Link>
      </Button>
    );
  }
  return (
    <Link
      className={cn(className)}
      href={href}
      {...((props.ref && { ref: props.ref as Ref<HTMLAnchorElement> }) || {})}
      {...propsToPass}
    >
      {label && label}
      {children && children}
    </Link>
  );
};
