import React, { useState, useMemo } from 'react';
import { DataTable_2 } from '../ui/DataTable/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import styles from './LeaderDashboard.module.css';
import { leaderService } from '../../services/leaderService';

interface TeamMember {
  id: number;
  nombre: string;
  correo?: string;
  total_minutos: number;
  total_radicados: number;
  total_servicios: number;
}

interface MemberDetail {
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

export const LeaderDashboard = () => {
  const [teamData] = useState<TeamMember[]>([
    { id: 1, nombre: 'Juan Pérez', correo: 'juan@example.com', total_minutos: 4800, total_radicados: 12, total_servicios: 5 },
    { id: 2, nombre: 'María García', correo: 'maria@example.com', total_minutos: 3600, total_radicados: 8, total_servicios: 3 },
    { id: 3, nombre: 'Carlos López', correo: 'carlos@example.com', total_minutos: 5200, total_radicados: 15, total_servicios: 7 },
    { id: 4, nombre: 'Ana Martínez', correo: 'ana@example.com', total_minutos: 2400, total_radicados: 6, total_servicios: 4 },
    { id: 5, nombre: 'Luis Rodríguez', correo: 'luis@example.com', total_minutos: 1800, total_radicados: 4, total_servicios: 2 },
    { id: 6, nombre: 'Sofía Ramírez', correo: 'sofia@example.com', total_minutos: 4200, total_radicados: 11, total_servicios: 6 },
    { id: 7, nombre: 'Diego Torres', correo: 'diego@example.com', total_minutos: 3900, total_radicados: 9, total_servicios: 4 },
    { id: 8, nombre: 'Laura Gómez', correo: 'laura@example.com', total_minutos: 2100, total_radicados: 5, total_servicios: 3 },
    { id: 9, nombre: 'Miguel Ángel Ruiz', correo: 'miguel@example.com', total_minutos: 4500, total_radicados: 13, total_servicios: 5 },
    { id: 10, nombre: 'Carolina Vargas', correo: 'carolina@example.com', total_minutos: 2800, total_radicados: 7, total_servicios: 3 },
  ]);

  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberDetails, setMemberDetails] = useState<MemberDetail[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return today;
  });

  const estadosOptions = ['LIQUIDADO', 'INCONSISTENCIA', 'DEVOLUCION', 'NO COMPLETADO'];

  // Calcular totales
  const totals = useMemo(() => {
    return {
      totalMinutos: teamData.reduce((sum, item) => sum + item.total_minutos, 0),
      totalRadicados: teamData.reduce((sum, item) => sum + item.total_radicados, 0),
      totalServicios: teamData.reduce((sum, item) => sum + item.total_servicios, 0),
    };
  }, [teamData]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleRowClick = async (member: TeamMember) => {
    if (!member.correo) return;
    
    setSelectedMember(member);
    setIsLoadingDetails(true);
    
    try {
      const details = await leaderService.getMemberDetails(member.correo);
      setMemberDetails(details);
    } catch (error) {
      console.error('Error al obtener detalles:', error);
      // Datos dummy mientras implementamos el backend
      setMemberDetails([
        { id: 1, radicado: 'RAD-2024-100', nombre: member.nombre, estado: 'LIQUIDADO', fecha_inicio: '2025-10-01', fecha_fin: '', total_minutos: 120, ruta_imagen: '/images/caso1.jpg', total_servicios: 2 },
        { id: 2, radicado: 'RAD-2024-101', nombre: member.nombre, estado: 'INCONSISTENCIA', fecha_inicio: '2025-10-01', fecha_fin: '', total_minutos: 90, ruta_imagen: '/images/caso2.jpg', total_servicios: 1 },
        { id: 3, radicado: 'RAD-2024-102', nombre: member.nombre, estado: 'DEVOLUCION', fecha_inicio: '2025-10-01', fecha_fin: '2025-10-01', total_minutos: 150, ruta_imagen: '/images/caso3.jpg', total_servicios: 3 },
        { id: 4, radicado: 'RAD-2024-103', nombre: member.nombre, estado: 'LIQUIDADO', fecha_inicio: '2025-10-01', fecha_fin: '2025-10-01', total_minutos: 200, ruta_imagen: '/images/caso4.jpg', total_servicios: 4 },
      ]);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleBackToList = () => {
    setSelectedMember(null);
    setMemberDetails([]);
  };

  const teamColumns = useMemo<ColumnDef<TeamMember>[]>(() => [
    { 
      accessorKey: 'nombre', 
      header: 'Nombre de Usuario', 
      meta: { filterType: 'text' }, 
      cell: ({ row }) => (
        <div className={styles.nameCell}>
          <strong>{row.getValue('nombre')}</strong>
        </div>
      )
    },
    { 
      accessorKey: 'total_minutos', 
      header: 'Tiempo', 
      meta: { filterType: 'text' }, 
      cell: ({ row }) => formatTime(row.getValue('total_minutos'))
    },
    { 
      accessorKey: 'total_radicados', 
      header: 'Total Radicados', 
      meta: { filterType: 'text' }
    },
    { 
      accessorKey: 'total_servicios', 
      header: 'Total Servicios', 
      meta: { filterType: 'text' }
    },
  ], []);

  const detailColumns = useMemo<ColumnDef<MemberDetail>[]>(() => [
    { accessorKey: 'radicado', header: 'Radicado', meta: { filterType: 'text' }, enableSorting: true },
    { 
      accessorKey: 'estado', 
      header: 'Estado', 
      meta: { filterType: 'select', options: estadosOptions }, 
      cell: ({ row }) => { 
        const estado = row.getValue('estado') as string; 
        const estadoClass = estado.toLowerCase().replace(/\s+/g, ''); 
        return <span className={`${styles.statusBadge} ${styles[estadoClass] || ''}`}>{estado}</span>; 
      } 
    },
    { accessorKey: 'fecha_inicio', header: 'Fecha Inicio', meta: { filterType: 'text' } },
    { accessorKey: 'fecha_fin', header: 'Fecha Fin', meta: { filterType: 'text' }, cell: ({ row }) => row.getValue('fecha_fin') || '-' },
    { accessorKey: 'total_minutos', header: 'Total Minutos', meta: { filterType: 'text' }, cell: ({ row }) => `${row.getValue('total_minutos')} min` },
    { accessorKey: 'ruta_imagen', header: 'Imagen', meta: { filterType: 'text' }, cell: ({ row }) => `${row.getValue('ruta_imagen')}` },
    { accessorKey: 'total_servicios', header: 'Total Servicios', meta: { filterType: 'text' }, cell: ({ row }) => `${row.original.total_servicios || 0}` },
  ], []);

  // Calcular estadísticas de detalle
  const detailStats = useMemo(() => {
    return estadosOptions.map(estado => ({
      estado,
      count: memberDetails.filter(item => item.estado === estado).length
    }));
  }, [memberDetails]);

  // Vista de detalle
  if (selectedMember) {

    return (
      <div className={styles.dashboard}>
        <div className={styles.content}>
          <section className={styles.section}>
            <div className={styles.detailHeader}>
              <button className={styles.backButton} onClick={handleBackToList}>
                ← Volver
              </button>
              <h2>Detalle de {selectedMember.nombre}</h2>
            </div>

            <div className={styles.tableHeader}>
              <div className={styles.statsContainer}>
                <div className={styles.statsCards}>
                  {detailStats.map(({ estado, count }) => {
                    const estadoClass = estado.toLowerCase().replace(/\s+/g, '');
                    return (
                      <div key={estado} className={`${styles.statCard} ${styles[`stat_${estadoClass}`]}`}>
                        <div className={styles.statCount}>{count}</div>
                        <div className={styles.statLabel}>{estado}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {isLoadingDetails ? (
              <div className={styles.loading}>Cargando detalles...</div>
            ) : (
              <div className={styles.tableContainer}>
                <DataTable_2 
                  data={memberDetails} 
                  columns={detailColumns} 
                  pageSize={8} 
                  className={styles.customTable} 
                />
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  // Vista principal (sin cambios en la estructura original)
  return (
    <div className={styles.dashboard}>
      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.tableHeader}>
            <div className={styles.statsContainer}>
              <div className={styles.statsCards}>
                <div className={styles.statCard}>
                  <div className={styles.statCount}>{formatTime(totals.totalMinutos)}</div>
                  <div className={styles.statLabel}>Tiempo Total</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statCount}>{totals.totalRadicados}</div>
                  <div className={styles.statLabel}>Total Radicados</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statCount}>{totals.totalServicios}</div>
                  <div className={styles.statLabel}>Total Servicios</div>
                </div>
              </div>
              <div className={styles.dateFilter}>
                <input 
                  type="date" 
                  className={styles.dateInput} 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)} 
                />
              </div>
            </div>
          </div>
          <div className={styles.tableContainer}>
            <DataTable_2 
              data={teamData} 
              columns={teamColumns} 
              pageSize={8} 
              className={styles.customTable}
              onRowClick={handleRowClick}
            />
          </div>
        </section>
      </div>
    </div>
  );
};