import { assignAPIs, makeStateUpdater } from '../../utils'
import {
  column_getIndex,
  column_getIsFirstColumn,
  column_getIsLastColumn,
  getDefaultColumnOrderState,
  table_resetColumnOrder,
  table_setColumnOrder,
} from './ColumnOrdering.utils'
import type { TableState } from '../../types/TableState'
import type {
  ColumnOrderDefaultOptions,
  Column_ColumnOrdering,
  TableState_ColumnOrdering,
  Table_ColumnOrdering,
} from './ColumnOrdering.types'
import type { CellData, RowData } from '../../types/type-utils'
import type { TableFeature, TableFeatures } from '../../types/TableFeatures'
import type { Table } from '../../types/Table'
import type { Column } from '../../types/Column'

/**
 * The Column Ordering feature adds column ordering state and APIs to the table and column objects.
 * @link [API Docs](https://tanstack.com/table/v8/docs/api/features/column-ordering)
 * @link [Guide](https://tanstack.com/table/v8/docs/guide/column-ordering)
 */
export const ColumnOrdering: TableFeature = {
  getInitialState: <TFeatures extends TableFeatures>(
    state: TableState<TFeatures>,
  ): TableState<TFeatures> & TableState_ColumnOrdering => {
    return {
      columnOrder: getDefaultColumnOrderState(),
      ...state,
    }
  },

  getDefaultTableOptions: <
    TFeatures extends TableFeatures,
    TData extends RowData,
  >(
    table: Table<TFeatures, TData> &
      Partial<Table_ColumnOrdering<TFeatures, TData>>,
  ): ColumnOrderDefaultOptions => {
    return {
      onColumnOrderChange: makeStateUpdater('columnOrder', table),
    }
  },

  constructColumnAPIs: <
    TFeatures extends TableFeatures,
    TData extends RowData,
    TValue extends CellData = CellData,
  >(
    column: Column<TFeatures, TData, TValue> & Partial<Column_ColumnOrdering>,
  ): void => {
    assignAPIs(column, [
      {
        fn: (position) => column_getIndex(column, position),
        memoDeps: (position) => [
          position,
          column.table.getState().columnOrder,
          column.table.getState().columnPinning,
          column.table.getState().grouping,
        ],
      },
      {
        fn: (position) => column_getIsFirstColumn(column, position),
      },
      {
        fn: (position) => column_getIsLastColumn(column, position),
      },
    ])
  },

  constructTableAPIs: <TFeatures extends TableFeatures, TData extends RowData>(
    table: Table<TFeatures, TData> &
      Partial<Table_ColumnOrdering<TFeatures, TData>>,
  ): void => {
    assignAPIs(table, [
      {
        fn: (updater) => table_setColumnOrder(table, updater),
      },
      {
        fn: (defaultState) => table_resetColumnOrder(table, defaultState),
      },
    ])
  },
}
