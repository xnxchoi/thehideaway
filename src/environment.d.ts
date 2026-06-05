import { z } from "zod/v4";

// Type-only mirror of the runtime schema in src/lib/env.ts. Update both
// together; src/lib/env.ts is the authoritative validator at boot.
import { envSchema } from "./lib/env";
export type Env = z.infer<typeof envSchema>;
declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<Env> {}
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
