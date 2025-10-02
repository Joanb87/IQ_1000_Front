import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [fechaFiltro, setFechaFiltro] = useState<string>('');

  const loadCasos = useCallback(async () => {
    setIsLoading(true);
    try {
  const casos = await adminService.listarCasos(fechaFiltro || undefined);
      setTableData(casos);
    } catch (e) {
      console.error('Error cargando casos:', e);
      setTableData([]);
    } finally {
      setIsLoading(false);
    }
  }, [fechaFiltro]);

  useEffect(() => {
    loadCasos();
  }, [loadCasos]);

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
            />
            <label htmlFor="excelFile" className={styles.fileLabel}>
              Seleccionar archivo
            </label>
          </div>
        </div>

        <div className={styles.tableContainer + ' ' + styles.loadingWrapper}>
          <div style={{display:'flex',gap:'1rem',padding:'0.75rem 1rem',alignItems:'center'}}>
            <label style={{fontSize:'0.8rem',fontWeight:600}}>Fecha:</label>
            <input type="date" value={fechaFiltro} onChange={(e)=>setFechaFiltro(e.target.value)} style={{padding:'0.35rem 0.5rem',border:'1px solid #d1d5db',borderRadius:6}} />
            <button onClick={loadCasos} style={{padding:'0.4rem 0.9rem',borderRadius:6,border:'1px solid #ed1b22',background:'#ed1b22',color:'#fff',fontSize:'0.75rem',fontWeight:600,cursor:'pointer'}}>Refrescar</button>
          </div>
          {isLoading && <div className={styles.loadingOverlay} aria-label="Cargando casos" />}
          <DataTable_2
            data={tableData}
            columns={adminColumns}
            pageSize={10}
            identifierKey="radicado" // ← Usar 'radicado' como identificador único
            onSaveChanges={handleSaveChanges} // ← Pasar la función para guardar cambios
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