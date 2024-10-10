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

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});

