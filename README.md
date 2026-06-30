# 🚌 Ruta Express — Sistema de Gestión de Transporte

Monorepo con frontend React + Vite y backend Express + MongoDB para la gestión de rutas de transporte público.

## Requisitos

- Node.js 18 o superior
- npm
- MongoDB (local o Atlas)

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```
MONGO_URI=mongodb://<connection_string>
SERVER_PORT=5000
```

> Al iniciar, si no existe un administrador en la base de datos, se crea automáticamente con usuario `admin` y clave `admin`.

## Instalación

```bash
npm install
```

## Ejecutar en desarrollo

```bash
# Frontend y backend al mismo tiempo
npm run dev

# O por separado:
npm run client   # Solo frontend → http://localhost:3000
npm run server   # Solo backend  → http://localhost:5000
```

## Build para producción

```bash
npm run build
npm start
```

`npm run build` compila el frontend con Vite y empaqueta el backend con esbuild.
`npm start` sirve ambos en modo producción.

## Estructura del proyecto

```
Rungoo/
├── client/                   # Frontend React (Vite)
│   ├── src/
│   │   ├── components/       # Componentes por rol (Admin, Chofer, Pasajero, etc.)
│   │   ├── App.jsx           # Componente raíz
│   │   ├── AppRouter.jsx     # Definición de rutas
│   │   ├── App.css           # Estilos globales de la app
│   │   ├── index.css         # Variables CSS del tema (oscuro/claro)
│   │   ├── index.jsx         # Punto de entrada
│   │   └── config.js         # Configuración del cliente
│   ├── index.html
│   └── vite.config.js
├── server/                   # Backend Express
│   ├── index.js              # Punto de entrada de la API
│   ├── db.js                 # Conexión a MongoDB y seed de admin
│   ├── models/               # Modelos de Mongoose
│   └── routes/               # Rutas de la API
├── .env                      # Variables de entorno (no se versiona)
├── .npmrc                    # Configuración de npm
└── package.json              # Raíz del monorepo
```

## Notas

- El proyecto usa **npm workspaces**. Los scripts desde la raíz orquestan ambos workspaces (`client` y `server`).
- El servidor usa `--env-file` para cargar las variables de entorno automáticamente.
- Las contraseñas se hashean con bcryptjs automáticamente al guardar.
- El frontend corre en el puerto 3000 y el backend en el puerto 5000 por defecto.
- Las dependencias están fijadas a versiones exactas (sin `^`).
