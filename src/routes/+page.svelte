<script lang="ts">
</script>

<main class="space-y-20 p-20">
  <h1 class="text-bold text-center text-4xl">Disease Outbreak Simulation (DOS)</h1>
  <p class="text-center">Please select mode</p>
  <section class="mode-selection">
    <a href="/simulation" class="bg-green-400">Simulation</a>
    <a href="/game" class="pointer-events-none bg-gray-400 opacity-50">Game</a>
  </section>
</main>

<style lang="postcss">
  .mode-selection {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;

    & > a {
      display: grid;
      place-items: center;
      padding: 40px;
    }
  }
</style>
