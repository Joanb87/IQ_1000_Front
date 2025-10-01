import React, { useState, useMemo } from 'react';
import styles from './AdminDashboard.module.css';
import { AdminDashboard as AdminAssignator } from './Admin_Asignator';
import { DataTable_2 } from '../ui/DataTable/DataTable_2';
import type { ColumnDef } from '@tanstack/react-table';

interface DataRecord {
  id: number;
  nombre: string;
  categoria: string;
  valor: number;
  fecha: string;
  estado: string;
}

export const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState<'assign' | 'data' | null>(null);
  
  const [tableData] = useState<DataRecord[]>([
    { id: 1, nombre: 'Registro A', categoria: 'Ventas', valor: 1500, fecha: '2024-09-15', estado: 'Completado' },
    { id: 2, nombre: 'Registro B', categoria: 'Marketing', valor: 2300, fecha: '2024-09-20', estado: 'Pendiente' },
    { id: 3, nombre: 'Registro C', categoria: 'Operaciones', valor: 1800, fecha: '2024-09-22', estado: 'Completado' },
    { id: 4, nombre: 'Registro D', categoria: 'Ventas', valor: 3200, fecha: '2024-09-25', estado: 'En Proceso' },
    { id: 5, nombre: 'Registro E', categoria: 'Finanzas', valor: 2100, fecha: '2024-09-28', estado: 'Completado' },
  ]);

  const dataColumns = useMemo<ColumnDef<DataRecord>[]>(() => [
    { accessorKey: 'id', header: 'ID', enableColumnFilter: false },
    { accessorKey: 'nombre', header: 'Nombre', meta: { filterType: 'text' } },
    { accessorKey: 'categoria', header: 'Categoría', meta: { filterType: 'select' } },
    { accessorKey: 'valor', header: 'Valor', cell: ({ row }) => `$${row.getValue('valor')}` },
    { accessorKey: 'fecha', header: 'Fecha', cell: ({ row }) => new Date(row.getValue('fecha')).toLocaleDateString('es-CO') },
    { accessorKey: 'estado', header: 'Estado', meta: { filterType: 'select' } },
    { accessorKey: 'estado', header: 'Estado', meta: { filterType: 'select' } },
    { accessorKey: 'estado', header: 'Estado', meta: { filterType: 'select' } },
    { accessorKey: 'estado', header: 'Estado', meta: { filterType: 'select' } },
  ], []);

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
        <h1>Cargar Datos</h1>
        <div className={styles.tableContainer}>
          <DataTable_2
            data={tableData}
            columns={dataColumns}
            pageSize={10}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <h1>Panel de Admin</h1>
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