"use client"; // ¡Importante para que sea un Client Component!

import { useState } from "react";
import styles from "@/styles/login.module.css";
import api from "@/services/axiosConfig"; // Tu instancia de Axios
import { useRouter } from "next/navigation";
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorLocal, setErrorLocal] = useState("");
  const [loading, setLoading] = useState(false); // Estado de carga local para el login

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorLocal("");
    setLoading(true); // Activa el estado de carga

    if (!email || !password) {
      setErrorLocal("Por favor, completa todos los campos.");
      setLoading(false);
      return;
    }

    try {
      // La petición de login establecerá la cookie HttpOnly en el navegador
      const response = await api.post('/auth/login', { email, password });

      if (response.status === 200) {
        console.log('LoginPage: Login exitoso. Redirigiendo a /perfil.');
        // Después de un login exitoso, redirigimos.
        // El AuthenticatedLayout o HomePage se encargarán de verificar la sesión.
        router.push('/perfil'); 
      } else {
        setErrorLocal(response.data.message || "Credenciales inválidas. Inténtalo de nuevo.");
      }
    } catch (err) {
      console.error("LoginPage: Error al iniciar sesión:", err.response?.data?.message || err.message);
      setErrorLocal(err.response?.data?.message || "Error al iniciar sesión.");
    } finally {
      setLoading(false); // Desactiva el estado de carga
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.titulo}>Iniciar Sesión</h2>
      <form className={styles.formulario} onSubmit={handleSubmit}>
        <label htmlFor="email" className={styles.label}>Correo electrónico:</label>
        <input
          id="email"
          type="email"
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading} // Deshabilitar mientras se está cargando
        />

        <label htmlFor="password" className={styles.label}>Contraseña:</label>
        <input
          id="password"
          type="password"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading} // Deshabilitar mientras se está cargando
        />

        {errorLocal && <p className={styles.error}>{errorLocal}</p>}
        {loading && <p className={styles.loading}>Iniciando sesión...</p>}

        <button type="submit" className={styles.boton} disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className={styles.registroLink}>
        ¿No tienes cuenta? <Link href="/registro">Regístrate aquí</Link>
      </p>
    </div>
  );
}
