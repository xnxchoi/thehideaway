"use server"
import { readFile } from "fs/promises"
import { realpath } from "fs/promises"
import path from "path"
import { PayloadHandler } from "payload"
import { fileURLToPath } from "url"
import { getServerSideURL } from "@/utilities/getURL"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const TRACK_MEDIA_DIR = path.resolve(__dirname, "../../../../../public/track_media")

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isAllowedOrigin(req: Parameters<PayloadHandler>[0]): boolean {
  const allowed = getServerSideURL()
  if (!allowed) return false

  const origin = req.headers.get("origin")
  if (origin) return origin === allowed

  const referer = req.headers.get("referer")
  if (referer) {
    try {
      return new URL(referer).origin === allowed
    } catch {
      return false
    }
  }

  return false
}

export const StreamHandler: PayloadHandler = async (req) => {
  if (!isAllowedOrigin(req)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const params = req.routeParams
  if (!params) return Response.json({ error: "No params" }, { status: 400 })

  const { id: trackID } = params
  if (!trackID || typeof trackID !== "string" || !UUID_RE.test(trackID)) {
    return Response.json({ error: "Valid track ID is required" }, { status: 400 })
  }

  const payload = req.payload
  const track = await payload.findByID({
    collection: "tracks",
    id: trackID,
    select: {
      url: true,
      mimeType: true,
      filename: true,
    },
  })
  if (!track || !track.url) {
    return Response.json({ error: "Track not found" }, { status: 404 })
  }
  if (!track.mimeType) {
    return Response.json({ error: "Track metadata incomplete" }, { status: 400 })
  }

  // Path traversal protection: resolve the real path and ensure it's inside the track media directory.
  const resolvedPath = await realpath(track.url).catch(() => null)
  if (!resolvedPath || !resolvedPath.startsWith(TRACK_MEDIA_DIR + path.sep)) {
    payload.logger.error(
      { trackId: trackID, url: track.url },
      "Stream path traversal attempt or missing file"
    )
    return Response.json({ error: "Track not found" }, { status: 404 })
  }

  const CHUNK_SIZE = 64 * 1024

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const audioData = await readFile(resolvedPath)
        let offset = 0

        while (offset < audioData.length) {
          const chunk = audioData.slice(offset, offset + CHUNK_SIZE)
          controller.enqueue(chunk)
          offset += CHUNK_SIZE
          await new Promise((resolve) => setTimeout(resolve, 50))
        }
      } catch (error) {
        controller.error(error)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      "Content-Type": track.mimeType,
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
