<script lang="ts">
  import { clickoutside } from '@svelte-put/clickoutside';
  import Fuse from 'fuse.js';
  import debounce from 'lodash.debounce';
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { slide } from 'svelte/transition';
  import { dndzone } from 'svelte-dnd-action';

  import {
    categorizeInfectionsByHospitalization,
    getInfectionStats,
  } from '$client/services/simulation';
  import {
    HOSPITALIZATIONS,
    INFECTION_STATES,
    type Hospitalization,
    type Infection,
    type Action,
  } from '$shared/types';

  export let data;

  const flipDurationMs = 300;

  $: simulation = data.simulation;

  $: stats = getInfectionStats($simulation?.infections ?? []);
  $: iByHos = categorizeInfectionsByHospitalization($simulation?.infections ?? []);

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
    console.log(actionSearchResult);
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
  });
</script>

<main class="c-page c-page--full py-10">
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
        <p class="d-stat-value">{stats.total}</p>
        <p class="d-stat-desc">Number of currently in-game infections</p>
      </div>
      <div class="d-stat gap-y-2">
        <div class="d-stat-figure">
          <svg inline-src="lucide/user-plus" width="28" height="28" />
        </div>
        <p class="d-stat-title uppercase">Infection Pool</p>
        <p class="d-stat-value">{$simulation?.infectionPool.length ?? 0}</p>
        <p class="d-stat-desc">Number of infections to pool from in next rounds</p>
      </div>
    </div>
    <div class="d-divider text-gray-500">Active Infection Statistics</div>
    <div class="d-stats grid-cols-4">
      {#each INFECTION_STATES as state}
        <div class="d-stat grid-rows-[auto,auto,1fr] gap-y-2">
          <p class="d-stat-title uppercase">{state}</p>
          <p class="d-stat-value">{stats.byState[state].total}</p>
          <ul class="d-stat-desc">
            <li>
              <strong>{stats.byState[state].byHospitalization.none}</strong> not hospitalized
            </li>
            <li>
              <strong>{stats.byState[state].byHospitalization.regular}</strong> regular bed
            </li>
            {#if state !== 'recovered' && state !== 'mild'}
              <li>
                <strong>{stats.byState[state].byHospitalization.icu}</strong> icu
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
    <div class="d-stats grid-cols-2">
      <div class="d-stat gap-y-2">
        <div class="d-stat-figure">
          <svg inline-src="lucide/heart-pulse" width="28" height="28" />
        </div>
        <p class="d-stat-title uppercase">Regular Bed</p>
        <p class="d-stat-value">
          {stats.byHospitalization.regular.total} / {$simulation?.context.hospitalCapacity
            .regular ?? 0} <span class="text-base font-normal">occupied</span>
        </p>
      </div>
      <div class="d-stat gap-y-2">
        <div class="d-stat-figure">
          <svg inline-src="lucide/heart" width="28" height="28" />
        </div>
        <p class="d-stat-title uppercase">ICU</p>
        <p class="d-stat-value">
          {stats.byHospitalization.icu.total} / {$simulation?.context.hospitalCapacity.icu ?? 0}
          <span class="text-base font-normal">occupied</span>
        </p>
      </div>
    </div>
    <div class="d-divider text-gray-500">Hospitalization Statistics</div>
    <div class="d-stats grid-cols-3">
      {#each HOSPITALIZATIONS as hos}
        <div class="d-stat grid-rows-[auto,auto,1fr] gap-y-2">
          <p class="d-stat-title uppercase">{hos}</p>
          <p class="d-stat-value">{stats.byHospitalization[hos].total}</p>
          <ul class="d-stat-desc">
            {#if hos !== 'icu'}
              <li>
                <strong>{stats.byHospitalization[hos].byState.mild}</strong> mild infections
              </li>
            {/if}
            <li>
              <strong>{stats.byHospitalization[hos].byState.critical}</strong> critical infections
            </li>
            <li>
              <strong>{stats.byHospitalization[hos].byState.dead}</strong> dead infections
            </li>
            {#if hos !== 'icu'}
              <li>
                <strong>{stats.byHospitalization[hos].byState.recovered}</strong> recovered infections
              </li>
            {/if}
          </ul>
        </div>
      {/each}
    </div>

    <div class="d-divider text-gray-500">Patient Distribution</div>
    <div class="hospitalization-dnd">
      <p>No hospitalization</p>
      <p>Regular Bed</p>
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
          transition:slide
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
      {#each $simulation?.queuedActions ?? [] as action}
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

  <section class="mt-10 flex justify-between px-10">
    <button type="button" class="d-btn-outline d-btn min-w-[120px]">Undo</button>
    <button type="button" class="d-btn-primary d-btn min-w-[120px]">Next</button>
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
      background-color: theme('colors.neutral-100');
      border-radius: 4px;

      &:active {
        cursor: grabbing;
      }
    }
  }
</style>
