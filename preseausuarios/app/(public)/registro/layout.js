// frontend/app/registro/layout.js
'use client'; // Necesario si usas estilos de módulo o cualquier hook de React

// Importa solo los estilos necesarios para la página de registro
import '../../../styles/globals.css';
import '../../../styles/login.module.css'; // Estilos específicos de login/registro

// ¡IMPORTANTE! Hemos eliminado el bloque 'export const metadata' de aquí.

export default function RegistroLayout({ children }) {
  return (
    <div style={{
      margin: 0,
      padding: 0,
      fontFamily: 'Arial, sans-serif',
      backgroundColor: "#f4f4f4",
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {children} {/* Aquí se renderizará tu página de registro */}
    </div>
  );
}
