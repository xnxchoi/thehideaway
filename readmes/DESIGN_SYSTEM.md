# Design System Notes

These rules apply across feature work unless a core primitive itself is being implemented.

## Navigation And Actions

- Use [`Link`](/Users/seanschoi/WebstormProjects/thehideaway/src/components/core/Link/Link.tsx) for app links.
- Use [`Button`](/Users/seanschoi/WebstormProjects/thehideaway/src/components/core/Button/index.tsx) for button actions.
- Do not use raw `next/link` imports or native `<button>` elements in feature UI. A narrow third-party integration boundary is acceptable only when the wrapper cannot be used cleanly.

## Animation Imports

- Use `import * as m from "motion/react-m";` for component-driven primitives such as `m.div`, `m.button`, `m.aside`, and other animated elements.
- Use imports from `motion/react` for function-driven or orchestrated animation work: hooks, controls, values, and presence/layout coordination APIs.
- GSAP is allowed when it fits the job, especially for complex timelines, scroll-linked sequences, and WebGL/Three.js coordination. Prefer Motion where it produces the same interaction with better smoothness and less custom machinery.

## Type Scale

- The standard document font size is `10px`, not the browser default `16px`.
- Tailwind text utilities in this project already assume the app scale. When porting a reference that declares a `16px` base, translate the visual intent instead of copying raw `rem` values.
