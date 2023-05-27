<script lang="ts">
  const app_version = `v${__BUILD_VERSION__}#${__BUILD_HASH__}/${__BUILD_TIMESTAMP__}`;
</script>

<main class="grid place-items-center gap-10 p-20">
  <svg inline-src="svelte" height="200" width="auto" />
  <h1 class="text-2xl font-bold">Svelte Kit Template</h1>
  <div class="c-graphic" />
  <p>Site Version: <span class="italic">{app_version}</span></p>
</main>
