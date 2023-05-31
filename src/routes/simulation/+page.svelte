<script lang="ts">
  import { flip } from 'svelte/animate';
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
</script>

<main class="c-page c-page--full py-10">
  <h1 class="mb-10 text-center text-4xl font-bold">Simulation</h1>

  <section class="space-y-4 bg-base-200 p-10">
    <h2>Infections</h2>
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
    <h2>Hospitalization</h2>
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

  <section class="space-y-4 bg-base-200 p-10">
    <h2>Actions</h2>
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
