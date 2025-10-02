import React, { useState, useMemo } from 'react';
import styles from './AdminDashboard.module.css';
import { AdminDashboard as AdminAssignator } from './Admin_Asignator';
import { DataTable_2 } from '../ui/DataTable/DataTable_2';
import { adminService } from '../../services/adminService';
import type { ColumnDef } from '@tanstack/react-table';

interface AdminRecord {
  id: number;
  radicado: string;
  ips_nit: string;
  ips_nombre: string;
  factura: string;
  valor_factura: number;
  ruta_imagen: string;
  caso: string;
  fecha_asignacion: string;
  total_servicios: number;
  lider: string;
  usuario_asignacion: string;
  total_servicios_usuario: number;
  estado: string;
  prioridad: string;
}

export const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState<'assign' | 'data' | null>(null);
  
  const [tableData, setTableData] = useState<AdminRecord[]>([
    { id: 1, radicado: 'RAD-001', ips_nit: '123456789', ips_nombre: 'IPS Salud', factura: 'FACT-001', valor_factura: 1000000, ruta_imagen: '/images/factura1.jpg', caso: 'Caso 1', fecha_asignacion: '2024-09-01', total_servicios: 5, lider: 'Juan Pérez', usuario_asignacion: 'Ana Gómez', total_servicios_usuario: 3, estado: 'Asignado', prioridad: 'Alta' },
    { id: 2, radicado: 'RAD-002', ips_nit: '987654321', ips_nombre: 'IPS Medicina', factura: 'FACT-002', valor_factura: 500000, ruta_imagen: '/images/factura2.jpg', caso: 'Caso 2', fecha_asignacion: '2024-09-05', total_servicios: 3, lider: 'María Rodríguez', usuario_asignacion: 'Carlos López', total_servicios_usuario: 2, estado: 'En Proceso', prioridad: 'Media' },
    { id: 3, radicado: 'RAD-003', ips_nit: '111111111', ips_nombre: 'IPS Odontología', factura: 'FACT-003', valor_factura: 2000000, ruta_imagen: '/images/factura3.jpg', caso: 'Caso 3', fecha_asignacion: '2024-09-10', total_servicios: 4, lider: 'Luis Hernández', usuario_asignacion: 'Sofía García', total_servicios_usuario: 1, estado: 'Completado', prioridad: 'Baja' },
  ]);

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
        cell: ({ row }) => `$${(row.getValue('valor_factura') as number).toLocaleString('es-CO')}`,
        meta: { editable: true }, // ← Columna editable
      },
      { accessorKey: 'ruta_imagen', header: 'Ruta Imagen', meta: { filterType: 'text' } },
      { accessorKey: 'caso', header: 'Caso', meta: { filterType: 'text', editable: true } }, // ← Columna editable
      {
        accessorKey: 'fecha_asignacion',
        header: 'Fecha Asignación',
        cell: ({ row }) => new Date(row.getValue('fecha_asignacion')).toLocaleDateString('es-CO'),
      },
      { accessorKey: 'total_servicios', header: 'Total Servicios' },
      { accessorKey: 'lider', header: 'Líder', meta: { filterType: 'text', editable: true } }, // ← Columna editable
      { accessorKey: 'usuario_asignacion', header: 'Usuario Asignación', meta: { filterType: 'text' } },
      { accessorKey: 'total_servicios_usuario', header: 'Total Servicios Usuario' },
      { accessorKey: 'estado', header: 'Estado', meta: { filterType: 'select', editable: true } }, // ← Columna editable
      { accessorKey: 'prioridad', header: 'Prioridad', meta: { filterType: 'select', editable: true } }, // ← Columna editable
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
          change.identifier as string, // radicado
          change.columnId,              // nombre de la columna
          change.newValue               // nuevo valor
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

        <div className={styles.tableContainer}>
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