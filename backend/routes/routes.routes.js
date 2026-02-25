const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// CONFIGURACIÓN DE MULTER para guardar en backend/public/uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// 1. Ruta para GUARDAR
router.post('/guardar', async (req, res) => {
    const { title, description, coordinates, user_id, distance, duration } = req.body;
    try {
        const coordsJSON = typeof coordinates === 'string' ? coordinates : JSON.stringify(coordinates);
        const sql = 'INSERT INTO routes (title, description, coordinates, user_id, distance, duration) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await db.query(sql, [title, description || '', coordsJSON, user_id, distance || 0, duration || 0]);
        res.json({ msg: "Ruta guardada", id: result.insertId });
    } catch (error) {
        console.error("Error en /guardar:", error.message);
        res.status(500).json({ error: "Error de base de datos: " + error.message });
    }
});

// 2. Ruta para VALORAR (Estrellas)
router.post('/valorar', async (req, res) => {
    const { route_id, user_id, rating } = req.body;
    try {
        const query = `
            INSERT INTO route_ratings (route_id, user_id, rating) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE rating = VALUES(rating)
        `;
        await db.query(query, [route_id, user_id, rating]);
        
        // Calculamos la nueva media para devolverla de inmediato
        const [rows] = await db.query('SELECT AVG(rating) as media FROM route_ratings WHERE route_id = ?', [route_id]);
        const newMedia = rows[0].media || 0;
        
        res.json({ message: "Valoración guardada", newMedia });
    } catch (error) {
        console.error("Error en /valorar:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// OBTENER VALORACIÓN MEDIA (GET)
router.get('/:id/valoracion-media', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT AVG(rating) as media FROM route_ratings WHERE route_id = ?', [req.params.id]);
        res.json({ media: rows[0].media || 0 });
    } catch (error) {
        res.status(500).json({ error: "Error al calcular media" });
    }
});

// 3. Ruta para COMENTAR (POST)
router.post('/comentar', async (req, res) => {
    const { route_id, user_id, comment } = req.body;
    if (!route_id || !user_id || !comment) {
        return res.status(400).json({ error: "Faltan datos obligatorios (route_id, user_id, comment)" });
    }
    try {
        const query = 'INSERT INTO route_comments (route_id, user_id, comment) VALUES (?, ?, ?)';
        await db.query(query, [route_id, user_id, comment]);
        res.json({ message: "Comentario guardado" });
    } catch (error) {
        console.error("🔥 Error en /comentar:", error.message);
        res.status(500).json({ error: "Error de base de datos" });
    }
});

// OBTENER DETALLE DE UNA RUTA (GET)
router.get('/detail/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM routes WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: "Ruta no encontrada" });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener detalle de la ruta" });
    }
});

// --- OBTENER COMENTARIOS DE UNA RUTA ESPECÍFICA (GET) ---
router.get('/:id/comentarios', async (req, res) => {
    const routeId = req.params.id;
    try {
        // Buscamos los comentarios y el nombre del usuario que los hizo
        const query = `
            SELECT rc.*, u.username 
            FROM route_comments rc
            JOIN users u ON rc.user_id = u.id
            WHERE rc.route_id = ?
            ORDER BY rc.created_at DESC
        `;
        const [rows] = await db.query(query, [routeId]);
        res.json(rows); // Esto enviará el JSON que el frontend espera
    } catch (error) {
        console.error("🔥 Error al obtener comentarios:", error.message);
        res.status(500).json({ error: "No se pudieron cargar los comentarios" });
    }
});

// 5. OBTENER RUTAS USUARIO
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
        res.status(500).json({ error: "Error al leer rutas" });
    }
});

module.exports = router;