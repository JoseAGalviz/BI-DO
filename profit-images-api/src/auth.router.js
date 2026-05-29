const express = require('express');
const { generateToken } = require('./auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const token = generateToken(username);
  res.json({ token, username, expiresIn: '8h' });
});

module.exports = router;
