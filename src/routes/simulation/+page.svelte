<script lang="ts">
  import { clickoutside } from '@svelte-put/clickoutside';
  import Fuse from 'fuse.js';
  import debounce from 'lodash.debounce';
  import { onMount, tick } from 'svelte';
  import { slide } from 'svelte/transition';

  import { HOSPITAL_BEDS } from '$shared/types';
  import type { Action, InfectionStats } from '$shared/types';

  export let data;

  const ACTIVE_STATES = ['mild', 'critical'] as const;

  $: simulation = data.simulation;
  $: history = simulation?.history;
  $: stats = simulation?.stats;
  $: step = simulation?.step;
  $: transitions = simulation?.transitions;
  let statsDelta: InfectionStats | undefined = undefined;

  let actionSearchQuery = '';
  let actionSearchResult: Action[] = [];
  let actionSearchFocused = false;
  let fuse: Fuse<Action> | undefined;

  $: search(actionSearchQuery.trim());

  const search = debounce((query: string) => {
    if (!fuse) return;
    actionSearchResult = fuse.search(query).map((r) => r.item);
  }, 250);

  function handleSelectAction(action: Action) {
    blurActionSearch();
    simulation?.queueAction(action);
  }

  function handleRemoveAction(action: Action) {
    simulation?.dequeueAction(action);
  }

  function focusActionSearch() {
    actionSearchFocused = true;
  }

  function blurActionSearch() {
    actionSearchFocused = false;
  }

  onMount(() => {
    fuse = new Fuse($simulation?.context.actions ?? [], {
      keys: ['id', 'name', 'description'],
      includeScore: true,
      useExtendedSearch: true,
      threshold: 0.5,
    });

    // FIXME: what if step is not defined on mount?
    const unsubStep = step?.subscribe(async () => {
      await tick();
      statsDelta = $stats?.delta;
    });

    return () => {
      unsubStep?.();
    };
  });

  function simulationUndo() {
    simulation?.undo();
  }

  function simulationRestart() {
    simulation?.restart();
  }

  function simulationNext() {
    simulation?.next();
  }
</script>

<main class="c-page c-page--full pt-10">
  <h1 class="mb-10 text-center text-4xl font-bold">Simulation</h1>

  <section class="space-y-4 bg-base-200 p-10">
    <div class="flex items-center">
      <h2 class="flex-1">Infections</h2>
      <a href="/settings" class="d-btn-ghost d-btn">Check Settings</a>
    </div>
    <div class="d-stats grid-cols-3">
      <div class="d-stat gap-y-2">
        <p class="d-stat-title uppercase">Total</p>
        <p class="d-stat-value">
          <span>{$stats?.current.total ?? 0}</span>
          {#if statsDelta?.total}
            {@const newTotal = statsDelta.total ?? 0}
            {@const mild = $stats?.new.byState.mild.total ?? 0}
            {@const critical = $stats?.new.byState.critical.total ?? 0}
            <span class="delta" class:down={newTotal < 0} class:bad={newTotal > 0}>
              {Math.abs(newTotal)} ({mild} mild, {critical} critical)
            </span>
          {/if}
        </p>
        <p class="d-stat-desc">Cumulative number of infections that have occurred</p>
      </div>
      {#each ACTIVE_STATES as state}
        <div class="d-stat grid-rows-[auto,auto,1fr] gap-y-2">
          <p class="d-stat-title uppercase">{state}</p>
          <p
            class="d-stat-value"
            class:text-condition-critical-fg={state === 'critical'}
            class:text-condition-mild-fg={state === 'mild'}
          >
            <span>{$stats?.current.byState[state].total ?? 0}</span>
            {#if statsDelta?.byState[state].total}
              {@const delta = statsDelta.byState[state].total ?? 0}
              <span class="delta" class:down={delta < 0} class:bad={delta > 0}>
                {Math.abs(delta)}
              </span>
            {/if}
          </p>
          <p class="d-stat-desc">Number of <strong>active</strong> {state} infections</p>
        </div>
      {/each}
    </div>

    <div class="d-divider text-gray-500">Infection Transition</div>
    <p class="text-sm text-gray-500">
      This section lists infection transitions at the beginning of each round.
    </p>
    <p />
    <div class="d-stats grid-cols-4">
      <div class="d-stat grid-rows-[auto,auto,1fr] gap-y-2">
        <p class="d-stat-title uppercase">MILD -> RECOVERED</p>
        <p class="d-stat-value text-condition-recovered-fg">{$transitions?.recovered ?? 0}</p>
        <p class="d-stat-desc">
          Number of infections transitioned from mild to recovered at the start of this round
        </p>
      </div>
      <div class="d-stat grid-rows-[auto,auto,1fr] gap-y-2">
        <p class="d-stat-title uppercase">MILD -> CRITICAL</p>
        <p class="d-stat-value text-condition-critical-fg">{$transitions?.critical ?? 0}</p>
        <p class="d-stat-desc">
          Number of infections transitioned from mild to critical at the start of this round
        </p>
      </div>
      <div class="d-stat grid-rows-[auto,auto,1fr] gap-y-2">
        <p class="d-stat-title uppercase">CRITICAL -> DEAD</p>
        <p class="d-stat-value text-condition-dead-fg">{$transitions?.dead ?? 0}</p>
        <p class="d-stat-desc">
          Number of infections transitioned from critical to dead at the start of this round
        </p>
      </div>
      <div class="d-stat grid-rows-[auto,auto,1fr] gap-y-2">
        <p class="d-stat-title uppercase">CRITICAL -> MILD</p>
        <p class="d-stat-value text-condition-mild-fg">{$transitions?.mild ?? 0}</p>
        <p class="d-stat-desc">
          Number of infections transitioned from critical to mild at the start of this round
        </p>
      </div>
    </div>
  </section>

  <section class="space-y-4 p-10">
    <div class="flex items-center">
      <h2 class="flex-1">Hospital Capacity</h2>
      <a href="/settings" class="d-btn-ghost d-btn">Check Settings</a>
    </div>
    <div class="d-divider text-gray-500">Hospitalization Statistics</div>
    <div class="d-stats grid-cols-2">
      {#each HOSPITAL_BEDS as hos}
        <div class="d-stat grid-rows-[auto,auto,1fr] gap-y-2">
          <p class="d-stat-title uppercase">{hos}</p>
          <p class="d-stat-value">
            <span>
              {$simulation?.context.hospitalCapacity[hos] ?? 0}
              <span class="text-sm font-normal">units</span>
            </span>
          </p>
        </div>
      {/each}
    </div>
  </section>

  <section class="min-h-[500px] space-y-4 bg-base-200 p-10">
    <div class="flex items-center">
      <h2 class="flex-1">Actions</h2>
      <a href="/settings/actions" class="d-btn-ghost d-btn">Check Action Table</a>
    </div>
    <p class="text-sm">Search, add, or remove actions that will be applied in next round</p>
    <div class="relative" use:clickoutside on:clickoutside|stopPropagation={blurActionSearch}>
      <label for="action-search" class="peer relative">
        <svg
          inline-src="lucide/search"
          width="24"
          height="24"
          class="absolute left-2 top-1/2 -translate-y-1/2"
        />
        <input
          id="action-search"
          type="text"
          class="d-input w-full pl-10"
          placeholder="Type to search for action"
          bind:value={actionSearchQuery}
          on:focus={focusActionSearch}
        />
      </label>
      {#if actionSearchResult.length && actionSearchFocused}
        <ul
          transition:slide={{ duration: 250 }}
          class="absolute inset-x-0 top-full mt-2 max-h-[360px] overflow-auto border border-neutral-100 bg-neutral-100 py-2"
        >
          {#each actionSearchResult as action}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <li
              class="cursor-pointer p-2 hover:bg-neutral-200"
              on:click={() => handleSelectAction(action)}
            >
              {action.id} ({action.role}) - {action.name}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
    <div class="d-divider">Queued Actions</div>
    <ul class="space-y-2">
      {#each $simulation?.runtime.queuedActions ?? [] as action}
        <li>
          <div class="flex items-center rounded bg-neutral-300 p-2">
            <div class="flex-1">
              <p class="text-sm text-gray-500">{action.id} ({action.role})</p>
              <p class="text-lg">{action.name}</p>
            </div>
            <button
              type="button"
              class="d-btn-ghost d-btn"
              on:click={() => handleRemoveAction(action)}>Remove</button
            >
          </div>
        </li>
      {/each}
    </ul>
  </section>

  <section class="space-y-4 p-10">
    <h2>Cumulative Statistics</h2>
    <p class="text-sm text-gray-500">
      This section lists cumulative infection and their terminal states.
    </p>
    <div class="d-stats grid-cols-3">
      <div class="d-stat grid-rows-[auto,auto,1fr] gap-y-2">
        <p class="d-stat-title uppercase">Total</p>
        <p class="d-stat-value text-condition-mild-fg">
          <span>{$stats?.current.total}</span>
        </p>
        <p class="d-stat-desc">Cumulative number of infections</p>
      </div>
      <div class="d-stat grid-rows-[auto,auto,1fr] gap-y-2">
        <p class="d-stat-title uppercase">Recovered</p>
        <p class="d-stat-value text-condition-recovered-fg">
          <span>{$stats?.current.byState.recovered.total}</span>
        </p>
        <p class="d-stat-desc">Cumulative number of recoveries</p>
      </div>
      <div class="d-stat grid-rows-[auto,auto,1fr] gap-y-2">
        <p class="d-stat-title uppercase">Dead</p>
        <p class="d-stat-value text-condition-dead-fg">
          <span>{$stats?.current.byState.dead.total}</span>
        </p>
        <p class="d-stat-desc">Cumulative number of deaths</p>
      </div>
    </div>
  </section>

  <section class="sticky bottom-0 flex items-center justify-between gap-4 bg-white p-4 px-10">
    <div class="flex gap-4">
      <button
        type="button"
        class="d-btn-outline d-btn pc:min-w-[120px]"
        on:click={simulationUndo}
        disabled={!$step}>Undo</button
      >
      <button
        type="button"
        class="d-btn-outline d-btn pc:min-w-[120px]"
        on:click={simulationRestart}
        disabled={!$step}>Restart</button
      >
    </div>
    <div class="grid h-8 w-8 place-items-center rounded-full bg-secondary text-white">
      {$history?.length ?? 0}
    </div>
    <div class="flex gap-4">
      <button
        type="button"
        class="d-btn-primary d-btn pc:min-w-[120px]"
        on:click={simulationNext}
        disabled={$simulation?.runtime.infectionPool.length === 0}>Next</button
      >
    </div>
  </section>
</main>

<style lang="postcss">
  .d-stats {
    width: 100%;
    background: theme('colors.neutral-100');
  }

  h2 {
    font-size: theme('fontSize.2xl');
    font-weight: 700;
  }

  .delta {
    font-size: theme('fontSize.xs');

    &::before {
      content: '↗';
      display: inline-block;
      margin-right: 2px;
      font-size: 10px;
    }

    &:not(.neutral) {
      color: theme('colors.green.500');
    }

    &.bad {
      color: theme('colors.red.500');
    }

    &.down::before {
      content: '↘ ';
    }
  }
</style>
