/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COLYSEUS_URL?: string;
  readonly VITE_SOLANA_RPC_URL?: string;
  readonly VITE_PETAL_MINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
