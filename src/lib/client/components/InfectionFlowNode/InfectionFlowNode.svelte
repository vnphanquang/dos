<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import { Node, Anchor, Slider } from 'svelvet';

  import { iNumber } from '$client/actions/iNumber';

  export let id: string;
  export let x: number;
  export let y: number;
  export let to: string[] = [];
  export let freeTo: [string, string][] = [];

  export let disabled = false;

  export let title: string;
  export let description = '';

  export let input: ComponentProps<Slider>['parameterStore'] | undefined = undefined;
  export let inputMode: 'slider' | 'input' = 'slider';

  $: connections = [...to.map((t) => [t, 'north']), ...freeTo] as Array<string | [string, string]>;
</script>

<Node {id} position={{ x, y }} locked useDefaults>
  <div
    class="wrapper"
    class:recovered={id.startsWith('R')}
    class:dead={id.startsWith('D')}
    class:critical={id.startsWith('C')}
    class:mild={id.startsWith('M')}
  >
    <p class="title" class:text-center={!input}><strong>{@html title}</strong></p>
    <p class="id"><strong>{id}</strong></p>
    {#if description || input || $$slots.default}
      <div class="divider" />
    {/if}
    <div class="content space-y-4">
      <p class="description">{description}</p>
      {#if input}
        {@const inputId = `${id}-probability`}
        {#if inputMode === 'input' || disabled}
          <div class="probability">
            <label for={inputId}>Probability:</label>
            <input id={inputId} min="0" max="100" use:iNumber bind:value={$input} {disabled} />
            <p>%</p>
          </div>
        {:else}
          <Slider
            min={0}
            max={100}
            step={1}
            parameterStore={input}
            label="Probability (%)"
            fixed={0}
            bgColor="var(--slider-bg-color)"
            barColor="var(--slider-fg-color)"
          />
        {/if}
      {/if}
      <slot />
    </div>
    <div class="contents">
      <div class="anchor north">
        <Anchor locked id="north" invisible direction="north" />
      </div>
      <div class="anchor south">
        <Anchor locked {connections} id="south" direction="south" invisible />
      </div>
    </div>
  </div>
</Node>

<style lang="postcss">
  .wrapper {
    --id-color: theme('colors.gray.500');
    --bg-color: theme('colors.gray.100');

    cursor: default;

    position: relative;

    overflow: hidden;

    width: 300px;
    padding: 16px;

    font-family: theme('fontFamily.inter');
    font-size: 16px;
    line-height: 1.5;

    background-color: var(--bg-color);
    border-radius: 10px;

    &.recovered {
      --id-color: theme('colors.condition.recovered.fg');
      --bg-color: theme('colors.condition.recovered.bg');
      --slider-bg-color: theme('colors.green.300');
      --slider-fg-color: theme('colors.green.500');
    }

    &.mild {
      --id-color: theme('colors.condition.mild.fg');
      --bg-color: theme('colors.condition.mild.bg');
      --slider-bg-color: theme('colors.yellow.300');
      --slider-fg-color: theme('colors.yellow.500');
    }

    &.critical {
      --id-color: theme('colors.condition.critical.fg');
      --bg-color: theme('colors.condition.critical.bg');
      --slider-bg-color: theme('colors.red.300');
      --slider-fg-color: theme('colors.red.500');
    }

    &.dead {
      --id-color: theme('colors.condition.dead.fg');
      --bg-color: theme('colors.condition.dead.bg');
      --slider-bg-color: theme('colors.gray.500');
      --slider-fg-color: theme('colors.gray.700');

      color: white;
    }
  }

  .anchor {
    position: absolute;

    &.north {
      top: 0;
      left: 50%;
      translate: -50% -50%;
    }

    &.south {
      bottom: 0;
      left: 50%;
      translate: -50% 50%;
    }
  }

  .id {
    position: absolute;
    top: 16px;
    right: 16px;

    font-size: 14px;
    color: var(--id-color);
  }

  .title {
    font-size: 18px;
  }

  .content {
    & :global(.slider-input) {
      height: 32px;
    }
  }

  .description {
    font-style: italic;
  }

  .divider {
    width: 100%;
    height: 1px;
    margin: 8px 0 16px;
    background: currentcolor;
  }

  .probability {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 8px;
    align-items: center;

    width: fit-content;

    font-weight: 500;

    & input {
      width: 80px;
      padding: 4px 8px;

      text-align: center;

      background: none;
      border: 1px solid currentcolor;
      border-radius: 4px;

      &:disabled {
        border-color: transparent;
      }
    }
  }
</style>
