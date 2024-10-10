# Innovafp Canarias - Guía de Instalación

Esta guía explica cómo instalar y configurar la aplicación **Innovafp Canarias** en un servidor **Ubuntu** totalmente limpio, comenzando desde la instalación de los paquetes necesarios hasta la ejecución de la aplicación en un entorno de producción.

### Requisitos Previos

- **Servidor con Ubuntu (versión limpia)**: Asegúrate de tener un servidor Ubuntu en estado "limpio" para la instalación.
- **Acceso a Git**: El repositorio de la aplicación se encuentra en GitHub en la siguiente URL: [https://github.com/atreyu1968/innovafp-canarias](https://github.com/atreyu1968/innovafp-canarias).

### 1. Preparar el Entorno

#### 1.1 Actualizar Ubuntu

Actualiza los paquetes y dependencias del sistema:

```bash
sudo apt update
sudo apt upgrade -y
```

#### 1.2 Instalar Git

Git será necesario para clonar el repositorio desde GitHub. Para instalarlo:

```bash
sudo apt install git -y
```

### 2. Clonar el Repositorio desde GitHub

Clona el repositorio **Innovafp Canarias** desde GitHub:

```bash
git clone https://github.com/atreyu1968/innovafp-canarias.git
cd innovafp-canarias
```

### 3. Instalar Node.js, npm y PM2

#### 3.1 Instalar Node.js y npm

Instala **Node.js** (versión LTS) y **npm** (el gestor de paquetes de Node.js):

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

Verifica la instalación:

```bash
node -v
npm -v
```

#### 3.2 Instalar PM2

**PM2** es un administrador de procesos para aplicaciones Node.js que ayudará a mantener la aplicación en ejecución:

```bash
sudo npm install -g pm2
```

### 4. Instalar MySQL

#### 4.1 Instalar el Servidor MySQL

Instala **MySQL** para almacenar los datos de la aplicación:

```bash
sudo apt install mysql-server -y
```

#### 4.2 Configurar MySQL

Ejecuta el script de seguridad para configurar MySQL y asegurar la base de datos:

```bash
sudo mysql_secure_installation
```

#### 4.3 Crear la Base de Datos

Inicia sesión en **MySQL**:

```bash
sudo mysql -u root -p
```

Crea la base de datos y el usuario:

```sql
CREATE DATABASE innovafp;
CREATE USER 'innovafp_user'@'localhost' IDENTIFIED BY 'securepassword';
GRANT ALL PRIVILEGES ON innovafp.* TO 'innovafp_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. Configuración del Proyecto

#### 5.1 Instalar las Dependencias

Instala las dependencias de **Node.js** necesarias para la aplicación:

```bash
npm install
```

#### 5.2 Configurar las Variables de Entorno

Crea el archivo `.env` para definir las variables de entorno:

```bash
touch .env
nano .env
```

Añade las siguientes configuraciones:

```env
DB_HOST=localhost
DB_USER=innovafp_user
DB_PASSWORD=securepassword
DB_NAME=innovafp

JWT_SECRET=your_jwt_secret_key
PORT=3000
```

Guarda el archivo y cierra el editor (`Ctrl + X`, luego `Y` y `Enter`).

#### 5.3 Ejecutar el Script SQL

Ejecuta el script **SQL** para crear las tablas necesarias en la base de datos:

```bash
sudo mysql -u innovafp_user -p innovafp < database/schema.sql
```

### 6. Configuración de Tailwind CSS

Si no lo hiciste durante el desarrollo local, compila los archivos de **Tailwind CSS**:

```bash
npx tailwindcss -i ./src/input.css -o ./public/output.css --watch
```

Esto compilará las clases de **Tailwind** y generará el archivo CSS.

### 7. Configurar y Ejecutar la Aplicación con PM2

#### 7.1 Iniciar la Aplicación con PM2

Ejecuta la aplicación usando **PM2** para que se mantenga activa incluso si el servidor se reinicia:

```bash
pm2 start index.js --name "Innovafp"
```

#### 7.2 Guardar la Configuración de PM2

Guarda la configuración de **PM2** para que se cargue automáticamente al reiniciar el servidor:

```bash
pm2 save
pm2 startup
```

**PM2** te proporcionará un comando que debes ejecutar para completar la configuración de inicio automático.

### 8. Configurar Nginx como Proxy Inverso (Opcional)

Si deseas mejorar la seguridad y rendimiento de la aplicación, puedes usar **Nginx** como un proxy inverso.

#### 8.1 Instalar Nginx

```bash
sudo apt install nginx -y
```

#### 8.2 Configurar Nginx

Edita la configuración de **Nginx** para redirigir el tráfico HTTP hacia tu aplicación:

```bash
sudo nano /etc/nginx/sites-available/innovafp
```

Agrega la siguiente configuración:

```nginx
server {
    listen 80;
    server_name your_domain_or_ip;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Guarda el archivo y habilita la configuración:

```bash
sudo ln -s /etc/nginx/sites-available/innovafp /etc/nginx/sites-enabled/
sudo nginx -t  # Verifica que no haya errores de configuración
sudo systemctl restart nginx
```

### 9. Acceso a la Aplicación

Abre un navegador y navega hacia la **IP** del servidor o el **dominio** configurado:

```
http://tu_dominio_o_ip
```

### 10. Funcionalidades Adicionales de la Aplicación

#### 10.1 Importar Datos de Cursos Anteriores

Al crear un nuevo curso, puedes optar por **importar datos de un curso anterior**. Esto se hace a través del panel de administración de la aplicación.

#### 10.2 Crear Plantillas de Informes y Generar PDFs

La aplicación permite al **Administrador** o al **DGFP** crear **plantillas de informes** personalizables y generar **informes en PDF** siguiendo dichas plantillas.

#### 10.3 Gestión de Usuarios y Roles

Los usuarios pueden ser asignados a distintos roles como **Administrador**, **DGFP**, **Coordinador** y **Gestor**, y pueden ser asignados a **equipos/redes** según lo determine el **Administrador**.

### 11. Enlaces Êteis

- **Repositorio GitHub**: [https://github.com/atreyu1968/innovafp-canarias](https://github.com/atreyu1968/innovafp-canarias)
- **Documentación Oficial de Ubuntu**: [https://ubuntu.com/download/server](https://ubuntu.com/download/server)
- **Documentación de Node.js**: [https://nodejs.org/en/docs/](https://nodejs.org/en/docs/)

### 12. Soporte y Contribuciones

Si encuentras problemas o tienes preguntas, por favor, abre un **issue** en GitHub o contribuye con una **pull request** para mejorar el proyecto.

---

Este archivo **README.md** proporciona toda la información necesaria para poner en marcha la aplicación **Innovafp Canarias** en un servidor **Ubuntu** desde cero, incluyendo la instalación de **dependencias**, la **configuración** de la aplicación y la puesta en marcha con **PM2** y **Nginx**.
