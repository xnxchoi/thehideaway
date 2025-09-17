// PayloadCMS Dist Import Declarations
// This file enables TypeScript to resolve imports from PayloadCMS package dist directories

// Generic wildcard declaration for any PayloadCMS dist imports
declare module "@payloadcms/*/dist/*" {
  const content: any;
  export = content;
}

// More specific declarations for common PayloadCMS packages
declare module "@payloadcms/richtext-lexical/dist/*" {
  const content: any;
  export = content;
}

declare module "@payloadcms/db-mongodb/dist/*" {
  const content: any;
  export = content;
}

declare module "@payloadcms/db-postgres/dist/*" {
  const content: any;
  export = content;
}

declare module "@payloadcms/plugin-cloud-storage/dist/*" {
  const content: any;
  export = content;
}

declare module "@payloadcms/plugin-seo/dist/*" {
  const content: any;
  export = content;
}

declare module "@payloadcms/translations/dist/*" {
  const content: any;
  export = content;
}

declare module "@payloadcms/ui/dist/*" {
  const content: any;
  export = content;
}

declare module "@payloadcms/next/dist/*" {
  const content: any;
  export = content;
}

// Allow direct dist directory imports
declare module "@payloadcms/*/dist" {
  const content: any;
  export = content;
}

// Fallback for any PayloadCMS package structure
declare module "@payloadcms/*" {
  const content: any;
  export = content;
}
