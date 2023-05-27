import debounce from 'lodash.debounce';
import type { Action } from 'svelte/action';

interface NumberInputParameters {
  stuff?: string;
}

export const iNumber: Action<HTMLInputElement, NumberInputParameters> = function (node) {
  const clampInRange = debounce(() => {
    const min = parseFloat(node.min) || Number.NEGATIVE_INFINITY;
    const max = parseFloat(node.max) || Number.POSITIVE_INFINITY;
    const valueAsNumber = parseFloat(node.value);
    if (valueAsNumber < min) node.value = min.toString();
    else if (valueAsNumber > max) node.value = max.toString();
  }, 200);

  function handleInput() {
    node.value = node.value.replace(/[^\d]/g, '');
    if ((node.value && node.min) || node.max) {
      clampInRange();
    }
  }

  node.addEventListener('input', handleInput);

  return {
    destroy() {
      node.removeEventListener('input', handleInput);
    },
  };
};
