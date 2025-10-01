import React, { useMemo, useRef, useState } from "react";
import { ReactTabulator } from "react-tabulator";
import "tabulator-tables/dist/css/tabulator.min.css";
import "react-tabulator/lib/styles.css"; // estilos del wrapper
import { Search, Download, Rows, Rows4 } from "lucide-react";

type Caso = {
  id: number;
  radicado: string;
  estado: "Nuevo" | "Proceso" | "Cerrado" | string;
  valor: number;
};

type Props = {
  data: Caso[];
  className?: string;
  height?: string | number; // ej. "70vh"
  pageSize?: number;
};

export default function CasesTabulator({
  data,
  className,
  height = "70vh",
  pageSize = 20,
}: Props) {
  const tableRef = useRef<any>(null);
  const [globalQ, setGlobalQ] = useState("");
  const [compact, setCompact] = useState(true);

  // columnas
  const columns = useMemo(
    () => [
      {
        titleFormatter: "rowSelection",
        formatter: "rowSelection",
        hozAlign: "center",
        headerSort: false,
        width: 36,
      },
      {
        title: "Radicado",
        field: "radicado",
        headerFilter: "input",
        headerSortTristate: true,
        minWidth: 160,
      },
      {
        title: "Estado",
        field: "estado",
        headerFilter: "select",
        headerFilterParams: {
          values: { "": "Todos", Nuevo: "Nuevo", Proceso: "Proceso", Cerrado: "Cerrado" },
        },
        editor: "select",
        editorParams: { values: ["Nuevo", "Proceso", "Cerrado"] },
        formatter: (cell: any) => {
          const v = String(cell.getValue() ?? "");
          const tone =
            v === "Nuevo"
              ? "bg-blue-50 text-blue-700 ring-blue-200"
              : v === "Proceso"
              ? "bg-amber-50 text-amber-700 ring-amber-200"
              : v === "Cerrado"
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : "bg-slate-100 text-slate-700 ring-slate-200";
          return `<span class="inline-flex items-center rounded-full px-2 py-[2px] text-xs font-medium ring-1 ring-inset ${tone}">${v}</span>`;
        },
        hozAlign: "left",
        minWidth: 140,
      },
      {
        title: "Valor",
        field: "valor",
        hozAlign: "right",
        headerHozAlign: "right",
        headerFilter: "number",
        editor: "number",
        formatter: "money",
        formatterParams: {
          decimal: ",",
          thousand: ".",
          symbol: "$ ",
          precision: 0,
        },
        minWidth: 140,
      },
    ],
    []
  );

  // opciones tabulator
  const options: any = {
    layout: "fitDataStretch",
    reactiveData: true,
    columnHeaderVertAlign: "bottom",
    headerSortTristate: true,
    resizableColumns: true,
    selectable: true,
    pagination: "local",
    paginationSize: pageSize,
    paginationSizeSelector: [10, 20, 50, 100],
    clipboard: true,
    // Zebra + hover
    rowFormatter: (row: any) => {
      const el = row.getElement();
      el.classList.add("tab-row");
    },
    // Accesibilidad
    ariaTitle: "Tabla de casos",
  };

  // búsqueda global (simple contiene en campos clave)
  const applyGlobalFilter = () => {
    const table = tableRef.current?.table;
    if (!table) return;

    if (!globalQ) {
      table.clearFilter(true);
      return;
    }

    const q = globalQ.toLowerCase();
    table.setFilter((data: Caso) => {
      const hay =
        (data.radicado || "").toLowerCase().includes(q) ||
        (data.estado || "").toLowerCase().includes(q) ||
        String(data.valor ?? "").includes(q);
      return hay;
    });
  };

  const clearAll = () => {
    setGlobalQ("");
    const table = tableRef.current?.table;
    if (!table) return;
    table.clearFilter(true);
    table.clearHeaderFilter();
  };

  const downloadCSV = () => {
    tableRef.current?.table?.download("csv", "casos.csv");
  };

  return (
    <div
      className={[
        "w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg",
        className || "",
      ].join(" ")}
    >
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100/80 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={globalQ}
              onChange={(e) => setGlobalQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyGlobalFilter()}
              placeholder="Buscar en toda la tabla…"
              className="w-64 rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <button
            type="button"
            onClick={applyGlobalFilter}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Buscar
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCompact(false)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              !compact
                ? "border-slate-300 bg-white text-slate-900 shadow-sm"
                : "border-transparent bg-transparent text-slate-600 hover:text-slate-900"
            }`}
            title="Densidad cómoda"
          >
            <Rows className="h-4 w-4" />
            Cómodo
          </button>
          <button
            type="button"
            onClick={() => setCompact(true)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              compact
                ? "border-slate-300 bg-white text-slate-900 shadow-sm"
                : "border-transparent bg-transparent text-slate-600 hover:text-slate-900"
            }`}
            title="Densidad compacta"
          >
            <Rows4 className="h-4 w-4" />
            Compacto
          </button>

          <div className="h-6 w-px bg-slate-300 mx-1" />

          <button
            type="button"
            onClick={downloadCSV}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            title="Exportar CSV"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className={`tabulator-wrapper ${compact ? "is-compact" : "is-comfy"}`} style={{ height }}>
        <ReactTabulator
          ref={tableRef}
          data={data}
          columns={columns as any}
          options={options}
          className="custom-tabulator"
        />
      </div>
    </div>
  );
}
