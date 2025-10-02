import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import styles from './AdminDashboard.module.css';
import { AdminDashboard as AdminAssignator } from './Admin_Asignator';
import { DataTable_2 } from '../ui/DataTable/DataTable_2';
import { adminService, type Caso } from '../../services/adminService';
import type { ColumnDef } from '@tanstack/react-table';

type AdminRecord = Caso & {
  // Campos derivados / mapeados para UI (estado y prioridad legibles si luego se implementa catálogo)
};

export const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState<'assign' | 'data' | null>(null);
  
  const [tableData, setTableData] = useState<AdminRecord[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [fechaFiltro, setFechaFiltro] = useState<string>(() => new Date().toISOString().split('T')[0]);
  // Eliminado HUD de progreso: ya no se guarda estado de progreso para UI
  const [pageIndex, setPageIndex] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>( 'idle');
  const [uploadMessage, setUploadMessage] = useState<string>('');

  const startProgressiveLoad = useCallback(() => {
    if (!fechaFiltro) return;
    // Cancelar previa
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
  setTableData([]);
  setPageIndex(0); // reiniciar a primera página sólo al nuevo fetch
  setIsInitialLoading(true);

    adminService.progressiveLoadCasos({
      dateFrom: fechaFiltro,
      pageSize: 2000,
      order: 'DESC',
      signal: controller.signal,
      onChunk: (chunk, info) => {
  setTableData(prev => prev.concat(chunk)); // mantiene orden y no resetea manualmente pageIndex
        if (info.page === 1) setIsInitialLoading(false);
      }
    }).catch(err => {
      if (err?.name !== 'AbortError') {
        console.error('Error carga progresiva:', err);
      }
      setIsInitialLoading(false);
    });
  }, [fechaFiltro]);

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
      // Refrescar datos después de una pequeña pausa para que backend termine ingesta
      setTimeout(() => startProgressiveLoad(), 600);
    } catch (e: any) {
      setUploadStatus('error');
      setUploadMessage(e?.message || 'Error al subir');
    }
  };

  // ← Definición de columnas con las editables marcadas
  const adminColumns = useMemo<ColumnDef<AdminRecord>[]>(
    () => [
      // { accessorKey: 'id', header: 'ID', enableColumnFilter: false },
      { accessorKey: 'radicado', header: 'Radicado', meta: { filterType: 'text' } },
      { accessorKey: 'ips_nit', header: 'IPS NIT', meta: { filterType: 'text' } },
      { accessorKey: 'ips_nombre', header: 'IPS Nombre', meta: { filterType: 'text' } },
      { accessorKey: 'factura', header: 'Factura', meta: { filterType: 'text' } },
      {
        accessorKey: 'valor_factura',
        header: 'Valor Factura',
        cell: ({ row }) => {
          const v = row.getValue('valor_factura') as number | null;
          if (v == null) return '';
          return `$${v.toLocaleString('es-CO')}`;
        },
        meta: { editable: true },
      },
      { accessorKey: 'ruta_imagen', header: 'Ruta Imagen', meta: { filterType: 'text' } },
      { accessorKey: 'caso', header: 'Caso', meta: { filterType: 'text', editable: true } }, // ← Columna editable
      {
        accessorKey: 'fecha_asignacion',
        header: 'Fecha Asignación',
        cell: ({ row }) => {
          const v = row.getValue('fecha_asignacion') as string | null;
          return v ? new Date(v).toLocaleDateString('es-CO') : '';
        }
      },
      { accessorKey: 'total_servicios', header: 'Total Servicios' },
      { accessorKey: 'lider', header: 'Líder', meta: { filterType: 'text', editable: true } }, // ← Columna editable
      { accessorKey: 'usuario_asignacion', header: 'Usuario Asignación', meta: { filterType: 'text' } },
      { accessorKey: 'total_servicios_usuario', header: 'Total Servicios Usuario' },
      { accessorKey: 'estado_id', header: 'Estado ID', meta: { filterType: 'text', editable: true } },
      { accessorKey: 'prioridad', header: 'Prioridad', meta: { filterType: 'text', editable: true } },
    ], 
    []
  );

  // ← Función para manejar el guardado de cambios
  const handleSaveChanges = async (changes: Array<{
    identifier: string | number;
    columnId: string;
    newValue: any;
  }>) => {
    try {
      // Llamar al servicio para cada cambio
      for (const change of changes) {
        await adminService.updateRecord(
          change.identifier as string,
          change.columnId,
          change.newValue
        );
      }

      // Actualizar los datos locales después de guardar exitosamente
      setTableData(prevData => {
        const newData = [...prevData];
        changes.forEach(change => {
          const index = newData.findIndex(item => item.radicado === change.identifier);
          if (index !== -1) {
            newData[index] = {
              ...newData[index],
              [change.columnId]: change.newValue
            };
          }
        });
        return newData;
      });

      // Aquí podrías mostrar un mensaje de éxito
      console.log('Cambios guardados exitosamente');
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
      throw error; // Re-lanzar el error para que el componente DataTable_2 lo maneje
    }
  };

  if (activeSection === 'assign') {
    return (
      <div className={styles.dashboard}>
        <button 
          onClick={() => setActiveSection(null)}
          className={styles.backButton}
        >
          ← Volver
        </button>
        <AdminAssignator />
      </div>
    );
  }

  if (activeSection === 'data') {
    return (
      <div className={styles.dashboard}>
        <button 
          onClick={() => setActiveSection(null)}
          className={styles.backButton}
        >
          ← Volver
        </button>
        
        <div className={styles.uploadSection}>
          <div className={styles.uploadCard}>
            <h3>Cargar Cuentas Medicas</h3>
            <input 
              type="file" 
              accept=".xlsx,.xls"
              className={styles.fileInput}
              id="excelFile"
              onChange={handleFileSelect}
            />
            <label htmlFor="excelFile" className={styles.fileLabel}>
              Seleccionar archivo
            </label>
            {fileToUpload && (
              <div style={{marginTop:'0.75rem', fontSize:'0.7rem', color:'#374151'}}>Seleccionado: {fileToUpload.name}</div>
            )}
            <div style={{marginTop:'0.75rem', display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!fileToUpload || uploadStatus==='uploading'}
                style={{
                  padding:'0.55rem 1.2rem',
                  background: uploadStatus==='success' ? '#10b981' : '#ed1b22',
                  border:'none',
                  color:'#fff',
                  borderRadius:8,
                  fontSize:'0.75rem',
                  fontWeight:600,
                  cursor: !fileToUpload || uploadStatus==='uploading' ? 'not-allowed' : 'pointer',
                  opacity: !fileToUpload || uploadStatus==='uploading' ? 0.65 : 1,
                  transition:'background .25s'
                }}
              >
                {uploadStatus==='uploading' ? 'Subiendo...' : uploadStatus==='success' ? 'Subido' : 'Subir'}
              </button>
              {uploadStatus==='error' && (
                <button
                  type="button"
                  onClick={handleUpload}
                  style={{padding:'0.5rem 0.9rem',background:'#f59e0b',border:'none',color:'#fff',borderRadius:8,fontSize:'0.7rem',fontWeight:600,cursor:'pointer'}}
                >Reintentar</button>
              )}
              {fileToUpload && uploadStatus!=='uploading' && (
                <button
                  type="button"
                  onClick={()=>{ setFileToUpload(null); setUploadStatus('idle'); setUploadMessage(''); const input = document.getElementById('excelFile') as HTMLInputElement| null; if (input) input.value=''; }}
                  style={{padding:'0.5rem 0.9rem',background:'#6b7280',border:'none',color:'#fff',borderRadius:8,fontSize:'0.7rem',fontWeight:600,cursor:'pointer'}}
                >Limpiar</button>
              )}
            </div>
            {uploadStatus !== 'idle' && (
              <div style={{marginTop:'0.5rem', fontSize:'0.65rem', fontWeight:500, color: uploadStatus==='error' ? '#dc2626' : uploadStatus==='success' ? '#059669' : '#374151'}}>
                {uploadMessage}
              </div>
            )}
          </div>
        </div>

        <div className={styles.tableContainer + ' ' + styles.loadingWrapper}>
          <div style={{display:'flex',gap:'1rem',padding:'0.75rem 1rem',alignItems:'center'}}>
            <label style={{fontSize:'0.8rem',fontWeight:600}}>Fecha:</label>
            <input type="date" value={fechaFiltro} onChange={(e)=>setFechaFiltro(e.target.value)} style={{padding:'0.35rem 0.5rem',border:'1px solid #d1d5db',borderRadius:6}} />
            <button onClick={startProgressiveLoad} style={{padding:'0.4rem 0.9rem',borderRadius:6,border:'1px solid #ed1b22',background:'#ed1b22',color:'#fff',fontSize:'0.75rem',fontWeight:600,cursor:'pointer'}}>Refrescar</button>
            {/* Eliminado HUD de progreso para hacerlo transparente al usuario */}
          </div>
          {isInitialLoading && <div className={styles.loadingOverlay} aria-label="Cargando casos" />}
          <DataTable_2
            data={tableData}
            columns={adminColumns}
            pageSize={10}
            identifierKey="radicado" // ← Usar 'radicado' como identificador único
            onSaveChanges={handleSaveChanges} // ← Pasar la función para guardar cambios
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
        <section 
          className={styles.section}
          onClick={() => setActiveSection('assign')}
        >
          <h2>Asignar Usuarios</h2>
        </section>
        <section 
          className={styles.section}
          onClick={() => setActiveSection('data')}
        >
          <h2>Cargar Datos</h2>
        </section>
      </div>
    </div>
  );
}