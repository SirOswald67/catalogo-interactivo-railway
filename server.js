const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Pool de conexión usando las variables nativas de Railway (o local por defecto)
const pool = mysql.createPool({
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'railway',
  port: process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10
});

// Inicializar tabla y datos de prueba con medios en la nube
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS videojuegos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(150) NOT NULL,
        plataforma VARCHAR(80) NOT NULL,
        genero VARCHAR(80) NOT NULL,
        descripcion TEXT NOT NULL,
        imagen_url TEXT NOT NULL,
        video_url TEXT NOT NULL,
        recurso_nube_url TEXT NOT NULL,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM videojuegos');
    if (rows[0].total === 0) {
      await pool.query(`
        INSERT INTO videojuegos (titulo, plataforma, genero, descripcion, imagen_url, video_url, recurso_nube_url) VALUES
        (
          'Elden Ring: Shadow of the Erdtree',
          'PC / PS5 / Xbox',
          'Action RPG',
          'Explora la Tierra Sombría en una expansión masiva con nuevos jefes, armas y narrativa oscura.',
          'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2778580/header.jpg',
          'https://www.youtube.com/embed/qLZenOn7WUo',
          'https://store.steampowered.com/app/2778580/'
        ),
        (
          'Cyberpunk 2077: Phantom Liberty',
          'PC / PS5 / Xbox',
          'Sci-Fi RPG',
          'Thriller de espionaje ambientado en el peligroso distrito de Dogtown dentro de Night City.',
          'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/2138330/header.jpg',
          'https://www.youtube.com/embed/Ugb80d5lxEM',
          'https://store.steampowered.com/app/2138330/'
        ),
        (
          'The Legend of Zelda: Tears of the Kingdom',
          'Nintendo Switch',
          'Aventura',
          'Aventura épica por los cielos y profundidades de Hyrule con mecánicas de construcción creativa.',
          'https://assets.nintendo.com/image/upload/c_fill,w_1200/q_auto:best/f_auto/dpr_2.0/ncom/software/switch/70010000063714/276a412988e07c4d55a2996c6d38abb408b464413b2dfeb44d2aa460b9f622e1',
          'https://www.youtube.com/embed/uHGShqcAHlQ',
          'https://www.nintendo.com/es-mx/store/products/the-legend-of-zelda-tears-of-the-kingdom-switch/'
        ),
        (
          'Hollow Knight: Silksong',
          'PC / Consola',
          'Metroidvania',
          'Asciende hasta la cima de un reino embrujado gobernado por la seda y el canto.',
          'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1030300/header.jpg',
          'https://www.youtube.com/embed/pFAknD_9U7c',
          'https://store.steampowered.com/app/1030300/'
        )
      `);
      console.log('Datos iniciales insertados correctamente.');
    }
  } catch (error) {
    console.error('Error inicializando la base de datos:', error.message);
  }
}

// Endpoint: Obtener catálogo (con filtro opcional)
app.get('/api/juegos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM videojuegos ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar la base de datos', detalle: error.message });
  }
});

// Endpoint: Agregar nuevo juego
app.post('/api/juegos', async (req, res) => {
  const { titulo, plataforma, genero, descripcion, imagen_url, video_url, recurso_nube_url } = req.body;
  if (!titulo || !plataforma || !genero || !descripcion || !imagen_url || !video_url || !recurso_nube_url) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO videojuegos (titulo, plataforma, genero, descripcion, imagen_url, video_url, recurso_nube_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [titulo, plataforma, genero, descripcion, imagen_url, video_url, recurso_nube_url]
    );
    res.status(201).json({ id: result.insertId, mensaje: 'Juego registrado con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar en la base de datos', detalle: error.message });
  }
});

app.listen(PORT, async () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
  await initDB();
});