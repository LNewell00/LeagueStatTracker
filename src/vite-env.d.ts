/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RIOT_API_KEY?: string;
  readonly VITE_DEFAULT_GAME_NAME?: string;
  readonly VITE_DEFAULT_TAG_LINE?: string;
  readonly VITE_DEFAULT_REGION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

