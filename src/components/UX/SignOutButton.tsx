"use client";

export const SignOutButton = () => {
	return (
		<button type={"button"} onClick={async (e) => {
			e.preventDefault();
			await fetch("/api/users/logout", {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
			});
			location.reload();
		}}>
			Sign out </button>
	);
};
