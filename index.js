const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

// Conexión apuntando explícitamente al puerto 5433
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        user: 'postgres',
        host: 'localhost',
        database: 'db_peliculas',
        password: 'postgres',
        port: 5433,
      }
);

// Inicializar la tabla de películas
pool.query(`
  CREATE TABLE IF NOT EXISTS peliculas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    director VARCHAR(100) NOT NULL,
    anio INT
  );
`)
.then(() => {
  console.log('Base de datos inicializada correctamente (tabla peliculas creada).');
})
.catch(err => {
  console.error('Error al inicializar la base de datos:', err);
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({ mensaje: 'API de Películas funcionando correctamente 🎬' });
});

// 1. OBTENER todas las películas (GET)
app.get('/peliculas', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM peliculas ORDER BY id ASC');
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. CREAR una película (POST)
app.post('/peliculas', async (req, res) => {
  const { titulo, director, anio } = req.body;
  try {
    const resultado = await pool.query(
      'INSERT INTO peliculas (titulo, director, anio) VALUES ($1, $2, $3) RETURNING *',
      [titulo, director, anio]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de Películas corriendo en el puerto ${PORT}`);
});