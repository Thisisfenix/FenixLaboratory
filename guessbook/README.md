# 🎨 Guestbook de Dibujos v1.0.3

**Sistema de Perfiles y Comunidad Artística - Guestbook interactivo con sistema social completo**

## 🚀 Versión 1.0.3 - Sistema de Perfiles y Comunidad

### 👤 Sistema de Perfiles Completo

**Funcionalidades principales del sistema de perfiles:**

#### 🎭 **Avatares Personalizados**
- 12 emojis predefinidos para elegir
- Subida de imagen personalizada (PNG/JPG, máx 1MB)
- Vista previa en tiempo real
- Persistencia en localStorage y Firebase

#### 📊 **Estadísticas Detalladas**
- Contador de dibujos totales
- Total de likes recibidos
- Comentarios generados
- Categoría favorita automática
- Fecha de registro

#### 🏆 **Sistema de Logros**
- 🎨 **Primer Dibujo**: Tu primera obra
- 🖌️ **Artista Activo**: 5+ dibujos
- 🏆 **Maestro del Arte**: 10+ dibujos
- ❤️ **Popular**: 10+ likes totales
- ⭐ **Estrella**: 50+ likes totales
- 💬 **Conversador**: 20+ comentarios

#### 👥 **Red Social**
- Sistema de seguimiento de artistas
- Lista de usuarios seguidos
- Perfiles públicos de otros usuarios
- Botones de seguir/dejar de seguir

#### 🎨 **Galería Personal**
- Vista de todos tus dibujos
- Estadísticas por obra (likes, categoría)
- Acceso rápido desde el perfil
- Límite de 12 dibujos mostrados + contador total

### 🏆 Sistema de Rankings Múltiples

El guestbook incluye **4 tipos de rankings dinámicos** que se actualizan en tiempo real:

#### 1. **❤️ Más Populares**
- Ranking basado en likes recibidos
- Los dibujos con más corazones aparecen primero
- Sistema de votación único por usuario

#### 2. **💬 Más Comentados** 
- Ranking por interacción social
- Dibujos con más comentarios y engagement
- Sistema de comentarios en tiempo real

#### 3. **🎨 Más Detallados**
- Ranking por cantidad de trazos/strokes
- Reconoce el esfuerzo artístico invertido
- Algoritmo que cuenta cada trazo del pincel

#### 4. **🆕 Recientes**
- Obras más nuevas primero
- Ordenado por timestamp de creación
- Permite descubrir arte fresco

### 🏅 Sistema de Marcos Especiales

**Marcos dinámicos según posición en ranking:**

- 🥇 **Top 1**: Marco dorado con aura brillante y corona
- 🥈 **Top 2**: Marco plateado con medalla de plata  
- 🥉 **Top 3**: Marco bronce con medalla de bronce
- 📊 **Indicador numérico**: Muestra posición (#1, #2, #3) junto al nombre

### 📊 Estadísticas Avanzadas

**Panel de métricas en tiempo real:**
- Total de obras en la galería
- Suma total de likes recibidos
- Contador de comentarios globales
- Promedio de likes por obra
- Distribución por categorías
- Estadísticas de dispositivos (móvil vs desktop)
- Promedio de trazos por dibujo

### 🔄 Actualización en Tiempo Real

- **Firebase Firestore** para sincronización instantánea
- Rankings que se actualizan automáticamente
- Nuevos dibujos aparecen sin recargar página
- Sistema de notificaciones para nuevas obras

## ✨ Características Principales

### 🖌️ Herramientas de Dibujo Avanzadas
- **Pincel**: Dibujo libre con grosor personalizable
- **Spray**: Efecto aerógrafo con densidad ajustable  
- **Formas**: Círculos, rectángulos y líneas perfectas
- **Texto**: Añadir texto con diferentes tamaños
- **Borrador**: Eliminar partes del dibujo
- **Selección**: Copiar y pegar áreas del canvas

### 🎨 Personalización Visual
- **Paleta de colores**: 8 colores predefinidos + selector personalizado
- **4 tamaños de canvas**: Pequeño, Mediano, Grande, Panorámico
- **Temas dinámicos**: Default, Neon, Retro, Hacker, Sunset
- **Sincronización**: Los temas se mantienen entre páginas

### 🖼️ Contenido Multimedia
- **🌄 Fondos de Imagen**: Sistema exclusivo para fondos personalizados
  - Subir PNG/JPG como fondo del canvas
  - Auto-ajuste al tamaño del canvas
  - Preserva el dibujo al cambiar fondo
  - Botón para quitar fondo manteniendo el arte
- **🏷️ Stickers Personalizados**: Sistema separado para elementos posicionables
  - Subir PNG/JPG como stickers individuales
  - Herramienta ✋ Mover para arrastrar stickers
  - Colocación precisa con click en canvas
  - Sistema de capas: Fondo → Dibujo → Stickers
- **🎨 Filtros**: Blur, Pixel Art, Vintage + opción de quitar

### 🔧 Funcionalidades Avanzadas
- **Historial completo**: Deshacer/Rehacer ilimitado (Ctrl+Z/Ctrl+Y)
- **Zoom**: Acercar/alejar para detalles precisos
- **Exportación**: PNG con todo el contenido (fondo + dibujo + stickers)
- **Atajos de teclado**: B=Pincel, S=Spray, C=Círculo, H=Mover, etc.
- **🌄 Sistema de Fondos**: Apartado exclusivo para imágenes de fondo
- **🏷️ Sistema de Stickers**: Apartado separado para elementos móviles

### 📱 Optimización Móvil
- **Touch events**: Dibujo táctil mejorado
- **Responsive**: Adaptación automática a pantallas pequeñas
- **Prevención de scroll**: No interfiere con el dibujo
- **Canvas adaptativo**: Se ajusta al dispositivo

### 🌐 Sistema Social en Tiempo Real
- **Firebase**: Base de datos en tiempo real
- **Likes únicos**: 1 like por persona usando localStorage
- **Comentarios**: Sistema de comentarios por dibujo
- **Ranking Top 3**: Los dibujos más populares destacados
- **Búsqueda**: Por autor y filtros por categoría

### 📄 Galería Avanzada
- **Paginación**: 12 dibujos por página
- **Filtros**: Por autor y categoría
- **Categorías**: Arte, Meme, Divertido, Abstracto, Otro
- **Vista modal**: Ampliación con panel de comentarios
- **Compartir**: Web Share API + copia al portapapeles

### 🛡️ Seguridad y Moderación
- **Cooldown**: 5 minutos entre dibujos para evitar spam
- **Moderación básica**: Filtro de palabras extremadamente ofensivas
- **Prevención de salida**: Aviso si hay trabajo sin guardar
- **Variables de entorno**: API keys protegidas

### ✨ Efectos Visuales
- **Sparkles**: Partículas al dibujar
- **Confetti**: Celebración al guardar
- **Animaciones**: Hover effects en tarjetas
- **Transiciones**: Suaves cambios de tema
- **Feedback Visual**: Botones cambian estado (Listo → Aplicado)
- **Capas Visuales**: Sistema de 3 capas (Fondo, Dibujo, Stickers)

## 🚀 Tecnologías Utilizadas

- **Frontend**: HTML5 Canvas, CSS3, JavaScript ES6+
- **Framework**: Bootstrap 5.3.3
- **Base de datos**: Firebase Firestore
- **Iconos**: Bootstrap Icons
- **Fuentes**: Google Fonts (Space Grotesk)
- **Hosting**: GitHub Pages

## 📊 Estadísticas de Desarrollo

- **Líneas de código**: ~2,500 líneas de JavaScript
- **Herramientas**: 12+ herramientas de dibujo y edición
- **Temas**: 5 temas visuales dinámicos
- **Rankings**: 4 tipos de clasificación en tiempo real
- **Sistemas multimedia**: 2 (Fondos + Stickers) con apartados exclusivos
- **Atajos de teclado**: 12+ combinaciones
- **Eventos touch**: Optimizado para móviles
- **Cooldown**: 5 minutos entre uploads
- **Capas de renderizado**: 3 niveles (Fondo, Dibujo, Stickers)

## 🎯 Casos de Uso

1. **Libro de visitas artístico**: Los visitantes dejan dibujos en lugar de texto
2. **Galería colaborativa**: Comunidad de arte digital
3. **Herramienta educativa**: Enseñanza de arte digital
4. **Entretenimiento**: Dibujo libre y creativo
5. **Competencias**: Ranking por likes y popularidad

## 🆕 Novedades v1.0.3

### 👤 Sistema de Perfiles Completo
- **Círculo de perfil** fijo en la esquina superior izquierda
- **Modal de perfil** con toda la información del usuario
- **Configuración completa** de avatar y nombre de usuario
- **Persistencia** en localStorage y sincronización con Firebase

### 🎭 Avatares Personalizados
- **12 emojis** predefinidos para elegir
- **Subida de imagen** personalizada con validación
- **Vista previa** en tiempo real del avatar
- **Dos modos**: Emoji y Imagen personalizada

### 📊 Estadísticas y Logros
- **6 logros** desbloqueables por actividad
- **Estadísticas detalladas** de cada usuario
- **Tracking automático** de actividad
- **Sistema de achievements** progresivo

### 👥 Red Social
- **Sistema de seguimiento** de otros artistas
- **Perfiles públicos** con información completa
- **Lista de seguidos** en el perfil personal
- **Botones de seguir/dejar de seguir** en modales

### 🎨 Galería Personal
- **Vista de todos los dibujos** del usuario
- **Acceso directo** desde el perfil
- **Estadísticas por obra** (likes, categoría)
- **Integración** con el sistema de perfiles

## 🔄 Roadmap v1.0.4

- [x] ✅ Sistema de perfiles completo
- [x] ✅ Avatares personalizados (emoji + imagen)
- [x] ✅ Sistema de logros y achievements
- [x] ✅ Red social con seguimiento
- [x] ✅ Galería personal integrada
- [x] ✅ Estadísticas avanzadas por usuario
- [ ] Notificaciones de actividad
- [ ] Sistema de mensajes privados
- [ ] Grupos y comunidades
- [ ] Challenges y concursos
- [ ] Sistema de reputación
- [ ] Badges especiales por temporada

## 👨💻 Desarrollado por

**ThisIsFenix** - Diciembre 2024

---

*Parte del ecosistema FenixLaboratory v2.0.7 - Sistema de Perfiles y Comunidad Artística*