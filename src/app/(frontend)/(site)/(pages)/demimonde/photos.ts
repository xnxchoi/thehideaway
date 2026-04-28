export type Photo = {
  id: string;
  vol: number; // 1..5 (which event)
  title: string;
  occasion: string;
  date: string; // "Mar 2026"
  depth: "background" | "far" | "mid" | "close";
  aspect: "portrait" | "landscape" | "square";
  tone: "a" | "b" | "c" | "d" | "e";
  baseLeft: number; // % across stage
  baseTop: number; // % down stage
  width: number; // px on desktop
};

const events: Record<
  number,
  { occasion: string; date: string; tone: Photo["tone"] }
> = {
  1: { occasion: "Hannam · spring meeting", date: "Jun 2025", tone: "a" },
  2: { occasion: "Itaewon · late dinner", date: "Sep 2025", tone: "b" },
  3: { occasion: "Seongsu · rooftop", date: "Dec 2025", tone: "c" },
  4: { occasion: "Yeonnam · members' table", date: "Feb 2026", tone: "d" },
  5: { occasion: "Hannam · editorial closing", date: "Apr 2026", tone: "e" }
};

const titles = [
  "untitled",
  "second course",
  "the toast",
  "out by the smokers",
  "no flash",
  "between sets",
  "after the reading",
  "the hallway",
  "still life, glass",
  "before they arrived",
  "on the stairs",
  "second bottle",
  "borrowed light",
  "the corner",
  "midnight",
  "the door",
  "leaning",
  "look up",
  "outside",
  "the edge",
  "in profile",
  "blur",
  "candlelight",
  "the table",
  "halfway",
  "bowed",
  "third floor",
  "the elevator",
  "early",
  "the rain",
  "the ashtray",
  "near the window",
  "the spread",
  "behind",
  "from above"
];

// Roughly evenly spaced positions but with editorial offset — feels scattered
// instead of grid-locked. Tuned so columns roughly alternate left/right.
const POSITIONS: Array<
  Omit<Photo, "id" | "vol" | "title" | "occasion" | "date" | "tone">
> = [
  { depth: "far", aspect: "portrait", baseLeft: 6, baseTop: 2, width: 180 },
  { depth: "close", aspect: "landscape", baseLeft: 38, baseTop: 4, width: 360 },
  { depth: "mid", aspect: "portrait", baseLeft: 78, baseTop: 6, width: 220 },
  {
    depth: "background",
    aspect: "square",
    baseLeft: 24,
    baseTop: 10,
    width: 140
  },
  { depth: "close", aspect: "portrait", baseLeft: 60, baseTop: 13, width: 280 },
  { depth: "mid", aspect: "landscape", baseLeft: 8, baseTop: 16, width: 300 },
  { depth: "far", aspect: "square", baseLeft: 86, baseTop: 18, width: 160 },
  { depth: "close", aspect: "square", baseLeft: 30, baseTop: 22, width: 320 },
  {
    depth: "background",
    aspect: "portrait",
    baseLeft: 70,
    baseTop: 24,
    width: 130
  },
  { depth: "mid", aspect: "portrait", baseLeft: 4, baseTop: 28, width: 240 },
  {
    depth: "close",
    aspect: "landscape",
    baseLeft: 52,
    baseTop: 30,
    width: 380
  },
  { depth: "far", aspect: "portrait", baseLeft: 82, baseTop: 33, width: 190 },
  { depth: "mid", aspect: "square", baseLeft: 18, baseTop: 36, width: 220 },
  {
    depth: "background",
    aspect: "landscape",
    baseLeft: 62,
    baseTop: 38,
    width: 180
  },
  { depth: "close", aspect: "portrait", baseLeft: 36, baseTop: 41, width: 300 },
  { depth: "far", aspect: "landscape", baseLeft: 4, baseTop: 44, width: 240 },
  { depth: "mid", aspect: "portrait", baseLeft: 70, baseTop: 46, width: 230 },
  { depth: "close", aspect: "square", baseLeft: 22, baseTop: 50, width: 280 },
  {
    depth: "background",
    aspect: "square",
    baseLeft: 80,
    baseTop: 53,
    width: 150
  },
  { depth: "far", aspect: "portrait", baseLeft: 50, baseTop: 56, width: 200 },
  { depth: "mid", aspect: "landscape", baseLeft: 6, baseTop: 59, width: 320 },
  { depth: "close", aspect: "portrait", baseLeft: 64, baseTop: 62, width: 300 },
  { depth: "far", aspect: "square", baseLeft: 30, baseTop: 65, width: 170 },
  { depth: "mid", aspect: "portrait", baseLeft: 84, baseTop: 68, width: 200 },
  {
    depth: "close",
    aspect: "landscape",
    baseLeft: 12,
    baseTop: 71,
    width: 360
  },
  {
    depth: "background",
    aspect: "portrait",
    baseLeft: 56,
    baseTop: 74,
    width: 140
  },
  { depth: "mid", aspect: "square", baseLeft: 78, baseTop: 77, width: 220 },
  { depth: "close", aspect: "portrait", baseLeft: 32, baseTop: 80, width: 280 },
  { depth: "far", aspect: "landscape", baseLeft: 6, baseTop: 83, width: 240 },
  { depth: "mid", aspect: "portrait", baseLeft: 66, baseTop: 86, width: 240 },
  { depth: "close", aspect: "square", baseLeft: 22, baseTop: 90, width: 300 },
  {
    depth: "background",
    aspect: "landscape",
    baseLeft: 76,
    baseTop: 92,
    width: 180
  },
  { depth: "far", aspect: "portrait", baseLeft: 46, baseTop: 95, width: 200 },
  { depth: "mid", aspect: "square", baseLeft: 12, baseTop: 97, width: 200 },
  { depth: "close", aspect: "portrait", baseLeft: 70, baseTop: 99, width: 280 }
];

// Mix events across positions so the same vol doesn't cluster.
const VOL_SEQUENCE = [
  3, 1, 2, 4, 5, 2, 3, 1, 4, 2, 5, 3, 1, 5, 2, 4, 3, 5, 1, 2, 4, 3, 5, 1, 4, 2,
  3, 5, 1, 4, 2, 5, 3, 1, 4
];

export const PHOTOS: Photo[] = POSITIONS.map((pos, i) => {
  const vol = VOL_SEQUENCE[i % VOL_SEQUENCE.length] ?? 1;
  const ev = events[vol]!;
  return {
    id: `p-${i}`,
    vol,
    title: titles[i % titles.length] ?? "untitled",
    occasion: ev.occasion,
    date: ev.date,
    tone: ev.tone,
    ...pos
  };
});
