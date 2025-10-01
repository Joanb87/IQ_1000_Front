// import { LoginForm } from '../LoginForm/LoginForm';
// import { SocialLogin } from '../SocialLogin/SocialLogin';
// import { BackgroundAnimation } from '../BackgroundAnimation/BackgroundAnimation';
// import styles from './LoginPage.module.css';

// export const LoginPage = () => {
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
//               className={styles.journeyText}
//               style={{
//                 animation: `${styles.slideInTitle} 0.8s ease-out forwards, ${styles.lightSweep} 2s ease-in-out 1s infinite`
//               }}
//             >
//               CaseFlow
//             </p>
//             {/* <h1 className={styles.mainTitle}>Ingresa a CaseFlow</h1> */}
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

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimateText(false);
      setTimeout(() => setAnimateText(true), 50);
    }, 5000); // Cambia a 10000 para cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.loginContainer}>
      <div className={styles.formSection}>
        <div className={styles.formContent}>
          <div className={styles.logo}>
            <img 
              src="/src/assets/iq_logo.png" 
              alt="IQ Logo" 
              className={styles.logoImg}
            />
            <img 
              src="/src/assets/neps_logo.png" 
              alt="NEPS Logo" 
              className={styles.logoImg}
            />
          </div>

          <div className={styles.headerText}>
            <p 
              className={`${styles.journeyText} ${animateText ? styles.animate : ''}`}
            >
              CaseFlow
            </p>
          </div>

          <LoginForm />
          <SocialLogin />
        </div>
      </div>

      <BackgroundAnimation />
    </div>
  );
};