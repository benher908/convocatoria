"use client";
import React from 'react';
import Image from 'next/image';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css"; 
import styles from '../../../styles/nosotros.module.css';

const carouselImages = [
  { src: "/images/carrusel-1.jpg", alt: "Descripción de la imagen 1" },
  { src: "/images/carrusel-2.jpg", alt: "Descripción de la imagen 2" },
  { src: "/carrusel-3.jpg", alt: "Descripción de la imagen 3" },
];

export default function NosotrosPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Sobre Nosotros</h1>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Misión</h2>
        <p className={styles.sectionText}>
          Nuestra misión es fomentar la participación y el empoderamiento de las mujeres en el ámbito STEM mediante herramientas tecnológicas, eventos y convocatorias inclusivas.
        </p>
      </section>

      <section className={styles.carouselSection}>
        <div className={styles.carouselContainer}>
          <Carousel
            showThumbs={false}
            showStatus={false}
            infiniteLoop={true}
            autoPlay={true}
            interval={5000}
          >
            {carouselImages.map((image) => (
              <div key={image.src} className={styles.slide}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  style={{objectFit: 'cover'}}
                />
              </div>
            ))}
          </Carousel>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Visión</h2>
        <p className={styles.sectionText}>
          Ser la plataforma líder que impulse y conecte el talento femenino en ciencia y tecnología, creando una comunidad sólida y equitativa que transforme el futuro de la innovación en México y el mundo.
        </p>
      </section>
    </main>
  );
}