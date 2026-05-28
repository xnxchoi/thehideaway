import { describe, expect, it } from "vitest";
import {
  getLostCollectionTagState,
  getLostCollectionVideoState,
  lostCollectionTransition
} from "./collection-motion";

describe("lostinseoul collection motion", () => {
  it("keeps the active preview visible above the leaving preview", () => {
    expect(getLostCollectionVideoState("active")).toMatchObject({
      opacity: 1,
      x: "0%",
      zIndex: 2
    });
    expect(getLostCollectionVideoState("leaving")).toMatchObject({
      opacity: 1,
      zIndex: 1
    });
  });

  it("moves inactive preview media off the composited axis", () => {
    expect(getLostCollectionVideoState("inactive")).toMatchObject({
      opacity: 0,
      x: "100%",
      zIndex: 0
    });
  });

  it("preserves the tag slide direction for active and leaving labels", () => {
    expect(getLostCollectionTagState("active")).toMatchObject({
      opacity: 1,
      y: "0%"
    });
    expect(getLostCollectionTagState("leaving")).toMatchObject({
      opacity: 0,
      y: "-100%"
    });
    expect(getLostCollectionTagState("inactive")).toMatchObject({
      opacity: 0,
      y: "100%"
    });
  });

  it("uses the existing long editorial timing", () => {
    expect(lostCollectionTransition.duration).toBe(1);
    expect(lostCollectionTransition.ease).toEqual([0.6, 0, 0.3, 1]);
  });
});
