
//   // const teamColumns = useMemo<ColumnDef<TeamMember>[]>(() => [
//   //   { accessorKey: 'id', header: 'ID', enableColumnFilter: false, enableSorting: true },
//   //   { accessorKey: 'radicado', header: 'Radicado', enableColumnFilter: false, enableSorting: true },
//   //   { accessorKey: 'nombre', header: 'Nombre', meta: { filterType: 'text' }, cell: ({ row }) => <div className={styles.nameCell}><strong>{row.getValue('nombre')}</strong></div> },
//   //   { accessorKey: 'estado', header: 'Estado', meta: { filterType: 'select' } },
//   //   { accessorKey: 'fecha_inicio', header: 'Fecha Inicio', meta: { filterType: 'select' } },
//   //   { accessorKey: 'fecha_fin', header: 'Fecha Fin', meta: { filterType: 'select' } },
//   //   { accessorKey: 'total_minutos', header: 'Total Minutos', meta: { filterType: 'text' } },
//   //   {
//   //       accessorKey: 'ruta_imagen',
//   //       header: 'Imagen',
//   //       meta: {
//   //         filterType: 'multiselect', // MULTISELECT (cámbialo a 'select' si lo prefieres)
//   //         options: ['Activo', 'Inactivo', 'Vacaciones'],
//   //       },
//   //       cell: ({ row }) => {
//   //         const estado = row.getValue('estado') as string;
//   //         const estadoClass = estado.toLowerCase().replace(/\s+/g, '');
//   //         return (
//   //           <span className={`${styles.statusBadge} ${styles[estadoClass] || ''}`}>
//   //             {estado}
//   //           </span>
//   //         );
//   //       },
//   //     },

//   //   ], []);


import React, { useState, useMemo } from 'react';
import { DataTable_2 } from '../ui/DataTable/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import styles from './UserDashboard.module.css';
import { userService } from '../../services/userService';

interface TeamMember {
  id: number;
  radicado: string;
  nombre: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  total_minutos: number;
  ruta_imagen: string;
  total_servicios?: number;
}

export const UserDashboard = () => {
  const [teamData] = useState<TeamMember[]>([
    { id: 1, radicado: 'RAD-2024-001', nombre: 'Juan Pérez', estado: 'LIQUIDADO', fecha_inicio: '2025-10-1', fecha_fin: '', total_minutos: 4800, ruta_imagen: '/images/juan.jpg', total_servicios: 5 },
    { id: 2, radicado: 'RAD-2024-002', nombre: 'María García', estado: 'INCONSISTENCIA', fecha_inicio: '2025-10-1', fecha_fin: '', total_minutos: 3600, ruta_imagen: '/images/maria.jpg', total_servicios: 3 },
    { id: 3, radicado: 'RAD-2024-003', nombre: 'Carlos López', estado: 'LIQUIDADO', fecha_inicio: '2025-10-1', fecha_fin: '2024-12-20', total_minutos: 5200, ruta_imagen: '/images/carlos.jpg', total_servicios: 7 },
    { id: 4, radicado: 'RAD-2024-004', nombre: 'Ana Martínez', estado: 'LIQUIDADO', fecha_inicio: '2025-10-1', fecha_fin: '2024-10-15', total_minutos: 2400, ruta_imagen: '/images/ana.jpg', total_servicios: 4 },
    { id: 5, radicado: 'RAD-2024-005', nombre: 'Luis Rodríguez', estado: 'LIQUIDADO', fecha_inicio: '2025-10-1', fecha_fin: '2024-08-30', total_minutos: 1800, ruta_imagen: '/images/luis.jpg', total_servicios: 2 },
    { id: 6, radicado: 'RAD-2024-006', nombre: 'Sofía Ramírez', estado: 'DEVOLUCION', fecha_inicio: '2025-10-1', fecha_fin: '', total_minutos: 4200, ruta_imagen: '/images/sofia.jpg', total_servicios: 6 },
    { id: 7, radicado: 'RAD-2024-007', nombre: 'Diego Torres', estado: 'INCONSISTENCIA', fecha_inicio: '2025-10-1', fecha_fin: '', total_minutos: 3900, ruta_imagen: '/images/diego.jpg', total_servicios: 4 },
    { id: 8, radicado: 'RAD-2024-008', nombre: 'Laura Gómez', estado: 'DEVOLUCION', fecha_inicio: '2025-10-1', fecha_fin: '2024-09-15', total_minutos: 2100, ruta_imagen: '/images/laura.jpg', total_servicios: 3 },
    { id: 9, radicado: 'RAD-2024-009', nombre: 'Miguel Ángel Ruiz', estado: 'INCONSISTENCIA', fecha_inicio: '2025-10-1', fecha_fin: '', total_minutos: 4500, ruta_imagen: '/images/miguel.jpg', total_servicios: 5 },
    { id: 10, radicado: 'RAD-2024-010', nombre: 'Carolina Vargas', estado: 'NO COMPLETADO', fecha_inicio: '2025-10-1', fecha_fin: '2024-10-22', total_minutos: 2800, ruta_imagen: '/images/carolina.jpg', total_servicios: 3 },
    { id: 11, radicado: 'RAD-2024-011', nombre: 'Andrés Castillo', estado: 'DEVOLUCION', fecha_inicio: '2025-10-1', fecha_fin: '', total_minutos: 1500, ruta_imagen: '/images/andres.jpg', total_servicios: 2 },
    { id: 12, radicado: 'RAD-2024-012', nombre: 'Valentina Moreno', estado: 'NO COMPLETADO', fecha_inicio: '2025-10-1', fecha_fin: '2024-12-18', total_minutos: 4100, ruta_imagen: '/images/valentina.jpg', total_servicios: 5 },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState<TeamMember | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editForm, setEditForm] = useState({ total_servicios: 0, estado: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return today;
  });

  const estadosOptions = ['LIQUIDADO', 'INCONSISTENCIA', 'DEVOLUCION', 'NO COMPLETADO'];

  // Filtrar datos por fecha
  const filteredData = useMemo(() => {
    if (!dateFilter) return teamData;
    
    return teamData.filter(item => {
      const itemDate = new Date(item.fecha_inicio).toISOString().split('T')[0];
      return itemDate === dateFilter;
    });
  }, [teamData, dateFilter]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    return estadosOptions.map(estado => ({
      estado,
      count: filteredData.filter(item => item.estado === estado).length
    }));
  }, [filteredData]);

  const handleCreateNewCase = async () => {
    try {
      setIsLoading(true);
      const response = await userService.createNewCase();
      console.log('Caso creado:', response);
    } catch (error) {
      console.error('Error al crear caso:', error);
      alert('Error al crear el caso');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (member: TeamMember) => {
    if (!member.fecha_fin || member.fecha_fin === '') {
      setSelectedCase(member);
      setEditForm({ total_servicios: member.total_servicios || 0, estado: member.estado });
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCase(null);
  };

  const handleUpdateCase = async () => {
    if (!selectedCase) return;
    try {
      setIsUpdating(true);
      await userService.updateCase(selectedCase.id, editForm);
      alert('Caso actualizado exitosamente');
      handleCloseModal();
    } catch (error) {
      console.error('Error al actualizar caso:', error);
      alert('Error al actualizar el caso');
    } finally {
      setIsUpdating(false);
    }
  };

  const teamColumns = useMemo<ColumnDef<TeamMember>[]>(() => [
    { accessorKey: 'radicado', header: 'Radicado', meta: { filterType: 'text' }, enableSorting: true },
    { accessorKey: 'nombre', header: 'Nombre', meta: { filterType: 'text' }, cell: ({ row }) => <div className={styles.nameCell}><strong>{row.getValue('nombre')}</strong></div> },
    { accessorKey: 'estado', header: 'Estado', meta: { filterType: 'select', options: estadosOptions }, cell: ({ row }) => { const estado = row.getValue('estado') as string; const estadoClass = estado.toLowerCase().replace(/\s+/g, ''); return <span className={`${styles.statusBadge} ${styles[estadoClass] || ''}`}>{estado}</span>; } },
    { accessorKey: 'fecha_inicio', header: 'Fecha Inicio', meta: { filterType: 'text' } },
    { accessorKey: 'fecha_fin', header: 'Fecha Fin', meta: { filterType: 'text' }, cell: ({ row }) => row.getValue('fecha_fin') || '-' },
    { accessorKey: 'total_minutos', header: 'Total Minutos', meta: { filterType: 'text' }, cell: ({ row }) => `${row.getValue('total_minutos')} min` },
    { accessorKey: 'ruta_imagen', header: 'Imagen', meta: { filterType: 'text' }, cell: ({ row }) => `${row.getValue('ruta_imagen')}` },
    { accessorKey: 'total_servicios', header: 'Total Servicios', meta: { filterType: 'text' }, cell: ({ row }) => `${row.original.total_servicios || 0}` },
  ], []);

return (
  <div className={styles.dashboard}>
    <div className={styles.content}>
      <section className={styles.section}>
        <div className={styles.tableHeader}>
          <div className={styles.statsContainer}>
            <div className={styles.statsCards}>
              {stats.map(({ estado, count }) => {
                const estadoClass = estado.toLowerCase().replace(/\s+/g, '');
                return (
                  <div key={estado} className={`${styles.statCard} ${styles[`stat_${estadoClass}`]}`}>
                    <div className={styles.statCount}>{count}</div>
                    <div className={styles.statLabel}>{estado}</div>
                  </div>
                );
              })}
            </div>
            <div className={styles.dateFilter}>
              <input 
                type="date" 
                className={styles.dateInput} 
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value)} 
              />
              {/* <button 
                className={styles.clearDateButton} 
                onClick={() => setDateFilter(new Date().toISOString().split('T')[0])}
                title="Volver a hoy"
              >
                Hoy
              </button> */}
            </div>
          </div>
          <button className={styles.newCaseButton} onClick={handleCreateNewCase} disabled={isLoading}>
            {isLoading ? 'Creando...' : '+ Nuevo Caso'}
          </button>
        </div>
        <div className={styles.tableContainer}>
          <DataTable_2 data={filteredData} columns={teamColumns} pageSize={8} className={styles.customTable} onRowClick={handleRowClick} />
        </div>
      </section>
    </div>

    {showModal && selectedCase && (
      <div className={styles.modalOverlay} onClick={handleCloseModal}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2>Editar Caso</h2>
            <button className={styles.closeButton} onClick={handleCloseModal}>×</button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Radicado:</span>
              <span className={styles.value}>{selectedCase.radicado}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Nombre:</span>
              <span className={styles.value}>{selectedCase.nombre}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Fecha Inicio:</span>
              <span className={styles.value}>{selectedCase.fecha_inicio}</span>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Total Servicios</label>
              <input type="number" className={styles.formInput} value={editForm.total_servicios} onChange={(e) => setEditForm({ ...editForm, total_servicios: Number(e.target.value) })} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Estado</label>
              <select className={styles.formSelect} value={editForm.estado} onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}>
                {estadosOptions.map(option => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button className={styles.cancelButton} onClick={handleCloseModal}>Cancelar</button>
            <button className={styles.saveButton} onClick={handleUpdateCase} disabled={isUpdating}>
              {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
};