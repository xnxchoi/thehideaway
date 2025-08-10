import {Endpoint, PayloadRequest} from 'payload'

/**
 * Endpoint to toggle a like on a comment
 */
export const toggleCommentLikeEndpoint: Endpoint = {
	path: '/api/comments/:id/like', method: 'post', handler: async (req: PayloadRequest) => {
		if (!req.routeParams || (!('id' in req.routeParams))) return Response.json(
			{error: 'not found'}, {status: 404})
		const {id} = req.routeParams
		const {user} = req
		// User must be logged in to like a comment
		if (!user) {
			return Response.json({
				error: 'You must be logged in to like a comment',
			}, {status: 401})
		}
		try {
			// Get the current comment
			const comment = await req.payload.findByID({
				collection: 'comments', id,
			})

			// Check if comment exists
			if (!comment) {
				return Response.json({error: 'Comment not found'}, {status: 404})
			}

			// Check if comments are enabled for this content (unless user has special access)
			try {
				// Extract collection information
				let collectionValue
				if (typeof comment.collection === 'object' && comment.collection.relationTo) {
					collectionValue = comment.collection.relationTo
				} else {
					collectionValue = comment.collection
				}

				const document = await req.payload.findByID({
					collection: collectionValue, id: comment.documentId,
				})

				// If comments are disabled and user isn't admin/editor/author, prevent like
				if (document.commentsEnabled === false) {
					const hasSpecialAccess = user.roles && (user.roles.includes(
						'admin') || user.roles.includes('editor') || (user.roles.includes(
						"author") && Array.isArray(document.authors) && document.authors.some(
						authorId => {
							if (typeof authorId === 'object' && authorId.id) {
								return authorId.id === user.id
							}
							return authorId === user.id
						})))

					if (!hasSpecialAccess) {
						return res.status(403).json({
							error: 'Comments are disabled for this content',
						})
					}
				}
			} catch (error) {
				console.error(`Error checking if comments are enabled:`, error)
				// Continue if we can't check this for some reason
			}

			// Get current likes
			const currentLikes = comment.likes || []

			// Normalize likes to ID strings
			const currentLikeIds = currentLikes.map(like => {
				if (typeof like === 'object' && like.id) {
					return like.id
				}
				return like
			})

			// Check if user already liked this comment
			const userLikedIndex = currentLikeIds.findIndex(id => id === user.id)

			// Update likes array based on whether user already liked
			let updatedLikes
			if (userLikedIndex > -1) {
				// User already liked, so unlike
				updatedLikes = [...currentLikeIds.slice(0, userLikedIndex),
					...currentLikeIds.slice(userLikedIndex + 1)]
			} else {
				// User hasn't liked, so add like
				updatedLikes = [...currentLikeIds, user.id]
			}

			// Update the comment
			const updatedComment = await req.payload.update({
				collection: 'comments', id, data: {
					likes: updatedLikes,
				},
			})

			return res.status(200).json({
				success: true, liked: userLikedIndex === -1, // true if we added a like, false if we removed
				likeCount: updatedLikes.length,
			})
		} catch (error) {
			console.error('Error toggling like:', error)
			return res.status(500).json({
				error: 'Error processing your request',
			})
		}
	},
}