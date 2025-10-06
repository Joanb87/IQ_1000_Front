import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import styles from './AdminDashboard.module.css';
import { AdminDashboard as AdminAssignator } from './Admin_Asignator';
import { DataTable_2 } from '../ui/DataTable/DataTable_2';
import { adminService, type Caso } from '../../services/adminService';
import { estadosService, type Estado } from '../../services/estadosService';
import { usuariosService, type Usuario } from '../../services/usuariosService';
import type { ColumnDef } from '@tanstack/react-table';

type AdminRecord = Caso & {
  // Campos derivados / mapeados para UI (estado y prioridad legibles si luego se implementa catálogo)
};

export const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState<'assign' | 'data' | null>(null);
  const [tableData, setTableData] = useState<AdminRecord[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [fechaFiltro, setFechaFiltro] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [pageIndex, setPageIndex] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const [estados, setEstados] = useState<Estado[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  // Cargar catálogo de estados una sola vez
  useEffect(() => {
    (async () => {
      try {
        const list = await estadosService.listar();
        setEstados(list);
      } catch { /* ignore */ }
      try {
        const us = await usuariosService.listar();
        setUsuarios(us);
      } catch { /* ignore */ }
    })();
  }, []);

  const estadoIdToNombre = useMemo(() => Object.fromEntries(estados.map(e => [e.id, e.nombre])), [estados]);
  const estadoNombreToId = useMemo(() => Object.fromEntries(estados.map(e => [e.nombre, e.id])), [estados]);

  const startProgressiveLoad = useCallback(() => {
    if (!fechaFiltro) return;
    // Cancelar previa
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setTableData([]);
    setPageIndex(0);
    setIsInitialLoading(true);

    adminService.progressiveLoadCasos({
      dateFrom: fechaFiltro,
      pageSize: 2000,
      order: 'DESC',
      signal: controller.signal,
      onChunk: (chunk, info) => {
        setTableData(prev => {
          // Optimización: si es la primera página, reemplazar completamente
          if (info.page === 1) return chunk;
          
          // Para páginas subsecuentes, deduplicar eficientemente
          if (chunk.length === 0) return prev;
          const seen = new Set(prev.map(it => it.radicado));
          const newItems = chunk.filter(item => !seen.has(item.radicado));
          return newItems.length > 0 ? [...prev, ...newItems] : prev;
        });
        if (info.page === 1) setIsInitialLoading(false);
      }
    }).catch(err => {
      if (err?.name !== 'AbortError') {
        console.error('Error carga progresiva:', err);
      }
      setIsInitialLoading(false);
    });
  }, [fechaFiltro]);

  // Cargar datos al montar y cuando cambie la fecha
  useEffect(() => {
    startProgressiveLoad();
    return () => abortRef.current?.abort();
  }, [startProgressiveLoad]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFileToUpload(f);
    setUploadStatus('idle');
    setUploadMessage(f ? f.name : '');
  };

  const handleUpload = async () => {
    if (!fileToUpload) return;
    setUploadStatus('uploading');
    setUploadMessage('Subiendo...');
    try {
      await adminService.uploadExcel(fileToUpload);
      setUploadStatus('success');
      setUploadMessage('Archivo procesado correctamente');
      setTimeout(() => startProgressiveLoad(), 600);
    } catch (e: any) {
      setUploadStatus('error');
      setUploadMessage(e?.message || 'Error al subir');
    }
  };

  const adminColumns = useMemo<ColumnDef<AdminRecord>[]>(
    () => [
      { accessorKey: 'radicado', header: 'Radicado', meta: { filterType: 'text' } },
      { accessorKey: 'ips_nit', header: 'IPS NIT', meta: { filterType: 'none' } },
      { accessorKey: 'ips_nombre', header: 'IPS Nombre', meta: { filterType: 'multiselect' } },
      { accessorKey: 'factura', header: 'Factura', meta: { filterType: 'none' } },
      { accessorKey: 'valor_factura',
        header: 'Valor Factura',
        cell: ({ row }) => {
          const v = row.getValue('valor_factura') as number | null;
          if (v == null) return '';
          return `$${v.toLocaleString('es-CO')}`;
        },
        meta: { editable: true, filterType: 'none'  },
      },
      { accessorKey: 'ruta_imagen', header: 'Ruta Imagen', meta: { filterType: 'multiselect' } },
      { accessorKey: 'caso', header: 'Caso', meta: { filterType: 'none', editable: false } },
      {
        accessorKey: 'fecha_asignacion',
        header: 'Fecha Asignación',
        cell: ({ row }) => {
          const v = row.getValue('fecha_asignacion') as string | null;
          return v ? new Date(v).toLocaleDateString('es-CO') : '';
        },meta: { filterType: 'none' }
      },
      { accessorKey: 'total_servicios', header: 'Total Servicios',meta: { filterType: 'none' } },
      {
        accessorKey: 'lider',
        header: 'Líder',
        cell: ({ row }) => {
          const v = row.getValue('lider') as string | null;
          if (!v) return '';
          const u = usuarios.find(x => x.correo === v);
          // Mostrar solo nombre; si no existe o está vacío, mostrar correo
          return (u?.nombre?.trim() || v);
        },
        meta: {
          filterType: 'multiselect',
          options: usuarios.map(u => u.correo),
          // Mostrar en el filtro el nombre con correo
          filterOptions: usuarios.map(u => ({
            value: u.correo,
            label: u.nombre ? `${u.nombre}` : u.correo
          })),
          editable: true,
          editType: 'select',
          editOptions: usuarios.map(u => ({
            value: u.correo,
            // En edición mostrar solo el nombre; si no hay, usar el correo
            label: (u.nombre?.trim() || u.correo)
          }))
        }
      },
      {
        accessorKey: 'usuario_asignacion',
        header: 'Usuario Asignación',
        cell: ({ row }) => {
          const v = row.getValue('usuario_asignacion') as string | null;
          if (!v) return '';
          const u = usuarios.find(x => x.correo === v);
          // Mostrar solo nombre; si no existe o está vacío, mostrar correo
          return (u?.nombre?.trim() || v);
        },
        meta: {
          filterType: 'multiselect',
          options: usuarios.map(u => u.correo),
          filterOptions: usuarios.map(u => ({
            value: u.correo,
            label: u.nombre ? `${u.nombre}` : u.correo
          })),
          editable: false
        }
      },
      { accessorKey: 'total_servicios_usuario', header: 'Total Servicios Usuario',meta: { filterType: 'none' }},
      {
        accessorKey: 'estado_id',
        header: 'Estado',
        cell: ({ row }) => {
          const id = row.getValue('estado_id') as number | null;
          return id == null ? '' : (estadoIdToNombre[id] || id);
        },
        meta: {
          filterType: 'select',
          options: estados.map(e => String(e.id)),
          filterOptions: estados.map(e => ({ value: String(e.id), label: e.nombre })),
          editable: true,
          editType: 'select',
          editOptions: estados.map(e => ({ value: e.id, label: e.nombre }))
        }
      },
      { accessorKey: 'prioridad', header: 'Prioridad', meta: { filterType: 'select', editable: true } },
    ],
    [estados, estadoIdToNombre, usuarios]
  );

  const handleSaveChanges = async (changes: Array<{
    identifier: string | number;
    columnId: string;
    newValue: any;
  }>) => {
    try {
      for (const change of changes) {
        let valueToSend = change.newValue;
        if (change.columnId === 'estado_id') {
          if (typeof valueToSend === 'string' && /\D/.test(valueToSend)) {
            const maybeId = estadoNombreToId[valueToSend];
            if (maybeId) valueToSend = maybeId;
          } else if (typeof valueToSend === 'string') {
            const parsed = parseInt(valueToSend, 10);
            if (!isNaN(parsed)) valueToSend = parsed;
          }
        }
        await adminService.updateRecord(
          change.identifier as string,
          change.columnId,
          valueToSend
        );
      }

      setTableData(prevData => {
        const newData = [...prevData];
        changes.forEach(change => {
          const index = newData.findIndex(item => item.radicado === change.identifier);
          if (index !== -1) {
            newData[index] = {
              ...newData[index],
              [change.columnId]: change.columnId === 'estado_id'
                ? (typeof change.newValue === 'string' && /\D/.test(change.newValue)
                  ? estadoNombreToId[change.newValue] ?? change.newValue
                  : change.newValue)
                : change.newValue
            };
          }
        });
        return newData;
      });

      console.log('Cambios guardados exitosamente');
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      throw error;
    }
  };

  if (activeSection === 'assign') {
    return (
      <div className={styles.dashboard}>
        <button onClick={() => setActiveSection(null)} className={styles.backButton}>
          ← Volver
        </button>
        <AdminAssignator />
      </div>
    );
  }

  if (activeSection === 'data') {
    return (
      <div className={styles.dashboard}>
        <button onClick={() => setActiveSection(null)} className={styles.backButton}>
          ← Volver
        </button>
        
        <div className={styles.uploadSection}>
          <div className={styles.uploadCard}>
            <div className={styles.uploadHeader}>
              <h3>Cargar Cuentas Médicas</h3>
              {uploadStatus !== 'idle' && (
                <span className={styles.uploadStatus} data-status={uploadStatus}>
                  {uploadMessage}
                </span>
              )}
            </div>
            <div className={styles.uploadControls}>
              <div className={styles.fileSelectWrapper}>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className={styles.fileInput}
                  id="excelFile"
                  onChange={handleFileSelect}
                />
                <label htmlFor="excelFile" className={styles.fileLabel}>
                  {fileToUpload ? fileToUpload.name : 'Seleccionar archivo Excel'}
                </label>
              </div>
              <div className={styles.uploadActions}>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!fileToUpload || uploadStatus==='uploading'}
                  className={styles.uploadButton}
                  data-status={uploadStatus}
                >
                  {uploadStatus==='uploading' ? 'Subiendo...' : uploadStatus==='success' ? '✓ Subido' : 'Subir'}
                </button>
                {uploadStatus==='error' && (
                  <button
                    type="button"
                    onClick={handleUpload}
                    className={styles.retryButton}
                  >
                    Reintentar
                  </button>
                )}
                {fileToUpload && uploadStatus!=='uploading' && (
                  <button
                    type="button"
                    onClick={()=>{
                      setFileToUpload(null);
                      setUploadStatus('idle');
                      setUploadMessage('');
                      const input = document.getElementById('excelFile') as HTMLInputElement| null;
                      if (input) input.value='';
                    }}
                    className={styles.clearButton}
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.tableContainer + ' ' + styles.loadingWrapper}>
          <div style={{display:'flex',gap:'1rem',padding:'0.75rem 1rem',alignItems:'center'}}>
            <label style={{fontSize:'0.8rem',fontWeight:600}}>Fecha:</label>
            <input
              type="date"
              value={fechaFiltro}
              onChange={(e)=>setFechaFiltro(e.target.value)}
              style={{padding:'0.35rem 0.5rem',border:'1px solid #d1d5db',borderRadius:6}}
            />
            <button
              onClick={startProgressiveLoad}
              style={{padding:'0.4rem 0.9rem',borderRadius:6,border:'1px solid #ed1b22',background:'#ed1b22',color:'#fff',fontSize:'0.75rem',fontWeight:600,cursor:'pointer'}}
            >
              Refrescar
            </button>
          </div>
          {isInitialLoading && <div className={styles.loadingOverlay} aria-label="Cargando casos" />}
          <DataTable_2
            data={tableData}
            columns={adminColumns}
            pageSize={10}
            identifierKey="radicado"
            onSaveChanges={handleSaveChanges}
            externalPageIndex={pageIndex}
            onPageChange={setPageIndex}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <h1>Panel Administrador</h1>
      <div className={styles.content}>
        <section className={styles.section} onClick={() => setActiveSection('assign')}>
          <h2>Asignar Usuarios</h2>
        </section>
        <section className={styles.section} onClick={() => setActiveSection('data')}>
          <h2>Cargar Datos</h2>
        </section>
      </div>
    </div>
  );
}