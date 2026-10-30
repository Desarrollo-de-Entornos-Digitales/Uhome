# UHome

Backend de UHome, una plataforma para que estudiantes encuentren vivienda cerca de su universidad. Los arrendadores publican propiedades, los estudiantes las buscan, las filtran, las guardan como favoritas y dejan reviews, y los administradores gestionan usuarios, roles y catálogos.

Proyecto grupal del Corte 2, desarrollado con NestJS, TypeORM y PostgreSQL.

## Integrantes

- Jerónimo
- Juan
- Gaby
- Lina

## Despliegue

- URL pública: https://uhome-3e5i.onrender.com
- Gestión del proyecto en Jira: https://linamacaicedo.atlassian.net/browse/KAN-4

El despliegue usa el plan gratuito de Render, que apaga el servicio tras 15 minutos sin uso. La primera petición después de ese tiempo puede tardar cerca de un minuto. La base de datos está en Neon (PostgreSQL).

## Tecnologías

- NestJS (Node.js 22) con TypeScript
- TypeORM y PostgreSQL 16
- Autenticación con JWT (Passport)
- Contraseñas encriptadas con bcryptjs
- Pruebas unitarias con Jest
- Docker (base de datos local)
- Postman (pruebas de integración)

## Ejecutar el proyecto en local

Requisitos: Node.js 22, Docker Desktop y Git.

1. Clonar el repositorio y entrar a la carpeta:

```bash
git clone https://github.com/linamacaicedo/Uhome.git
cd Uhome
```

2. Levantar la base de datos PostgreSQL (puerto 5433):

```bash
docker compose up -d
```

3. Instalar dependencias y arrancar el backend:

```bash
cd backend
npm install
npm run start:dev
```

4. Esperar el mensaje `Nest application successfully started`. En el primer arranque se crean las tablas y los datos base (roles, permisos y tipos de propiedad).

5. Con el backend corriendo, desde la raíz del repositorio, cargar los datos de ejemplo:

```bash
docker exec -i uhome-postgres psql -U uhome -d uhome < backend/seed/seed.sql
```

La API queda en `http://localhost:3001`.

El script `backend/seed/seed.sql` borra y vuelve a crear usuarios, propiedades, amenities, perfiles, reviews, análisis de ambiente y favoritos, por lo que se puede ejecutar varias veces.

## Variables de entorno

Son opcionales en local. En el despliegue se configuran en Render.

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Cadena de conexión de PostgreSQL. Si no existe, se usa la base local. |
| `JWT_SECRET` | Clave para firmar los tokens. |
| `PORT` | Puerto del servidor. Por defecto 3000. |

## Cuentas de prueba

La contraseña de todas es `Uhome1234`.

| Correo | Rol |
|---|---|
| `admin@uhome.com` | admin |
| `carlos.mendoza@uhome.com` | landlord |
| `laura.gomez@uhome.com` | landlord |
| `ana.torres@uhome.com` | student |
| `luis.perez@uhome.com` | student |
| `maria.rojas@uhome.com` | student |
| `jorge.castro@uhome.com` | student |
| `sofia.vargas@uhome.com` | student (cuenta desactivada, no puede iniciar sesión) |

## Autenticación y roles

1. Iniciar sesión:

```bash
curl -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"email":"admin@uhome.com","password":"Uhome1234"}'
```

2. Copiar el `access_token` de la respuesta (dura 1 hora) y enviarlo en las rutas protegidas:

```bash
curl http://localhost:3001/roles -H "Authorization: Bearer EL_TOKEN"
```

Roles:

- **student:** crea su perfil, guarda favoritos y escribe reviews.
- **landlord:** publica y gestiona propiedades y su análisis de ambiente.
- **admin:** gestiona usuarios, roles, permisos y catálogos, y puede hacer todo lo anterior.

Un usuario nuevo se registra siempre como `student`. Solo un admin puede cambiar el rol de otro usuario. Un usuario desactivado no puede iniciar sesión y su token deja de funcionar.

## Endpoints

"Público" no requiere token. "Dueño o admin" significa que el usuario solo puede actuar sobre sus propios datos.

### Autenticación

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/auth/login` | Público |
| POST | `/auth/logout` | Con token |

### Usuarios

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/users` (registro) | Público |
| GET | `/users` | admin |
| GET | `/users/:id` | Dueño o admin |
| PATCH | `/users/:id` | Dueño o admin |
| PATCH | `/users/:id/role` | admin |
| PATCH | `/users/:id/deactivate` | admin |
| PATCH | `/users/:id/activate` | admin |
| DELETE | `/users/:id` | admin |

### Roles y permisos

| Método | Ruta | Acceso |
|---|---|---|
| POST, GET | `/roles` | admin |
| GET, PATCH, DELETE | `/roles/:id` | admin |
| PATCH | `/roles/:id/permissions` | admin |
| POST, GET | `/permissions` | admin |
| GET, PATCH, DELETE | `/permissions/:id` | admin |

### Perfil de estudiante

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/student-profile` | student o admin |
| GET | `/student-profile` | admin |
| GET, PATCH, DELETE | `/student-profile/:id` | Dueño o admin |

### Propiedades

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/properties` (filtros `?maxPrice=` y `?maxDistance=`) | Público |
| GET | `/properties/:id` | Público |
| POST | `/properties` | landlord o admin |
| PATCH, DELETE | `/properties/:id` | landlord o admin |
| GET | `/properties/:id/amenities` | Público |
| PUT | `/properties/:id/amenities` | landlord o admin |
| POST, DELETE | `/properties/:id/amenities/:amenityId` | landlord o admin |

### Catálogos

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/amenities`, `/amenities/:id` | Público |
| POST | `/amenities` | admin |
| PATCH, DELETE | `/amenities/:id` | admin |
| GET | `/property-types`, `/property-types/:id` | Público |
| POST | `/property-types` | admin |
| PATCH, DELETE | `/property-types/:id` | admin |

### Reviews

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/reviews` (filtro `?propertyId=`), `/reviews/:id` | Público |
| POST | `/reviews` | student o admin |
| PATCH, DELETE | `/reviews/:id` | Autor o admin |

### Vibe Analysis

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/vibe-analysis`, `/vibe-analysis/:id` | Público |
| POST | `/vibe-analysis` | landlord o admin |
| PATCH, DELETE | `/vibe-analysis/:id` | landlord o admin |

### Favoritos

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/favorites` | student o admin |
| GET | `/favorites` | admin |
| GET | `/favorites/user/:userId` | Dueño o admin |
| GET, PATCH | `/favorites/:id` | Dueño o admin |
| DELETE | `/favorites/user/:userId/property/:propertyId` | Dueño o admin |

## Probar cada funcionalidad

1. **Registro e inicio de sesión:** crear un usuario con `POST /users` y entrar con `POST /auth/login`.
2. **Búsqueda y filtros:** `GET /properties`, `GET /properties?maxPrice=1000000` y `GET /properties?maxDistance=800`.
3. **Detalle de una propiedad:** `GET /properties/1`.
4. **Preferencias:** con un estudiante, `POST /student-profile` con su presupuesto y su distancia máxima en metros.
5. **Favoritos:** con un estudiante, `POST /favorites` con `{"propertyId": 1}` y luego `GET /favorites/user/ID_DEL_USUARIO`.
6. **Reviews:** con un estudiante, `POST /reviews` con `{"rating": 5, "comment": "Muy buena", "propertyId": 1}`. La calificación va de 1 a 5.
7. **Vibe Analysis:** `GET /vibe-analysis`. Con un arrendador se crea con `POST /vibe-analysis`; cada indicador va de 1 a 5.
8. **Publicar propiedades:** con un arrendador, `POST /properties` y `PUT /properties/1/amenities` con `{"amenityIds": [1, 2]}`.
9. **Administración:** con el admin, `PATCH /users/ID/role` con `{"roleId": 2}`, `PATCH /users/ID/deactivate`, y la gestión de `/roles` y `/permissions`.
10. **Autorización:** repetir una ruta protegida sin token (responde 401) y con un rol que no corresponde (responde 403).

## Colección de Postman

El archivo `backend/postman/uhome.postman_collection.json` contiene las rutas de la aplicación.

1. En Postman, usar **Import** y seleccionar el archivo.
2. Configurar la variable `baseUrl`: `http://localhost:3001` en local, o `https://uhome-3e5i.onrender.com` para el despliegue.
3. Ejecutar primero el login para obtener el token y luego el resto de las peticiones.

## Pruebas unitarias

Hay pruebas con Jest para todos los servicios. Desde la carpeta `backend`:

```bash
npm run test
npm run test:cov
```

El segundo comando muestra la cobertura, que supera el 75 %.

## Modelo de datos

Tablas principales: `user`, `role`, `permission`, `student_profile`, `property`, `property_type`, `amenity`, `review`, `vibe_analysis` y `favorite`. Hay dos tablas intermedias: `role_permissions_permission` y `property_amenities_amenity`.

Relaciones principales:

- Un rol tiene muchos usuarios, y los roles y permisos se relacionan de muchos a muchos.
- Un usuario tiene un perfil de estudiante.
- Una propiedad tiene un tipo, un análisis de ambiente, muchas reviews y muchos amenities.
- Un usuario puede tener muchas reviews y muchos favoritos.

## Estructura

```text
Uhome/
├── docker-compose.yml
├── README.md
└── backend/
    ├── postman/        colección de Postman
    ├── seed/           script SQL con datos iniciales
    └── src/
        ├── auth/
        ├── users/
        ├── roles/
        ├── permissions/
        ├── student-profile/
        ├── properties/
        ├── property-types/
        ├── amenities/
        ├── reviews/
        ├── vibe-analysis/
        └── favorites/
```