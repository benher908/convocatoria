'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import styles from '../../../styles/destacados.module.css';

export default function DestacadosPage() {
  // Dejamos los arrays vacíos para que no se renderice ninguna imagen
  const arrayVacio = Array.from({ length: 20 });

  return (
    <main className={styles.page}>
      <Destacado
        año="2025"
        mensaje="Aquí va el mensaje inspirador de la directora para el evento del año 2025..."
        datos={{
          finalistas: arrayVacio,
          ganadoras: arrayVacio,
          ceremonia: arrayVacio,
        }}
      />
      <Destacado
        año="2024"
        mensaje="Recordando el éxito del 2024, la directora agradece a todas las participantes..."
        datos={{
          finalistas: arrayVacio,
          ganadoras: arrayVacio,
          ceremonia: arrayVacio,
        }}
      />
    </main>
  );
}

function Destacado({ año, mensaje, datos }) {
  const [verMas, setVerMas] = useState(false);

  const secciones = [
    { titulo: 'FINALISTAS', imagenes: datos.finalistas },
    { titulo: 'GANADORAS', imagenes: datos.ganadoras },
    { titulo: 'CEREMONIA DE PREMIACIÓN', imagenes: datos.ceremonia },
  ];

  const imagenesPorSeccion = 20;
  const imagenesIniciales = 3;

  return (
    <section className={styles.destacadoSection}>
      <h2 className={styles.destacadoTitle}>{`DESTACADO ${año}`}</h2>
      <div className={styles.mainLayout}>
        <div className={styles.messageBox}>
          <h3 className={styles.messageBoxTitle}>Mensaje de la Directora</h3>
          <p className={styles.messageBoxText}>{mensaje}</p>
        </div>

        <div className={styles.sectionsContainer}>
          {secciones.map((seccion) => (
            <div key={seccion.titulo} className={styles.section}>
              <h3 className={styles.sectionTitle}>{seccion.titulo}</h3>
              <div className={styles.imageGallery}>
                {/* Iteramos sobre un array vacío, por lo que no se mostrarán imágenes */}
                {seccion.imagenes.slice(0, verMas ? imagenesPorSeccion : imagenesIniciales).map((_, idx) => (
                  <div key={idx} className={styles.imageContainer}>
                    {/* El componente Image se renderiza, pero sin una URL de origen. 
                        El onError se encargará de darle un color de fondo gris a cada cuadro vacío. */}
                    <Image
                      src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                      alt={`Cuadro de foto ${idx + 1}`}
                      fill
                      style={{objectFit: 'cover'}}
                      onError={(e) => { e.currentTarget.style.backgroundColor = '#d1d5db'; e.currentTarget.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="; }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!verMas && (
        <div className={styles.verMasButton}>
          <button onClick={() => setVerMas(true)}>Ver todas las fotos</button>
        </div>
      )}
    </section>
  );
}