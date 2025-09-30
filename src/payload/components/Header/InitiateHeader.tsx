"use client";
import { useRPStore } from "@/providers/RP_Pro";
import { Header } from "@/payload-types";
import { getMenuPagePreviewKey, getPageTypeFromUrl } from "@/utilities/Helpers";
import { useEffect } from "react";
import { PayloadLinkProps } from "@/components/UX/Link/types";

export const InitiateHeader = ({ header }: { header: Header }) => {
  const { radio } = header;
  const setGlobalSettings = useRPStore((store) => store.setGlobalSettings);
  const setNavigationItems = useRPStore(
    (store) => store.setNavigationPageItemData
  );
  const setNavigationPreviewMediaByKey = useRPStore(
    (store) => store.setNavigationPreviewMediaByKey
  );
  const link = (
    href: string,
    label: string
  ): PayloadLinkProps & { url: string } => {
    return {
      type: "custom",
      url: href,
      newTab: false,
      label: label
    };
  };
  // const setRadioTracks = useRadio((store) => store.setTracks)
  // const setRadioPlaylist = useRadio((store) => store.setPlaylist)
  // useEffect(() => {
  //   if (radio && typeof radio === 'object') {
  //     if (Array.isArray(radio.tracks) && radio.tracks.length > 0 && radio.tracks[0] && typeof radio.tracks[0] === 'object') {
  //       setRadioTracks((radio.tracks as Track[]))
  //       setRadioPlaylist({
  //         id: radio.id,
  //         title: radio.title,
  //         index: 0,
  //         time: 0,
  //       })
  //     }
  //   }
  // }, [])
  const links: (PayloadLinkProps & { url: string })[] = [
    link("/", "Reception"),
    link("/essays", "Latest"),
    link("/plans", "Plans"),
    link("/the-team", "The Team"),
    link("/lostinseoul", "LOSTINSEOUL"),
    link("/register", "Register"),
    ...(process.env.NODE_ENV === "development"
      ? [link("/dev", "DEV"), link("/dashboard", "Dashboard")]
      : [])
  ];
  useEffect(() => {
    setNavigationItems(
      links.map((l, index) => ({
        link: l,
        url: l.url,
        label: l.label
      }))
    );
    const k: Record<string, { desktop: string | null; mobile: string | null }> =
      {};
    links.forEach((l) => {
      const type = getPageTypeFromUrl(l.url);
      const split = l.url.split("/");
      const slug = split[split.length - 1]!;

      const key = getMenuPagePreviewKey(type, slug);
      k[key] = {
        desktop: null,
        mobile: null
      };
    });
    setNavigationPreviewMediaByKey(k);
  }, [links, setNavigationItems, setNavigationPreviewMediaByKey]);
  // useEffect(() => {
  //   if (header.navItems) {
  //     console.log('header.navItems', header.navItems)
  //     setGlobalSettings({ navigation: { navItems: header.navItems } })
  //     setNavigationItems(header.navItems)
  //     let k = {}
  //     header.navItems.forEach((l, index) => {
  //       if (!l.link || !l.link.type) return
  //       let ketu = ''
  //       if (l.link.type === 'custom') {
  //         if (!l.link.url) {
  //           console.error('link is external, but has no url', l)
  //           return
  //         }
  //         ketu = getMenuPagePreviewKey('pages', l.link.url.split('/')[1])
  //       } else {
  //         if (!l.link.reference || !l.link.reference.relationTo || !l.link.reference.value) {
  //           console.error('link is internal, but has invalid reference', l)
  //           return
  //         }
  //         ketu = getMenuPagePreviewKey(
  //           l.link.reference.relationTo,
  //           typeof l.link.reference.value === 'object'
  //             ? l.link.reference.value.slug
  //             : l.link.reference.value,
  //         )
  //       }
  //       k[ketu] = l.previewMedia
  //     })
  //     setNavigationPreviewMediaByKey(k)
  //   }
  // }, [])
  return <></>;
};
