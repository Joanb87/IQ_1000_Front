// import { useEffect, useState } from 'react';
// import { LoginForm } from '../LoginForm/LoginForm';
// import { SocialLogin } from '../SocialLogin/SocialLogin';
// import { BackgroundAnimation } from '../BackgroundAnimation/BackgroundAnimation';
// import styles from './LoginPage.module.css';

// export const LoginPage = () => {
//   const [animateText, setAnimateText] = useState(true);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setAnimateText(false);
//       setTimeout(() => setAnimateText(true), 50);
//     }, 5000); // Cambia a 10000 para cada 10 segundos

//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <div className={styles.loginContainer}>
//       <div className={styles.formSection}>
//         <div className={styles.formContent}>
//           <div className={styles.logo}>
//             <img 
//               src="/src/assets/iq_logo.png" 
//               alt="IQ Logo" 
//               className={styles.logoImg}
//             />
//             <img 
//               src="/src/assets/neps_logo.png" 
//               alt="NEPS Logo" 
//               className={styles.logoImg}
//             />
//           </div>

//           <div className={styles.headerText}>
//             <p 
//               className={`${styles.journeyText} ${animateText ? styles.animate : ''}`}
//             >
//               CaseFlow
//             </p>
//           </div>

//           <LoginForm />
//           <SocialLogin />
//         </div>
//       </div>

//       <BackgroundAnimation />
//     </div>
//   );
// };


import { useEffect, useState } from 'react';
import { LoginForm } from '../LoginForm/LoginForm';
import { SocialLogin } from '../SocialLogin/SocialLogin';
import { BackgroundAnimation } from '../BackgroundAnimation/BackgroundAnimation';
import styles from './LoginPage.module.css';

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
            <img src="/src/assets/iq_logo.png" alt="IQ Logo" className={styles.logoImg} />
            <img src="/src/assets/neps_logo.png" alt="NEPS Logo" className={styles.logoImg} />
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