# UHome - Frontend

Plataforma web para consultar propiedades y encontrar opciones de alojamiento cerca del campus universitario.

## Tecnologías
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Leaflet y React Leaflet

## Requisitos
- Node.js
- npm
- Backend de UHome en ejecución o desplegado.

## Instalación
Desde la carpeta frontend:
npm install

## Variables de entorno
Configura el archivo .env.local:

NEXT_PUBLIC_API_URL=http://localhost:3001

Para producción:
NEXT_PUBLIC_API_URL=https://uhome-3e5i.onrender.com

No subas .env.local a GitHub.

## Ejecución local
npm run dev

Abre http://localhost:3000

## Compilación
npm run build

## Backend
- Local: http://localhost:3001
- Producción: https://uhome-3e5i.onrender.com

## Despliegue en Vercel
1. Importa el repositorio desde GitHub.
2. Configura frontend como Root Directory.
3. Agrega NEXT_PUBLIC_API_URL con la URL del backend de producción.
4. Despliega y verifica que se puedan consultar las propiedades.

## Estructura
- src/app
- src/components
- src/hooks
- src/services
- src/styles
- public
