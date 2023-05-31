<script lang="ts">
  import { invalidate } from '$app/navigation';
  import { parseSimulationContextFromCSV } from '$client/services/simulation';
  import { setSimulationContext } from '$client/services/simulation/simulation.cache';
  import { LOAD_DEPENDENCIES } from '$shared/constants';

  export let data;

  async function handleUploadSettings(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return [];
    const csvStr = await file.text();
    const context = parseSimulationContextFromCSV(csvStr);
    setSimulationContext(context);
    invalidate(LOAD_DEPENDENCIES.SIMULATION.CONTEXT);
  }

  $: simulation = data.simulation;
  $: context = $simulation?.context;
</script>

<main class="c-page space-y-8">
  <h1 class="text-center text-4xl font-bold">Simulation Settings</h1>

  <section class="space-y-4">
    <h2>1. Upload settings in CSV format</h2>
    <input
      type="file"
      name="settings"
      id="settings"
      multiple={false}
      accept=".csv"
      on:change={handleUploadSettings}
      class="d-file-input-primary d-file-input w-full"
    />
  </section>
  <div class="d-divider" />
  <section class="space-y-4" class:opacity-25={!context}>
    <h2>2. Review settings</h2>
    {#if context}
      <section class="space-y-4">
        <h3>Actions ({context.actions.length})</h3>
        <a href="/settings/actions" class="d-btn-outline d-btn w-full">See Action Table</a>
      </section>
      <section class="space-y-4">
        <h3>Infection</h3>
        <div class="d-stats">
          <div class="d-stat">
            <div class="d-stat-figure">
              <svg inline-src="lucide/bug" width="28" height="28" />
            </div>
            <p class="d-stat-title">Total Infections</p>
            <p class="d-stat-value">{context.totalInfections}</p>
            <p class="d-stat-desc">Infections to pool from at the start of each round</p>
          </div>

          <div class="d-stat">
            <div class="d-stat-figure">
              <svg inline-src="lucide/user-plus" width="28" height="28" />
            </div>
            <p class="d-stat-title">Infection Base Delta</p>
            <p class="d-stat-value">{context.newInfectionBaseDelta}</p>
            <p class="d-stat-desc">Default number of infections at start of each round</p>
          </div>
        </div>
        <a href="/settings/infection" class="d-btn-outline d-btn w-full"
          >See Infection Transition Flow & Probabilities</a
        >
      </section>
      <section class="space-y-4">
        <h3>Hospital Capacity</h3>
        <div class="d-stats">
          <div class="d-stat">
            <div class="d-stat-figure">
              <svg inline-src="lucide/heart-pulse" width="28" height="28" />
            </div>
            <p class="d-stat-title">Regular Beds</p>
            <p class="d-stat-value">{context.hospitalCapacity.regular}</p>
          </div>

          <div class="d-stat">
            <div class="d-stat-figure">
              <svg inline-src="lucide/heart" width="28" height="28" />
            </div>
            <p class="d-stat-title">Intensive Care Units</p>
            <p class="d-stat-value">{context.hospitalCapacity.icu}</p>
          </div>
        </div>
      </section>
    {/if}
  </section>
  <div class="d-divider" />
  <section class="space-y-4" class:opacity-25={!context}>
    <h2>3. Start / continue simulation</h2>
    <a class="d-btn-primary d-btn w-full" href="/simulation" data-disabled={!context}
      >Go to Simulation</a
    >
  </section>
</main>

<style lang="postcss">
  a[data-disabled]:not([data-disabled='false']) {
    pointer-events: none;
    cursor: not-allowed;
  }

  .d-stats {
    width: 100%;
    background: theme('colors.neutral-100');

    &:not(.actions) {
      grid-template-columns: 1fr 1fr;
    }

    & .d-stat {
      row-gap: 8px;
    }
  }

  h2 {
    font-size: theme('fontSize.2xl');
    font-weight: 700;
  }

  h3 {
    font-size: theme('fontSize.xl');
    font-weight: 700;
  }
</style>
