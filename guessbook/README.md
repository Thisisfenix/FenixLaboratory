# 🎨 Guestbook de Dibujos v2.0

**Sistema avanzado de guestbook con rankings, estadísticas en tiempo real y funcionalidades sociales**

## 🚀 Versión 1.0.1 - Sistema de Rankings Avanzado

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
- **3 tamaños de canvas**: Pequeño (400x300), Mediano (600x400), Grande (800x600)
- **Temas dinámicos**: Default, Neon, Retro, Hacker, Sunset
- **Sincronización**: Los temas se mantienen entre páginas

### 🖼️ Contenido Multimedia
- **Subir PNG**: Como fondo completo o stickers posicionables
- **Emojis**: 8 emojis rápidos como stickers clickeables
- **Filtros**: Blur, Pixel Art, Vintage + opción de quitar

### 🔧 Funcionalidades Avanzadas
- **Historial completo**: Deshacer/Rehacer ilimitado (Ctrl+Z/Ctrl+Y)
- **Zoom**: Acercar/alejar para detalles precisos
- **Exportación múltiple**: PNG, JPG, SVG
- **Atajos de teclado**: B=Pincel, S=Spray, C=Círculo, etc.

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
- **Cooldown**: 10 minutos entre dibujos para evitar spam
- **Moderación básica**: Filtro de palabras extremadamente ofensivas
- **Prevención de salida**: Aviso si hay trabajo sin guardar
- **Variables de entorno**: API keys protegidas en Netlify

### ✨ Efectos Visuales
- **Sparkles**: Partículas al dibujar
- **Confetti**: Celebración al guardar
- **Animaciones**: Hover effects en tarjetas
- **Transiciones**: Suaves cambios de tema

## 🚀 Tecnologías Utilizadas

- **Frontend**: HTML5 Canvas, CSS3, JavaScript ES6+
- **Framework**: Bootstrap 5.3.3
- **Base de datos**: Firebase Firestore
- **Iconos**: Bootstrap Icons
- **Fuentes**: Google Fonts (Space Grotesk)
- **Hosting**: Netlify con variables de entorno

## 📊 Estadísticas de Desarrollo

- **Líneas de código**: ~1,200 líneas de JavaScript
- **Herramientas**: 8 herramientas de dibujo diferentes
- **Temas**: 5 temas visuales
- **Rankings**: 4 tipos de clasificación
- **Formatos de exportación**: 3 (PNG, JPG, SVG)
- **Atajos de teclado**: 10+ combinaciones
- **Eventos touch**: Optimizado para móviles
- **Cooldown**: 10 minutos entre uploads

## 🎯 Casos de Uso

1. **Libro de visitas artístico**: Los visitantes dejan dibujos en lugar de texto
2. **Galería colaborativa**: Comunidad de arte digital
3. **Herramienta educativa**: Enseñanza de arte digital
4. **Entretenimiento**: Dibujo libre y creativo
5. **Competencias**: Ranking por likes y popularidad

## 🔄 Roadmap v1.1

- [ ] Sistema de usuarios con autenticación
- [ ] Capas de dibujo múltiples
- [ ] Herramientas de selección avanzadas
- [ ] Exportar a diferentes formatos (SVG, PDF)
- [ ] Sistema de moderación automática
- [ ] API REST para integración externa
- [ ] Rankings por período (diario, semanal, mensual)
- [ ] Sistema de badges y logros

## 👨‍💻 Desarrollado por

**ThisIsFenix** - Noviembre 2024

---

*Parte del ecosistema FenixLaboratory v2.0.7*