"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../styles/Navbar.module.css';
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "/convocatorias", text: "Convocatorias" },
    { href: "/nosotros", text: "Nosotros" },
    { href: "/contacto", text: "Contacto" },
  ];

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        
        <div className={styles.logo}>
          <Link href="/">
            <Image
              src="/images/logo.png"
              alt="Logo STEM"
              width={100}
              height={100}
            />
          </Link>
        </div>

        {/* Menú para Escritorio */}
        <div className={styles.desktopMenu}>
          <ul className={styles.desktopNavList}>
            {navLinks.map((link) => (
              <li key={link.text}>
                <Link href={link.href} className={styles.navLink}>{link.text}</Link>
              </li>
            ))}
          </ul>
          <div className={styles.actionButtons}>
            <Link href="/registro" className={styles.actionButton}>
              Registro
            </Link>
          </div>
        </div>

        {/* Botón de Hamburguesa */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={styles.hamburgerButton}
        >
          <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            )}
          </svg>
        </button>
      </div>

      {/* Menú desplegable para Móvil */}
      {isOpen && (
        <div className={styles.mobileMenu}>
          <ul className={styles.mobileNavList}>
            {navLinks.map((link) => (
              <li key={link.text}>
                <Link href={link.href} className={styles.mobileNavLink}>{link.text}</Link>
              </li>
            ))}
          </ul>
          <div className={styles.mobileActionButtons}>
            <Link href="/iniciar-sesion" className={styles.mobileActionButton}>
              Iniciar Sesión
            </Link>
            <Link href="/registro" className={styles.mobileActionButton}>
              Registro
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}