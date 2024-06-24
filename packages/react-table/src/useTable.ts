import * as React from 'react'

import { Store } from '@tanstack/react-store'
import {
  getInitialTableState,
  _createTable,
  TableState,
  TableOptions,
  RowData,
  Table,
  TableOptionsResolved,
} from '@tanstack/table-core'

function useTableRef<TData extends RowData>(
  options: TableOptionsResolved<TData>
): Table<TData> {
  const tableRef = React.useRef<Table<TData>>()

  if (!tableRef.current) {
    tableRef.current = _createTable<TData>(options)
  }

  return tableRef.current
}

/**
 * Will re-render the table whenever the state or options change. Works just like the `useReactTable` from v8.
 * Alternatively, you can use the new `useTableWithStore` hook to get a store instance that you can use to manage the table state.
 * @example const table = useTable({ columns, data, state, ...options })
 */
export function useTable<TData extends RowData>(
  tableOptions: TableOptions<TData>
): Table<TData> {
  const [state, setState] = React.useState<TableState>(
    getInitialTableState(tableOptions.initialState)
  )

  const statefulOptions: TableOptionsResolved<TData> = {
    ...tableOptions,
    state: { ...state, ...tableOptions.state },
    onStateChange: updater => {
      setState(updater)
      tableOptions.onStateChange?.(updater)
    },
  }

  const table = useTableRef(statefulOptions)

  table.setOptions(prev => ({ ...prev, ...statefulOptions })) //force re-render when state or options change

  return table
}

/**
 * Will create a stable table instance and a subscribable store instance that you can use to manage the table state.
 * @example const [table, store] = useTableWithStore({ columns, data, state, ...options })
 */
export function useTableWithStore<TData extends RowData>(
  tableOptions: TableOptions<TData>
): [Table<TData>, Store<TableState>] {
  const store = new Store<TableState>(
    getInitialTableState(tableOptions.initialState)
  )

  const statefulOptions: TableOptionsResolved<TData> = {
    ...tableOptions,
    state: { ...store.state, ...tableOptions.state },
    onStateChange: updater => {
      store.setState(state =>
        updater instanceof Function ? updater(state) : updater
      )
      tableOptions.onStateChange?.(updater)
    },
  }

  const table = useTableRef(statefulOptions)

  table.setOptions(prev => ({ ...prev, ...tableOptions })) //force re-render only when options change

  return [table, store]
}
