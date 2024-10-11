const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api');
const path = require('path');
const app = express();

// Cargar las variables de entorno desde el archivo .env
dotenv.config();

// Configuración de middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Carpeta de archivos estáticos
app.use('/public', express.static(path.join(__dirname, 'public')));

// Rutas de la API
app.use('/api', apiRoutes);

// Definir el puerto desde las variables de entorno o el puerto por defecto 3000
const PORT = process.env.PORT || 3000;

// Levantar el servidor y escuchar en el puerto definido
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});

// Manejar rutas no encontradas
app.use((req, res) => {
    res.status(404).send('Ruta no encontrada');
});

// Manejar errores del servidor
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Ha ocurrido un error en el servidor');
});


