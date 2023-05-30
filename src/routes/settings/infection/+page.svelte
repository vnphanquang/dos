<script lang="ts">
  import { onMount } from 'svelte';
  import { Svelvet, generateInput, Node } from 'svelvet';

  import { InfectionFlowNode } from '$client/components/InfectionFlowNode';

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

  const inputs = generateInput({
    // initial
    M0: 70,
    C0: 30,
    // mild, not hospitalized
    M1: 30,
    C1: 50,
    R0: 20,
    // mid, hospitalized into regular bed
    M2: 30,
    C2: 50,
    R1: 20,
    // critical, hospitalized into regular bed
    C3: 50,
    D0: 50,
    // critical, hospitalized into ICU
    M3: 30,
    C4: 50,
    D1: 20,
    // critical, not hospitalized
    D2: 100,
  });

  function checkScreenSetInputMode() {
    isSliderMode = window.innerWidth < 768;
  }

  let isSliderMode = false;
  $: inputMode = isSliderMode ? ('slider' as const) : ('input' as const);
  onMount(() => {
    checkScreenSetInputMode();
  });
</script>

<svelte:window on:resize={checkScreenSetInputMode} />

<main>
  <h1 class="text-center text-4xl font-bold backdrop-blur-sm">Infection Transition Flow</h1>
  <Svelvet edgeStyle="step" fitView controls minimap TD>
    <Node useDefaults position={{ x: 200, y: 200 }}>
      <div class="input-modes">
        <p><strong>Input Mode:</strong></p>
        <div class="mt-4 flex items-center gap-1">
          <p>Input</p>
          <input type="checkbox" class="d-toggle" bind:checked={isSliderMode} />
          <p>Slider</p>
        </div>
      </div>
    </Node>

    <InfectionFlowNode x={x(6)} y={y(0)} id="I" to={['M0', 'C0']} title="Infected" />

    <!-- Initial infections -->
    <InfectionFlowNode
      x={x(2, true)}
      y={y(1)}
      id="M0"
      to={['H0', 'H1']}
      title="Mild"
      description="Initial infection in mild condition"
      input={$inputs.M0}
      {inputMode}
    />
    <InfectionFlowNode
      x={x(9, true)}
      y={y(1)}
      id="C0"
      to={['H2', 'H3']}
      title="Critical"
      description="Initial infection in critical condition"
      input={$inputs.C0}
      {inputMode}
    />

    <!-- Hospitalization? -->
    <InfectionFlowNode x={x(1)} y={y(2)} id="H0" to={['M1', 'C1', 'R0']} title="Not hospitalized" />
    <InfectionFlowNode x={x(4)} y={y(2)} id="H1" to={['B0']} title="Hospitalized" />
    <InfectionFlowNode x={x(7, true)} y={y(2)} id="H2" to={['B1', 'B2']} title="Hospitalized" />
    <InfectionFlowNode x={x(11)} y={y(2)} id="H3" to={['D2']} title="Not hospitalized" />

    <!-- Bed? -->
    <InfectionFlowNode
      x={x(4)}
      y={y(3)}
      id="B0"
      to={['M2', 'C2', 'R1']}
      title="Regular Bed"
      description="Mild-conditioned patients should only be put in regular bed"
    />
    <InfectionFlowNode x={x(6, true)} y={y(3)} id="B1" to={['C3', 'D0']} title="Regular Bed" />
    <InfectionFlowNode x={x(9)} y={y(3)} id="B2" to={['M3', 'C4', 'D1']} title="ICU" />

    <!-- (Mild, not hospitalized) -->
    <InfectionFlowNode
      x={x(0)}
      y={y(4)}
      id="M1"
      to={[]}
      title="Mild -> Mild"
      input={$inputs.M1}
      {inputMode}
    />
    <InfectionFlowNode
      x={x(1)}
      y={y(4)}
      id="C1"
      to={[]}
      title="Mild -> Critical"
      input={$inputs.C1}
      {inputMode}
    >
      <p class="italic">
        On the next round, Patient must be hospitalized in ICU (transition <strong>B2</strong>) or
        will be dead (transition <strong>D2</strong>).
      </p>
    </InfectionFlowNode>
    <InfectionFlowNode
      x={x(2)}
      y={y(4)}
      id="R0"
      to={[]}
      title="Mild -> Recovered"
      input={$inputs.R0}
      {inputMode}
    />

    <!-- (Mild, regular bed) -->
    <InfectionFlowNode
      x={x(3)}
      y={y(4)}
      id="M2"
      to={[]}
      title="Mild -> Mild"
      input={$inputs.M2}
      {inputMode}
    />
    <InfectionFlowNode
      x={x(4)}
      y={y(4)}
      id="C2"
      to={[]}
      title="Mild -> Critical"
      input={$inputs.C2}
      {inputMode}
    >
      <p class="italic">On the next round, transition is same as in <strong>B1</strong>.</p>
    </InfectionFlowNode>
    <InfectionFlowNode
      x={x(5)}
      y={y(4)}
      id="R1"
      to={[]}
      title="Mild -> Recovered"
      input={$inputs.R1}
      {inputMode}
    />

    <!-- (Critical, regular bed) -->
    <InfectionFlowNode
      x={x(6)}
      y={y(4)}
      id="C3"
      to={[]}
      title="Critical -> Critical"
      input={$inputs.C3}
      {inputMode}
    />
    <InfectionFlowNode
      x={x(7)}
      y={y(4)}
      id="D0"
      to={[]}
      title="Critical -> Dead"
      input={$inputs.D0}
      {inputMode}
    />
    <!-- (Critical) ICU -->
    <InfectionFlowNode
      x={x(8)}
      y={y(4)}
      id="M3"
      to={[]}
      title="Critical -> Mild"
      input={$inputs.M3}
      {inputMode}
    >
      <p class="italic">
        On the next round, assuming patient has already been transferred to a regular bed,
        transition will be same as in <strong>B0</strong>.
      </p>
    </InfectionFlowNode>
    <InfectionFlowNode
      x={x(9)}
      y={y(4)}
      id="C4"
      to={[]}
      title="Critical -> Critical"
      input={$inputs.C4}
      {inputMode}
    />
    <InfectionFlowNode
      x={x(10)}
      y={y(4)}
      id="D1"
      to={[]}
      title="Critical -> Dead"
      input={$inputs.D1}
      {inputMode}
    />

    <!-- Not Hospitalized -->
    <InfectionFlowNode
      x={x(11)}
      y={y(4)}
      id="D2"
      to={[]}
      title="Critical -> Dead"
      input={$inputs.D2}
      {inputMode}
      disabled
    />
  </Svelvet>
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
  }

  .input-modes {
    padding: 20px;
    font-size: 20px;
    background-color: theme('colors.blue.200');
    border-radius: 10px;
  }
</style>
