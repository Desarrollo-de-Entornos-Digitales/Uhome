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

El despliegue usa el plan gratuito de Render, que apaga el servicio tras un periodo de inactividad. La primera petición después de ese tiempo puede tardar más de lo habitual.

La base de datos de producción está alojada en Neon utilizando PostgreSQL.

## Tecnologías

- NestJS con TypeScript
- Node.js 22
- TypeORM
- PostgreSQL 16
- Autenticación con JWT
- Passport
- Contraseñas encriptadas con `bcryptjs`
- Resend para correos de recuperación de contraseña
- Vitest para pruebas unitarias
- Docker para la base de datos local
- Postman para pruebas de integración

## Ejecutar el proyecto en local

### Requisitos

- Node.js 22
- Docker Desktop
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/linamacaicedo/Uhome.git
cd Uhome
```

### 2. Levantar PostgreSQL

Desde la raíz del proyecto:

```bash
docker compose up -d
```

La base de datos local utiliza el puerto `5433`.

### 3. Instalar dependencias

```bash
cd backend
npm install
```

### 4. Configurar variables de entorno

Se puede crear un archivo `.env` dentro de `backend`.

Ejemplo:

```env
JWT_SECRET=secret
PORT=3001

RESEND_API_KEY=
EMAIL_FROM=UHome <onboarding@resend.dev>
FRONTEND_URL=http://localhost:3000
```

Las credenciales reales no deben subirse al repositorio.

### 5. Ejecutar el backend

```bash
npm run start:dev
```

Esperar hasta que aparezca el mensaje:

```text
Nest application successfully started
```

La API queda disponible en:

```text
http://localhost:3001
```

En el primer arranque se crean las tablas y los datos base necesarios para la aplicación.

### 6. Cargar datos de ejemplo

Desde la raíz del repositorio:

```bash
docker exec -i uhome-postgres psql -U uhome -d uhome < backend/seed/seed.sql
```

El script `backend/seed/seed.sql` borra y vuelve a crear usuarios, propiedades, amenities, perfiles, reviews, análisis de ambiente y favoritos, por lo que se puede ejecutar varias veces durante el desarrollo.

## Variables de entorno

En local se pueden definir en un archivo `.env`. En producción se configuran como variables de entorno en Render.

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Cadena de conexión de PostgreSQL. Si no existe, se utiliza la base de datos local. |
| `JWT_SECRET` | Clave utilizada para firmar los tokens JWT. |
| `PORT` | Puerto del servidor. En local se utiliza `3001`; Render puede asignarlo automáticamente. |
| `RESEND_API_KEY` | API key de Resend utilizada para enviar correos de recuperación de contraseña. |
| `EMAIL_FROM` | Dirección utilizada como remitente de los correos enviados por Resend. |
| `FRONTEND_URL` | URL del frontend utilizada para construir el enlace de recuperación de contraseña. |

Ejemplo:

```env
RESEND_API_KEY=
EMAIL_FROM=UHome <onboarding@resend.dev>
FRONTEND_URL=http://localhost:3000
```

Por seguridad, las API keys, secretos y credenciales reales no deben almacenarse en el repositorio.

## Cuentas de prueba

La contraseña de todas las cuentas de prueba es:

```text
Uhome1234
```

| Correo | Rol |
|---|---|
| `admin@uhome.com` | admin |
| `carlos.mendoza@uhome.com` | landlord |
| `laura.gomez@uhome.com` | landlord |
| `ana.torres@uhome.com` | student |
| `luis.perez@uhome.com` | student |
| `maria.rojas@uhome.com` | student |
| `jorge.castro@uhome.com` | student |
| `sofia.vargas@uhome.com` | student desactivado |

La cuenta de Sofía Vargas está desactivada y no puede iniciar sesión.

## Autenticación y roles

### Inicio de sesión

Para iniciar sesión:

```bash
curl -X POST http://localhost:3001/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"admin@uhome.com","password":"Uhome1234"}'
```

Si las credenciales son correctas, el backend devuelve un objeto con un `access_token` y la información básica del usuario.

Ejemplo:

```json
{
  "access_token": "JWT_TOKEN",
  "user": {
    "id": 1,
    "email": "admin@uhome.com",
    "fullName": "Admin UHome",
    "username": "admin",
    "role": "admin"
  }
}
```

El token debe enviarse en las rutas protegidas mediante el encabezado:

```text
Authorization: Bearer TOKEN
```

Ejemplo:

```bash
curl http://localhost:3001/roles \
-H "Authorization: Bearer EL_TOKEN"
```

## Roles

### student

Puede:

- crear y gestionar su perfil;
- buscar propiedades;
- guardar propiedades como favoritas;
- escribir reviews;
- consultar sus propios datos.

### landlord

Puede:

- publicar propiedades;
- actualizar sus propiedades;
- gestionar amenities;
- crear y modificar análisis de ambiente.

### admin

Puede:

- gestionar usuarios;
- cambiar roles;
- activar y desactivar usuarios;
- gestionar roles y permisos;
- gestionar catálogos;
- realizar las operaciones administrativas de la plataforma.

Un usuario nuevo se registra siempre con el rol `student`.

Solo un administrador puede cambiar el rol de otro usuario.

Un usuario desactivado no puede iniciar sesión y los accesos protegidos deben respetar el estado de su cuenta.

## Autenticación, autorización y manejo de estado

La autenticación se realiza mediante JWT.

Cuando el usuario inicia sesión correctamente, el backend genera un token firmado y devuelve:

- `access_token`;
- id del usuario;
- email;
- nombre;
- username;
- rol.

El frontend almacena la información de autenticación para mantener la sesión del usuario y envía automáticamente el token en las solicitudes protegidas utilizando:

```text
Authorization: Bearer TOKEN
```

Las rutas protegidas validan el JWT antes de permitir el acceso.

Si una petición no incluye un token válido, el backend responde con:

```text
401 Unauthorized
```

Si el usuario está autenticado pero no tiene el rol o los permisos requeridos, la API responde con:

```text
403 Forbidden
```

El frontend también maneja respuestas `401` eliminando la sesión almacenada y redirigiendo al usuario nuevamente a la pantalla de login.

Al cerrar sesión se eliminan el token y los datos de sesión correspondientes.

## Recuperación de contraseña

UHome permite recuperar una contraseña mediante un flujo de correo electrónico utilizando Resend.

El proceso utiliza dos endpoints:

```text
POST /auth/forgot-password
POST /auth/reset-password
```

### Solicitar recuperación

El usuario envía su correo a:

```text
POST /auth/forgot-password
```

Ejemplo:

```json
{
  "email": "usuario@email.com"
}
```

Si el usuario existe, el backend:

1. genera un token criptográficamente aleatorio;
2. calcula el hash del token;
3. almacena únicamente el hash en la base de datos;
4. establece una fecha de expiración de 30 minutos;
5. envía el token original al usuario mediante un enlace de recuperación por correo.

El enlace se construye utilizando la variable:

```text
FRONTEND_URL
```

y tiene una estructura similar a:

```text
http://localhost:3000/reset-password?token=TOKEN
```

El backend devuelve una respuesta genérica incluso cuando el correo no pertenece a un usuario registrado.

Esto evita revelar qué direcciones de correo se encuentran registradas en la plataforma.

### Restablecer contraseña

La nueva contraseña se envía a:

```text
POST /auth/reset-password
```

Ejemplo:

```json
{
  "token": "TOKEN_RECIBIDO",
  "password": "nuevaContraseña"
}
```

El backend:

1. calcula el hash del token recibido;
2. busca el usuario asociado;
3. verifica que el token exista;
4. verifica que no haya expirado;
5. valida la nueva contraseña;
6. cifra la contraseña utilizando `bcryptjs`;
7. actualiza la contraseña del usuario;
8. elimina el token de recuperación y su fecha de expiración.

De esta forma, un token utilizado correctamente no puede volver a utilizarse.

Los tokens inválidos o expirados son rechazados.

### Resend en desarrollo

Durante el desarrollo se utiliza:

```text
UHome <onboarding@resend.dev>
```

El dominio `resend.dev` es un dominio de prueba de Resend.

Mientras se utilice este dominio, los correos de recuperación solo pueden enviarse al correo propietario de la cuenta de Resend utilizada en el proyecto.

Para producción se debe configurar un dominio propio verificado y actualizar la variable `EMAIL_FROM`.

## Endpoints

"Público" significa que la ruta no requiere token.

"Dueño o admin" significa que un usuario únicamente puede actuar sobre sus propios datos, excepto cuando tiene rol de administrador.

### Autenticación

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/auth/login` | Público |
| POST | `/auth/logout` | Con token |
| POST | `/auth/forgot-password` | Público |
| POST | `/auth/reset-password` | Público |

### Usuarios

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/users` | Público - registro |
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
| GET | `/properties` | Público |
| GET | `/properties/:id` | Público |
| POST | `/properties` | landlord o admin |
| PATCH, DELETE | `/properties/:id` | landlord o admin |
| GET | `/properties/:id/amenities` | Público |
| PUT | `/properties/:id/amenities` | landlord o admin |
| POST, DELETE | `/properties/:id/amenities/:amenityId` | landlord o admin |

La búsqueda de propiedades admite filtros como:

```text
?maxPrice=
?maxDistance=
```

### Catálogos

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/amenities` | Público |
| GET | `/amenities/:id` | Público |
| POST | `/amenities` | admin |
| PATCH, DELETE | `/amenities/:id` | admin |
| GET | `/property-types` | Público |
| GET | `/property-types/:id` | Público |
| POST | `/property-types` | admin |
| PATCH, DELETE | `/property-types/:id` | admin |

### Reviews

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/reviews` | Público |
| GET | `/reviews/:id` | Público |
| POST | `/reviews` | student o admin |
| PATCH, DELETE | `/reviews/:id` | Autor o admin |

Las reviews pueden filtrarse por propiedad utilizando:

```text
?propertyId=
```

### Vibe Analysis

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/vibe-analysis` | Público |
| GET | `/vibe-analysis/:id` | Público |
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

### 1. Registro e inicio de sesión

Crear un usuario utilizando:

```text
POST /users
```

Luego iniciar sesión:

```text
POST /auth/login
```

### 2. Búsqueda y filtros

```text
GET /properties
GET /properties?maxPrice=1000000
GET /properties?maxDistance=800
```

### 3. Detalle de una propiedad

```text
GET /properties/1
```

### 4. Preferencias

Con un estudiante autenticado:

```text
POST /student-profile
```

Se pueden almacenar datos como presupuesto y distancia máxima.

### 5. Favoritos

Agregar una propiedad:

```text
POST /favorites
```

Ejemplo:

```json
{
  "propertyId": 1
}
```

Consultar favoritos:

```text
GET /favorites/user/ID_DEL_USUARIO
```

### 6. Reviews

Con un estudiante:

```text
POST /reviews
```

Ejemplo:

```json
{
  "rating": 5,
  "comment": "Muy buena",
  "propertyId": 1
}
```

La calificación va de 1 a 5.

### 7. Vibe Analysis

Consultar:

```text
GET /vibe-analysis
```

Crear como landlord:

```text
POST /vibe-analysis
```

Cada indicador se maneja en una escala de 1 a 5.

### 8. Publicar propiedades

Con un landlord:

```text
POST /properties
```

Asignar amenities:

```text
PUT /properties/1/amenities
```

Ejemplo:

```json
{
  "amenityIds": [1, 2]
}
```

### 9. Administración

Con un usuario administrador:

```text
PATCH /users/ID/role
```

Ejemplo:

```json
{
  "roleId": 2
}
```

También se puede:

```text
PATCH /users/ID/deactivate
PATCH /users/ID/activate
```

y gestionar:

```text
/roles
/permissions
```

### 10. Autorización

Probar una ruta protegida sin token debe producir:

```text
401 Unauthorized
```

Probar una ruta con un usuario autenticado pero sin el rol requerido debe producir:

```text
403 Forbidden
```

### 11. Recuperación de contraseña

Solicitar el correo:

```text
POST /auth/forgot-password
```

Ejemplo:

```json
{
  "email": "usuario@email.com"
}
```

Después utilizar el token recibido por correo:

```text
POST /auth/reset-password
```

Ejemplo:

```json
{
  "token": "TOKEN_RECIBIDO",
  "password": "NuevaPassword123"
}
```

Después de completar el proceso, la contraseña anterior deja de ser válida y el usuario puede iniciar sesión utilizando la nueva.

## Colección de Postman

El archivo:

```text
backend/postman/uhome.postman_collection.json
```

contiene las rutas de la aplicación.

Para utilizarlo:

1. Abrir Postman.
2. Seleccionar **Import**.
3. Importar `uhome.postman_collection.json`.
4. Configurar la variable `baseUrl`.

Para desarrollo local:

```text
http://localhost:3001
```

Para producción:

```text
https://uhome-3e5i.onrender.com
```

Ejecutar primero el login para obtener un token JWT y utilizarlo posteriormente en las rutas protegidas.

## Pruebas unitarias

El backend utiliza Vitest para ejecutar las pruebas unitarias.

Desde la carpeta `backend`:

```bash
npm test
```

Para ejecutar las pruebas con cobertura:

```bash
npm run test:cov
```

Actualmente existen pruebas para los diferentes servicios de la aplicación, incluyendo:

- autenticación;
- usuarios;
- propiedades;
- amenities;
- favoritos;
- roles;
- permisos;
- tipos de propiedad;
- perfiles de estudiantes;
- reviews;
- análisis de ambiente.

### Pruebas de autenticación

Las pruebas del servicio de autenticación verifican, entre otros casos:

- que el servicio se cree correctamente;
- login exitoso;
- generación de JWT;
- inclusión del rol en la respuesta;
- contraseña incorrecta;
- correo inexistente;
- rechazo de usuarios desactivados;
- generación de un token para recuperar la contraseña;
- respuesta segura cuando el correo no está registrado;
- recuperación de contraseña con token válido;
- rechazo de tokens inválidos;
- rechazo de tokens expirados;
- rechazo de contraseñas nuevas que no cumplen la longitud mínima.

El flujo de recuperación también fue probado de forma integral mediante el envío del correo, apertura del enlace de recuperación, cambio de contraseña y posterior inicio de sesión utilizando la nueva contraseña.

## Modelo de datos

Tablas principales:

- `user`
- `role`
- `permission`
- `student_profile`
- `property`
- `property_type`
- `amenity`
- `review`
- `vibe_analysis`
- `favorite`

Además existen tablas intermedias como:

- `role_permissions_permission`
- `property_amenities_amenity`

## Relaciones principales

- Un rol tiene muchos usuarios.
- Roles y permisos tienen una relación muchos a muchos.
- Un usuario puede tener un perfil de estudiante.
- Una propiedad pertenece a un tipo de propiedad.
- Una propiedad puede tener un análisis de ambiente.
- Una propiedad puede tener muchas reviews.
- Una propiedad puede tener muchos amenities.
- Un usuario puede escribir muchas reviews.
- Un usuario puede guardar muchas propiedades como favoritas.

## Estructura

```text
Uhome/
├── docker-compose.yml
├── README.md
└── backend/
    ├── postman/
    │   └── uhome.postman_collection.json
    ├── seed/
    │   └── seed.sql
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

## Seguridad

UHome implementa diferentes medidas de seguridad:

- las contraseñas se almacenan utilizando hashes generados con `bcryptjs`;
- las rutas privadas requieren JWT;
- la autorización se controla mediante roles y permisos;
- los usuarios desactivados no pueden iniciar sesión;
- los tokens de recuperación de contraseña tienen una duración limitada;
- el token original de recuperación no se almacena directamente en la base de datos;
- la respuesta de Forgot Password no revela si un correo está registrado;
- los tokens de recuperación utilizados se eliminan después de cambiar la contraseña;
- las credenciales y API keys se administran mediante variables de entorno.

## Estado del proyecto

El backend se encuentra desplegado públicamente en Render:

```text
https://uhome-3e5i.onrender.com
```

Incluye autenticación, autorización por roles, gestión de usuarios, propiedades, perfiles, favoritos, reviews, amenities, análisis de ambiente, recuperación de contraseña y pruebas unitarias.