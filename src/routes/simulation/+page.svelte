<script lang="ts">
  import { getInfectionStats } from '$client/services/simulation';
  import { HOSPITALIZATIONS, INFECTION_STATES } from '$shared/types';

  export let data;

  $: simulation = data.simulation;

  $: stats = getInfectionStats($simulation?.infections ?? []);
</script>

<main class="c-page c-page--full py-10">
  <h1 class="mb-10 text-center text-4xl font-bold">Simulation</h1>

  <section class="space-y-4 bg-base-200 p-10">
    <h2>Infections</h2>
    <div class="d-stats grid-cols-2">
      <div class="d-stat gap-y-2">
        <p class="d-stat-title uppercase">Active Infections</p>
        <p class="d-stat-value">{stats.total}</p>
        <p class="d-stat-desc">Number of currently in-game infections</p>
      </div>
      <div class="d-stat gap-y-2">
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
        <p class="d-stat-title uppercase">Regular Bed</p>
        <p class="d-stat-value">
          {stats.byHospitalization.regular.total} / {$simulation?.context.hospitalCapacity
            .regular ?? 0} <span class="text-base font-normal">occupied</span>
        </p>
      </div>
      <div class="d-stat gap-y-2">
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
</style>
