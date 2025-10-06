import { useState, useMemo, useEffect, useCallback } from 'react';
import { DataTable_2 } from '../ui/DataTable/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import styles from './LeaderDashboard.module.css';
import { leaderService, type OperadorResumen } from '../../services/leaderService';
import { useAuth } from '../../context/AuthContext';
import type { Seguimiento } from '../../services/seguimientoService';

interface TeamMember extends OperadorResumen {}
interface MemberDetail extends Seguimiento {}

export const LeaderDashboard = () => {
  const [teamData, setTeamData] = useState<TeamMember[]>([]);
  const [isLoadingResumen, setIsLoadingResumen] = useState(false);

  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberDetails, setMemberDetails] = useState<MemberDetail[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return today;
  });

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const estadosOptions = ['LIQUIDADO', 'INCONSISTENCIA', 'DEVOLUCION', 'NO COMPLETADO'];

  const { user } = useAuth();

  const fetchResumen = useCallback(async (silent = false) => {
    if (!user?.email) return;
    if (!silent) setIsLoadingResumen(true);
    try {
      // CONSERVADO como lo tenías:
      const data = await leaderService.resumenOperadores(dateFilter, user.email ); // 'diana.giraldo@iq-online.com'
      setTeamData(data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Error cargando resumen operadores:', e);
      setTeamData([]);
    } finally {
      if (!silent) setIsLoadingResumen(false);
    }
  }, [user, dateFilter]);

  // Helper: YYYY-MM-DD HH:mm
  const formatDateTime = (value?: string | null) => {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    fetchResumen();
  }, [fetchResumen]);

  // Auto-refresh  SIN overlay
  useEffect(() => {
    const id = setInterval(() => {
      fetchResumen(true); // silent
    }, 400000);
    return () => clearInterval(id);
  }, [fetchResumen]);

  // Calcular totales
  const totals = useMemo(() => {
    return {
      totalMinutos: teamData.reduce((sum, item) => sum + item.total_minutos, 0),
      totalRadicados: teamData.reduce((sum, item) => sum + item.total_radicados, 0),
      totalServicios: teamData.reduce((sum, item) => sum + item.total_servicios, 0),
    };
  }, [teamData]);

  const openCasesCount = useMemo(() => teamData.filter(m => m.caso_abierto).length, [teamData]);

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
      const detalles = await leaderService.getMemberSeguimientos(member.correo, dateFilter);
      setMemberDetails(detalles);
    } catch (error) {
      console.error('Error al obtener detalles:', error);
      setMemberDetails([]);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleBackToList = () => {
    setSelectedMember(null);
    setMemberDetails([]);
  };

  const teamColumns = useMemo<ColumnDef<TeamMember>[]>(() => {
    const nombreOptions = Array.from(new Set(teamData.map(t => t.nombre))).sort();
    return [
      { 
        accessorKey: 'nombre', 
        header: 'Nombre de Usuario', 
        meta: { filterType: 'multiselect', options: nombreOptions }, 
        cell: ({ row }) => (
          <div className={styles.nameCell}>
            <strong>{row.getValue('nombre')}</strong>
          </div>
        )
      },
      { 
        accessorKey: 'total_minutos', 
        header: 'Tiempo', 
        meta: { filterType: 'none' }, 
        cell: ({ row }) => formatTime(row.getValue('total_minutos'))
      },
      { 
        accessorKey: 'total_radicados', 
        header: 'Total Radicados', 
        meta: { filterType: 'none' }
      },
      { 
        accessorKey: 'total_servicios', 
        header: 'Total Servicios', 
        meta: { filterType: 'none' }
      },
      {
        accessorKey: 'caso_abierto',
        header: 'Caso Abierto',
        meta: { filterType: 'select', options: [true, false] },
        cell: ({ row }) => {
          const abierto = row.original.caso_abierto;
          return (
            <span className={abierto ? styles.badgeOpen : styles.badgeClosed}>
              {abierto ? 'Sí' : 'No'}
            </span>
          );
        }
      },
    ];
  }, [teamData]);

  const detailColumns = useMemo<ColumnDef<MemberDetail>[]>(() => [
    { accessorKey: 'radicado', header: 'Radicado', meta: { filterType: 'text' }, enableSorting: true },
    { accessorKey: 'raw.ruta_imagen', header: 'Ruta Imagen', meta: { filterType: 'text' }, cell: ({ row }) => { const v = (row.original as any).raw?.ruta_imagen; return <span>{v ?? ''}</span>; } },
    { 
      accessorKey: 'estado', 
      header: 'Estado', 
      meta: { filterType: 'select', options: estadosOptions }, 
      cell: ({ row }) => { 
        const estado = row.original.estado; 
        const estadoClass = estado?.toLowerCase().replace(/\s+/g, '') || ''; 
        return <span className={`${styles.statusBadge} ${estadoClass && styles[estadoClass] ? styles[estadoClass] : ''}`}>{estado}</span>; 
      } 
    },
    {
      accessorKey: 'fecha_inicio',
      header: 'Fecha Inicio',
      meta: { filterType: 'none' },
      cell: ({ row }) => <span>{formatDateTime(row.original.fecha_inicio)}</span>
    },
    {
      accessorKey: 'fecha_fin',
      header: 'Fecha Fin',
      meta: { filterType: 'none' },
      cell: ({ row }) => <span>{formatDateTime(row.original.fecha_fin)}</span>
    },
    { accessorKey: 'total_minutos', header: 'Total Minutos', meta: { filterType: 'none' }, cell: ({ row }) => { const v = row.original.total_minutos; return v == null ? '' : `${v} min`; } },
    { accessorKey: 'total_servicios', header: 'Total Servicios', meta: { filterType: 'none' }, cell: ({ row }) => { const v = row.original.total_servicios; return v == null ? '' : v; } },
  ], [estadosOptions]);

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

            <div className={styles.tableContainer + ' ' + styles.loadingWrapper}>
              {isLoadingDetails && (
                <div className={styles.loadingOverlay} aria-label="Cargando detalles" />
              )}
              <DataTable_2 
                data={memberDetails} 
                columns={detailColumns} 
                pageSize={8} 
                className={styles.customTable}
                autoResetPageIndex={false}   // ← evita volver a página 1 al refrescar datos
              />
            </div>
          </section>
        </div>
      </div>
    );
  }

  // Vista principal (estructura original)
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
                <div className={styles.statCard}>
                  <div className={styles.statCount}>{openCasesCount}</div>
                  <div className={styles.statLabel}>Casos Abiertos</div>
                </div>
              </div>
              <div className={styles.dateFilter}>
                <input 
                  type="date" 
                  className={styles.dateInput} 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)} 
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--ud-muted)' }}>
                  Última actualización: {lastUpdated ? lastUpdated.toLocaleString() : '—'}
                </span>
              </div>
            </div>
          </div>
          <div className={styles.tableContainer + ' ' + styles.loadingWrapper}>
            {isLoadingResumen && (
              <div className={styles.loadingOverlay} aria-label="Cargando resumen" />
            )}
            <DataTable_2 
              data={teamData} 
              columns={teamColumns} 
              pageSize={8} 
              className={styles.customTable}
              onRowClick={handleRowClick}
              autoResetPageIndex={false}     // ← evita reset de página en refresh silencioso
            />
          </div>
        </section>
      </div>
    </div>
  );
};
