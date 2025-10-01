import styles from './LeaderDashboard.module.css';

export const LeaderDashboard = () => {
  return (
    <div className={styles.dashboard}>
      <h1>Panel de Líder</h1>
      <div className={styles.content}>
        <section className={styles.section}>
          <h2>Gestión de Equipo</h2>
          {/* Aquí irían los componentes de gestión de equipo */}
        </section>
        <section className={styles.section}>
          <h2>Reportes y Métricas</h2>
          {/* Aquí irían los componentes de reportes */}
        </section>
      </div>
    </div>
  );
};