require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'unpkg.com', 'cdnjs.cloudflare.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'unpkg.com', 'cdnjs.cloudflare.com'],
      imgSrc: ["'self'", 'data:', 'blob:', '*.tile.openstreetmap.org'],
      connectSrc: ["'self'", 'api.example.com'], // Replace with your actual API domain
    },
  },
}));
app.use(morgan('combined')); // Logging
app.use(cors());
app.use(express.json());

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/api/sheet-data', async (req, res) => {
  try {
    const response = await axios.get(process.env.SHEET_URL);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    res.status(500).json({ error: 'Failed to fetch sheet data', details: error.message });
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
    console.error('Error sending config:', error);
    res.status(500).json({ error: 'Failed to send config', details: error.message });
  }
});

// Serve GeoJSON files
app.use('/api/geojson', express.static(path.join(__dirname, 'geojson')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});