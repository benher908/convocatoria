const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey';

const protect = async (req, res, next) => {
    let token;
    let connection;


    token = req.cookies.token; 

    

    if (token) {
        try {
    
            const decoded = jwt.verify(token, jwtSecret);
        

            
            connection = await pool.getConnection();
            const [users] = await connection.execute(
                'SELECT id_aspirante, nombre, correo_contacto, curp, foto_perfil FROM aspirante WHERE id_aspirante = ?', 
                [decoded.id]
            );

            const user = users[0];

            if (!user) {
            
                
                res.clearCookie('token');
                return res.status(401).json({ message: 'No autorizado, token fallido (usuario no existe).' });
            }

        
            req.user = {
                id: user.id_aspirante,
                nombre: user.nombre,
                email: user.correo_contacto,
                curp: user.curp,
                foto_perfil: user.foto_perfil, 
            };
        

            next();

        } catch (error) {
            console.error('AuthMiddleware: Error al verificar token o al buscar usuario:', error);
            // Limpiar la cookie si el token es inválido o expirado
            res.clearCookie('token');
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'No autorizado, token expirado.' });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'No autorizado, token inválido.' });
            } else {
                return res.status(401).json({ message: 'No autorizado, token fallido.' });
            }
        } finally {
            if (connection) connection.release();
        }
    } else {
        console.log('AuthMiddleware: No hay token en las cookies.');
        return res.status(401).json({ message: 'No autorizado, no hay token.' });
    }
};

module.exports = { protect };
