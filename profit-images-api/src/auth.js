const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;

function generateToken(username) {
  return jwt.sign({ username }, SECRET, { expiresIn: '8h' });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { generateToken, requireAuth };
