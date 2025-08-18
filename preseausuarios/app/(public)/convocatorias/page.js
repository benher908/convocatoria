import React from "react";
import Image from "next/image";
import styles from "../../../styles/convocatorias.module.css";

const convocatorias = [
  {
    titulo: "ENCUENTRO DE NIÑAS",
    descripcion: "Convocatoria abierta a niñas de diferentes regiones...",
    imageSrc: "/images/Niñas.jpg",
  },
  {
    titulo: "PRESEA NACIONAL",
    descripcion: "Reconocimiento a mujeres destacadas por su trayectoria...",
    imageSrc: "/images/Presea.jpg",
  },
  {
    titulo: "CUENTA CUENTOS",
    descripcion: "Programa de narración y lectura para fomentar el pensamiento...",
    imageSrc: "/images/Cuenta.jpg",
  },
  {
    titulo: "ENCUENTRO DE UNIVERSITARIAS",
    descripcion: "Espacio de diálogo y aprendizaje para estudiantes...",
    imageSrc: "/images/Universitarias.jpg",
  },
  {
    titulo: "ENCUENTRO DE INVESTIGADORAS",
    descripcion: "Reunión nacional para compartir proyectos y experiencias...",
    imageSrc: "/images/Investigadoras.jpg",
  },
];

const primeraFila = convocatorias.slice(0, 3);
const segundaFila = convocatorias.slice(3);

export default function Convocatorias() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>CONVOCATORIAS</h1>
      <div className={styles.layoutContainer}>
        <div className={styles.rowTop}>
          {primeraFila.map((convocatoria) => (
            <Card key={convocatoria.titulo} {...convocatoria} />
          ))}
        </div>
        <div className={styles.rowBottom}>
          {segundaFila.map((convocatoria) => (
            <Card key={convocatoria.titulo} {...convocatoria} />
          ))}
        </div>
      </div>
    </main>
  );
}

function Card({ titulo, descripcion, imageSrc }) {
  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <Image src={imageSrc} alt={`Imagen de ${titulo}`} fill style={{objectFit: 'cover'}} />
      </div>
      <div className={styles.cardContent}>
        <h2 className={styles.cardTitle}>{titulo}</h2>
        <p className={styles.cardDescription}>{descripcion}</p>
        <a href="../registro" className={styles.cardButton}>Registro</a>
      </div>
    </div>
  );
}