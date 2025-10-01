import React from "react";
import type {ColumnDef,ColumnFiltersState,SortingState,RowSelectionState,} from "@tanstack/react-table";
import {flexRender,getCoreRowModel,getPaginationRowModel,getSortedRowModel,getFilteredRowModel,useReactTable,} from "@tanstack/react-table";
import { ArrowUpDown, ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";

// ===== Tipos =====
export type FetchParams = {
  page: number;
  pageSize: number;
  q?: string;
  sorting?: { id: string; desc: boolean }[];
  filters?: { id: string; value: unknown }[];
};

export type ServerResponse<T> = {
  rows: T[];
  total: number;
};

export type SmartDataTableProps<TData> = {
  columns: ColumnDef<TData, any>[];
  data?: TData[];
  endpoint?: string;
  getData?: (params: FetchParams) => Promise<ServerResponse<TData>>;
  onBulkAction?: (selected: TData[]) => Promise<void> | void;
  initialPageSize?: number;
  initialSorting?: SortingState;
  initialColumnFilters?: ColumnFiltersState;
  className?: string;
};

// ====== Filtro por columna ======
function ColumnTextFilter({ column }: { column: any }) {
  const v = (column.getFilterValue() as string) ?? "";
  return (
    <input
      className="mt-2 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs placeholder-slate-400 outline-none transition-colors focus:border-slate-400 focus:ring-0"
      value={v}
      onChange={(e) => column.setFilterValue(e.target.value)}
      placeholder="Filtrar..."
    />
  );
}

// ====== Tabla principal ======
export default function SmartDataTable<TData>(props: SmartDataTableProps<TData>) {
  const {
    columns,
    data: localData,
    endpoint,
    getData,
    onBulkAction,
    initialPageSize = 10,
    initialSorting = [],
    initialColumnFilters = [],
    className,
  } = props;

  const isServer = !!(endpoint || getData);

  // Estado de tabla
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(initialColumnFilters);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: initialPageSize });

  // Datos
  const [rows, setRows] = React.useState<TData[]>(localData ?? []);
  const [rowCount, setRowCount] = React.useState<number>(localData?.length ?? 0);
  const [loading, setLoading] = React.useState(false);

  // Fetch en modo servidor
  React.useEffect(() => {
    if (!isServer) return;

    const fetcher = async () => {
      setLoading(true);
      try {
        const params: FetchParams = {
          page: pagination.pageIndex + 1,
          pageSize: pagination.pageSize,
          sorting,
          filters: columnFilters.map((f) => ({ id: f.id, value: f.value })),
        };

        if (getData) {
          const { rows, total } = await getData(params);
          setRows(rows);
          setRowCount(total);
        } else if (endpoint) {
          const url = new URL(endpoint, window.location.origin);
          url.searchParams.set("page", String(params.page));
          url.searchParams.set("pageSize", String(params.pageSize));
          params.sorting?.forEach((s) => {
            url.searchParams.append("sort", s.id);
            url.searchParams.append("order", s.desc ? "desc" : "asc");
          });
          params.filters?.forEach((f) => {
            url.searchParams.append(`filter_${f.id}`, String(f.value ?? ""));
          });

          const res = await fetch(url.toString());
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json: ServerResponse<TData> = await res.json();
          setRows(json.rows);
          setRowCount(json.total ?? json.rows.length);
        }
      } catch (e) {
        console.error("SmartDataTable fetch error", e);
      } finally {
        setLoading(false);
      }
    };

    fetcher();
  }, [isServer, endpoint, getData, pagination.pageIndex, pagination.pageSize, JSON.stringify(sorting), JSON.stringify(columnFilters)]);

  // Configurar la tabla
  const table = useReactTable({
    data: isServer ? rows : localData ?? [],
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      pagination,
    },
    enableMultiSort: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: isServer,
    manualSorting: isServer,
    manualFiltering: isServer,
    pageCount: isServer ? Math.max(1, Math.ceil(rowCount / Math.max(1, pagination.pageSize))) : undefined,
  });

  return (
    <div className={"w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md " + (className ?? "")}>      
      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} className="border-b border-slate-200 px-6 py-4 text-left">
                    {header.isPlaceholder ? null : (
                      <div className="space-y-1">
                        <button
                          className="group flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                            {{
                              asc: <ArrowUp className="h-4 w-4 text-blue-600" />,
                              desc: <ArrowDown className="h-4 w-4 text-blue-600" />,
                            }[header.column.getIsSorted() as string] ?? (
                              <ArrowUpDown className="h-4 w-4 text-slate-400" />
                            )}
                          </span>
                        </button>
                        {header.column.getCanFilter() && (
                          <ColumnTextFilter column={header.column} />
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={table.getAllLeafColumns().length} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    <span className="ml-3 text-sm text-slate-500">Cargando...</span>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, index) => (
                <tr key={row.id} className={`transition-colors hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 text-sm text-slate-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={table.getAllLeafColumns().length} className="px-6 py-12 text-center">
                  <div className="text-slate-500">
                    <div className="text-lg font-medium">Sin resultados</div>
                    <div className="text-sm">No se encontraron datos que mostrar</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600">
            {isServer ? (
              <>Total: <span className="font-medium text-slate-900">{rowCount.toLocaleString()}</span> registros</>
            ) : (
              <>Mostrando <span className="font-medium text-slate-900">{table.getPrePaginationRowModel().rows.length}</span> registros</>
            )}
          </div>
          <select
            className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[10, 20, 50, 100].map((ps) => (
              <option key={ps} value={ps}>
                {ps} por página
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">
            Página <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span> de{" "}
            <span className="font-medium">{table.getPageCount()}</span>
          </span>
          <div className="flex gap-1">
            <button
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <button
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
