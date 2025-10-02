import styles from './BackgroundAnimation.module.css';
import familiaImage from '../../../assets/familia.jpg';

export const BackgroundAnimation = () => {
  return (
    <div className={styles.backgroundSection}>
      <img 
        src={familiaImage}
        alt="Familia en ambiente médico"
        className={styles.backgroundImage}
      />
      <div className={styles.fluidBackground}>
        <div className={styles.shape1}></div>
        <div className={styles.shape2}></div>
        <div className={styles.shape3}></div>
        <div className={styles.bubble1}></div>
        <div className={styles.bubble2}></div>
        <div className={styles.bubble3}></div>
        <div className={styles.bubble4}></div>
        <div className={styles.bubble5}></div>
      </div>
    </div>
  );
};