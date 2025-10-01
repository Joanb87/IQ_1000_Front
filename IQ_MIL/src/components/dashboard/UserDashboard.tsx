import React, { useState, useMemo } from 'react';
import { DataTable_2 } from '../ui/DataTable/DataTable_2';
import type { ColumnDef } from '@tanstack/react-table';
import styles from './UserDashboard.module.css';

interface TeamMember {
  id: number;
  nombre: string;
  cargo: string;
  departamento: string;
  email: string;
  telefono: string;
  fechaIngreso: string;
  estado: 'Activo' | 'Inactivo' | 'Vacaciones';
}

export const UserDashboard = () => {
  const [teamData] = useState<TeamMember[]>([
    { id: 1, nombre: 'Juan Pérez', cargo: 'Desarrollador Senior', departamento: 'Tecnología', email: 'juan.perez@empresa.com', telefono: '+57 300 123 4567', fechaIngreso: '2022-01-15', estado: 'Activo' },
    { id: 2, nombre: 'María García', cargo: 'Diseñadora UX/UI', departamento: 'Diseño', email: 'maria.garcia@empresa.com', telefono: '+57 310 987 6543', fechaIngreso: '2021-08-22', estado: 'Vacaciones' },
    { id: 3, nombre: 'Carlos López', cargo: 'Project Manager', departamento: 'Gestión', email: 'carlos.lopez@empresa.com', telefono: '+57 320 456 7890', fechaIngreso: '2020-03-10', estado: 'Activo' },
    { id: 4, nombre: 'Ana Martínez', cargo: 'Analista de Datos', departamento: 'Tecnología', email: 'ana.martinez@empresa.com', telefono: '+57 315 234 5678', fechaIngreso: '2023-06-01', estado: 'Activo' },
    { id: 5, nombre: 'Luis Rodríguez', cargo: 'DevOps Engineer', departamento: 'Tecnología', email: 'luis.rodriguez@empresa.com', telefono: '+57 305 876 5432', fechaIngreso: '2022-11-30', estado: 'Inactivo' },
    { id: 6, nombre: 'Sofía Ramírez', cargo: 'QA Tester', departamento: 'Tecnología', email: 'sofia.ramirez@empresa.com', telefono: '+57 318 654 3210', fechaIngreso: '2023-02-14', estado: 'Activo' },
    { id: 7, nombre: 'Diego Torres', cargo: 'Marketing Manager', departamento: 'Marketing', email: 'diego.torres@empresa.com', telefono: '+57 312 111 2222', fechaIngreso: '2021-05-20', estado: 'Activo' },
    { id: 8, nombre: 'Laura Gómez', cargo: 'HR Specialist', departamento: 'Recursos Humanos', email: 'laura.gomez@empresa.com', telefono: '+57 301 333 4444', fechaIngreso: '2020-09-15', estado: 'Vacaciones' },
    { id: 9, nombre: 'Miguel Ángel Ruiz', cargo: 'Backend Developer', departamento: 'Tecnología', email: 'miguel.ruiz@empresa.com', telefono: '+57 314 555 6666', fechaIngreso: '2022-07-08', estado: 'Activo' },
    { id: 10, nombre: 'Carolina Vargas', cargo: 'Content Creator', departamento: 'Marketing', email: 'carolina.vargas@empresa.com', telefono: '+57 319 777 8888', fechaIngreso: '2023-03-22', estado: 'Activo' },
    { id: 11, nombre: 'Andrés Castillo', cargo: 'Security Analyst', departamento: 'Tecnología', email: 'andres.castillo@empresa.com', telefono: '+57 316 999 0000', fechaIngreso: '2021-11-30', estado: 'Inactivo' },
    { id: 12, nombre: 'Valentina Moreno', cargo: 'Frontend Developer', departamento: 'Tecnología', email: 'valentina.moreno@empresa.com', telefono: '+57 311 222 3333', fechaIngreso: '2022-04-18', estado: 'Activo' },
    { id: 13, nombre: 'Valentina Moreno', cargo: 'Frontend Developer', departamento: 'Marketing', email: 'andres.castillo@empresa.com', telefono: '+57 316 999 0000', fechaIngreso: '2021-11-30', estado: 'Inactivo' },

  ]);

  const teamColumns = useMemo<ColumnDef<TeamMember>[]>(() => [
    { accessorKey: 'id', header: 'ID', enableColumnFilter: false, enableSorting: true },
    { accessorKey: 'nombre', header: 'Nombre', meta: { filterType: 'text' }, cell: ({ row }) => <div className={styles.nameCell}><strong>{row.getValue('nombre')}</strong></div> },
    { accessorKey: 'cargo', header: 'Cargo', meta: { filterType: 'select' } },
    { accessorKey: 'departamento', header: 'Departamento', meta: { filterType: 'select' } },
    { accessorKey: 'email', header: 'Email', meta: { filterType: 'text' }, cell: ({ row }) => <a href={`mailto:${row.getValue('email')}`} className={styles.emailLink}>{row.getValue('email')}</a> },
    { accessorKey: 'telefono', header: 'Teléfono', meta: { filterType: 'text' } },
      {
        accessorKey: 'estado',
        header: 'Estado',
        meta: {
          filterType: 'multiselect', // MULTISELECT (cámbialo a 'select' si lo prefieres)
          options: ['Activo', 'Inactivo', 'Vacaciones'],
        },
        cell: ({ row }) => {
          const estado = row.getValue('estado') as string;
          const estadoClass = estado.toLowerCase().replace(/\s+/g, '');
          return (
            <span className={`${styles.statusBadge} ${styles[estadoClass] || ''}`}>
              {estado}
            </span>
          );
        },
      },
          { accessorKey: 'fechaIngreso', header: 'Fecha Ingreso', meta: { filterType: 'text' }, cell: ({ row }) => new Date(row.getValue('fechaIngreso')).toLocaleDateString('es-CO') },

    ], []);

  return (
    <div className={styles.dashboard}>
      <h1>Panel de Operador</h1>

      <div className={styles.content}>
        <section className={styles.section}>
          {/* <h2>Gestión de Equipo</h2> */}
          <div className={styles.tableContainer}>
            <DataTable_2
              data={teamData}
              columns={teamColumns}
              pageSize={8} 
              className={styles.customTable}
            />
          </div>
        </section>
      </div>
    </div>
  );
};
