/// <reference types="@sveltejs/kit" />
/// <reference types="svelte" />
/// <reference types="vite/client" />
/// <reference types="@sveltejs/adapter-cloudflare" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare const __BUILD_TIMESTAMP__: string;
declare const __BUILD_HASH__: string;
declare const __BUILD_VERSION__: string;

declare global {
  namespace App {
    // interface Locals {}
    // interface PageData {}
    // interface Platform {}
    // interface Error {}
  }
}
