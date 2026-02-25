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

// 3. UNIRSE A UN CLUB
router.post('/join', async (req, res) => {
    const { userId, clubId } = req.body;

    if (!userId || !clubId) {
        return res.status(400).json({ error: "Faltan datos (usuario o club)" });
    }

    try {
        // A. Comprobar si ya existe la unión
        const [existe] = await db.query(
            'SELECT * FROM user_clubs WHERE user_id = ? AND club_id = ?', 
            [userId, clubId]
        );

        if (existe.length > 0) {
            return res.status(400).json({ error: "¡Ya eres miembro de este club!" });
        }

        // B. Insertar
        await db.query('INSERT INTO user_clubs (user_id, club_id) VALUES (?, ?)', [userId, clubId]);
        
        res.json({ message: "¡Unión exitosa!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error de base de datos" });
    }
});

module.exports = router;