import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import styles from './Admin_Asignator.module.css';
import { usuariosService, type Usuario } from '../../services/usuariosService';
import { rolesService, type Rol } from '../../services/rolesService';
import { DataTable_2 } from '../ui/DataTable/DataTable_2';
import type { ColumnDef } from '@tanstack/react-table';

interface LeaderOption { value: string; label: string; }

export const AdminDashboard: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [leaderOptions, setLeaderOptions] = useState<LeaderOption[]>([]);
  const [showModal, setShowModal] = useState<'user' | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRoleId, setNewUserRoleId] = useState<number | ''>('');
  const [newUserLeader, setNewUserLeader] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [us, rs] = await Promise.all([usuariosService.listar(), rolesService.listar()]);
        if (!alive) return;
        setUsuarios(us);
        setRoles(rs);
      } catch (e: any) {
        if (alive) setError(e?.message || 'Error cargando datos');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const roleLiderIds = roles.filter(r => r.nombre.toLowerCase().includes('lid')).map(r => r.id);
    const correos = new Set<string>();
    usuarios.forEach(u => { if (roleLiderIds.includes(u.role_id || -1)) correos.add(u.correo); });
    usuarios.forEach(u => { if (u.id_lider) correos.add(u.id_lider); });
    const opts: LeaderOption[] = Array.from(correos).map(c => {
      const found = usuarios.find(u => u.correo === c);
      return { value: c, label: found?.nombre || c };
    }).sort((a,b)=> a.label.localeCompare(b.label));
    setLeaderOptions(opts);
  }, [usuarios, roles]);

  const createUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserRoleId) return;
    setSaving(true); setError(null);
    try {
      await usuariosService.crear({
        correo: newUserEmail.trim(),
        nombre: newUserName.trim(),
        role_id: newUserRoleId as number,
        id_lider: newUserLeader || undefined,
        activo: true
      });
      setUsuarios(await usuariosService.listar());
      setShowModal(null);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserRoleId('');
      setNewUserLeader('');
    } catch (e: any) { setError(e?.message || 'Error creando usuario'); } finally { setSaving(false); }
  };

  // Eliminado: no se permite eliminar usuarios desde esta vista

  const toggleActivo = useCallback(async (u: Usuario) => {
    setSaving(true); setError(null);
    try { await usuariosService.actualizar(u.correo, { activo: !u.activo }); setUsuarios(prev => prev.map(x => x.correo === u.correo ? { ...x, activo: !x.activo } : x)); }
    catch { setError('Error cambiando estado'); } finally { setSaving(false); }
  }, []);

  const roleNameById = useMemo(() => Object.fromEntries(roles.map(r => [r.id, r.nombre])), [roles]);

  const filteredUsuarios = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter(u => u.correo.toLowerCase().includes(q) || (u.nombre || '').toLowerCase().includes(q));
  }, [usuarios, searchQuery]);

  const onSaveChanges = useCallback(async (changes: Array<{ identifier: string; columnId: string; newValue: any }>) => {
    // Agrupar cambios por usuario
    const grouped: Record<string, Record<string, any>> = {};
    changes.forEach(c => {
      const value = c.newValue === '' ? null : (typeof c.newValue === 'string' ? c.newValue.trim() : c.newValue);
      (grouped[c.identifier] ||= {})[c.columnId] = value;
    });

    // Debug: ver qué se intenta enviar
    console.log('[Asignator] Cambios agrupados:', grouped);

    setSaving(true); setError(null);
    try {
      const updatedUsers: Record<string, any> = {};
      for (const [correo, partialPatch] of Object.entries(grouped)) {
        const current = usuarios.find(u => u.correo === correo);
        if (!current) continue;

        const fullPatch = {
          correo: current.correo, // backend indicaba incluirlo
          nombre: partialPatch.nombre !== undefined ? partialPatch.nombre : current.nombre,
          role_id: partialPatch.role_id !== undefined ? partialPatch.role_id : current.role_id,
          id_lider: partialPatch.id_lider !== undefined ? (partialPatch.id_lider || null) : current.id_lider,
          activo: partialPatch.activo !== undefined ? partialPatch.activo : current.activo,
        };

        console.log('[Asignator] Enviando PATCH', correo, fullPatch);
        await usuariosService.actualizar(correo, fullPatch);
        updatedUsers[correo] = fullPatch; // guardar para estado local
      }

      setUsuarios(prev => prev.map(u => updatedUsers[u.correo] ? { ...u, ...updatedUsers[u.correo] } : u));
    } catch (e: any) {
      console.error('[Asignator] Error guardando:', e);
      setError(e?.message || 'Error guardando cambios');
      // No hacemos rollback de editedCells aquí; DataTable se encargará de mantenerlos para reintento.
      throw e; // Propagar para que DataTable no limpie cambios.
    } finally {
      setSaving(false);
    }
  }, [usuarios]);

  const columns = useMemo<ColumnDef<Usuario>[]>(() => [
    { accessorKey: 'correo', header: 'Correo', meta: { filterType: 'multiselect', minWidth: 220 } },
    { accessorKey: 'nombre', header: 'Nombre', meta: { filterType: 'multiselect', editable: true, editType: 'text', minWidth: 180 } },
    { accessorKey: 'role_id', header: 'Rol', cell: info => roleNameById[info.getValue() as number] || '', meta: { filterType: 'select', options: roles.map(r => r.id), minWidth: 120 } },
    { accessorKey: 'id_lider', header: 'Líder', cell: info => { const val = info.getValue<string | null>(); if (!val) return ''; const opt = leaderOptions.find(o => o.value === val); return opt?.label || val; }, meta: { filterType: 'select', editable: true, editType: 'select', editOptions: leaderOptions, minWidth: 200 } },
    { accessorKey: 'activo', header: 'Activo', cell: info => { const row = info.row.original as Usuario; return <button className={row.activo ? styles.badgeActive : styles.badgeInactive} onClick={() => toggleActivo(row)} disabled={saving}>{row.activo ? 'Sí' : 'No'}</button>; }, meta: { filterType: 'select', options: [true, false], minWidth: 90 } }
  ], [leaderOptions, roleNameById, roles, saving, toggleActivo]);

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Usuarios & Asignaciones</h1>
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={() => setShowModal('user')} disabled={saving}>+ Crear Usuario</button>
        </div>
      </div>

      <DataTable_2
        data={filteredUsuarios}
        columns={columns}
        identifierKey="correo"
        onSaveChanges={onSaveChanges as any}
        externalPageIndex={pageIndex}
        onPageChange={setPageIndex}
        pageSize={8}
      />

      {showModal === 'user' && (
        <div className={styles.modal} onClick={() => setShowModal(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2>Crear Nuevo Usuario</h2>
            <div className={styles.inputGroup}>
              <label>Nombre completo</label>
              <input type="text" placeholder="Ej: Juan Pérez" value={newUserName} onChange={e => setNewUserName(e.target.value)} autoFocus />
            </div>
            <div className={styles.inputGroup}>
              <label>Email</label>
              <input type="email" placeholder="usuario@ejemplo.com" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
            </div>
            <div className={styles.inputGroup}>
              <label>Rol</label>
              <select value={newUserRoleId} onChange={e => setNewUserRoleId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">-- Seleccionar rol --</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>
            {!roles.find(r => r.id === newUserRoleId)?.nombre.toLowerCase().includes('lid') && (
              <div className={styles.inputGroup}>
                <label>Líder</label>
                <select value={newUserLeader} onChange={e => setNewUserLeader(e.target.value)}>
                  <option value="">-- Sin líder --</option>
                  {leaderOptions.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setShowModal(null)} disabled={saving}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={createUser} disabled={!newUserEmail.trim() || !newUserName.trim() || !newUserRoleId || saving}>{saving ? 'Guardando...' : 'Crear Usuario'}</button>
            </div>
          </div>
        </div>
      )}

      {error && <div style={{ marginTop: '1rem', color: '#dc2626', fontSize: '0.75rem' }}>{error}</div>}
      {loading && <div style={{ marginTop: '1rem', color: '#374151', fontSize: '0.7rem' }}>Cargando usuarios...</div>}
    </div>
  );
};

export default AdminDashboard;
