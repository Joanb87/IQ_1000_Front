import { useEffect, useState } from 'react';
import { SocialLogin } from '../SocialLogin/SocialLogin';
import { BackgroundAnimation } from '../BackgroundAnimation/BackgroundAnimation';
import styles from './LoginPage.module.css';
import iqLogo from '../../../assets/iq_logo.png';
import nepsLogo from '../../../assets/neps_logo.png';


export const LoginPage = () => {
  const [animateText, setAnimateText] = useState(true);
  const [textAnimation, setTextAnimation] = useState('');

  useEffect(() => {
    const text = "CaseFlow";
    
    const startAnimation = () => {
      let currentIndex = 0;
      setTextAnimation('');
      
      const typeText = () => {
        if (currentIndex <= text.length) {
          setTextAnimation(text.slice(0, currentIndex));
          currentIndex++;
          setTimeout(typeText, 200); // Más lento: 200ms por letra
        }
      };

      typeText();
    };

    if (animateText) {
      startAnimation();
    }

    const interval = setInterval(() => {
      setAnimateText(false);
      setTimeout(() => {
        setAnimateText(true);
      }, 500);
    }, 10000); // Reinicia cada 10 segundos

    return () => clearInterval(interval);
  }, [animateText]);

  return (
    <div className={styles.loginContainer}>
      <div className={styles.formSection}>
        <div className={styles.formContent}>
          <div className={styles.logo}>
            <img src={iqLogo} alt="IQ Logo" className={styles.logoImg} />
            <img src={nepsLogo} alt="NEPS Logo" className={styles.logoImg} />
          </div>
          <div className={styles.headerText}>
            <p className={`${styles.journeyText} ${animateText ? styles.animate : ''}`}>
              {textAnimation}
              <span className={styles.cursor}>|</span>
            </p>
          </div>
          {/* <LoginForm /> */}
          <SocialLogin />
        </div>
      </div>
      <BackgroundAnimation />
    </div>
  );
};