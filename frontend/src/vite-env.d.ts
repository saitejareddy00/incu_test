/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public URL of the backend API (no trailing slash). Empty = use same-origin /api. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
