require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { requireAuth } = require('./src/auth');
const authRouter = require('./src/auth.router');
const imagesRouter = require('./src/images.router');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/auth', authRouter);
app.use('/images', requireAuth, imagesRouter);

app.listen(PORT, () => {
  console.log(`profit-images-api running on port ${PORT}`);
});
