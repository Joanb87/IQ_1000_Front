import { useAuth } from '../../context/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { LeaderDashboard } from './LeaderDashboard';
import { UserDashboard } from './UserDashboard';
import { DashboardLayout } from './DashboardLayout';
import type { UserRole } from '../../types/auth';
import type { FC } from 'react';

const dashboardComponents: Record<UserRole, FC> = {
  admin: AdminDashboard,
  lider: LeaderDashboard,
  usuario: UserDashboard,
};

export const DashboardRouter = () => {
  const { user, validationError, isValidatingUser, loading } = useAuth();

  // Mostrar loading durante la carga inicial del usuario
  if (loading || !user) {
    return (
      <DashboardLayout>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '400px',
          textAlign: 'center'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #ed1b22', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }}></div>
          <p>Cargando dashboard...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </DashboardLayout>
    );
  }

  // Si el usuario existe pero aún no tiene un rol definido (durante validación inicial)
  if (!user.role || isValidatingUser) {
    return (
      <DashboardLayout>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '400px',
          textAlign: 'center'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #ed1b22', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }}></div>
          <p>Verificando permisos...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </DashboardLayout>
    );
  }

  // Verificar que el usuario tenga un rol válido
  if (!dashboardComponents[user.role]) {
    return (
      <DashboardLayout>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '400px',
          textAlign: 'center'
        }}>
          <h2>Acceso Restringido</h2>
          <p>Tu cuenta no tiene un rol válido asignado.</p>
          <p>Contacta al administrador para obtener acceso.</p>
        </div>
      </DashboardLayout>
    );
  }

  // Verificar si el usuario está inactivo
  if (user.active === false) {
    return (
      <DashboardLayout>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '400px',
          textAlign: 'center'
        }}>
          <h2>Cuenta Inactiva</h2>
          <p>Tu cuenta ha sido desactivada.</p>
          <p>Contacta al administrador para reactivar tu acceso.</p>
        </div>
      </DashboardLayout>
    );
  }

  const DashboardComponent = dashboardComponents[user.role];

  // Debug: Log para identificar el problema
  console.log('[DashboardRouter] User role:', user.role, 'Component:', DashboardComponent?.name);

  return (
    <DashboardLayout>
      {/* Mostrar indicador de validación si está en proceso */}
      {isValidatingUser && (
        <div style={{
          position: 'fixed',
          top: '70px', // Debajo de la cabecera
          right: '10px',
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#666',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          🔄 Verificando acceso...
        </div>
      )}
      
      {/* Mostrar error de validación si existe */}
      {validationError && (
        <div style={{
          position: 'fixed',
          top: '70px',
          right: '10px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#c33',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          ⚠️ {validationError}
        </div>
      )}
      
      <DashboardComponent />
    </DashboardLayout>
  );
};