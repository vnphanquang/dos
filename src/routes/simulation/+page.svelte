<script lang="ts">
  import { onMount } from 'svelte';
  import { Svelvet } from 'svelvet';

  import { RateNode } from '$client/components/RateNode';

  const baseX = 300;
  const gapX = 50;
  function x(index: number, shift = false) {
    return (baseX + gapX) * index + (shift ? (baseX + gapX) / 2 : 0);
  }

  const baseY = 200;
  const gapY = 50;
  function y(index: number) {
    return (baseY + gapY) * index;
  }

  let mounted = false;
  onMount(() => {
    mounted = true;
  });
</script>

<main>
  <h1 class="text-center text-4xl font-bold">Infection Transition Flow</h1>
  {#if mounted}
    <Svelvet edgeStyle="step" fitView controls minimap TD>
      <RateNode x={x(6)} y={y(0)} id="I" to={['M0', 'C0']} title="Infected" input={false} />

      <!-- Initial infections -->
      <RateNode
        x={x(2, true)}
        y={y(1)}
        id="M0"
        to={['H0', 'H1']}
        title="Mild"
        value="70"
        description="Initial infection in mild condition"
      />
      <RateNode
        x={x(9, true)}
        y={y(1)}
        id="C0"
        to={['H2', 'H3']}
        title="Critical"
        value="30"
        description="Initial infection in critical condition"
      />

      <!-- Hospitalization? -->
      <RateNode
        x={x(1)}
        y={y(2)}
        id="H0"
        to={['M1', 'C1', 'R0']}
        title="Not hospitalized"
        input={false}
      />
      <RateNode x={x(4)} y={y(2)} id="H1" to={['B0']} title="Hospitalized" input={false} />
      <RateNode
        x={x(7, true)}
        y={y(2)}
        id="H2"
        to={['B1', 'B2']}
        title="Hospitalized"
        input={false}
      />
      <RateNode x={x(11)} y={y(2)} id="H3" to={['D2']} title="Not hospitalized" input={false} />

      <!-- Bed? -->
      <RateNode
        x={x(4)}
        y={y(3)}
        id="B0"
        to={['M2', 'C2', 'R1']}
        title="Regular Bed"
        input={false}
        description="Mild-conditioned patients should only be put in regular bed"
      />
      <RateNode
        x={x(6, true)}
        y={y(3)}
        id="B1"
        to={['C3', 'D0']}
        title="Regular Bed"
        input={false}
      />
      <RateNode x={x(9)} y={y(3)} id="B2" to={['M3', 'C4', 'D1']} title="ICU" input={false} />

      <!-- (Mild, not hospitalized) -->
      <RateNode x={x(0)} y={y(4)} id="M1" to={[]} title="Mild -> Mild" />
      <RateNode x={x(1)} y={y(4)} id="C1" to={[]} title="Mild -> Critical">
        <p class="italic">
          On the next round, Patient must be hospitalized in ICU (transition <strong>B2</strong>) or
          will be dead (transition <strong>D2</strong>).
        </p>
      </RateNode>
      <RateNode x={x(2)} y={y(4)} id="R0" to={[]} title="Mild -> Recovered" />

      <!-- (Mild, regular bed) -->
      <RateNode x={x(3)} y={y(4)} id="M2" to={[]} title="Mild -> Mild" />
      <RateNode x={x(4)} y={y(4)} id="C2" to={[]} title="Mild -> Critical">
        <p class="italic">On the next round, transition is same as in <strong>B1</strong>.</p>
      </RateNode>
      <RateNode x={x(5)} y={y(4)} id="R1" to={[]} title="Mild -> Recovered" />

      <!-- (Critical, regular bed) -->
      <RateNode x={x(6)} y={y(4)} id="C3" to={[]} title="Critical -> Critical" />
      <RateNode x={x(7)} y={y(4)} id="D0" to={[]} title="Critical -> Dead" />
      <!-- (Critical) ICU -->
      <RateNode x={x(8)} y={y(4)} id="M3" to={[]} title="Critical -> Mild" />
      <RateNode x={x(9)} y={y(4)} id="C4" to={[]} title="Critical -> Critical" />
      <RateNode x={x(10)} y={y(4)} id="D1" to={[]} title="Critical -> Dead" />

      <!-- Not Hospitalized -->
      <RateNode
        x={x(11)}
        y={y(4)}
        id="D2"
        to={[]}
        title="Critical -> Dead"
        value="100"
        input="fixed"
      />
    </Svelvet>
  {/if}
</main>

<style lang="postcss">
  main {
    position: relative;
    width: 100dvw;
    height: 100dvh;
  }

  h1 {
    position: absolute;
    z-index: 2;
    top: 16px;
    left: 50%;
    translate: -50% 0;

    width: fit-content;

    backdrop-filter: blur(2px);
  }
</style>
