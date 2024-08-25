import { column_getVisibleLeafColumns } from '../column-visibility/ColumnVisibility.utils'
import {
  table_getInitialState,
  table_getState,
  table_getState,
} from '../../core/table/Tables.utils'
import type { TableOptions_ColumnGrouping } from '../column-grouping/ColumnGrouping.types'
import type { CellData, RowData, Updater } from '../../types/type-utils'
import type { TableFeatures } from '../../types/TableFeatures'
import type { Table } from '../../types/Table'
import type { Column } from '../../types/Column'
import type { ColumnPinningPosition } from '../column-pinning/ColumnPinning.types'
import type {
  ColumnOrderState,
  TableOptions_ColumnOrdering,
} from './ColumnOrdering.types'

export function column_getIndex<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TValue extends CellData = CellData,
>(
  column: Column<TFeatures, TData, TValue>,
  table: Table<TFeatures, TData>,
  position?: ColumnPinningPosition | 'center',
) {
  const columns = column_getVisibleLeafColumns(table, position)
  return columns.findIndex((d) => d.id === column.id)
}

export function column_getIsFirstColumn<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TValue extends CellData = CellData,
>(
  column: Column<TFeatures, TData, TValue>,
  table: Table<TFeatures, TData>,
  position?: ColumnPinningPosition | 'center',
) {
  const columns = column_getVisibleLeafColumns(table, position)
  return columns[0]?.id === column.id
}

export function column_getIsLastColumn<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TValue extends CellData = CellData,
>(
  column: Column<TFeatures, TData, TValue>,
  table: Table<TFeatures, TData>,
  position?: ColumnPinningPosition | 'center',
) {
  const columns = column_getVisibleLeafColumns(table, position)
  return columns[columns.length - 1]?.id === column.id
}

export function table_setColumnOrder<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(
  table: Table<TFeatures, TData> & {
    options: Partial<TableOptions_ColumnOrdering>
  },
  updater: Updater<ColumnOrderState>,
) {
  table.options.onColumnOrderChange?.(updater)
}

export function table_resetColumnOrder<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table<TFeatures, TData>, defaultState?: boolean) {
  table_setColumnOrder(
    table,
    defaultState ? [] : (table_getInitialState(table).columnOrder ?? []),
  )
}

export function table_getOrderColumnsFn<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table<TFeatures, TData>) {
  const { columnOrder = [] } = table_getState(table)

  return (columns: Array<Column<TFeatures, TData, unknown>>) => {
    // Sort grouped columns to the start of the column list
    // before the headers are built
    let orderedColumns: Array<Column<TFeatures, TData, unknown>> = []

    // If there is no order, return the normal columns
    if (!columnOrder.length) {
      orderedColumns = columns
    } else {
      const columnOrderCopy = [...columnOrder]

      // If there is an order, make a copy of the columns
      const columnsCopy = [...columns]

      // And make a new ordered array of the columns

      // Loop over the columns and place them in order into the new array
      while (columnsCopy.length && columnOrderCopy.length) {
        const targetColumnId = columnOrderCopy.shift()
        const foundIndex = columnsCopy.findIndex((d) => d.id === targetColumnId)
        if (foundIndex > -1) {
          orderedColumns.push(columnsCopy.splice(foundIndex, 1)[0]!)
        }
      }

      // If there are any columns left, add them to the end
      orderedColumns = [...orderedColumns, ...columnsCopy]
    }

    return orderColumns(table, orderedColumns)
  }
}

export function orderColumns<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(
  table: Table<TFeatures, TData> & {
    options: Partial<
      TableOptions_ColumnOrdering &
        TableOptions_ColumnGrouping<TFeatures, TData>
    >
  },
  leafColumns: Array<Column<TFeatures, TData, unknown>>,
) {
  const { grouping = [] } = table_getState(table)
  const { groupedColumnMode } = table.options

  if (!grouping.length || !groupedColumnMode) {
    return leafColumns
  }

  const nonGroupingColumns = leafColumns.filter(
    (col) => !grouping.includes(col.id),
  )

  if (groupedColumnMode === 'remove') {
    return nonGroupingColumns
  }

  const groupingColumns = grouping
    .map((g) => leafColumns.find((col) => col.id === g)!)
    .filter(Boolean)

  return [...groupingColumns, ...nonGroupingColumns]
}
