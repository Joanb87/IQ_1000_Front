import type { InputGroupProps } from '../../../types/auth';
import styles from './InputGroup.module.css';

export const InputGroup: React.FC<InputGroupProps> = ({
  label,
  type,
  id,
  placeholder,
  value,
  onChange
}) => {
  return (
    <div className={styles.inputGroup}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={styles.input}
      />
    </div>
  );
};