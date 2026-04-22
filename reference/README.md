# reference/

"Benchmark target" code: snippets, components, and modules ripped from other
projects that I want to **take apart, understand, and reimplement** — not use
as-is.

## Rules of the road

- **Nothing in `reference/` is imported by production code.** If you start
  importing a file from `src/`, that's the signal to port it properly: move it
  into `src/`, rewrite it to match the codebase's conventions, and delete the
  original from `reference/`.
- **The IDE still type-checks these files.** `reference/tsconfig.json` extends
  the root config with relaxed settings (`strict: false`, `checkJs: false`).
  VS Code and WebStorm pick it up automatically.
- **The production typecheck ignores `reference/`.** The root `tsconfig.json`
  excludes `reference/**`, and Next.js never builds from here because the
  directory sits outside `src/`, `app/`, and `pages/`. Any errors here stay
  scoped to the IDE.
- **Attribution matters.** Add a `SOURCE.md` or a top-of-file comment to each
  imported artifact naming where it came from and under what license.

## Layout convention

Mirror whatever structure makes the original code legible to you. There is no
enforced layout. Typical shapes:

```
reference/
├── README.md
├── tsconfig.json
├── lenis-smooth-scroll/        <- a whole library I'm studying
│   ├── SOURCE.md
│   ├── src/
│   └── examples/
└── threejs-shader-grain/       <- a single component I want to port
    ├── SOURCE.md
    └── GrainShader.tsx
```

## vs. `.attic/`

- `.attic/` = dormant code from **this project** you're keeping as a fallback. Not
  imported, not studied, just archived.
- `reference/` = foreign code brought into the repo **on purpose** as study
  material. Not imported, but actively being read and type-checked.
