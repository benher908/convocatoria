import Image from 'next/image';
import styles from '../../../styles/contacto.module.css';

export default function Contacto() {
  return (
    <div className={styles.page}>
      
      <div className={styles.header}>
        <h1 className={styles.title}>CONTACTO</h1>
        <p className={styles.subtitle}>Estamos para servirte. ¡Ponte en contacto con nosotros!</p>
      </div>
      
      <div className={styles.mapContainer}>
        <a
          href="https://www.google.com/maps/place/Universidad+Tecnológica+de+Tehuacán/@18.4146449,-97.3466508,17z/data=!3m1!4b1!4m6!3m5!1s0x85c5bc949e873fa1:0xba8168c5cffd0772!8m2!3d18.4146449!4d-97.3440759!16s%2Fg%2F11b6x74hz8?entry=ttu&g_ep=EgoyMDI1MDczMC4wIKXMDSoASAFQAw%3D%3D"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.mapLink}
        >
          <Image
            src="/images/mapa-utt.png"
            alt="Mapa de la ubicación de la UTT"
            fill
            className={styles.mapImage}
          />
        </a>
      </div>

      <div className={styles.address}>
        <p>Boulevard Socorro Romero Sánchez No. 3801</p>
        <p>San Pablo Tepetzingo, Tehuacán, Puebla, México. C.P. 75859</p>
      </div>

      <div className={styles.contactInfo}>
        <div className={styles.infoBlock}>
          <h3>Teléfono:</h3>
          <p>01 (238) 382 11 91</p>
        </div>
        <div className={styles.infoBlock}>
          <h3>Correo electrónico:</h3>
          <p>contacto@uttehuacan.edu.mx</p>
        </div>
      </div>
    </div>
  );
}