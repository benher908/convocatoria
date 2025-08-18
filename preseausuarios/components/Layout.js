// frontend/components/Layout.js
"use client";

import React, { useState } from 'react';
import styles from '../styles/layout.module.css';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout({ children, isAuthenticated, user }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <Header
        isAuthenticated={isAuthenticated}
        user={user}
        onToggleSidebar={isAuthenticated ? toggleSidebar : null} // <-- Asegúrate de que esta línea esté correcta
      />
      
      <div className={styles.layoutWrapper}>
        {isAuthenticated && (
          <Sidebar
            isAuthenticated={isAuthenticated}
            isSidebarOpen={isSidebarOpen}
          />
        )}
        <main className={isAuthenticated ? styles.mainContent : styles.fullWidthContent}>
          {children}
        </main>
      </div>
    </>
  );
}