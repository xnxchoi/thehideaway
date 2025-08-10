"use server"
import {readFile} from "fs/promises"
import {PayloadHandler} from "payload"

export const StreamHandler: PayloadHandler = async (req) => {
	const query = req.query,
		params = req.routeParams

	if (!query) return Response.json({message: "No query"}, {status: 400})
	if (!params) return Response.json({message: "No params"}, {status: 400})
	const {id: trackID} = params
	if (
		!trackID ||
		(typeof trackID !== "string")
	) {
		return Response.json({message: "Track ID is required"}, {status: 400})
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
		return Response.json({}, {status: 400})
	}
	if (!track.mimeType) {
		return Response.json({error: "Mime Type is missing"}, {status: 400})
	}
	const CHUNK_SIZE = 64 * 1024

	const audioPath = track.url
	const readable = new ReadableStream({
		async start(controller) {
			try {
				const audioData = await readFile(audioPath)
				let offset = 0

				while (offset < audioData.length) {
					const chunk = audioData.slice(offset, offset + CHUNK_SIZE)
					controller.enqueue(chunk)
					offset += CHUNK_SIZE
					// Optional: Add small delay to prevent overwhelming the client
					await new Promise((resolve) => setTimeout(resolve, 50))
				}
			} catch (error) {
				controller.error(error)
				return Response.json(
					{error: "Something went wrong!"},
					{status: 400},
				)
			} finally {
				controller.close()
			}
		},
	})
	const contType = track.mimeType
	return new Response(readable, {
		headers: {
			"Content-Type": contType,
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		},
	})
}
