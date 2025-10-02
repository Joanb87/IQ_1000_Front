
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


import { useState, useMemo, useEffect, useCallback } from 'react';
import { DataTable_2 } from '../ui/DataTable/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import styles from './UserDashboard.module.css';
import { seguimientoService, type Seguimiento } from '../../services/seguimientoService';
import { useAuth } from '../../context/AuthContext';

interface TeamMember extends Seguimiento {}

export const UserDashboard = () => {
  const [teamData, setTeamData] = useState<TeamMember[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedCase, setSelectedCase] = useState<TeamMember | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editForm, setEditForm] = useState({ total_servicios: 0, estado: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return today;
  });

  const estadosOptions = ['ASIGNADA', 'LIQUIDADO', 'INCONSISTENCIA', 'DEVOLUCION', 'NO COMPLETADO'];

  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setIsFetching(true);
      const data = await seguimientoService.listar({ fecha: dateFilter, usuario: user.email || undefined });
      setTeamData(data || []);
    } catch (error) {
      console.error('Error cargando seguimientos:', error);
    } finally {
      setIsFetching(false);
    }
  }, [dateFilter, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    if (!user?.email) return alert('Usuario no disponible');
    try {
      setIsLoading(true);
      const caso = await seguimientoService.tomarCaso(user.email);
      // Si backend devuelve el caso, lo añadimos (o refrescamos todo por consistencia)
      if (caso) {
        // Evitamos duplicados por radicado o id
        setTeamData(prev => [caso, ...prev.filter(c => c.id !== caso.id)]);
      } else {
        await fetchData();
      }
    } catch (error) {
      console.error('Error al tomar caso:', error);
      alert('Error al tomar un nuevo caso');
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
    if (!selectedCase || !user?.email) return;
    try {
      setIsUpdating(true);
      await seguimientoService.cerrarCaso({
        usuario: user.email,
        radicado: selectedCase.radicado,
        total_servicios: editForm.total_servicios,
        estado: editForm.estado
      });
      alert('Caso actualizado exitosamente');
      handleCloseModal();
      await fetchData();
    } catch (error) {
      console.error('Error al cerrar caso:', error);
      alert('Error al cerrar el caso');
    } finally {
      setIsUpdating(false);
    }
  };

  const teamColumns = useMemo<ColumnDef<TeamMember>[]>(() => [
    { accessorKey: 'radicado', header: 'Radicado', meta: { filterType: 'text' }, enableSorting: true },
    { accessorKey: 'nombre', header: 'Usuario', meta: { filterType: 'text' }, cell: ({ row }) => <div className={styles.nameCell}><strong>{row.getValue('nombre') as string}</strong></div> },
  { accessorKey: 'estado', header: 'Estado', meta: { filterType: 'select', options: estadosOptions }, cell: ({ row }) => { const estado = row.getValue('estado') as string | undefined; if (!estado) return <span className={styles.statusBadge}>-</span>; const estadoClass = estado.toLowerCase().replace(/\s+/g, ''); return <span className={`${styles.statusBadge} ${styles[estadoClass] || ''}`}>{estado}</span>; } },
    { accessorKey: 'fecha_inicio', header: 'Fecha Inicio', meta: { filterType: 'text' }, cell: ({ row }) => { const v = row.getValue('fecha_inicio') as string; return v ? v.split('T')[0] : '-'; } },
    { accessorKey: 'fecha_fin', header: 'Fecha Fin', meta: { filterType: 'text' }, cell: ({ row }) => { const v = row.getValue('fecha_fin') as string | null; return v ? v.split('T')[0] : '-'; } },
  { accessorKey: 'total_minutos', header: 'Total Minutos', meta: { filterType: 'text' }, cell: ({ row }) => { const val = row.getValue('total_minutos') as number | null; return val == null ? '' : `${val} min`; } },
  { accessorKey: 'total_servicios', header: 'Total Servicios', meta: { filterType: 'text' }, cell: ({ row }) => { const v = row.original.total_servicios; return v == null ? '' : v; } },
  ], [estadosOptions]);

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
          <button className={styles.newCaseButton} onClick={handleCreateNewCase} disabled={isLoading || !user}>
            {isLoading ? 'Tomando...' : '+ Tomar Caso'}
          </button>
        </div>
        <div className={styles.tableContainer} aria-busy={isFetching}>
          <DataTable_2 
            data={filteredData} 
            columns={teamColumns} 
            pageSize={8} 
            className={styles.customTable} 
            onRowClick={handleRowClick} 
          />
          {isFetching && (
            <div className={styles.loadingOverlay} role="status" aria-label="Cargando casos">
              <div className={styles.spinner}></div>
            </div>
          )}
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