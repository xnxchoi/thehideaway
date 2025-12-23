// Keep these in sync with the CSS variables in your tailwind configuration
const breakpoints = {
	"3xl": 1920,
	"2xl": 1536,
	xl: 1280,
	lg: 1024,
	md: 768,
	sm: 640,
	xs: 480
} as const;
export const cssVariables = {
	breakpoints
} as const;
export const breakString = Object.entries(cssVariables.breakpoints)
  .map(([, value]) => `(max-width: ${value}px) ${value * 2}w`)
  .join(", ");
