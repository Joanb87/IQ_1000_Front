import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  flexRender,
} from '@tanstack/react-table';
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  Row,
} from '@tanstack/react-table';
import styles from './DataTable.module.css';

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  enableEditing?: boolean;
  pageSize?: number;
  onRowEdit?: (row: Row<TData>) => void;
  onDataChange?: (data: TData[]) => void;
  className?: string;
}

export type FilterVariant = 'text' | 'single' | 'multi';
export interface ColumnMeta {
  filterVariant?: FilterVariant;
  filterPlaceholder?: string;
}

export function DataTable<TData>({
  data,
  columns,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableEditing = false,
  pageSize = 10,
  onRowEdit,
  onDataChange,
  className = '',
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getFacetedRowModel: enableFiltering ? getFacetedRowModel() : undefined,
    getFacetedUniqueValues: enableFiltering ? getFacetedUniqueValues() : undefined,

    // (Opcional) puedes dejar esto o eliminarlo; ya no dependemos del id string en las columnas
    filterFns: {
      multiSelect: (row, columnId, filterValues: string[]) => {
        if (!Array.isArray(filterValues) || filterValues.length === 0) return true;
        const v = String(row.getValue(columnId) ?? '');
        return filterValues.includes(v);
      },
      singleSelect: (row, columnId, filterValue?: string) => {
        if (!filterValue) return true;
        const v = String(row.getValue(columnId) ?? '');
        return v === String(filterValue);
      },
    },

    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, columnVisibility, globalFilter },
    initialState: { pagination: { pageSize } },
  });

  const handleCellEdit = (rowIndex: number, columnId: string, value: any) => {
    if (!onDataChange) return;
    const newData = [...data];
    (newData[rowIndex] as any)[columnId] = value;
    onDataChange(newData);
  };

  return (
    <div className={`${styles.tableContainer} ${className}`}>
      {enableFiltering && (
        <div className={styles.tableHeader}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Buscar en toda la tabla..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className={styles.globalFilter}
            />
            <div className={styles.searchIcon}>🔍</div>
          </div>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className={styles.headerRow}>
                {hg.headers.map((header) => (
                  <th key={header.id} className={styles.headerCell}>
                    <div className={styles.headerContent}>
                      <div
                        className={`${styles.headerText} ${
                          header.column.getCanSort() ? styles.sortable : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className={styles.sortIcon}>
                            {{
                              asc: ' 🔼',
                              desc: ' 🔽',
                            }[header.column.getIsSorted() as string] ?? ' ↕️'}
                          </span>
                        )}
                      </div>

                      {enableFiltering && header.column.getCanFilter() ? (
                        <DataTableColumnFilter column={header.column} />
                      ) : null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className={styles.tableBody}>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`${styles.bodyRow} ${enableEditing ? styles.editable : ''}`}
                  onClick={() => enableEditing && onRowEdit?.(row)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={styles.bodyCell}>
                      {enableEditing ? (
                        <EditableCell
                          value={cell.getValue()}
                          row={row}
                          column={cell.column}
                          onEdit={handleCellEdit}
                        />
                      ) : (
                        flexRender(cell.column.columnDef.cell, cell.getContext())
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className={`${styles.bodyCell} ${styles.emptyState}`}>
                  No se encontraron resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {enablePagination && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            <span>
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </span>
            <span>({table.getFilteredRowModel().rows.length} registros)</span>
          </div>
          <div className={styles.paginationControls}>
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className={styles.paginationButton}
            >
              {'<<'}
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className={styles.paginationButton}
            >
              {'<'}
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className={styles.paginationButton}
            >
              {'>'}
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className={styles.paginationButton}
            >
              {'>>'}
            </button>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className={styles.pageSizeSelect}
            >
              {[10, 20, 30, 40, 50].map((ps) => (
                <option key={ps} value={ps}>
                  Mostrar {ps}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

interface EditableCellProps {
  value: any;
  row: Row<any>;
  column: any;
  onEdit: (rowIndex: number, columnId: string, value: any) => void;
}

function EditableCell({ value: initialValue, row, column, onEdit }: EditableCellProps) {
  const [value, setValue] = useState(initialValue);
  const onBlur = () => onEdit(row.index, column.id, value);
  return (
    <input
      value={value ?? ''}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onBlur}
      className={styles.editableInput}
    />
  );
}

function DataTableColumnFilter({ column }: { column: any }) {
  const meta = (column.columnDef.meta ?? {}) as { filterVariant?: 'text' | 'single' | 'multi'; filterPlaceholder?: string };
  const variant = meta.filterVariant ?? 'text';
  const faceted = column.getFacetedUniqueValues?.() as Map<any, number> | undefined;
  const value = column.getFilterValue();

  if (variant === 'text') {
    return (
      <input
        type="text"
        value={(value ?? '') as string}
        onChange={(e) => column.setFilterValue(e.target.value)}
        placeholder={meta.filterPlaceholder ?? 'Filtrar...'}
        className={styles.columnFilter}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  if (variant === 'single') {
    const options = faceted ? Array.from(faceted.keys()).map(String).sort() : [];
    return (
      <select
        value={(value as string) ?? ''}
        onChange={(e) => column.setFilterValue(e.target.value || undefined)}
        className={styles.columnFilter}
        onClick={(e) => e.stopPropagation()}
      >
        <option value="">(Todos)</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  const selected: string[] = Array.isArray(value) ? value : [];
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const options = faceted
    ? Array.from(faceted.entries())
        .map(([k, count]) => ({ label: String(k ?? ''), count }))
        .filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => a.label.localeCompare(b.label))
    : [];

  const toggle = (opt: string) => {
    const set = new Set(selected);
    set.has(opt) ? set.delete(opt) : set.add(opt);
    const arr = Array.from(set);
    column.setFilterValue(arr.length ? arr : undefined);
  };

  const allVisible = options.map((o) => o.label);
  const selectAll = () => {
    const set = new Set([...selected, ...allVisible]);
    column.setFilterValue(Array.from(set));
  };
  const clearAll = () => {
    if (q) {
      const keep = selected.filter((s) => !allVisible.includes(s));
      column.setFilterValue(keep.length ? keep : undefined);
    } else {
      column.setFilterValue(undefined);
    }
  };

  return (
    <div className={styles.excelFilter} onClick={(e) => e.stopPropagation()}>
      <button type="button" className={styles.excelFilterButton} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {selected.length ? `(${selected.length})` : 'Filtrar'}
        <span className={styles.excelCaret}>▾</span>
      </button>
      {open && (
        <div className={styles.excelPopover}>
          <div className={styles.excelSearchRow}>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={meta.filterPlaceholder ?? 'Buscar opción...'}
              className={styles.excelSearch}
            />
          </div>
          <div className={styles.excelActions}>
            <button type="button" onClick={selectAll} className={styles.excelActionBtn}>Seleccionar todo</button>
            <button type="button" onClick={clearAll} className={styles.excelActionBtn}>Limpiar</button>
          </div>
          <div className={styles.excelOptions}>
            {options.map(({ label, count }) => (
              <label key={label} className={styles.excelOption}>
                <input type="checkbox" checked={selected.includes(label)} onChange={() => toggle(label)} />
                <span className={styles.excelOptionText}>{label}</span>
                <span className={styles.excelCount}>{count}</span>
              </label>
            ))}
            {!options.length && <div className={styles.excelEmpty}>Sin opciones</div>}
          </div>
        </div>
      )}
    </div>
  );
}
