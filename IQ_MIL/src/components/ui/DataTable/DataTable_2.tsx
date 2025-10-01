import { useEffect, useRef, useState, useMemo } from 'react';
import {useReactTable,getCoreRowModel,getFilteredRowModel,getSortedRowModel,getPaginationRowModel,getFacetedRowModel,getFacetedUniqueValues,flexRender,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type FilterFn,
} from '@tanstack/react-table';
import styles from './DataTable_2.module.css';

type FilterType = 'text' | 'select' | 'multiselect' | 'none';

type ColumnMeta = {
  filterType?: FilterType;
  options?: Array<string | number | boolean>;
};

export interface DataTableProps<T extends Record<string, any>> {
  data: T[];
  columns: ColumnDef<T, any>[];
  /** tamaño de página fijo (si no se pasa, 10) */
  pageSize?: number;
  className?: string;
}

/* ---------- FilterFns ---------- */
const textFilterFn: FilterFn<any> = (row, columnId, value) => {
  const v = String(row.getValue(columnId) ?? '').toLowerCase();
  const needle = String(value ?? '').toLowerCase();
  return v.includes(needle);
};
const selectFilterFn: FilterFn<any> = (row, columnId, value) => {
  if (value == null || value === '') return true;
  return String(row.getValue(columnId) ?? '') === String(value);
};
const multiselectFilterFn: FilterFn<any> = (row, columnId, value) => {
  const arr = Array.isArray(value) ? value : [];
  if (arr.length === 0) return true;
  const cell = String(row.getValue(columnId) ?? '');
  return arr.includes(cell);
};

export function DataTable_2<T extends Record<string, any>>({
  data,
  columns,
  pageSize = 10,
  className = '',
}: DataTableProps<T>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const columnsWithFilters = useMemo<ColumnDef<T, any>[]>(() => {
    return columns.map((c) => {
      const meta = (c as any).meta as ColumnMeta | undefined;
      const filterType: FilterType = meta?.filterType ?? 'text';
      if ((c as any).filterFn) return c;
      switch (filterType) {
        case 'select': return { ...c, filterFn: selectFilterFn };
        case 'multiselect': return { ...c, filterFn: multiselectFilterFn };
        case 'none': return { ...c, enableColumnFilter: false };
        case 'text':
        default: return { ...c, filterFn: textFilterFn };
      }
    });
  }, [columns]);

  const table = useReactTable({
    data,
    columns: columnsWithFilters,
    state: { columnFilters, sorting },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: { pagination: { pageSize } },
  });

  // Si cambias la prop pageSize desde el padre, la sincroniza
  useEffect(() => {
    if (table.getState().pagination.pageSize !== pageSize) {
      table.setPageSize(pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize]);

  const rows = table.getRowModel().rows;
  const pad = Math.max(0, table.getState().pagination.pageSize - rows.length);
  const colSpan = table.getVisibleLeafColumns().length;

  return (
    <div className={`${styles.tableContainer} ${className}`}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className={styles.th}>
                    <div className={styles.headerContent}>
                      <div
                        className={styles.headerLabel}
                        onClick={header.column.getToggleSortingHandler()}
                        style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() && (
                          <span className={styles.sortIcon}>
                            {header.column.getIsSorted() === 'asc' ? ' ↑' : ' ↓'}
                          </span>
                        )}
                      </div>
                      {header.column.getCanFilter() && <Filter column={header.column} />}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={styles.tr}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={styles.td}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}

            {/* Relleno para mantener altura consistente */}
            {Array.from({ length: pad }).map((_, i) => (
              <tr key={`pad-${i}`} className={styles.padRow}>
                <td className={styles.padCell} colSpan={colSpan} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className={styles.paginationButton}
        >
          Anterior
        </button>

        <span className={styles.pageInfo}>
          Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </span>

        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className={styles.paginationButton}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

/* ---------- Filter component ---------- */
// function Filter({ column }: { column: any }) {
//   const columnFilterValue = column.getFilterValue();
//   const meta: ColumnMeta | undefined = column.columnDef?.meta;
//   const filterType: FilterType = meta?.filterType ?? 'text';

//   const [open, setOpen] = useState(false);
//   const rootRef = useRef<HTMLDivElement | null>(null);
//   useEffect(() => {
//     function onDocClick(e: MouseEvent) {
//       if (!rootRef.current) return;
//       if (!rootRef.current.contains(e.target as Node)) setOpen(false);
//     }
//     document.addEventListener('mousedown', onDocClick);
//     return () => document.removeEventListener('mousedown', onDocClick);
//   }, []);

/* ---------- Filter component ---------- */
function Filter({ column }: { column: any }) {
  const columnFilterValue = column.getFilterValue();
  const meta: ColumnMeta | undefined = column.columnDef?.meta;
  const filterType: FilterType = meta?.filterType ?? 'text';

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Calcular posición del popover cuando se abre
  useEffect(() => {
    if (open && rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect();
      setPopoverPos({
        top: rect.bottom + 6,
        left: rect.left,
      });
    }
  }, [open]);

  // Recalcular SIEMPRE desde faceting (encadenado)
  const map = column.getFacetedUniqueValues?.();
  const faceted = map ? Array.from(map.keys()).map((v: any) => String(v ?? '')) : [];
  const base = [...new Set(faceted)].sort((a, b) => a.localeCompare(b));
  const ordered = base.filter((x) => x !== '');
  if (base.includes('')) ordered.push('');

  const uniqueValues: string[] = meta?.options?.length
    ? (meta.options as any[]).map((v) => String(v ?? '')).filter((v) => ordered.includes(v))
    : ordered;

  if (filterType === 'none') return null;

  if (filterType === 'select') {
    return (
      <div className={styles.filterWrap}>
        <select
          className={`${styles.filterSelect} ${styles.singleSelect}`}
          value={(columnFilterValue as string) ?? ''}
          onChange={(e) => column.setFilterValue(e.target.value || undefined)}
        >
          <option value="">Todos</option>
          {uniqueValues.map((value) => (
            <option key={value || '__empty__'} value={value}>
              {value || '— vacío —'}
            </option>
          ))}
        </select>

        {(columnFilterValue ?? '') !== '' && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => column.setFilterValue(undefined)}
            title="Limpiar filtro"
          >
            ×
          </button>
        )}
      </div>
    );
  }

  if (filterType === 'multiselect') {
    const selected = (Array.isArray(columnFilterValue) ? columnFilterValue : []) as string[];
    const toggleValue = (val: string) => {
      const next = selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val];
      column.setFilterValue(next.length ? next : undefined);
    };

    return (
      <div className={styles.multiRoot} ref={rootRef}>
        <button
          type="button"
          className={styles.multiControl}
          onClick={() => setOpen((o) => !o)}
          title="Filtrar (multiselección)"
        >
          {selected.length === 0 ? (
            <span className={styles.placeholder}>Todos</span>
          ) : (
            <div className={styles.badges}>
              {selected.slice(0, 3).map((v) => (
                <span key={v} className={styles.badge}>{v}</span>
              ))}
              {selected.length > 3 && <span className={styles.moreBadge}>+{selected.length - 3}</span>}
            </div>
          )}
          <span className={styles.caret} />
        </button>

        {open && (
          <div className={styles.popover}>
            <div className={styles.popoverHeader}>
              <button type="button" className={styles.smallBtn} onClick={() => column.setFilterValue(undefined)}>
                Limpiar
              </button>
              <button type="button" className={styles.smallBtn} onClick={() => setOpen(false)}>
                Cerrar
              </button>
            </div>

            <div className={styles.optionsList}>
              {uniqueValues.map((value) => {
                const id = `${column.id}__${value || 'empty'}`;
                const checked = selected.includes(value);
                return (
                  <label key={id} className={styles.optionRow}>
                    <input
                      id={id}
                      type="checkbox"
                      className={styles.checkbox}
                      checked={checked}
                      onChange={() => toggleValue(value)}
                    />
                    <span className={styles.optionLabel}>{value || '— vacío —'}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <input
      type="text"
      className={styles.filterInput}
      value={(columnFilterValue ?? '') as string}
      onChange={(e) => column.setFilterValue(e.target.value || undefined)}
      placeholder="Filtrar..."
    />
  );
}
