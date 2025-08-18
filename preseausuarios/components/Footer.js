import Image from 'next/image';
import Link from 'next/link';
import styles from '../styles/Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.logoContainer}>
        <Link href="/">
          <Image
            src="/images/logo.png"
            alt="Logo STEM Footer"
            width={150}
            height={150}
          />
        </Link>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <strong>Redes Sociales</strong>
          <a href="https://www.facebook.com/STEMUTyP?locale=es_LA">Facebook</a>
          <a href="https://www.instagram.com/stem_utyp">Instagram</a>
        </div>

        <div className={styles.section}>
          <strong>Alianzas</strong>
          <p>Universidad Tecnológica</p>
          <p>Universidad Politécnica</p>
          <p>Gobierno Federal</p>
        </div>
      </div>
    </footer>
  );
}