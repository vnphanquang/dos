<script lang="ts">
  import { parseSimulationContextFromCSV } from '$client/services/simulation';

  let initialized = false;
  async function handleUploadSettings(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return [];
    const csvStr = await file.text();
    const context = parseSimulationContextFromCSV(csvStr);
    console.log(context);
    initialized = true;
  }
</script>

<main class="space-y-10 p-8 pc:p-10">
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

  <section class="space-y-4" class:opacity-25={!initialized}>
    <h2>2. Review settings</h2>
    <div class="grid grid-cols-2 gap-10">
      <a class="d-btn-info d-btn" href="/settings/actions" data-disabled={!initialized}>Action</a>
      <a class="d-btn-info d-btn" href="/settings/infection" data-disabled={!initialized}
        >Infection Flow</a
      >
    </div>
  </section>

  <section class="space-y-4" class:opacity-25={!initialized}>
    <h2>3. Start simulation</h2>
    <a class="d-btn-primary d-btn w-full" href="/simulation" data-disabled={!initialized}
      >Start Simulation</a
    >
  </section>
</main>

<style lang="postcss">
  a[data-disabled]:not([data-disabled='false']) {
    pointer-events: none;
    cursor: not-allowed;
  }
</style>
