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

// RUTA PARA GUARDAR
router.post('/guardar', async (req, res) => {
    console.log("📥 Guardando ruta:", req.body);

    const { title, description, coordinates, user_id, distance, duration } = req.body;

    if (!title || !coordinates || !user_id) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    try {
        const coordsJSON = typeof coordinates === 'string' ? coordinates : JSON.stringify(coordinates);

        // Insertamos incluyendo descripción, distancia y duración
        const sql = 'INSERT INTO routes (title, description, coordinates, user_id, distance, duration) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await db.query(sql, [title, description || '', coordsJSON, user_id, distance || 0, duration || 0]);

        res.json({ msg: "Ruta guardada", id: result.insertId });

    } catch (error) {
        console.error("🔥 Error SQL:", error.sqlMessage || error.message);
        res.status(500).json({ error: "Error de base de datos: " + (error.sqlMessage || error.message) });
    }
});

// AGREGAR AL FINAL DE routes/routes.routes.js (antes del module.exports)

// 1. Ruta para VALORAR (Estrellas)
router.post('/valorar', async (req, res) => {
    const { route_id, user_id, rating } = req.body; // Nombres de image_077478.png
    try {
        const query = `
            INSERT INTO route_ratings (route_id, user_id, rating) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE rating = VALUES(rating)
        `;
        await db.query(query, [route_id, user_id, rating]);
        res.json({ message: "Valoración guardada" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Ruta para COMENTAR
router.post('/comentar', async (req, res) => {
    const { route_id, user_id, comment } = req.body;
    try {
        const query = 'INSERT INTO route_comments (route_id, user_id, comment) VALUES (?, ?, ?)';
        await db.query(query, [route_id, user_id, comment]);
        res.json({ message: "Comentario guardado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint antiguo compatible si se usa
router.post('/:route_id/comentarios', upload.single('foto'), async (req, res) => {
    const { route_id } = req.params;
    const { user_id, comment } = req.body;
    let photo_url = null;

    if (req.file) {
        photo_url = `/uploads/${req.file.filename}`;
    }

    try {
        await db.query('INSERT INTO route_comments (route_id, user_id, comment, photo_url) VALUES (?, ?, ?, ?)',
            [route_id, user_id, comment, photo_url]);
        res.json({ msg: "Comentario añadido" });
    } catch (error) {
        console.error("Error Social Wall:", error);
        res.status(500).json({ error: "Error al añadir comentario" });
    }
});

router.get('/:route_id/comentarios', async (req, res) => {
    try {
        const [routes] = await db.query(
            `SELECT c.*, u.username FROM route_comments c 
             JOIN users u ON c.user_id = u.id 
             WHERE c.route_id = ? ORDER BY c.created_at DESC`,
            [req.params.route_id]
        );
        res.json(routes);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener comentarios" });
    }
});



router.post('/:route_id/valorar', async (req, res) => {
    const { route_id } = req.params;
    const { user_id, rating } = req.body;
    try {
        // Usamos ON DUPLICATE KEY UPDATE para permitir que el usuario cambie su voto
        await db.query(
            'INSERT INTO route_ratings (route_id, user_id, rating) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE rating = ?',
            [route_id, user_id, rating, rating]
        );

        // Calculamos la nueva media
        const [result] = await db.query('SELECT AVG(rating) as media FROM route_ratings WHERE route_id = ?', [route_id]);
        res.json({ msg: "Valoración guardada", media: result[0].media || 0 });
    } catch (error) {
        res.status(500).json({ error: "Error al valorar" });
    }
});

// RUTA PARA LEER (Mis rutas + media de valoración + conteo de comentarios)
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