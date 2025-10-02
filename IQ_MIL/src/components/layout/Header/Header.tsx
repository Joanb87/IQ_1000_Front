import { useState } from 'react';
import { auth } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import styles from './Header.module.css';

const roleLabels = {
  admin: 'Administrador',
  lider: 'Líder',
  usuario: 'Usuario'
};

export const Header = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, setUserRole } = useAuth();

  const handleRoleChange = (newRole: 'admin' | 'lider' | 'usuario') => {
    setUserRole(newRole);
    setIsProfileOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <div className={styles.logoContainer}>
          <img 
            src="/src/assets/neps_blanco.png" 
            alt="NEPS Logo" 
            className={styles.nepsLogo}
          />
          <div className={styles.divider}></div>
          <div className={styles.caseFlowLogo}>
            <span className={styles.caseText}>Case</span>
            <span className={styles.flowText}>Flow</span>
          </div>
        </div>
      </div>
      
      <nav className={styles.navigation}>
        {/* Espacio para futuros iconos de navegación */}
      </nav>

      <div className={styles.profileSection}>
        <button 
          className={styles.profileButton}
          onClick={() => setIsProfileOpen(!isProfileOpen)}
        >
          <div className={styles.profileContainer}>
            <div className={styles.companyLogo}>
              <img 
                src="/src/assets/iq_logo.png" 
                alt="IQ Logo" 
                className={styles.companyIcon}
              />
            </div>
            
            <div className={styles.userInfo}>

            </div>

            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Perfil"
                className={styles.profileImage}
              />
            ) : (
              <div className={styles.profilePlaceholder}>
                {user?.displayName?.charAt(0) || 'U'}
              </div>
            )}
          </div>
        </button>

        {isProfileOpen && (
          <div className={styles.profileMenu}>
            <div className={styles.profileInfo}>
              <div className={styles.userAvatar}>
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Perfil"
                    className={styles.avatarImage}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {user?.displayName?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div className={styles.userDetails}>
                <strong>{user?.displayName}</strong>
                <span>{user?.email}</span>
                <span className={styles.roleBadge}>
                  {user?.role && roleLabels[user.role]}
                </span>
              </div>
            </div>
            
            <div className={styles.menuDivider} />
            
            <div className={styles.roleSwitcher}>
              <h4 className={styles.roleTitle}>Cambiar Rol</h4>
              <div className={styles.roleButtons}>
                <button 
                  className={`${styles.roleButton} ${user?.role === 'admin' ? styles.activeRole : ''}`}
                  onClick={() => handleRoleChange('admin')}
                >
                  <span className={styles.roleDot}></span>
                  Administrador
                </button>
                <button 
                  className={`${styles.roleButton} ${user?.role === 'lider' ? styles.activeRole : ''}`}
                  onClick={() => handleRoleChange('lider')}
                >
                  <span className={styles.roleDot}></span>
                  Líder
                </button>
                <button 
                  className={`${styles.roleButton} ${user?.role === 'usuario' ? styles.activeRole : ''}`}
                  onClick={() => handleRoleChange('usuario')}
                >
                  <span className={styles.roleDot}></span>
                  Usuario
                </button>
              </div>
            </div>
            
            <div className={styles.menuDivider} />
            
            <button 
              className={styles.signOutButton}
              onClick={handleSignOut}
            >
              {/* <span className={styles.signOutIcon}>🚪</span> */}
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
};