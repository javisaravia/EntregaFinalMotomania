const express = require('express');
const router = express.Router();
const db = require('../db');

// REGISTER
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Faltan datos' });
    }

    try {
        const [existing] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        await db.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, password]
        );

        res.json({ message: 'Usuario registrado correctamente' });

    } catch (error) {
        console.error('ERROR REGISTER:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

module.exports = router;

