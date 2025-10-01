import { useState } from 'react';
import type { LoginFormData } from '../../../types/auth';
import { InputGroup } from '../../ui/InputGroup/InputGroup';
import styles from './LoginForm.module.css';

export const LoginForm = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Aquí iría la lógica de autenticación
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  return (
    <form className={styles.signupForm} onSubmit={handleSubmit}>
      <InputGroup
        label="Usuario"
        type="email"
        id="email"
        placeholder="ejemplo@email.com"
        value={formData.email}
        onChange={handleChange}
      />
      <InputGroup
        label="Contraseña"
        type="password"
        id="password"
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange}
      />
      <button type="submit" className={styles.submitButton}>
        Iniciar Sesión
      </button>
    </form>
  );
};