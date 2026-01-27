# Sistema de Autenticación - Frontend

## Descripción

Sistema completo de autenticación JWT integrado con el backend. Incluye registro, login, logout y persistencia de sesión.

## Características Implementadas

### ✅ Autenticación Completa
- **Registro de usuarios** con validación de contraseñas
- **Login** con gestión de tokens JWT
- **Logout** con limpieza de datos locales y llamada al backend
- **Persistencia de sesión** con tokens JWT
- **Refresh automático de tokens** cuando expiran

### ✅ Componentes Actualizados

#### 1. Login.jsx
- Validación de campos de usuario y contraseña
- Uso de `username` en lugar de email (según API del backend)
- Manejo de errores con mensajes descriptivos
- Estados de carga (loading) con botones deshabilitados
- Feedback visual durante el proceso de login

#### 2. Register.jsx
- Validación de contraseñas:
  - Mínimo 6 caracteres
  - Debe contener mayúsculas, minúsculas y números
- Confirmación de contraseña
- Manejo de errores del backend (email duplicado, etc.)
- Estados de carga con UI deshabilitada

#### 3. LeftSidebar.jsx
- Botón de "Cerrar sesión" cuando el usuario está autenticado
- Botón de "Iniciar sesión" cuando no hay sesión activa
- Integración con el servicio de autenticación

#### 4. App.jsx
- Verificación de autenticación basada en tokens JWT
- Listener de eventos para actualizar estado de autenticación
- Gestión global del estado `isAuthenticated`

#### 5. Chat.jsx
- Todas las peticiones a la API usan `fetchWithAuth`
- Incluye automáticamente el token JWT en las peticiones
- Maneja el refresh automático de tokens

#### 6. ModelSelector.jsx
- Peticiones autenticadas a `/api/models`
- Sincronizado con el sistema de autenticación

## Servicios Implementados

### auth.service.js
Servicio principal de autenticación con los siguientes métodos:

```javascript
// Registro
authService.register(username, email, password)

// Login
authService.login(username, password)

// Logout
authService.logout()

// Refresh token
authService.refreshToken()

// Verificar autenticación
authService.isAuthenticated()

// Obtener tokens
authService.getAccessToken()
authService.getRefreshToken()

// Obtener usuario
authService.getUser()
```

### api.service.js
Wrapper para `fetch` que incluye:
- Inyección automática del token JWT en headers
- Refresh automático cuando el token expira (401)
- Manejo de errores de autenticación
- Soporte para FormData (multipart)

```javascript
// Uso
import { fetchWithAuth } from '../services/api.service'

const response = await fetchWithAuth(url, options)
```

## Flujo de Autenticación

### Registro
1. Usuario completa formulario de registro
2. Se validan los datos en el frontend
3. Se envía petición a `/api/auth/register`
4. Backend responde con `accessToken`, `refreshToken` y datos del usuario
5. Se guardan tokens en `localStorage`
6. Se dispara evento `authChange` para actualizar UI
7. Redirección automática al chat

### Login
1. Usuario ingresa username y contraseña
2. Se envía petición a `/api/auth/login`
3. Backend valida credenciales
4. Se reciben y guardan tokens JWT
5. Actualización de estado de autenticación
6. Redirección al chat

### Logout
1. Usuario hace clic en "Cerrar sesión"
2. Se envía petición a `/api/auth/logout` (con token)
3. Se limpian todos los datos locales:
   - `accessToken`
   - `refreshToken`
   - `user`
   - `isAuthenticated`
4. Se dispara evento `authChange`
5. UI se actualiza mostrando botón de login

### Peticiones Autenticadas
1. Componente usa `fetchWithAuth` en lugar de `fetch`
2. El servicio agrega automáticamente `Authorization: Bearer <token>`
3. Si la respuesta es 401:
   - Se intenta refresh del token
   - Se reintenta la petición original con el nuevo token
   - Si falla el refresh, se cierra sesión automáticamente

## Datos Almacenados (localStorage)

```javascript
{
  "accessToken": "eyJhbGc...",      // Token de acceso (15 min)
  "refreshToken": "eyJhbGc...",     // Token de refresco (7 días)
  "isAuthenticated": "true",        // Flag de autenticación
  "user": {                         // Datos del usuario
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "avatarUrl": null,
    "createdAt": "2026-01-23T..."
  }
}
```

## Validaciones Implementadas

### Frontend (Register.jsx)
- ✅ Username requerido
- ✅ Email con formato válido
- ✅ Contraseña mínimo 6 caracteres
- ✅ Contraseña con mayúscula, minúscula y número
- ✅ Confirmación de contraseña coincidente

### Backend (según API_AUTH.md)
- ✅ Username: 3-50 caracteres, alfanumérico
- ✅ Email único en la base de datos
- ✅ Contraseña hasheada con bcrypt
- ✅ Tokens JWT firmados y con expiración

## Estilos CSS

Se agregaron estilos para:
- `.error-message` - Mensajes de error con fondo rojo translúcido
- `:disabled` - Estados deshabilitados para inputs y botones
- Feedback visual durante estados de carga

## Eventos Personalizados

### authChange
Disparado cuando cambia el estado de autenticación:
```javascript
window.dispatchEvent(new Event('authChange'))
```

Escuchado en `App.jsx` para actualizar `isAuthenticated` globalmente.

## Endpoints Utilizados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registro de nuevo usuario |
| POST | `/api/auth/login` | Inicio de sesión |
| POST | `/api/auth/logout` | Cierre de sesión |
| POST | `/api/auth/refresh` | Refrescar access token |
| GET | `/api/models` | Listar modelos (autenticado) |
| POST | `/api/generate/stream` | Generar respuesta (autenticado) |

## Seguridad

### Implementado
- ✅ Tokens JWT con expiración
- ✅ Contraseñas hasheadas en backend
- ✅ Refresh automático de tokens
- ✅ Limpieza de datos al cerrar sesión
- ✅ Validación de credenciales

### Recomendaciones Adicionales
- 🔄 Implementar HTTPS en producción
- 🔄 Agregar rate limiting en el backend
- 🔄 Implementar CSRF protection
- 🔄 Considerar usar httpOnly cookies para tokens

## Testing

Para probar el sistema:

1. **Registro**:
   ```
   - Ir a /register
   - Crear cuenta con username, email y contraseña válidos
   - Verificar redirección automática al chat
   ```

2. **Login**:
   ```
   - Ir a /login
   - Ingresar credenciales
   - Verificar que aparece botón "Cerrar sesión"
   ```

3. **Logout**:
   ```
   - Hacer clic en "Cerrar sesión"
   - Verificar que se limpia localStorage
   - Verificar que aparece botón "Iniciar sesión"
   ```

4. **Persistencia**:
   ```
   - Iniciar sesión
   - Recargar la página (F5)
   - Verificar que se mantiene la sesión
   ```

5. **Token Expiration**:
   ```
   - Esperar 15+ minutos sin usar la app
   - Enviar un mensaje en el chat
   - Verificar que el token se refresca automáticamente
   ```

## Troubleshooting

### Error: "Sesión expirada"
- El refresh token expiró (7 días)
- Solución: Volver a iniciar sesión

### Error: "Credenciales inválidas"
- Usuario o contraseña incorrectos
- Verificar que el usuario existe en la BD

### Error: "El email ya está registrado"
- El email ya existe en la base de datos
- Usar otro email o iniciar sesión

### No aparece botón de cerrar sesión
- Verificar que `isAuthenticated` es true
- Revisar que hay tokens en localStorage
- Verificar console para errores

## Próximas Mejoras

- [ ] Recuperación de contraseña
- [ ] Verificación de email
- [ ] 2FA (autenticación de dos factores)
- [ ] OAuth (Google, GitHub, etc.)
- [ ] Perfil de usuario editable
- [ ] Cambio de contraseña
