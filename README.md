# Frontend Genesis 

Aplicación web moderna de chat con modelos de lenguaje (LLM) para generación de código híbrido construida con Reat. Cuenta con un sistema completo de autenticación JWT, gestión inteligente de conversaciones, soporte para modelos de visión multimodal y una experiencia de usuario fluida con tema claro/oscuro.

## 📑 Índice

- [✨ Características Principales](#-características-principales)
- [📋 Requisitos Previos](#-requisitos-previos)
- [🛠️ Instalación y Ejecución](#️-instalación-y-ejecución)
- [🏗️ Estructura del Proyecto](#️-estructura-del-proyecto)
- [🔐 Sistema de Autenticación](#-sistema-de-autenticación)
- [📦 Componentes Detallados](#-componentes-detallados)
- [🐛 Troubleshooting](#-troubleshooting)
- [📄 Licencia](#-licencia)
- [📧 Contacto](#-contacto)

---

## ✨ Características Principales

### 💬 Chat Inteligente
- **Streaming en tiempo real** de respuestas del LLM
- **Soporte multimodal** con modelos de visión (hasta 5 imágenes por mensaje)
- **Renderizado de Markdown** con resaltado de sintaxis
- **Gestión de código** con vista previa, descarga individual y exportación masiva en ZIP
- **Generación automática de títulos** para conversaciones
- **Scroll automático inteligente** que detecta si el usuario está leyendo mensajes anteriores
- **Persistencia de mensajes** antes de autenticarse (se guardan automáticamente al hacer login)

### 🔐 Autenticación JWT
- **Registro e inicio de sesión** con validación de campos en tiempo real
- **Persistencia de sesión** con tokens JWT (access + refresh)
- **Renovación automática** de tokens cuando expiran
- **Protección de rutas** y peticiones autenticadas
- **Cierre de sesión seguro** con limpieza de datos

### 📂 Gestión de Conversaciones
- **Crear, editar y eliminar chats** de forma intuitiva
- **Búsqueda avanzada** por título o fecha (múltiples formatos soportados)
- **Fijar conversaciones** importantes
- **Ordenamiento automático** por última actualización
- **Historial completo** de todas las conversaciones del usuario
- **Menú contextual** con opciones de edición, eliminación y fijado

### 🎨 Interfaz de Usuario
- **Tema claro/oscuro** con preferencia del sistema por defecto
- **Diseño responsive** adaptado a todos los dispositivos
- **Sidebar colapsable** para maximizar espacio de lectura
- **Perfil de usuario personalizable** con avatar y configuración
- **Feedback visual** en todas las interacciones
- **Indicadores de carga** durante operaciones

### 🤖 Gestión de Modelos
- **Selector de modelos** con detección automática
- **Modo Auto** que selecciona los mejores modelos según contexto.

## 📋 Requisitos Previos

- **Node.js** 16.0 o superior
- **npm** o **yarn**
- **Backend** ejecutándose en `http://localhost:3000`

## 🛠️ Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Modo desarrollo (puerto 5173 por defecto)
npm run dev

# Build de producción
npm run build

# Preview del build de producción
npm run preview

# Linting del código
npm run lint
```

## 🏗️ Estructura del Proyecto

```
frontend/
├── public/              # Recursos estáticos
├── src/
│   ├── App.jsx         # Componente raíz con enrutamiento
│   ├── main.jsx        # Punto de entrada de la aplicación
│   ├── assets/         # Imágenes, iconos, logos
│   ├── components/     # Componentes React
│   │   ├── Chat.jsx                  # Vista principal del chat
│   │   ├── ChatInput.jsx             # Input con selector de modelo e imágenes
│   │   ├── ChatMessage.jsx           # Renderizado de mensajes con Markdown
│   │   ├── ChatOptionsMenu.jsx       # Menú contextual de conversaciones
│   │   ├── CodeModal.jsx             # Modal para ver código en pantalla completa
│   │   ├── CodeSidebar.jsx           # Sidebar con snippets de código
│   │   ├── ImageDropdown.jsx         # Dropdown para gestionar imágenes
│   │   ├── ImageModal.jsx            # Modal para ver imágenes en grande
│   │   ├── ImageUploader.jsx         # Subida y preview de imágenes
│   │   ├── LeftSidebar.jsx           # Sidebar con lista de chats
│   │   ├── LoadingDots.jsx           # Animación de carga
│   │   ├── Login.jsx                 # Formulario de inicio de sesión
│   │   ├── ModelSelector.jsx         # Selector de modelos LLM
│   │   ├── Register.jsx              # Formulario de registro
│   │   ├── ThemeToggle.jsx           # Toggle de tema claro/oscuro
│   │   ├── UserProfile.jsx           # Perfil de usuario
│   │   └── UserProfileModal.jsx      # Modal de configuración de perfil
│   ├── css/            # Estilos CSS modulares (uno por componente)
│   └── services/       # Servicios y lógica de negocio
│       ├── api.service.js      # Cliente HTTP con autenticación automática
│       ├── auth.service.js     # Gestión de autenticación JWT
│       └── chat.service.js     # CRUD de conversaciones y mensajes
├── index.html          # HTML base
├── package.json        # Dependencias y scripts
├── vite.config.js      # Configuración de Vite
├── eslint.config.js    # Configuración de ESLint
├── README.md           # Este archivo
└── AUTHENTICATION.md   # Documentación detallada de autenticación
```

## 🔐 Sistema de Autenticación

El frontend implementa un sistema completo de autenticación JWT que protege todas las rutas y peticiones a la API.

### Características de Autenticación

#### ✅ Registro de Usuarios
- Validación en tiempo real de campos
- Requisitos de contraseña (mín. 6 caracteres, mayúscula, minúscula y número)
- Username alfanumérico (3-50 caracteres)
- Email con formato válido y único
- Confirmación de contraseña
- Estados de carga con UI deshabilitada

#### ✅ Inicio de Sesión
- Login con email y contraseña
- Recepción y almacenamiento de tokens JWT
- Redirección automática al chat
- Mensajes de error descriptivos

#### ✅ Cierre de Sesión
- Notificación al backend
- Limpieza completa de datos locales
- Actualización inmediata de la UI
- Evento personalizado `authChange` para sincronización

## 📦 Componentes Detallados

### Chat.jsx
**Componente principal** que gestiona toda la lógica del chat:

- **Streaming de mensajes**: Recibe respuestas del LLM token por token en tiempo real
- **Gestión de estado**: Maneja mensajes, modelo seleccionado, imágenes, tema, chats
- **Scroll inteligente**: Auto-scroll que se desactiva si el usuario lee mensajes antiguos
- **Persistencia pre-autenticación**: Guarda mensajes en localStorage si el usuario chatea sin sesión
- **Sincronización post-login**: Al autenticarse, crea automáticamente un chat con los mensajes guardados
- **Generación de títulos**: Crea títulos automáticos basados en la conversación usando IA
- **Detección de código**: Extrae y almacena snippets de código de las respuestas
- **Gestión de imágenes**: Soporte para hasta 5 imágenes por mensaje (solo modelos con visión)
- **Tema adaptable**: Detecta preferencia del sistema y permite cambio manual
- **Estados de carga**: Indicadores visuales durante generación de respuestas

**Funcionalidades clave**:
- `handleSendMessage()`: Envía mensaje con imágenes, detecta modelo de visión, gestiona streaming
- `handleNewChat()`: Crea nueva conversación, genera título automático
- `handleSelectChat()`: Carga conversación existente con todos sus mensajes
- `detectCodeInMessage()`: Extrae bloques de código del markdown de respuestas

### ChatInput.jsx
**Input de mensajes** con controles integrados:

- Textarea con **altura automática** (máx. 8 líneas)
- **Enter para enviar**, Shift+Enter para nueva línea
- Integración con `ModelSelector` e `ImageUploader`
- Botón de envío deshabilitado si no hay texto o está cargando
- Scroll automático cuando excede altura máxima

### ChatMessage.jsx
**Renderizado de mensajes** con soporte completo de Markdown:

- **ReactMarkdown**: Convierte texto plano a HTML con formato
- **Syntax Highlighting**: Resaltado de código con 200+ lenguajes (react-syntax-highlighter)
- **Tema adaptable**: Estilos de código cambian con el tema (vscDarkPlus / vs)
- **Botón copiar**: Copia código al clipboard con feedback visual
- **Preview de imágenes**: Muestra imágenes del mensaje con modal de ampliación
- **Mensajes de dos pasos**: Soporte para modelos con razonamiento previo
- **Estados especiales**: Error, cargando, primera interacción
- **PlantUML**: Renderizado de diagramas UML (expandir/colapsar)

### LeftSidebar.jsx
**Sidebar de navegación** con gestión de chats:

- **Lista de conversaciones**: Ordenadas por última actualización
- **Búsqueda avanzada**:
  - Por título (búsqueda parcial insensible a mayúsculas)
  - Por fecha (formatos: DD/MM/YYYY, DD-MM-YYYY, DD/MM, YYYY-MM-DD)
- **Crear nuevo chat**: Botón destacado arriba
- **Chat activo**: Resaltado visual de la conversación actual
- **Menú contextual**: Editar título, fijar/desfijar, eliminar
- **Chats fijados**: Aparecen primero con indicador visual
- **Perfil de usuario**: Avatar, nombre y configuración
- **Toggle de autenticación**: Login/Logout según estado
- **Modo compacto**: Colapsa para maximizar espacio del chat
- **Estados de carga**: Skeleton loaders mientras carga chats

**Funcionalidades**:
- `loadChats()`: Carga todas las conversaciones del usuario autenticado
- `handleChatClick()`: Cambia a una conversación específica
- `handleDeleteChat()`: Elimina conversación con confirmación
- `handleTogglePin()`: Fija/desfija conversación

### ChatOptionsMenu.jsx
**Menú contextual** de cada chat (botón ⋮):

- **Editar título**: Modal inline para renombrar
- **Fijar/Desfijar**: Mantiene chat arriba de la lista
- **Eliminar**: Confirmación antes de borrar
- **Posicionamiento inteligente**: Se ajusta si está cerca del borde
- **Cierre automático**: Al hacer clic fuera o presionar Escape

### ModelSelector.jsx
**Selector de modelos LLM** con detección inteligente:

- **Carga automática** de modelos disponibles desde el backend
- **Modo Auto**: Selección inteligente según contexto (texto o visión)
- **Información detallada**: Modal con descripción de cada modelo
- **Validación de imágenes**: Deshabilita imágenes si el modelo no soporta visión
- **Actualización dinámica**: Refresca lista de modelos disponibles
- **Fallback**: Mensaje "No hay LLMs" si no hay modelos

**Detección de modelos de visión**:
```javascript
// Palabras clave: vl, vision, llava, bakllava, moondream
const isVisionModel = modelName.toLowerCase().includes('vision')
```

### ImageUploader.jsx
**Gestor de imágenes** para mensajes multimodales:

- **Drag & drop**: Arrastra imágenes directamente
- **Selección de archivos**: Click para explorar
- **Límite de 5 imágenes** por mensaje
- **Preview en miniatura**: Vista previa antes de enviar
- **Eliminar individual**: Remove imágenes del mensaje
- **Modal de ampliación**: Ver imagen en tamaño completo
- **Dropdown para múltiples**: Muestra miniaturas cuando hay >1 imagen
- **Validación de modelo**: Solo habilitado con modelos de visión
- **Formatos soportados**: JPG, PNG, GIF, WebP

### CodeSidebar.jsx
**Sidebar de código** con gestión avanzada:

- **Extracción automática**: Detecta bloques de código en respuestas
- **Vista previa**: Muestra lenguaje y primeras líneas
- **Modal de código**: Ver código completo con syntax highlighting
- **Descarga individual**: Cada snippet con nombre generado inteligentemente
- **Descarga masiva**: Exportar todos los códigos en un archivo ZIP
- **Generación de nombres**:
  1. Detecta comentarios con nombre de archivo
  2. Busca `class NombreClase` o `function nombreFuncion()`
  3. Analiza palabras del mensaje del usuario
  4. Fallback: `code_{index}.{ext}`
- **Agrupación**: Organiza códigos por mensaje del usuario
- **Contador**: Muestra cantidad total de snippets
- **Colapsable**: Minimiza para maximizar espacio

### UserProfile.jsx y UserProfileModal.jsx
**Perfil y configuración** del usuario:

- **Avatar personalizable**: Upload o URL externa
- **Nombre de usuario**: Editable con validación
- **Email**: Solo lectura
- **Fecha de creación**: Información de cuenta
- **Toggle de tema**: Cambio entre claro y oscuro
- **Cerrar sesión**: Botón con confirmación
- **Preview de cambios**: Vista previa antes de guardar
- **Estados de carga**: Feedback durante actualización
- **Validación**: Username 3-50 caracteres, formato de URL

### Login.jsx y Register.jsx
**Formularios de autenticación** con validación:

**Login**:
- Email y contraseña
- Validación de formato email
- Mostrar/ocultar contraseña
- Mensajes de error por campo
- Estados de carga
- Link a registro

**Register**:
- Username, email, contraseña, confirmación
- Validación en tiempo real
- Errores específicos por campo
- Mostrar/ocultar ambas contraseñas
- Estados de carga
- Link a login

### Componentes Auxiliares

#### ThemeToggle.jsx
- Toggle simple de tema
- Cambio instantáneo en toda la app

#### LoadingDots.jsx
- Animación de tres puntos
- Indica que el LLM está generando respuesta

#### ImageModal.jsx
- Modal para ver imágenes en tamaño completo
- Navegación entre imágenes (si hay múltiples)
- Zoom y cierre con Escape

#### ImageDropdown.jsx
- Dropdown que muestra miniaturas de imágenes
- Click para ver en modal
- Eliminar imágenes individuales

#### CodeModal.jsx
- Modal para ver código en pantalla completa
- Syntax highlighting con tema adaptable
- Botones copiar y descargar
- Nombre del archivo generado
- Cierre con Escape o click fuera.

## 🐛 Troubleshooting

### Problemas Comunes

#### "Cannot connect to backend"
```bash
# Verificar que el backend está ejecutándose
curl http://localhost:3000/api/health

# Debe responder: {"status":"ok"}

# Si no responde:
cd backend
npm start
```

#### "CORS error"
```bash
# Verificar configuración CORS en backend
# backend/src/server.js debe tener:
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))
```

#### "Module not found"
```bash
# Limpiar y reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

#### "Build failed"
```bash
# Limpiar cache de Vite
rm -rf node_modules/.vite
npm run build
```

#### "Token expirado constantemente"
```bash
# Verificar sincronización de reloj del sistema
date

# Verificar que el backend no tiene problemas de JWT
# Revisar logs del backend
```

## 📄 Licencia

Este proyecto es parte de un Trabajo de Fin de Grado de la Universidad de Castilla La Mancha.

## 📧 Contacto

- 📧 fernandomm1840@gmail.com

---

**Desarrollado por**: Fernando Martín