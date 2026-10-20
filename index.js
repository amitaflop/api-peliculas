const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

// Conexión a la base de datos (Render o local)
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

// Inicializar la base de datos protegiendo los datos existentes
async function inicializarDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS peliculas (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(150) NOT NULL,
        director VARCHAR(100) NOT NULL,
        anio INT,
        genero VARCHAR(100),
        descripcion TEXT
      );
    `);

    console.log('Base de datos y tabla verificadas correctamente 🎬');
  } catch (err) {
    console.error('Error al inicializar la base de datos:', err);
  }
}

inicializarDB();

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

// 2. OBTENER una película por su ID (GET por ID) 👈 NUEVA RUTA
app.get('/peliculas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await pool.query('SELECT * FROM peliculas WHERE id = $1', [id]);
    
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: "Película no encontrada 😢" });
    }
    
    res.json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. CREAR una o varias películas (POST - Soporta objeto único o arreglo masivo)
app.post('/peliculas', async (req, res) => {
  try {
    const data = req.body;

    // Si mandan un arreglo (varias películas a la vez)
    if (Array.isArray(data)) {
      const insertedMovies = [];
      for (const pelicula of data) {
        const { titulo, director, anio, genero, descripcion } = pelicula;
        const resultado = await pool.query(
          'INSERT INTO peliculas (titulo, director, anio, genero, descripcion) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [titulo, director, anio, genero, descripcion]
        );
        insertedMovies.push(resultado.rows[0]);
      }
      return res.status(201).json({
        mensaje: "Películas agregadas exitosamente en lote 🎬",
        total: insertedMovies.length,
        peliculas: insertedMovies
      });
    } 
    
    // Si mandan una sola película
    else {
      const { titulo, director, anio, genero, descripcion } = data;
      const resultado = await pool.query(
        'INSERT INTO peliculas (titulo, director, anio, genero, descripcion) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [titulo, director, anio, genero, descripcion]
      );
      return res.status(201).json(resultado.rows[0]);
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de Películas corriendo en el puerto ${PORT}`);
});
