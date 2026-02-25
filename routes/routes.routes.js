const express = require('express');
const router = express.Router();
const db = require('../db');

// ==========================================
// NUEVOS ENDPOINTS (API en Inglés)
// ==========================================

// 1. OBTENER TODAS LAS RUTAS (GET /api/routes)
router.get('/', async (req, res) => {
    console.log("🔍 [INFO] Petición GET para todas las rutas");
    try {
        const sql = 'SELECT * FROM routes ORDER BY created_at DESC';
        const [routes] = await db.query(sql);
        res.json(routes);
    } catch (error) {
        console.error("🔥 [ERROR GET ALL ROUTES]:", error.message);
        res.status(500).json({ error: "Error al obtener rutas" });
    }
});

// 2. GUARDAR RUTA (POST /api/routes)
router.post('/', async (req, res) => {
    console.log("📥 [INFO] Nueva ruta recibida (API English)");
    const { title, user_id, coordinates, distance, duration, description } = req.body;

    if (!title || !user_id || !coordinates) {
        return res.status(400).json({ error: "Faltan datos requeridos (title, user_id, coordinates)" });
    }

    try {
        const coordsJSON = typeof coordinates === 'string' ? coordinates : JSON.stringify(coordinates);
        const sql = 'INSERT INTO routes (title, user_id, coordinates, distance, duration, description) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await db.query(sql, [title, user_id, coordsJSON, distance || 0, duration || 0, description || '']);
        
        console.log("✅ [SUCCESS] Ruta guardada con ID:", result.insertId);
        res.json({ message: "Ruta guardada", id: result.insertId });
    } catch (error) {
        console.error("🔥 [ERROR POST ROUTE]:", error.message);
        res.status(500).json({ error: "Error al guardar ruta", detalles: error.message });
    }
});

// ... (se mantienen los endpoints anteriores por compatibilidad si es necesario, pero los principales ahora son /)

// RUTA PARA GUARDAR (Antigua /api/rutas/guardar -> Ahora disponible en /api/routes/guardar si se desea, 
// o simplemente redirigir al nuevo formato)
// RUTA PARA GUARDAR (Compatible con frontend /guardar)
router.post('/guardar', async (req, res) => {
    const { title, description, coordinates, user_id, distance, duration } = req.body;
    try {
        const coordsJSON = typeof coordinates === 'string' ? coordinates : JSON.stringify(coordinates);
        const sql = 'INSERT INTO routes (title, description, coordinates, user_id, distance, duration) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await db.query(sql, [title, description || '', coordsJSON, user_id, distance || 0, duration || 0]);
        res.json({ msg: "Ruta guardada con éxito", id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: "Error interno", detalles: error.message });
    }
});

// --- FUNCIONALIDAD: COMENTARIOS ---
router.post('/comentar', async (req, res) => {
    const { route_id, user_id, comment } = req.body;
    try {
        await db.query('INSERT INTO route_comments (route_id, user_id, comment) VALUES (?, ?, ?)',
            [route_id, user_id, comment]);
        res.json({ msg: "Comentario añadido" });
    } catch (error) {
        res.status(500).json({ error: "Error al añadir comentario" });
    }
});

// --- FUNCIONALIDAD: VALORACIONES ---
router.post('/valorar', async (req, res) => {
    const { route_id, user_id, rating } = req.body;
    try {
        await db.query(
            'INSERT INTO route_ratings (route_id, user_id, rating) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE rating = ?',
            [route_id, user_id, rating, rating]
        );
        const [result] = await db.query('SELECT AVG(rating) as media FROM route_ratings WHERE route_id = ?', [route_id]);
        res.json({ msg: "Valoración guardada", media: result[0].media || 0 });
    } catch (error) {
        res.status(500).json({ error: "Error al valorar" });
    }
});

// RUTA PARA LEER RUTAS DE UN USUARIO (GET /api/routes/:usuario_id)
router.get('/:usuario_id', async (req, res) => {
    try {
        const sql = `
            SELECT r.*, 
            (SELECT AVG(rating) FROM route_ratings WHERE route_id = r.id) as avg_rating,
            (SELECT COUNT(*) FROM route_comments WHERE route_id = r.id) as comment_count
            FROM routes r WHERE r.user_id = ?`;
        const [routes] = await db.query(sql, [req.params.usuario_id]);
        res.json(routes);
    } catch (error) {
        res.status(500).json({ error: "Error al leer rutas", detalles: error.message });
    }
});

module.exports = router;