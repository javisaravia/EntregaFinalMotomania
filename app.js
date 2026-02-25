require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db'); // Asegúrate de que db.js existe

const app = express();
const PORT = 3000;

// ==========================================
// 1. CONFIGURACIÓN
// ==========================================
app.use(cors({
    origin: [
        'http://127.0.0.1:5500', 
        'http://localhost:5500', 
        'https://motomania-frontend.vercel.app',
        'https://entrega-final-motomania.vercel.app',
        'https://entregafinalmotomania.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

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
    console.log("-----------------------------------------");
    console.log("🔍 [DEBUG LOGIN] Email recibido:", email);

    try {
        console.log(`🚀 [DB PRE-FLIGHT] Intentando conectar a Railway en: ${process.env.DB_HOST}`);
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            console.log("❌ [DEBUG LOGIN] Usuario NO encontrado en la base de datos.");
            return res.status(401).json({ error: "Email no encontrado" });
        }

        const usuario = users[0];
        console.log("👤 [DEBUG LOGIN] Usuario encontrado:", usuario.username);
        console.log("🔑 [DEBUG LOGIN] Password en DB:", usuario.password);
        console.log("📥 [DEBUG LOGIN] Password enviada:", password);

        // --- LÓGICA DE COMPARACIÓN ---
        let coinciden = false;
        if (usuario.password.startsWith('$2b$') || usuario.password.startsWith('$2a$')) {
            const bcrypt = require('bcrypt');
            coinciden = await bcrypt.compare(password, usuario.password);
            console.log("🛡️ [DEBUG LOGIN] Detectado HASH Bcrypt. ¿Coinciden?:", coinciden);
        } else {
            coinciden = (usuario.password == password);
            console.log("📄 [DEBUG LOGIN] Detectado TEXTO PLANO. ¿Coinciden?:", coinciden);
        }

        if (coinciden) {
            console.log("✅ [DEBUG LOGIN] Login exitoso para:", usuario.username);
            res.json({ message: "Login OK", user: { id: usuario.id, nombre: usuario.username } });
        } else {
            console.log("❌ [DEBUG LOGIN] La contraseña NO coincide.");
            res.status(401).json({ error: "Contraseña mala" });
        }
    } catch (error) {
        console.error("🔥 [DEBUG LOGIN] ERROR crítico:", error.message);
        res.status(500).json({ error: error.message });
    }
    console.log("-----------------------------------------");
});
// REGISTRO
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    console.log("-----------------------------------------");
    console.log("🆕 [DEBUG REGISTER] Datos recibidos:", req.body);

    if (!username || !email || !password) {
        console.log("⚠️ [DEBUG REGISTER] Faltan campos obligatorios");
        return res.status(400).json({ error: "Faltan datos" });
    }

    try {
        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Si sospechas de nombres de columna distintos, verifica esto:
        const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        console.log("📝 [DEBUG REGISTER] Ejecutando Query:", query);

        const [result] = await db.query(query, [username, email, hashedPassword]);
        console.log("✅ [DEBUG REGISTER] Usuario guardado con éxito. ID:", result.insertId);
        
        res.json({ message: "Registrado con éxito", id: result.insertId });
    } catch (error) {
        console.error("🔥 [DEBUG REGISTER] ERROR de MySQL:");
        console.error("   Código:", error.code);
        console.error("   Mensaje:", error.message);
        
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: "Email o usuario repetido" });
        } else if (error.code === 'ER_BAD_FIELD_ERROR') {
            res.status(500).json({ error: "Error de columnas en la DB. Revisa los logs del servidor." });
        } else {
            res.status(500).json({ error: "Error interno del servidor" });
        }
    }
    console.log("-----------------------------------------");
});

// ==========================================
// 3. RUTAS EXTERNAS (ARCHIVOS SEPARADOS)
// ==========================================

// A. RUTAS DE MAPAS (routes.routes.js -> Ahora /api/routes)
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