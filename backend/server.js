require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const xlsx = require('xlsx');

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'unpkg.com', 'cdnjs.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'unpkg.com', 'cdnjs.cloudflare.com'],
      imgSrc: ["'self'", 'data:', 'blob:', '*.tile.openstreetmap.org'],
      connectSrc: ["'self'", 'api.example.com'], 
    },
  },
}));
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/api/sheet-data', async (req, res) => {
  try {
    const response = await axios.get(process.env.SHEET_URL);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    res.status(500).json({ error: 'Gagal sambungkan Spreadsheet', details: error.message });
  }
});

app.get('/api/config', (req, res) => {
  try {
    const config = {
      YEARS: process.env.YEARS.split(','),
      MAP_BOUNDS: JSON.parse(process.env.MAP_BOUNDS),
      desaIds: process.env.DESA_IDS.split(',')
    };
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Gagal Kirim config', details: error.message });
  }
});

app.get('/api/place-data', (req, res) => {
  try {
    const workbook = xlsx.readFile(path.join(__dirname, '../public/place.xlsx'));
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    res.json(data);
  } catch (error) {
    console.error('Error reading Excel file:', error);
    res.status(500).json({ error: 'Gagal membaca file Excel', details: error.message });
  }
});

app.use('/api/geojson', express.static(path.join(__dirname, 'geojson')));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Ada yang salah pada Middleware!');
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});