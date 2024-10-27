import { isDev, tableMemo } from '../../utils'
import { row_getIsExpanded } from './RowExpanding.utils'
import type { RowData } from '../../types/type-utils'
import type { TableFeatures } from '../../types/TableFeatures'
import type { RowModel } from '../../core/row-models/RowModels.types'
import type { Table_Internal } from '../../types/Table'
import type { Row } from '../../types/Row'

export function createExpandedRowModel<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(): (
  table: Table_Internal<TFeatures, TData>,
) => () => RowModel<TFeatures, TData> {
  return (table) =>
    tableMemo({
      debug: isDev && (table.options.debugAll ?? table.options.debugTable),
      fnName: 'table.getExpandedRowModel',
      memoDeps: () => [
        table.getState().expanded,
        table.getPreExpandedRowModel(),
        table.options.paginateExpandedRows,
      ],
      fn: () => _createExpandedRowModel(table),
    })
}

export function _createExpandedRowModel<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(table: Table_Internal<TFeatures, TData>): RowModel<TFeatures, TData> {
  const rowModel = table.getPreExpandedRowModel()
  const expanded = table.getState().expanded

  if (
    !rowModel.rows.length ||
    (expanded !== true && !Object.keys(expanded ?? {}).length)
  ) {
    return rowModel
  }

  if (!table.options.paginateExpandedRows) {
    // Only expand rows at this point if they are being paginated
    return rowModel
  }

  return expandRows(rowModel)
}

export function expandRows<
  TFeatures extends TableFeatures,
  TData extends RowData,
>(rowModel: RowModel<TFeatures, TData>) {
  const expandedRows: Array<Row<TFeatures, TData>> = []

  const handleRow = (row: Row<TFeatures, TData>) => {
    expandedRows.push(row)

    if (row.subRows.length && row_getIsExpanded(row)) {
      row.subRows.forEach(handleRow)
    }
  }

  rowModel.rows.forEach(handleRow)

  return {
    rows: expandedRows,
    flatRows: rowModel.flatRows,
    rowsById: rowModel.rowsById,
  }
}
