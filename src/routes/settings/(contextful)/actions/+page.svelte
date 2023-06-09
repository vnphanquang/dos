<script lang="ts">
  import { writable } from 'svelte/store';
  import { Render, Subscribe, createTable } from 'svelte-headless-table';

  import { INFECTION_TRANSITION, type Action, HOSPITAL_BEDS } from '$shared/types';

  export let data;

  $: ({ simulation } = data);

  const actions = writable<Action[]>([]);
  $: actions.set($simulation?.context.actions ?? []);

  const table = createTable(actions);
  const columns = table.createColumns([
    table.column({
      header: 'ID',
      accessor: 'id',
    }),
    table.column({
      header: 'Role',
      accessor: 'role',
    }),
    table.column({
      header: 'Name',
      accessor: 'name',
    }),
    table.column({
      header: 'Description',
      accessor: 'description',
    }),
    table.column({
      header: 'Infection Delta',
      accessor: 'infectionDelta',
    }),
    table.group({
      header: 'Infection Transitioon Probability Delta',
      columns: INFECTION_TRANSITION.map((id) =>
        table.column({
          header: id,
          accessor: (data) => data.infectionTransitionProbabilityDelta[id],
        }),
      ),
    }),
    table.group({
      header: 'Hospital Capacity Delta',
      columns: HOSPITAL_BEDS.map((id) =>
        table.column({
          header: id,
          accessor: (data) => data.hospitalCapacityDelta[id],
        }),
      ),
    }),
  ]);

  const { headerRows, rows, tableAttrs, tableBodyAttrs } = table.createViewModel(columns);
</script>

<main class="c-page c-page--full space-y-10">
  <section class="table-actions">
    {#if $actions.length}
      <table {...$tableAttrs} class="d-table-zebra d-table d-table-compact min-w-full">
        <thead>
          {#each $headerRows as headerRow (headerRow.id)}
            <Subscribe rowAttrs={headerRow.attrs()} let:rowAttrs rowProps={headerRow.props()}>
              <tr {...rowAttrs}>
                {#each headerRow.cells as cell (cell.id)}
                  <Subscribe attrs={cell.attrs()} let:attrs props={cell.props()}>
                    <th {...attrs}>
                      <Render of={cell.render()} />
                    </th>
                  </Subscribe>
                {/each}
              </tr>
            </Subscribe>
          {/each}
        </thead>
        <tbody {...$tableBodyAttrs}>
          {#each $rows as row (row.id)}
            <Subscribe rowAttrs={row.attrs()} let:rowAttrs>
              <tr {...rowAttrs}>
                {#each row.cells as cell (cell.id)}
                  {@const value = cell.isData() ? cell.value : ''}
                  <Subscribe attrs={cell.attrs()} let:attrs>
                    <td {...attrs} data-empty={!value}>
                      <Render of={cell.render()} />
                    </td>
                  </Subscribe>
                {/each}
              </tr>
            </Subscribe>
          {/each}
        </tbody>
      </table>
    {/if}
  </section>
</main>

<style lang="postcss">
  td[data-empty]:not([data-empty='false']) {
    color: theme('colors.gray.500 / 25%');
  }

  .table-actions {
    overflow: auto;
    max-width: 100%;

    & thead :global(tr:nth-child(2)) {
      position: sticky;
      z-index: 2;
      top: 0;
    }

    & tbody :global(tr td:first-child) {
      position: sticky;
      z-index: 1;
      left: 0;
    }
  }
</style>
