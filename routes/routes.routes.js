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
        const [rutas] = await db.query(sql);
        res.json(rutas);
    } catch (error) {
        console.error("🔥 [ERROR GET ALL ROUTES]:", error.message);
        res.status(500).json({ error: "Error al obtener rutas" });
    }
});

// 2. GUARDAR RUTA (POST /api/routes)
router.post('/', async (req, res) => {
    console.log("📥 [INFO] Nueva ruta recibida (API English)");
    const { title, user_id, coordinates, distance } = req.body;

    if (!title || !user_id || !coordinates) {
        return res.status(400).json({ error: "Faltan datos requeridos (title, user_id, coordinates)" });
    }

    try {
        const sql = 'INSERT INTO routes (title, user_id, coordinates, distance) VALUES (?, ?, ?, ?)';
        const [result] = await db.query(sql, [title, user_id, coordinates, distance || 0]);
        
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
router.post('/guardar', async (req, res) => {
    // Redirigimos lógica al nuevo formato o mantenemos según se prefiera.
    // Para no romper nada, lo dejamos como estaba pero adaptado a la tabla routes.
    const { titulo, descripcion, coordenadas, usuario_id, distancia, duracion } = req.body;
    try {
        const sql = 'INSERT INTO routes (title, description, coordinates, user_id, distance, duration) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await db.query(sql, [titulo, descripcion || '', JSON.stringify(coordenadas), usuario_id, distancia || 0, duracion || 0]);
        res.json({ msg: "Ruta guardada con éxito", id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: "Error interno", detalles: error.message });
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
        const [rutas] = await db.query(sql, [req.params.usuario_id]);
        res.json(rutas);
    } catch (error) {
        res.status(500).json({ error: "Error al leer rutas", detalles: error.message });
    }
});

module.exports = router;