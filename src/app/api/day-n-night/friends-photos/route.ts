import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const FRIENDS_PHOTOS_DIR = "public/assets/day-n-night/past-events";
const IMAGE_EXTENSION_RE = /\.(?:avif|gif|jpe?g|png|webp)$/i;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const directory = path.join(process.cwd(), FRIENDS_PHOTOS_DIR);

  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const photos = entries
      .filter((entry) => entry.isFile() && IMAGE_EXTENSION_RE.test(entry.name))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((filename) => ({
        src: `/assets/day-n-night/past-events/${encodeURIComponent(filename)}`
      }));

    return NextResponse.json(
      { photos },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch {
    return NextResponse.json(
      { photos: [] },
      {
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }
}
