import { useState, useMemo, useEffect, useCallback } from 'react';
import { DataTable_2 } from '../ui/DataTable/DataTable';
import { Modal } from '../ui/Modal/Modal';
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
  const [editForm, setEditForm] = useState({ total_servicios: '', estado: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Overlay “ya tienes caso”
  const [showAssignedOverlay, setShowAssignedOverlay] = useState(false);

  const [dateFilter, setDateFilter] = useState(() => {
    // const today = new Date().toISOString().split('T')[0];
    const today = new Date().toLocaleDateString('sv-SE');
    return today;
  });

  const estadosOptions = ['LIQUIDADO', 'INCONSISTENCIA', 'DEVOLUCION', 'NO COMPLETADO'];
  const { user } = useAuth();

  // Helper: YYYY-MM-DD HH:mm
  const formatDateTime = (value?: string | null) => {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const isFormValid = useMemo(() => {
    return editForm.total_servicios.trim() !== '' &&
           editForm.estado.trim() !== '' &&
           Number(editForm.total_servicios) > 0;
  }, [editForm.total_servicios, editForm.estado]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setIsFetching(true);
      const data = await seguimientoService.listar({ fecha: dateFilter, usuario: 'carol.gomez@iq-online.com' });
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

  const filteredData = useMemo(() => {
    // El backend ya filtra por fecha, no necesitamos filtrar otra vez
    return teamData;
  }, [teamData]);

  const stats = useMemo(() => {
    return estadosOptions.map(estado => ({
      estado,
      count: filteredData.filter(item => item.estado === estado).length
    }));
  }, [filteredData, estadosOptions]);

  const handleCreateNewCase = async () => {
    if (!user?.email) return alert('Usuario no disponible');
    try {
      setIsLoading(true);
      const { caso, alreadyAssigned } = await seguimientoService.tomarCaso(user.email);

      if (caso) {
        setTeamData(prev => [caso, ...prev.filter(c => c.id !== caso.id)]);
      } else if (alreadyAssigned) {
        // ⬇️ Mostrar overlay SOLO si el backend devolvió lista vacía
        setShowAssignedOverlay(true);
        // auto-ocultar después de unos segundos
        setTimeout(() => setShowAssignedOverlay(false), 4500);
      } else {
        // Sin asignación (otra condición): refrescar
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
      setEditForm({
        total_servicios: '',
        estado: ''
      });
      setShowSuccess(false);
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCase(null);
    setShowSuccess(false);
  };

  const handleUpdateCase = async () => {
    if (!selectedCase || !user?.email || !isFormValid) return;
    try {
      setIsUpdating(true);
      await seguimientoService.cerrarCaso({
        usuario: user.email,
        radicado: selectedCase.radicado,
        total_servicios: Number(editForm.total_servicios) || 0,
        estado: editForm.estado
      });
      setShowSuccess(true);
      setTimeout(() => {
        handleCloseModal();
        fetchData();
      }, 2000);
    } catch (error) {
      console.error('Error al cerrar caso:', error);
      alert('Error al guardar');
    } finally {
      setIsUpdating(false);
    }
  };

  const teamColumns = useMemo<ColumnDef<TeamMember>[]>(() => [
    { accessorKey: 'radicado', header: 'Radicado', meta: { filterType: 'multiselect' }, enableSorting: true },
    { accessorKey: 'raw.ruta_imagen', header: 'Ruta Imagen', meta: { filterType: 'multiselect' }, cell: ({ row }) => {
        const v = (row.original as any).raw?.ruta_imagen;
        return <span>{v ?? ''}</span>;
      }
    },
    { accessorKey: 'ips_nit', header: 'IPS NIT', meta: { filterType: 'text' }, cell: ({ row }) => {
        const v = row.getValue('ips_nit') as string | undefined;
        return <span>{v ?? ''}</span>;
      }
    },
    { accessorKey: 'factura', header: 'Factura', meta: { filterType: 'text' }, cell: ({ row }) => {
        const v = row.getValue('factura') as string | undefined;
        return <span>{v ?? ''}</span>;
      }
    },
    { accessorKey: 'estado', header: 'Estado', meta: { filterType: 'multiselect', options: estadosOptions }, cell: ({ row }) => {
        const estado = row.getValue('estado') as string | undefined;
        if (!estado) return <span className={styles.statusBadge}>-</span>;
        const estadoClass = estado.toLowerCase().replace(/\s+/g, '');
        return <span className={`${styles.statusBadge} ${styles[estadoClass] || ''}`}>{estado}</span>;
      }
    },
    // ⬇️ Fechas con HH:mm
    { accessorKey: 'fecha_inicio', header: 'Fecha Inicio', meta: { filterType: 'none' }, cell: ({ row }) => {
        const v = row.getValue('fecha_inicio') as string;
        return <span>{formatDateTime(v)}</span>;
      }
    },
    { accessorKey: 'fecha_fin', header: 'Fecha Fin', meta: { filterType: 'none' }, cell: ({ row }) => {
        const v = row.getValue('fecha_fin') as string | null;
        return <span>{formatDateTime(v)}</span>;
      }
    },
    { accessorKey: 'total_minutos', header: 'Total Minutos', meta: { filterType: 'none' }, cell: ({ row }) => {
        const val = row.getValue('total_minutos') as number | null;
        return val == null ? '' : `${val} min`;
      }
    },
    { accessorKey: 'total_servicios', header: 'Total Servicios', meta: { filterType: 'none' }, cell: ({ row }) => {
        const v = row.original.total_servicios;
        return v == null ? '' : v;
      }
    },
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
                    <div key={estado} className={`${styles.statCard} ${styles[`stat_${estadoClass}`] || ''}`}>
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

      {/* Overlay: ya tienes un caso asignado */}
      {showAssignedOverlay && (
        <div className={styles.warningOverlay} role="alert" aria-live="assertive">
          <div className={styles.warningBox}>
            <div className={styles.warningIcon}>⚠️</div>
            <h4 className={styles.warningTitle}>Ya tienes un caso asignado</h4>
            <p className={styles.warningText}>Debes cerrarlo antes de solicitar uno nuevo.</p>
            <p className={styles.warningNote}>
              Si no tienes caso, contacta al administrador para que te ayude.
            </p>
          </div>
        </div>
      )}

      <Modal 
        isOpen={showModal && !!selectedCase} 
        onClose={handleCloseModal}
        title={showSuccess ? undefined : "Editar Caso"}
      >
        {selectedCase && (
          <>
            {showSuccess ? (
              <div className={styles.successContainer}>
                <div className={styles.checkmark}>
                  <svg viewBox="0 0 52 52" className={styles.checkmarkSvg}>
                    <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none"/>
                    <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                  </svg>
                </div>
                <h3 className={styles.successTitle}>¡Registro Exitoso!</h3>
                <p className={styles.successText}>El caso ha sido actualizado correctamente</p>
              </div>
            ) : (
              <>
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
                  <span className={styles.value}>{formatDateTime(selectedCase.fecha_inicio)}</span>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Total Servicios *</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={editForm.total_servicios}
                    placeholder="Ingrese cantidad"
                    min="1"
                    onChange={(e) => setEditForm({ ...editForm, total_servicios: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Estado *</label>
                  <select
                    className={styles.formSelect}
                    value={editForm.estado}
                    onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                  >
                    <option value="">Seleccione un estado</option>
                    {estadosOptions.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div className={styles.modalFooter}>
                  <button className={styles.cancelButton} onClick={handleCloseModal}>Cancelar</button>
                  <button
                    className={styles.saveButton}
                    onClick={handleUpdateCase}
                    disabled={isUpdating || !isFormValid}
                  >
                    {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};
