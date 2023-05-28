import debounce from 'lodash.debounce';
import type { Action } from 'svelte/action';

interface NumberInputParameters {
  stuff?: string;
}

export const iNumber: Action<HTMLInputElement, NumberInputParameters> = function (node) {
  const clampInRange = debounce(() => {
    let min = parseFloat(node.min);
    if (Number.isNaN(min)) min = Number.MIN_SAFE_INTEGER;
    let max = parseFloat(node.max);
    if (Number.isNaN(max)) max = Number.MAX_SAFE_INTEGER;
    const valueAsNumber = parseFloat(node.value);
    if (valueAsNumber < min) node.value = min.toString();
    else if (valueAsNumber > max) node.value = max.toString();
  }, 200);

  function handleInput() {
    node.value = node.value.replace(/[[^0-9-]]/g, '');
    if (node.value && (node.min !== '' || node.max !== '')) {
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
