import { GoogleIcon } from '../../icons';
import styles from './SocialLogin.module.css';
import { auth, googleProvider } from '../../../config/firebase';
import { signInWithPopup } from 'firebase/auth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import type { UserRole } from '../../../types/auth';

export const SocialLogin = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { setUserRole } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      
      // Cuando conectes con el backend, descomentar este código:
      try {
        const response = await fetch('tu-api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL
          })
        });

        if (!response.ok) {
          throw new Error('Error en la verificación del usuario');
        }

        const { role } = await response.json();
        setUserRole(role);
      } catch (error) {
        // Mientras no haya backend, usamos un rol por defecto
        console.log('Backend no disponible, usando rol por defecto');
        setUserRole('usuario');
      }

      navigate('/dashboard');
    } catch (error) {
      setErrorMessage('Error al iniciar sesión con Google');
      console.error('Error:', error);
    }
  };

  return (
    <div className={styles.socialSection}>
      <p className={styles.socialText}>Inicia con</p>
      {errorMessage && (
        <p className={styles.errorMessage}>{errorMessage}</p>
      )}
      <div className={styles.socialButtons}>
        <button 
          className={styles.socialBtn} 
          onClick={handleGoogleLogin}
          aria-label="Iniciar Sesión con Google"
        >
          <GoogleIcon />
          <span>Iniciar Sesión con Google</span>
        </button>
      </div>
    </div>
  );
};