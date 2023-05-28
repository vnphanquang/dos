<script lang="ts">
  import '../lib/client/styles/app.css';

  export let data;
</script>

<svelte:head>
  <title>DOS - Disease Outbreak Simulation</title>
</svelte:head>

<slot />

<p
  class="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-gray-500 backdrop-blur-sm"
>
  App version {data.version}
</p>
