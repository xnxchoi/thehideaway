const setReadAtHook = ({data, operation}) => {
	// Check if the "read" field is true and the "readAt" field is not already set.
	// This ensures that on creation or update when a notification is marked as read,
	// the readAt field is automatically populated.
	if (data.read === true && !data.readAt) {
		data.readAt = new Date().toISOString()
	}
	return data
}

export default setReadAtHook