import Link from "next/link";
import Image from "next/image";
import styles from "../styles/Card.module.css";

export default function Card({ title, href, imageSrc }) {
  const content = (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={`Imagen para ${title}`}
            fill
            className={styles.image}
          />
        ) : (
          <div className={styles.placeholder} />
        )}
      </div>
      <h4 className={styles.title}>{title}</h4>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}