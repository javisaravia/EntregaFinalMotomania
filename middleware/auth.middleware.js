const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, 'SECRET');
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ error: 'Token inválido' });
  }
};
