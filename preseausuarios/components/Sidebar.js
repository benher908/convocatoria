// frontend/components/Sidebar.jsx
'use client';

import Link from 'next/link';
import styles from '../styles/layout.module.css';
import { usePathname } from 'next/navigation';

export default function Sidebar({ isAuthenticated, isSidebarOpen }) {
  const pathname = usePathname();

  if (!isAuthenticated) {
    return null;
  }

  const sidebarClasses = `${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`;

  return (
    <aside className={sidebarClasses}>
      <nav className={styles.sidebarNav}>
        <ul>
          <li>
            <Link href="/perfil" className={`${styles.sidebarLink} ${pathname === '/perfil' ? styles.active : ''}`}>
              Perfil
            </Link>
          </li>
          <li>
            <Link href="/escolaridad" className={`${styles.sidebarLink} ${pathname === '/escolaridad' ? styles.active : ''}`}>
              Escolaridad
            </Link>
          </li>
          <li>
            <Link href="/actividades" className={`${styles.sidebarLink} ${pathname === '/actividades' ? styles.active : ''}`}>
              Actividades
            </Link>
          </li>
          <li>
            <Link href="/logros" className={`${styles.sidebarLink} ${pathname === '/logros' ? styles.active : ''}`}>
              Logros
            </Link>
          </li>
          <li>
            <Link href="/experiencia" className={`${styles.sidebarLink} ${pathname === '/experiencia' ? styles.active : ''}`}>
              Experiencia
            </Link>
          </li>
          <li>
            <Link href="/habilidades" className={`${styles.sidebarLink} ${pathname === '/habilidades' ? styles.active : ''}`}>
              Habilidades
            </Link>
          </li>
          <li>
            <Link href="/investigacion" className={`${styles.sidebarLink} ${pathname === '/investigacion' ? styles.active : ''}`}>
              Investigación
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}