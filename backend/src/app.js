
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes'); 
const escolaridadRoutes = require('./routes/escolaridadRoutes');
const actividadesRoutes = require("./routes/actividadesRoutes")
const logrosRoutes = require('./routes/logrosRoutes');
const experienciaRoutes = require('./routes/experienciaRoutes');
const investigacionRoutes = require('./routes/investigacionRoutes');
const habilidadesRoutes = require('./routes/habilidadesRoutes');
const dataRoutes = require('./routes/dataRoutes'); 
const { connectBD } = require('./config/db'); 

dotenv.config(); 

connectBD(); 

const app = express();


app.use(cors({
    origin: 'http://localhost:3000', 
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));


app.use(express.json());


app.use(cookieParser());


app.use('/api/auth', authRoutes); 
app.use('/api/profile', profileRoutes); 
app.use('/api/escolaridad', escolaridadRoutes);
app.use('/api', dataRoutes); 
app.use('/api/actividades', actividadesRoutes);
app.use('/api/logros', logrosRoutes);
app.use('/api/experiencias', experienciaRoutes);
app.use('/api/investigaciones', investigacionRoutes); 
app.use('/api/habilidades', habilidadesRoutes);



app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong on the server!');
});

const PORT = process.env.PORT || 4000; 
app.listen(PORT, () => {
    console.log(`Express server listening on port ${PORT}`);
});