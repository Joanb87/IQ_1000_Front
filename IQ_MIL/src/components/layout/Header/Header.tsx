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

  // Función temporal para cambiar roles durante el desarrollo
  const handleRoleChange = (newRole: 'admin' | 'lider' | 'usuario') => {
    setUserRole(newRole);
    setIsProfileOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      // La redirección se manejará por el AuthProvider
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.logoSection}>
        <img 
          src="/src/assets/neps_blanco.png" 
          alt="NEPS Logo" 
          className={styles.logo2}
        />
      </div>
      
      <nav className={styles.navigation}>
        {/* Aquí puedes agregar tus iconos de navegación */}
      </nav>

      <div className={styles.profileSection}>
        <button 
          className={styles.profileButton}
          onClick={() => setIsProfileOpen(!isProfileOpen)}
        >
          <div className={styles.profileContainer}>
            {/* Logo IQ a la izquierda */}
            <div className={styles.companyLogo}>
              <img 
                src="/src/assets/iq_logo.png" 
                alt="IQ Logo" 
                className={styles.companyIcon}
              />
            </div>
            
            {/* Imagen del usuario a la derecha */}
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
              <strong>{user?.displayName}</strong>
              <span>{user?.email}</span>
              <span className={styles.roleLabel}>
                {user?.role && roleLabels[user.role]}
              </span>
            </div>
            <div className={styles.menuDivider} />
            {/* Selector temporal de roles (solo para desarrollo) */}
            <div className={styles.roleSwitcher}>
              <button 
                className={`${styles.roleButton} ${user?.role === 'admin' ? styles.activeRole : ''}`}
                onClick={() => handleRoleChange('admin')}
              >
                Modo Admin
              </button>
              <button 
                className={`${styles.roleButton} ${user?.role === 'lider' ? styles.activeRole : ''}`}
                onClick={() => handleRoleChange('lider')}
              >
                Modo Líder
              </button>
              <button 
                className={`${styles.roleButton} ${user?.role === 'usuario' ? styles.activeRole : ''}`}
                onClick={() => handleRoleChange('usuario')}
              >
                Modo Usuario
              </button>
            </div>
            <div className={styles.menuDivider} />
            <button 
              className={styles.signOutButton}
              onClick={handleSignOut}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
};