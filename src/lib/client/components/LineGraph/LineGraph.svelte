<script lang="ts">
  import { scaleLinear, line, extent, select, axisLeft, axisBottom } from 'd3';

  type Data = { x: number; y: number };

  export let data: Data[] = [];
  export let title = '';

  export let width = 640;
  export let height = 400;
  export let marginTop = 20;
  export let marginRight = 20;
  export let marginBottom = 20;
  export let marginLeft = 20;

  let gx: SVGElement;
  let gy: SVGElement;

  $: x = scaleLinear(extent(data, (d) => d.x) as any, [marginLeft, width - marginRight]);
  $: y = scaleLinear(extent(data, (d) => d.y) as any, [height - marginBottom, marginTop]);
  $: lined = line<Data>()
    .x((d) => x(d.x))
    .y((d) => y(d.y));

  $: select(gy).call(axisLeft(y) as any);
  $: select(gx).call(axisBottom(x) as any);
</script>

<svg {width} {height}>
  <text x={width / 2} y={marginTop} text-anchor="middle">{title}</text>
  <g bind:this={gx} transform="translate(0,{height - marginBottom})" />
  <g bind:this={gy} transform="translate({marginLeft},0)" />
  <path fill="none" stroke="currentColor" stroke-width="1.5" d={lined(data)} />
  <g fill="white" stroke="currentColor" stroke-width="1.5">
    {#each data as d}
      <circle cx={x(d.x)} cy={y(d.y)} r="2.5" />
    {/each}
  </g>
</svg>
