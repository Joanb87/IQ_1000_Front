import { Header } from '../layout/Header/Header';
import styles from './Home.module.css';

export const Home = () => {
  return (
    <div className={styles.homeContainer}>
      <Header />
      <main className={styles.mainContent}>
      </main>
    </div>
  );
};