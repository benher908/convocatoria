"use client";
import '../styles/globals.css';
import Card from '../components/Card';
import Image from 'next/image';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css"; 
import styles from '../styles/page.module.css';

const destacadosData = [
  { title: "ENCUENTRO DE NIÑAS", href: "/destacados", imageSrc: "/images/Niñas.jpg" },
  { title: "PRESEA NACIONAL", href: "/destacados", imageSrc: "/images/Presea.jpg" },
  { title: "CUENTA CUENTOS", href: "/destacados", imageSrc: "/images/Cuenta.jpg" },
  { title: "ENCUENTRO DE UNIVERSITARIAS", href: "/destacados", imageSrc: "/images/Universitarias.jpg" },
  { title: "ENCUENTRO DE INVESTIGADORAS", href: "/destacados", imageSrc: "/images/Investigadoras.jpg" },
];
const noticiasData = [
    {
    titulo: "¡Convocatoria Abierta!",
    descripcion: "Ya puedes registrarte para el Encuentro de Investigadoras. ¡No te quedes fuera!",
    imageSrc: "/images/noticias.jpeg",
    link: "/convocatorias"
  },
  {
    titulo: "Ganadoras de la Presea 2025",
    descripcion: "Conoce a las mujeres que están cambiando el futuro de la ciencia y la tecnología.",
    imageSrc: "/images/noticias.jpeg",
    link: "/destacados"
  },
];

const primeraFilaDestacados = destacadosData.slice(0, 3);
const segundaFilaDestacados = destacadosData.slice(3);

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.bannerSection}>
        <div className={styles.bannerContainer}> 
          <Image src="/images/banner.jpg" alt="Banner" fill style={{objectFit: 'cover'}} priority />
        </div>
      </section>

      <div className={styles.textSection}>
        <h2>¿Qué es STEM?</h2>
        <p>STEM en mujeres hace referencia al impulso y la participación activa de niñas y mujeres en los
          campos de la Ciencia, Tecnología, Ingeniería y Matemáticas. Esta iniciativa busca reducir la brecha
          de género histórica en estas áreas, promover la igualdad de oportunidades y fomentar el desarrollo de
          talento femenino en sectores clave para la innovación y el progreso social. A través de la educación,
          la capacitación y el acceso a recursos, se fortalece el rol de las mujeres como agentes de cambio en el ámbito científico y tecnológico.
        </p>
      </div>

      <section className={styles.newsCarouselSection}>
        <div className={styles.newsCarouselContainer}>
          <h2>Noticias y Avisos</h2>
          <Carousel showThumbs={false} showStatus={false} infiniteLoop={true} autoPlay={true} interval={6000}>
            {noticiasData.map((noticia) => (
              <div key={noticia.titulo} className={styles.newsSlide}>
                <Image src={noticia.imageSrc} alt={noticia.titulo} fill className={styles.newsImage} />
                <div className={styles.newsOverlay}>
                  <h3>{noticia.titulo}</h3>
                  <p>{noticia.descripcion}</p>
                  <a href={noticia.link}>Ver más</a>
                </div>
              </div>
            ))}
          </Carousel>
        </div>
      </section>

      <div className={styles.destacadosSection}>
        <h3>DESTACADOS</h3>
        <div className={styles.destacadosLayout}>
          <div className={styles.destacadosRowTop}>
            {primeraFilaDestacados.map((card) => <Card key={card.title} {...card} />)}
          </div>
          <div className={styles.destacadosRowBottom}>
            {segundaFilaDestacados.map((card) => <Card key={card.title} {...card} />)}
          </div>
        </div>
      </div>
    </main>
  );
}