<script lang="ts">
  import { clickoutside } from '@svelte-put/clickoutside';
  import Fuse from 'fuse.js';
  import debounce from 'lodash.debounce';
  import { onMount, tick } from 'svelte';
  import { flip } from 'svelte/animate';
  import { slide } from 'svelte/transition';
  import { dndzone } from 'svelte-dnd-action';

  import { categorizeInfectionsByHospitalization } from '$client/services/simulation';
  import { HOSPITALIZATIONS, INFECTION_STATES } from '$shared/types';
  import type { Hospitalization, Infection, Action, InfectionStats } from '$shared/types';

  export let data;

  const flipDurationMs = 300;

  $: simulation = data.simulation;
  $: history = simulation?.history;
  $: stats = simulation?.stats;
  $: step = simulation?.step;
  let statsDelta: InfectionStats | undefined = undefined;

  // TODO: optimize this??
  $: iByHos = categorizeInfectionsByHospitalization(
    $simulation?.runtime.infections.filter((i) => i.state === 'mild' || i.state === 'critical') ??
      [],
  );

  // TODO: possible to keep order on dropped (right now it jumps around);
  function handleDndConsider(e: CustomEvent<DndEvent<Infection>>, hos: Hospitalization) {
    iByHos[hos] = e.detail.items;
  }

  function handleDndFinalize(e: CustomEvent<DndEvent<Infection>>, hos: Hospitalization) {
    iByHos[hos] = e.detail.items;

    let infection = iByHos[hos].find((i) => i.id === e.detail.info.id);
    if (infection) {
      infection = { ...infection, hospitalization: hos };
      simulation?.updateInfection(infection);
    }
  }

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

  function simulationEnd() {
    simulation?.end();
  }
</script>

<main class="c-page c-page--full pt-10">
  <h1 class="mb-10 text-center text-4xl font-bold">Simulation</h1>

  <section class="space-y-4 bg-base-200 p-10">
    <div class="flex items-center">
      <h2 class="flex-1">Infections</h2>
      <a href="/settings/infection" class="d-btn-ghost d-btn">Check Infection Transition Flow</a>
    </div>
    <div class="d-stats grid-cols-2">
      <div class="d-stat gap-y-2">
        <div class="d-stat-figure">
          <svg inline-src="lucide/bug" width="28" height="28" />
        </div>
        <p class="d-stat-title uppercase">Active Infections</p>
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
        <p class="d-stat-desc">Number of infections that have occurred</p>
      </div>
      <div class="d-stat gap-y-2">
        <div class="d-stat-figure">
          <svg inline-src="lucide/user-plus" width="28" height="28" />
        </div>
        <p class="d-stat-title uppercase">Infection Pool</p>
        <p class="d-stat-value">
          <span>{$simulation?.runtime.infectionPool.length ?? 0}</span>
          {#if statsDelta?.total}
            <span class="delta neutral down">
              {Math.abs(statsDelta.total ?? 0)}
            </span>
          {/if}
        </p>
        <p class="d-stat-desc">Number of infections to pool from in next rounds</p>
      </div>
    </div>
    <div class="d-divider text-gray-500">Active Infection Statistics</div>
    <div class="d-stats grid-cols-4">
      {#each INFECTION_STATES as state}
        {@const byHos = $stats?.current.byState[state].byHospitalization}
        {@const deltaByHos = statsDelta?.byState[state].byHospitalization}
        <div class="d-stat grid-rows-[auto,auto,1fr] gap-y-2">
          <p class="d-stat-title uppercase">{state}</p>
          <p class="d-stat-value">
            <span>{$stats?.current.byState[state].total ?? 0}</span>
            {#if statsDelta?.byState[state].total}
              {@const delta = statsDelta.byState[state].total ?? 0}
              {@const isBad = state === 'recovered' ? delta < 0 : delta > 0}
              <span class="delta" class:down={delta < 0} class:bad={isBad}>
                {Math.abs(delta)}
              </span>
            {/if}
          </p>
          <ul class="d-stat-desc">
            <li>
              <strong>{byHos?.none ?? 0}</strong> not hospitalized
              {#if deltaByHos?.none}
                {@const delta = deltaByHos.none}
                {@const isBad = state === 'recovered' ? delta < 0 : delta > 0}
                <span class="delta" class:down={delta < 0} class:bad={isBad}>
                  {Math.abs(delta)}
                </span>
              {/if}
            </li>
            <li>
              <strong>{byHos?.regular ?? 0}</strong>
              regular bed
              {#if deltaByHos?.regular}
                {@const delta = deltaByHos.regular}
                {@const isBad = state === 'recovered' ? delta < 0 : delta > 0}
                <span class="delta" class:down={delta < 0} class:bad={isBad}>
                  {Math.abs(delta)}
                </span>
              {/if}
            </li>
            {#if state !== 'recovered'}
              <li>
                <strong>{byHos?.icu ?? 0}</strong> icu
                {#if deltaByHos?.icu}
                  {@const delta = deltaByHos.icu}
                  <span class="delta" class:down={delta < 0} class:bad={delta > 0}>
                    {Math.abs(delta)}
                  </span>
                {/if}
              </li>
            {/if}
          </ul>
        </div>
      {/each}
    </div>
  </section>

  <section class="space-y-4 p-10">
    <div class="flex items-center">
      <h2 class="flex-1">Hospitalization</h2>
      <a href="/settings" class="d-btn-ghost d-btn">Check Settings</a>
    </div>
    <div class="d-divider text-gray-500">Hospitalization Statistics</div>
    <div class="d-stats grid-cols-3">
      {#each HOSPITALIZATIONS as hos}
        {@const byState = $stats?.current.byHospitalization[hos].byState}
        {@const deltaByState = statsDelta?.byHospitalization[hos].byState}
        <div class="d-stat grid-rows-[auto,auto,1fr] gap-y-2">
          <p class="d-stat-title uppercase">{hos}</p>
          <p class="d-stat-value">
            <span>
              {$stats?.current.byHospitalization[hos].active ?? 0}
              <span class="text-sm font-normal">active</span>
              {#if hos !== 'none'}
                / {$simulation?.context.hospitalCapacity[hos] ?? 0}
                <span class="text-sm font-normal">units</span>
              {/if}
            </span>
          </p>
          <ul class="d-stat-desc">
            <li>
              <strong>{byState?.mild ?? 0}</strong> mild infections
              {#if deltaByState?.mild}
                {@const delta = deltaByState?.mild}
                <span class="delta" class:down={delta < 0} class:bad={delta > 0}>
                  {Math.abs(delta)}
                </span>
              {/if}
            </li>
            <li>
              <strong>{byState?.critical}</strong> critical infections
              {#if deltaByState?.critical}
                {@const delta = deltaByState?.critical}
                <span class="delta" class:down={delta < 0} class:bad={delta > 0}>
                  {Math.abs(delta)}
                </span>
              {/if}
            </li>
            <li>
              <strong>{byState?.dead}</strong> dead infections
              {#if deltaByState?.dead}
                {@const delta = deltaByState?.dead}
                <span class="delta bad">
                  {Math.abs(delta)}
                </span>
              {/if}
            </li>
            {#if hos !== 'icu'}
              <li>
                <strong>{byState?.recovered}</strong>
                recovered infections
                {#if deltaByState?.recovered}
                  {@const delta = deltaByState?.recovered}
                  <span class="delta">
                    {Math.abs(delta)}
                  </span>
                {/if}
              </li>
            {/if}
          </ul>
        </div>
      {/each}
    </div>

    <div class="d-divider text-gray-500">Patient Distribution</div>
    <p class="text-sm">Drag and drop patient to match desired hospitalization status</p>
    <div class="hospitalization-dnd">
      <p>No hospitalization</p>
      <p>Regular</p>
      <p>ICU</p>

      {#each HOSPITALIZATIONS as hos}
        <ul
          use:dndzone={{ items: iByHos[hos], flipDurationMs }}
          on:consider={(e) => handleDndConsider(e, hos)}
          on:finalize={(e) => handleDndFinalize(e, hos)}
        >
          {#each iByHos[hos] as i (i.id)}
            <li class="infection" animate:flip={{ duration: flipDurationMs }}>{i.state}</li>
          {/each}
        </ul>
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
        class="d-btn-outline d-btn-primary d-btn pc:min-w-[120px]"
        on:click={simulationEnd}>End</button
      >
      <button type="button" class="d-btn-primary d-btn pc:min-w-[120px]" on:click={simulationNext}
        >Next</button
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

  .hospitalization-dnd {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;

    & > p,
    & > ul {
      padding: 8px;
      text-align: center;
      background-color: theme('colors.neutral-100');
      border-radius: 4px;
    }

    & > p {
      font-weight: 700;
    }

    & > ul {
      overflow: auto;
      max-height: 100dvh;
      padding-bottom: 100px;
    }

    & > ul > * + * {
      margin-top: 8px;
    }

    & .infection {
      cursor: grab;
      padding: 8px;
      background-color: theme('colors.neutral-200');
      border-radius: 4px;

      &:active {
        cursor: grabbing;
      }
    }
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
