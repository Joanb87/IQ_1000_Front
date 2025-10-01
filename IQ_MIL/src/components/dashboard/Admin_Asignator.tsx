import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import styles from './Admin_Asignator.module.css';

interface Operator {
  id: string;
  email: string;
  active: boolean;
}

interface Leader {
  id: string;
  email: string;
  name: string;
  operators: Operator[];
}

// Datos dummy - 15 líderes
const DUMMY_LEADERS: Leader[] = [
  {
    id: 'L1',
    email: 'carlos.rodriguez@example.com',
    name: 'Carlos Rodríguez',
    operators: [
      { id: 'O1', email: 'operador1@example.com', active: true },
      { id: 'O2', email: 'operador2@example.com', active: true },
      { id: 'O3', email: 'operador3@example.com', active: false },
    ]
  },
  {
    id: 'L2',
    email: 'maria.garcia@example.com',
    name: 'María García',
    operators: [
      { id: 'O4', email: 'operador4@example.com', active: true },
      { id: 'O5', email: 'operador5@example.com', active: true },
    ]
  },
  {
    id: 'L3',
    email: 'juan.martinez@example.com',
    name: 'Juan Martínez',
    operators: [
      { id: 'O6', email: 'operador6@example.com', active: true },
      { id: 'O7', email: 'operador7@example.com', active: false },
    ]
  },
  {
    id: 'L4',
    email: 'ana.lopez@example.com',
    name: 'Ana López',
    operators: [
      { id: 'O8', email: 'operador8@example.com', active: true },
    ]
  },
  {
    id: 'L5',
    email: 'pedro.sanchez@example.com',
    name: 'Pedro Sánchez',
    operators: [
      { id: 'O9', email: 'operador9@example.com', active: true },
      { id: 'O10', email: 'operador10@example.com', active: true },
      { id: 'O11', email: 'operador11@example.com', active: false },
    ]
  },
  {
    id: 'L6',
    email: 'laura.fernandez@example.com',
    name: 'Laura Fernández',
    operators: [
      { id: 'O12', email: 'operador12@example.com', active: true },
      { id: 'O13', email: 'operador13@example.com', active: true },
    ]
  },
  {
    id: 'L7',
    email: 'miguel.torres@example.com',
    name: 'Miguel Torres',
    operators: [
      { id: 'O14', email: 'operador14@example.com', active: true },
    ]
  },
  {
    id: 'L8',
    email: 'sofia.ramirez@example.com',
    name: 'Sofía Ramírez',
    operators: [
      { id: 'O15', email: 'operador15@example.com', active: false },
      { id: 'O16', email: 'operador16@example.com', active: true },
      { id: 'O17', email: 'operador17@example.com', active: true },
    ]
  },
  {
    id: 'L9',
    email: 'diego.morales@example.com',
    name: 'Diego Morales',
    operators: [
      { id: 'O18', email: 'operador18@example.com', active: true },
      { id: 'O19', email: 'operador19@example.com', active: true },
    ]
  },
  {
    id: 'L10',
    email: 'carmen.silva@example.com',
    name: 'Carmen Silva',
    operators: [
      { id: 'O20', email: 'operador20@example.com', active: true },
    ]
  },
  {
    id: 'L11',
    email: 'roberto.castro@example.com',
    name: 'Roberto Castro',
    operators: [
      { id: 'O21', email: 'operador21@example.com', active: false },
      { id: 'O22', email: 'operador22@example.com', active: true },
    ]
  },
  {
    id: 'L12',
    email: 'patricia.ruiz@example.com',
    name: 'Patricia Ruiz',
    operators: [
      { id: 'O23', email: 'operador23@example.com', active: true },
      { id: 'O24', email: 'operador24@example.com', active: true },
      { id: 'O25', email: 'operador25@example.com', active: false },
    ]
  },
  {
    id: 'L13',
    email: 'antonio.diaz@example.com',
    name: 'Antonio Díaz',
    operators: [
      { id: 'O26', email: 'operador26@example.com', active: true },
    ]
  },
  {
    id: 'L14',
    email: 'elena.jimenez@example.com',
    name: 'Elena Jiménez',
    operators: [
      { id: 'O27', email: 'operador27@example.com', active: true },
      { id: 'O28', email: 'operador28@example.com', active: true },
    ]
  },
  {
    id: 'L15',
    email: 'fernando.ortiz@example.com',
    name: 'Fernando Ortiz',
    operators: [
      { id: 'O29', email: 'operador29@example.com', active: false },
      { id: 'O30', email: 'operador30@example.com', active: true },
      { id: 'O31', email: 'operador31@example.com', active: true },
    ]
  },
];

export const AdminDashboard = () => {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [expandedLeader, setExpandedLeader] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<'leader' | 'operator' | null>(null);
  const [targetLeaderId, setTargetLeaderId] = useState<string | null>(null);
  const [newLeaderName, setNewLeaderName] = useState('');
  const [newLeaderEmail, setNewLeaderEmail] = useState('');
  const [newOperatorEmail, setNewOperatorEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLeaders(DUMMY_LEADERS);
  }, []);

  const toggleLeader = (leaderId: string) => {
    setExpandedLeader(expandedLeader === leaderId ? null : leaderId);
  };

  const createLeader = () => {
    if (!newLeaderName.trim() || !newLeaderEmail.trim()) return;
    
    const newLeader: Leader = {
      id: `L${Date.now()}`,
      email: newLeaderEmail,
      name: newLeaderName,
      operators: []
    };
    
    setLeaders([...leaders, newLeader]);
    setNewLeaderName('');
    setNewLeaderEmail('');
    setShowModal(null);
  };

  const createOperator = () => {
    if (!newOperatorEmail.trim() || !targetLeaderId) return;
    
    const newOperator: Operator = {
      id: `O${Date.now()}`,
      email: newOperatorEmail,
      active: true,
    };
    
    setLeaders(leaders.map(leader =>
      leader.id === targetLeaderId
        ? { ...leader, operators: [...leader.operators, newOperator] }
        : leader
    ));
    
    setNewOperatorEmail('');
    setShowModal(null);
    setTargetLeaderId(null);
  };

  const toggleOperator = (leaderId: string, operatorId: string) => {
    setLeaders(leaders.map(leader =>
      leader.id === leaderId
        ? {
            ...leader,
            operators: leader.operators.map(op =>
              op.id === operatorId ? { ...op, active: !op.active } : op
            )
          }
        : leader
    ));
  };

  const removeOperator = (leaderId: string, operatorId: string) => {
    setLeaders(leaders.map(leader =>
      leader.id === leaderId
        ? {
            ...leader,
            operators: leader.operators.filter(op => op.id !== operatorId)
          }
        : leader
    ));
  };

  const removeLeader = (leaderId: string) => {
    if (!confirm('¿Eliminar este líder y sus operadores?')) return;
    setLeaders(leaders.filter(l => l.id !== leaderId));
  };

  const openAddOperatorModal = (leaderId: string) => {
    setTargetLeaderId(leaderId);
    setShowModal('operator');
  };

  // Filtrar líderes por búsqueda
  const filteredLeaders = leaders.filter(leader =>
    leader.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    leader.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Asignación de Operadores</h1>
        <button className={styles.btnPrimary} onClick={() => setShowModal('leader')}>
          + Crear Líder
        </button>
      </div>

      <div className={styles.searchBar}>
        <Search className={styles.searchIcon} size={18} />
        <input
          type="text"
          placeholder="Buscar líder por nombre o correo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        {searchQuery && (
          <button
            className={styles.clearBtn}
            onClick={() => setSearchQuery('')}
            title="Limpiar búsqueda"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className={styles.accordionContainer}>
        {filteredLeaders.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{searchQuery ? 'No se encontraron líderes' : 'No hay líderes creados'}</p>
            {!searchQuery && (
              <button className={styles.btnPrimary} onClick={() => setShowModal('leader')}>
                Crear Primer Líder
              </button>
            )}
          </div>
        ) : (
          filteredLeaders.map(leader => (
            <div key={leader.id} className={styles.accordionItem}>
              <div className={styles.accordionHeader}>
                <div className={styles.leaderInfo} onClick={() => toggleLeader(leader.id)}>
                  <div className={styles.leaderMain}>
                    <span className={styles.chevron}>
                      {expandedLeader === leader.id ? '▼' : '▶'}
                    </span>
                    <div>
                      <h3 className={styles.leaderName}>{leader.name}</h3>
                      <p className={styles.leaderEmail}>{leader.email}</p>
                    </div>
                  </div>
                  <span className={styles.badge}>
                    {leader.operators.length} operador{leader.operators.length !== 1 ? 'es' : ''}
                  </span>
                </div>
                <button
                  className={`${styles.btnIcon} ${styles.btnDanger}`}
                  onClick={() => removeLeader(leader.id)}
                  title="Eliminar líder"
                >
                  🗑
                </button>
              </div>

              {expandedLeader === leader.id && (
                <div className={styles.accordionContent}>
                  {leader.operators.length === 0 ? (
                    <div className={styles.emptyOperators}>
                      <p>No hay operadores asignados</p>
                    </div>
                  ) : (
                    <div className={styles.operatorsList}>
                      {leader.operators.map(op => (
                        <div
                          key={op.id}
                          className={`${styles.operatorCard} ${!op.active ? styles.inactive : ''}`}
                        >
                          <div className={styles.operatorInfo}>
                            <span className={styles.operatorEmail}>{op.email}</span>
                            <span className={styles.operatorStatus}>
                              {op.active ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          <div className={styles.operatorActions}>
                            <button
                              className={styles.btnIcon}
                              onClick={() => toggleOperator(leader.id, op.id)}
                              title={op.active ? 'Desactivar' : 'Activar'}
                            >
                              {op.active ? '⏸' : '▶'}
                            </button>
                            <button
                              className={`${styles.btnIcon} ${styles.btnDanger}`}
                              onClick={() => removeOperator(leader.id, op.id)}
                              title="Eliminar"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <button
                    className={styles.btnAdd}
                    onClick={() => openAddOperatorModal(leader.id)}
                  >
                    + Agregar Operador
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal crear líder */}
      {showModal === 'leader' && (
        <div className={styles.modal} onClick={() => setShowModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Crear Nuevo Líder</h2>
            
            <div className={styles.inputGroup}>
              <label>Nombre completo</label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez"
                value={newLeaderName}
                onChange={(e) => setNewLeaderName(e.target.value)}
                autoFocus
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Email</label>
              <input
                type="email"
                placeholder="juan@ejemplo.com"
                value={newLeaderEmail}
                onChange={(e) => setNewLeaderEmail(e.target.value)}
              />
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setShowModal(null)}>
                Cancelar
              </button>
              <button
                className={styles.btnPrimary}
                onClick={createLeader}
                disabled={!newLeaderEmail.trim() || !newLeaderName.trim()}
              >
                Crear Líder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear operador */}
      {showModal === 'operator' && (
        <div className={styles.modal} onClick={() => setShowModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Crear Nuevo Operador</h2>
            
            <div className={styles.inputGroup}>
              <label>Email del operador</label>
              <input
                type="email"
                placeholder="operador@ejemplo.com"
                value={newOperatorEmail}
                onChange={(e) => setNewOperatorEmail(e.target.value)}
                autoFocus
              />
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setShowModal(null)}>
                Cancelar
              </button>
              <button
                className={styles.btnPrimary}
                onClick={createOperator}
                disabled={!newOperatorEmail.trim()}
              >
                Crear Operador
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}