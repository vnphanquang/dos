<script lang="ts">
  import '../lib/client/styles/app.css';

  export let data;
</script>

<svelte:head>
  <title>DOS - Disease Outbreak Simulation</title>
</svelte:head>

<slot />

<footer class="mt-8 py-2">
  <p class="whitespace-nowrap text-center text-xs text-gray-500">App version {data.version}</p>
</footer>
