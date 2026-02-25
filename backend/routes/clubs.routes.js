const express = require('express');
const router = express.Router();
const db = require('../db');

// 1. LISTAR TODOS LOS CLUBES (Para la lista de explorar)
router.get('/', async (req, res) => {
    try {
        const [clubs] = await db.query('SELECT * FROM clubs');
        res.json(clubs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al cargar lista de clubes" });
    }
});

// 2. VER MIS CLUBES (Ruta nueva para filtrar)
router.get('/mis-clubes/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // SQL: Unimos la tabla 'clubs' con 'user_clubs' para sacar solo los míos
        const sql = `
            SELECT c.* FROM clubs c
            JOIN user_clubs uc ON c.id = uc.club_id
            WHERE uc.user_id = ?
        `;
        const [misClubes] = await db.query(sql, [userId]);
        res.json(misClubes);

    } catch (error) {
        console.error("Error buscando mis clubes:", error);
        res.status(500).json({ error: "Error al cargar tus clubes" });
    }
});

// 3. UNIRSE A UN CLUB (POST /join)
router.post('/join', async (req, res) => {
    // Extraemos club_id y user_id del body (el frontend debe enviarlos así o mapeamos)
    const { userId, clubId } = req.body;

    if (!userId || !clubId) {
        return res.status(400).json({ error: "Faltan datos (userId o clubId)" });
    }

    try {
        // Usamos la consulta específica solicitada por el usuario
        const sql = 'INSERT INTO user_clubs (club_id, user_id) VALUES (?, ?)';
        await db.query(sql, [clubId, userId]);
        
        res.json({ message: "¡Unión exitosa!" });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "¡Ya eres miembro de este club!" });
        }
        console.error("🔥 Error en /join:", error.message);
        res.status(500).json({ error: "No se pudo unir al club" });
    }
});

module.exports = router;