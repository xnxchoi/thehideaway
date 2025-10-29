/** @type {import('tailwindcss').Config} */
const config = {
	content: ["./src/**/*.{tsx}"],
	
	theme: {
		extend: {
			typography: ({theme}) => ({
				DEFAULT: {
					css: {
						"--tw-prose-body": "var(--text)",
						"--tw-prose-headings": "var(--text)",
						h1: {
							fontSize: "3.5rem",
							fontWeight: "normal",
							marginBottom: "0.25em"
						}
					}
				}
			})
		}
	}
};

export default config;
