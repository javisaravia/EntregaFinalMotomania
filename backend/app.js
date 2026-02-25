require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db'); // Asegúrate de que db.js existe

const app = express();
const PORT = 3000;

// ==========================================
// 1. CONFIGURACIÓN
// ==========================================
app.use(cors());

// AUMENTAMOS EL LÍMITE A 50MB (Vital para tus rutas largas)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// HACER PÚBLICA LA CARPETA DE UPLOADS
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Chivato de consola para ver qué pasa
app.use((req, res, next) => {
    console.log(`📢 Petición: ${req.method} ${req.url}`);
    next();
});

// ==========================================
// 2. RUTAS DIRECTAS (AUTH)
// ==========================================

// LOGIN
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: "Email no encontrado" });

        const usuario = users[0];
        if (usuario.password == password) {
            console.log("✅ Login OK:", usuario.username);
            res.json({ message: "Login OK", user: { id: usuario.id, nombre: usuario.username } });
        } else {
            res.status(401).json({ error: "Contraseña mala" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// REGISTRO
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: "Faltan datos" });

    try {
        const [result] = await db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, password]);
        res.json({ message: "Registrado", id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') res.status(400).json({ error: "Email repetido" });
        else res.status(500).json({ error: "Error servidor" });
    }
});

// ==========================================
// 3. RUTAS EXTERNAS (ARCHIVOS SEPARADOS)
// ==========================================

// A. RUTAS DE MAPAS (routes.routes.js)
try {
    app.use('/api/routes', require('./routes/routes.routes'));
} catch (e) { console.error("⚠️ Error cargando rutas de mapas:", e.message); }

// B. RUTAS DE CLUBES (clubs.routes.js) <--- ¡ESTO ES LO NUEVO!
try {
    app.use('/api/clubs', require('./routes/clubs.routes'));
    console.log("🧥 Sistema de Clubes ACTIVADO");
} catch (e) { console.error("⚠️ Error cargando rutas de clubes:", e.message); }


// ==========================================
// 4. ARRANCAR
// ==========================================
app.listen(PORT, () => {
    console.log(`🚀 SERVIDOR CORRIENDO EN http://localhost:${PORT}`);
});