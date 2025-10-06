import { useState } from 'react';
import { auth } from '../../../config/firebase';
import { useAuth } from '../../../context/AuthContext';
import styles from './Header.module.css';
import nepsblanco from '../../../assets/neps_blanco.png';
import iqLogo from '../../../assets/iq_logo.png';


const roleLabels = {
  admin: 'Administrador',
  lider: 'Líder',
  usuario: 'Usuario'
};

export const Header = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user } = useAuth();



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
            src={nepsblanco}
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
                src={iqLogo}
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