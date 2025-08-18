"use client";

import { useState, useEffect } from "react";
import styles from "@/styles/login.module.css";
import api from "@/services/axiosConfig";
import { useRouter } from "next/navigation";
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [apPaterno, setApPaterno] = useState("");
  const [apMaterno, setApMaterno] = useState("");
  const [curp, setCurp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [idRegion, setIdRegion] = useState("");
  const [idCategoria, setIdCategoria] = useState("");
  const [idInstitucion, setIdInstitucion] = useState("");
  const [newInstitutionName, setNewInstitutionName] = useState(""); 
  const [newInstitutionStateId, setNewInstitutionStateId] = useState(""); 
  const [newInstitutionType, setNewInstitutionType] = useState(""); 
  const [foto, setFoto] = useState(null);

  const [regions, setRegions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [states, setStates] = useState([]);

  const [errorLocal, setErrorLocal] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);


  const ADD_NEW_INSTITUTION_VALUE = "add_new";

  
  useEffect(() => {
    const fetchSelectOptions = async () => {
      try {
        const [regionsRes, categoriesRes, institutionsRes, statesRes] = await Promise.all([
          api.get('/regions'),
          api.get('/categories'),
          api.get('/institutions'),
          api.get('/states'), 
        ]);
        setRegions(regionsRes.data);
        setCategories(categoriesRes.data);
      
        setInstitutions([{ id_institucion: ADD_NEW_INSTITUTION_VALUE, nombre_institucion: "-- Agregar nueva institución --" }, ...institutionsRes.data]);
        setStates(statesRes.data);
      } catch (err) {
        console.error("Error al cargar opciones para selects:", err);
        setErrorLocal("Error al cargar datos necesarios. Inténtalo de nuevo.");
      } finally {
        setDataLoading(false);
      }
    };
    fetchSelectOptions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorLocal("");
    setLoading(true);

    if (password !== confirmPassword) {
      setErrorLocal("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    // Validación básica de campos obligatorios
    if (!nombre || !apPaterno || !curp || !email || !password || !idRegion || !idCategoria) {
      setErrorLocal("Por favor, completa todos los campos obligatorios.");
      setLoading(false);
      return;
    }

  
    let finalInstitutionId = idInstitucion;
    if (idInstitucion === ADD_NEW_INSTITUTION_VALUE) {
      if (!newInstitutionName.trim()) {
        setErrorLocal("Por favor, ingresa el nombre de la nueva institución.");
        setLoading(false);
        return;
      }
      if (!newInstitutionStateId) {
        setErrorLocal("Por favor, selecciona el estado de la nueva institución.");
        setLoading(false);
        return;
      }
      if (!newInstitutionType) {
        setErrorLocal("Por favor, selecciona el tipo de la nueva institución.");
        setLoading(false);
        return;
      }
      try {
        const addInstitutionResponse = await api.post('/institutions', { 
          nombre_institucion: newInstitutionName,
          id_estado: newInstitutionStateId,
          tipo_institucion: newInstitutionType
        });
        if (addInstitutionResponse.status === 201 && addInstitutionResponse.data.id_institucion) {
          finalInstitutionId = addInstitutionResponse.data.id_institucion;
        } else {
          setErrorLocal("Error al agregar la nueva institución.");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error al agregar nueva institución:", err.response?.data?.message || err.message);
        setErrorLocal(err.response?.data?.message || "Error al agregar la nueva institución.");
        setLoading(false);
        return;
      }
    } else if (!idInstitucion) { // Si no se seleccionó ninguna institución y no se va a añadir una nueva
      setErrorLocal("Por favor, selecciona una institución o agrega una nueva.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('ap_paterno', apPaterno);
    formData.append('ap_materno', apMaterno);
    formData.append('curp', curp);
    formData.append('correo_contacto', email);
    formData.append('password', password);
    formData.append('id_region_procedencia', idRegion);
    formData.append('id_categoria', idCategoria);
    formData.append('id_institucion', finalInstitutionId); 
    if (foto) {
      formData.append('foto', foto);
    }

    try {
      const response = await api.post('/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        console.log('RegisterPage: Registro exitoso. Redirigiendo a /login.');
        router.push('/login');
      } else {
        setErrorLocal(response.data.message || "Error en el registro.");
      }
    } catch (err) {
      console.error("RegisterPage: Error al registrar:", err.response?.data?.message || err.message);
      setErrorLocal(err.response?.data?.message || "Error al registrar. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.titulo}>Registrarse</h2>
      <form className={styles.formulario} onSubmit={handleSubmit}>
        <label htmlFor="nombre" className={styles.label}>Nombre:</label>
        <input id="nombre" type="text" className={styles.input} value={nombre} onChange={(e) => setNombre(e.target.value)} required disabled={loading} />

        <label htmlFor="apPaterno" className={styles.label}>Apellido Paterno:</label>
        <input id="apPaterno" type="text" className={styles.input} value={apPaterno} onChange={(e) => setApPaterno(e.target.value)} required disabled={loading} />

        <label htmlFor="apMaterno" className={styles.label}>Apellido Materno:</label>
        <input id="apMaterno" type="text" className={styles.input} value={apMaterno} onChange={(e) => setApMaterno(e.target.value)} disabled={loading} />

        <label htmlFor="curp" className={styles.label}>CURP:</label>
        <input id="curp" type="text" className={styles.input} value={curp} onChange={(e) => setCurp(e.target.value)} required disabled={loading} />

        <label htmlFor="email" className={styles.label}>Correo electrónico:</label>
        <input id="email" type="email" className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />

        <label htmlFor="password" className={styles.label}>Genera una contraseña:</label>
        <input id="password" type="password" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />

        <label htmlFor="confirmPassword" className={styles.label}>Confirmar Contraseña:</label>
        <input id="confirmPassword" type="password" className={styles.input} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} />


        <label htmlFor="idRegion" className={styles.label}>Región de Procedencia:</label>
        <select
          id="idRegion"
          className={styles.input}
          value={idRegion}
          onChange={(e) => setIdRegion(e.target.value)}
          required
          disabled={loading || dataLoading}
        >
          <option value="">Selecciona una región</option>
          {regions.map((region) => (
            <option key={region.id_region_procedencia} value={region.id_region_procedencia}>
              {region.nombre_region}
            </option>
          ))}
        </select>

        <label htmlFor="idCategoria" className={styles.label}>Categoría:</label>
        <select
          id="idCategoria"
          className={styles.input}
          value={idCategoria}
          onChange={(e) => setIdCategoria(e.target.value)}
          required
          disabled={loading || dataLoading}
        >
          <option value="">Selecciona una categoría</option>
          {categories.map((categoria) => (
            <option key={categoria.id_categoria} value={categoria.id_categoria}>
              {categoria.nombre_categoria}
            </option>
          ))}
        </select>

        <label htmlFor="idInstitucion" className={styles.label}>Institución:</label>
        <select
          id="idInstitucion"
          className={styles.input}
          value={idInstitucion}
          onChange={(e) => setIdInstitucion(e.target.value)}
          required
          disabled={loading || dataLoading}
        >
          <option value="">Selecciona una institución</option>
  
          {institutions.map((institucion) => (
            <option key={institucion.id_institucion} value={institucion.id_institucion}>
              {institucion.nombre_institucion}
            </option>
          ))}
        </select>

        {/* Campo condicional para nueva institución */}
        {idInstitucion === ADD_NEW_INSTITUTION_VALUE && (
          <div>
            <label htmlFor="newInstitutionName" className={styles.label}>Nombre de la nueva institución:</label>
            <input
              id="newInstitutionName"
              type="text"
              className={styles.input}
              value={newInstitutionName}
              onChange={(e) => setNewInstitutionName(e.target.value)}
              required
              disabled={loading}
            />

            <label htmlFor="newInstitutionStateId" className={styles.label}>Estado de la nueva institución:</label>
            <select
              id="newInstitutionStateId"
              className={styles.input}
              value={newInstitutionStateId}
              onChange={(e) => setNewInstitutionStateId(e.target.value)}
              required
              disabled={loading || dataLoading}
            >
              <option value="">Selecciona un estado</option>
              {states.map((state) => (
                <option key={state.id_estado} value={state.id_estado}>
                  {state.nombre_estado}
                </option>
              ))}
            </select>

            <label htmlFor="newInstitutionType" className={styles.label}>Tipo de la nueva institución:</label>
            <select
              id="newInstitutionType"
              className={styles.input}
              value={newInstitutionType}
              onChange={(e) => setNewInstitutionType(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">Selecciona el tipo</option>
              <option value="publica">Pública</option>
              <option value="privada">Privada</option>
            </select>
          </div>
        )}

        <label htmlFor="foto" className={styles.label}>Foto de Perfil (Opcional):</label>
        <input id="foto" type="file" className={styles.input} accept="image/*" onChange={(e) => setFoto(e.target.files[0])} disabled={loading} />

        {errorLocal && <p className={styles.error}>{errorLocal}</p>}

        <button type="submit" className={styles.boton} disabled={loading || dataLoading}>
          {loading ? "Registrando..." : dataLoading ? "Cargando datos..." : "Registrarse"}
        </button>
      </form>
      <p className={styles.registroLink}>
        ¿Ya tienes cuenta? <Link href="/login">Inicia sesión aquí</Link>
      </p>
    </div>
  );
}
