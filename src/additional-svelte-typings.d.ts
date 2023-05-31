declare type DndEvent<ItemType = import('svelte-dnd-action').Item> =
  import('svelte-dnd-action').DndEvent<ItemType>;

declare namespace svelteHTML {
  interface SVGAttributes {
    'inline-src'?: import('@svelte-put/preprocess-inline-svg').Source;
  }
  interface HTMLAttributes<T> {
    'on:consider'?: (event: CustomEvent<DndEvent<ItemType>> & { target: EventTarget & T }) => void;
    'on:finalize'?: (event: CustomEvent<DndEvent<ItemType>> & { target: EventTarget & T }) => void;
  }
}
