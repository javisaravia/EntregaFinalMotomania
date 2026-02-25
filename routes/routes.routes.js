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
    console.log("-----------------------------------------");
    console.log("📥 [INFO] Intento de GUARDAR RUTA");
    console.log("📦 Body recibido:", JSON.stringify(req.body, null, 2));

    const { titulo, descripcion, coordenadas, usuario_id, distancia, duracion } = req.body;

    // Validación estricta "Senior"
    if (!titulo || !coordenadas || !usuario_id) {
        console.warn("⚠️ [WARN] Faltan campos obligatorios");
        return res.status(400).json({ 
            error: "Faltan datos obligatorios", 
            camposRequeridos: ["titulo", "coordenadas", "usuario_id"] 
        });
    }

    try {
        console.log(`🔍 [DEBUG] Procesando coordenadas para usuario ID: ${usuario_id}`);
        const coordsJSON = JSON.stringify(coordenadas);

        const sql = 'INSERT INTO routes (title, description, coordinates, user_id, distance, duration) VALUES (?, ?, ?, ?, ?, ?)';
        console.log("📝 [QUERY] Ejecutando INSERT en 'routes'...");

        const [result] = await db.query(sql, [
            titulo, 
            descripcion || '', 
            coordsJSON, 
            usuario_id, 
            distancia || 0, 
            duracion || 0
        ]);

        console.log("✅ [SUCCESS] Ruta guardada con ID:", result.insertId);
        res.json({ msg: "Ruta guardada con éxito", id: result.insertId });

    } catch (error) {
        console.error("🔥 [FATAL ERROR] Fallo al guardar en DB:");
        console.error("   Mensaje:", error.message);
        console.error("   Código:", error.code);
        if (error.sqlMessage) console.error("   SQL Message:", error.sqlMessage);
        
        res.status(500).json({ 
            error: "Error interno del servidor", 
            detalles: error.sqlMessage || error.message 
        });
    }
    console.log("-----------------------------------------");
});

// --- FUNCIONALIDAD 1: COMENTARIOS (Con soporte para Multiparte/Archivo) ---
router.post('/:route_id/comentarios', upload.single('foto'), async (req, res) => {
    const { route_id } = req.params;
    const { user_id, comentario } = req.body;
    let photo_url = null;

    if (req.file) {
        photo_url = `/uploads/${req.file.filename}`;
    }

    try {
        await db.query('INSERT INTO route_comments (route_id, user_id, comment, photo_url) VALUES (?, ?, ?, ?)',
            [route_id, user_id, comentario, photo_url]);
        res.json({ msg: "Comentario añadido" });
    } catch (error) {
        console.error("Error Social Wall:", error);
        res.status(500).json({ error: "Error al añadir comentario" });
    }
});

router.get('/:route_id/comentarios', async (req, res) => {
    try {
        const [comentarios] = await db.query(
            `SELECT c.*, u.username FROM route_comments c 
             JOIN users u ON c.user_id = u.id 
             WHERE c.route_id = ? ORDER BY c.created_at DESC`,
            [req.params.route_id]
        );
        res.json(comentarios);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener comentarios" });
    }
});

// --- FUNCIONALIDAD 2: VALORACIONES ---
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
        const [rutas] = await db.query(sql, [req.params.usuario_id]);
        res.json(rutas);
    } catch (error) {
        res.status(500).json({ error: "Error al leer rutas" });
    }
});

module.exports = router;