// frontend/components/Header.jsx
'use client';

import Link from 'next/link';
import Image from 'next/image'; 
import styles from '../styles/layout.module.css';
import { useRouter } from 'next/navigation';
import api from '../services/axiosConfig';

export default function Header({ isAuthenticated, user, onToggleSidebar }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className={styles.header}>
  
      <div className={styles.leftSection}> 
        {isAuthenticated && (
          <button onClick={onToggleSidebar} className={styles.menuButton}>
            &#9776;
          </button>
        )}
        <Link href="/" className={styles.logoLink}>
          <Image
            src="/images/logo.png"
            alt="Logo STEM"
            width={100}
            height={100}
          />
        </Link>
      </div>

      {/* La sección de logout/autenticación se mantiene a la derecha */}
      <div className={styles.logoutSection}>
        {isAuthenticated ? (
          <>
            <span className={styles.welcomeText}>
              Hola, {user?.nombre || user?.email || 'Usuario'}
            </span>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Cerrar sesión
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </>
        ) : (
          <div className={styles.authLinks}>
            <Link href="/registro" className={styles.registerLink}>
              Registrarse
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}