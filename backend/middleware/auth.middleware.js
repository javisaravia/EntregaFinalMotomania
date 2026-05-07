const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization;

  if (token) {
    try {
      const decoded = jwt.verify(token, 'SECRET');
      req.user = decoded;
    } catch {
      return res.status(403).json({ error: 'Token inválido' });
    }
  }
  next();
};
