import { GoogleIcon } from '../../icons';
import styles from './SocialLogin.module.css';
import { auth, googleProvider } from '../../../config/firebase';
import { API_URL } from '../../../config/api';
import { signInWithPopup } from 'firebase/auth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import type { BackendUserInfo } from '../../../types/auth';

export const SocialLogin = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { setUserFromBackend, setUserRole } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();

      try {
        const response = await fetch(`${API_URL}/auth/verify-token`, {
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
          console.warn('Fallo verificación backend. Status:', response.status);
          // Fallback mínimo (sin backend)
          setUserRole('usuario');
        } else {
          const backendData = await response.json() as BackendUserInfo;
          setUserFromBackend({ firebaseUser: result.user, backend: backendData, token });
        }
      } catch (verifyError) {
        console.warn('Backend no disponible para verificar token:', verifyError);
        setUserRole('usuario');
      }
      navigate('/dashboard');
    } catch (error) {
      setErrorMessage('Error al iniciar sesión con Google');
      console.error('Error login Google:', error);
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