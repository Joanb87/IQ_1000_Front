import { useEffect, useRef, useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  flexRender,
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
  editable?: boolean;

  /** Tamaños opcionales por columna */
  minWidth?: number | string; // ej: 140 o '12rem' o '20ch'
  width?: number | string;    // ej: 200 o '20ch'
  maxWidth?: number | string; // ej: 360 o '30rem'
};

export interface DataTableProps<T extends Record<string, any>> {
  data: T[];
  columns: ColumnDef<T, any>[];
  pageSize?: number;
  className?: string;
  onRowClick?: (row: T) => void;
  identifierKey?: string; // ej: 'radicado' o 'id'
  onSaveChanges?: (changes: Array<{
    identifier: string | number;
    columnId: string;
    newValue: any;
  }>) => Promise<void>;
  externalPageIndex?: number; // Control externo opcional
  onPageChange?: (pageIndex: number) => void; // Notificación externa
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
  onRowClick,
  identifierKey = 'id',
  onSaveChanges,
  externalPageIndex,
  onPageChange,
}: DataTableProps<T>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Ediciones pendientes
  const [editedCells, setEditedCells] = useState<Map<string, any>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

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
    state: { columnFilters, sorting, pagination: externalPageIndex != null ? { pageIndex: externalPageIndex, pageSize } : undefined },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: { pagination: { pageSize } },
    onPaginationChange: updater => {
      if (onPageChange) {
        const next = typeof updater === 'function' ? updater({ pageIndex: externalPageIndex || 0, pageSize }) : updater;
        if (typeof next === 'object' && 'pageIndex' in next) {
          onPageChange(next.pageIndex as number);
        }
      }
    },
    // Evita que tanstack resetee la página a 0 cuando cambia data
    autoResetPageIndex: false,
  });

  useEffect(() => {
    if (table.getState().pagination.pageSize !== pageSize) {
      table.setPageSize(pageSize);
    }
  }, [pageSize, table]);

  // Valor mostrado (editado u original)
  const getCellValue = (rowId: string, columnId: string, originalValue: any) => {
    const key = `${rowId}-${columnId}`;
    return editedCells.has(key) ? editedCells.get(key) : originalValue;
  };

  const updateCellValue = (rowId: string, columnId: string, newValue: any) => {
    const key = `${rowId}-${columnId}`;
    setEditedCells(prev => {
      const next = new Map(prev);
      next.set(key, newValue);
      return next;
    });
  };

  const isCellEdited = (rowId: string, columnId: string) => {
    const key = `${rowId}-${columnId}`;
    return editedCells.has(key);
  };

  const handleSaveChanges = async () => {
    if (!onSaveChanges || editedCells.size === 0) return;

    setIsSaving(true);
    try {
      const changes = Array.from(editedCells.entries()).map(([key, newValue]) => {
        const [rowId, columnId] = key.split('-');
        const row = data.find((item: any) => String(item[identifierKey]) === rowId);
        const identifier = row ? row[identifierKey] : rowId;

        return { identifier, columnId, newValue };
      });

      await onSaveChanges(changes);
      setEditedCells(new Map()); // limpiar
    } catch (error) {
      console.error('Error al guardar cambios:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelChanges = () => {
    setEditedCells(new Map());
  };

  const rows = table.getRowModel().rows;
  const pad = Math.max(0, table.getState().pagination.pageSize - rows.length);
  const colSpan = table.getVisibleLeafColumns().length;

  return (
    <div className={`${styles.tableContainer} ${className}`}>
      {/* Barra de acciones para cambios pendientes */}
      {editedCells.size > 0 && (
        <div className={styles.actionBar}>
          <span className={styles.changesCount}>
            {editedCells.size} cambio{editedCells.size !== 1 ? 's' : ''} pendiente{editedCells.size !== 1 ? 's' : ''}
          </span>
          <div className={styles.actionButtons}>
            <button
              className={styles.cancelButton}
              onClick={handleCancelChanges}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              className={styles.saveButton}
              onClick={handleSaveChanges}
              disabled={isSaving}
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          {/* ⬇️ Tamaños por columna */}
          <colgroup>
            {table.getVisibleLeafColumns().map((col) => {
              const meta = col.columnDef?.meta as ColumnMeta | undefined;
              const style: React.CSSProperties = {
                minWidth: meta?.minWidth ?? 140, // fallback si no definen meta
                width: meta?.width,
                maxWidth: meta?.maxWidth,
              };
              return <col key={col.id} style={style} />;
            })}
          </colgroup>

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
                        title={String(header.column.columnDef.header ?? '')}
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
            {rows.map((row) => {
              const rowIdentifier = String((row.original as any)[identifierKey]);

              return (
                <tr
                  key={row.id}
                  className={`${styles.tr} ${onRowClick ? styles.clickableRow : ''}`}
                >
                  {row.getVisibleCells().map((cell) => {
                    const columnMeta = (cell.column.columnDef as any).meta as ColumnMeta | undefined;
                    const isEditable = columnMeta?.editable ?? false;
                    const columnId = cell.column.id;
                    const originalValue = cell.getValue();
                    const currentValue = getCellValue(rowIdentifier, columnId, originalValue);
                    const isEdited = isCellEdited(rowIdentifier, columnId);

                    const titleText =
                      currentValue == null
                        ? ''
                        : typeof currentValue === 'string'
                        ? currentValue
                        : String(currentValue);

                    return (
                      <td
                        key={cell.id}
                        className={`${styles.td} ${isEdited ? styles.editedCell : ''}`}
                        title={titleText} // tooltip con contenido completo
                        onClick={() => {
                          if (!isEditable && onRowClick) onRowClick(row.original);
                        }}
                      >
                        {isEditable ? (
                          <input
                            type="text"
                            className={styles.editInput}
                            value={currentValue ?? ''}
                            onChange={(e) => updateCellValue(rowIdentifier, columnId, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          flexRender(cell.column.columnDef.cell, cell.getContext())
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

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

  useEffect(() => {
    if (open && rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect();
      setPopoverPos({ top: rect.bottom + 6, left: rect.left });
    }
  }, [open]);

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
          <div
            className={styles.popover}
            style={{ top: popoverPos.top, left: popoverPos.left }} // posiciona el popover
          >
            <div className={styles.popoverHeader}>
              <button
                type="button"
                className={styles.smallBtn}
                onClick={() => column.setFilterValue(undefined)}
              >
                Limpiar
              </button>
              <button
                type="button"
                className={styles.smallBtn}
                onClick={() => setOpen(false)}
              >
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
