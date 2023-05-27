import type { LayoutServerLoadEvent } from './$types';

export async function load({ url }: LayoutServerLoadEvent) {
  return {
    pathname: url.pathname, // to trigger when pathname changes
    version: `#${__BUILD_HASH__}@${__BUILD_TIMESTAMP__}`,
  };
}
