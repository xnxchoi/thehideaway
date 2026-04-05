"use client";

import { RPage } from "@/components/UX/Transition";
import { useHeaderTheme } from "@/providers/HeaderTheme";
import { useMenu, useRPStore } from "@/providers/RP_Pro";
import { Media, User, UserMedia } from "@payload-types";
import React, { useEffect, useEffectEvent, useMemo, useRef } from "react";

const PageClient = (props: {
  user: Pick<
    User,
    | "bio"
    | "role"
    | "updatedAt"
    | "createdAt"
    | "email"
    | "slug"
    | "displayUsername"
    | "name"
    | "firstName"
    | "location"
    | "lastName"
    | "image"
  > & {
    portrait: UserMedia | Media | null;
  };
  children: React.ReactNode;
}) => {
  /* Force the header to be dark mode while we have an image behind it */
  const { user } = props;
  const pageSlug = useMemo(() => [`@${user?.slug ?? "f"}`], [user]);
  const { setHeaderTheme } = useHeaderTheme();
  const setHeaderTransition = useRPStore((l) => l.setHeaderTransition);
  const setFullscreen = useMenu((r) => r.setFullscreen);
  const showFXFrames = useRPStore((r) => r.setFXFrameVisibility);
  const exitCallback = useRef<string>(null!);
  const navIsOpen = useRPStore((r) => r.navIsOpen);
  const setHeaderVisibility = useRPStore((l) => l.setHeaderVisibility);
  const onInitialize = useEffectEvent(() => {
    setHeaderTheme("dark");
    setHeaderTransition("slide");
    setHeaderVisibility(false);
    setFullscreen(true);
  });
  useEffect(() => {
    onInitialize();
    return () => {
      setFullscreen(false);
    };
  }, []);
  useEffect(() => {
    setHeaderVisibility(navIsOpen);
    !navIsOpen && showFXFrames(true);
    return () => {
      showFXFrames(true);
    };
  }, [navIsOpen, setHeaderVisibility, showFXFrames]);
  useEffect(() => {}, []);

  return (
    <RPage type="users" slug={pageSlug} headerVisibility={false}>
      {props.children}
    </RPage>
  );
};

export default PageClient;
