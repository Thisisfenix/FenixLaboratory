# 🎨 Guestbook de Dibujos v2.1

**Sistema avanzado de guestbook con rankings, estadísticas en tiempo real, fondos personalizados y funcionalidades sociales**

## 🚀 Versión 2.1 - Sistema de Fondos y Mejoras Avanzadas

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

- **Líneas de código**: ~1,500 líneas de JavaScript
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

## 🆕 Novedades v2.1

### 🌄 Sistema de Fondos de Imagen
- **Apartado exclusivo** separado de stickers
- **Auto-escalado** de imágenes al canvas
- **Preservación** del dibujo al cambiar fondo
- **Confirmación** antes de quitar fondo

### 🏷️ Sistema de Stickers Mejorado
- **Apartado independiente** del sistema de fondos
- **Herramienta ✋ Mover** para arrastrar stickers
- **Colocación precisa** con click en canvas
- **Sistema de capas** bien definido

### 🔧 Mejoras Técnicas
- **Funciones JavaScript** completas para ambos sistemas
- **Event listeners** optimizados
- **Validación de archivos** PNG/JPG/JPEG
- **Feedback visual** en botones de estado

## 🔄 Roadmap v2.2

- [x] ✅ Sistema de fondos personalizados
- [x] ✅ Sistema de stickers con apartado exclusivo
- [x] ✅ Herramienta de mover stickers
- [x] ✅ Sistema de capas (Fondo → Dibujo → Stickers)
- [ ] Galería de fondos predefinidos
- [ ] Stickers predefinidos por categorías
- [ ] Sistema de usuarios con autenticación
- [ ] Capas de dibujo múltiples
- [ ] Herramientas de selección avanzadas
- [ ] Rankings por período (diario, semanal, mensual)
- [ ] Sistema de badges y logros

## 👨💻 Desarrollado por

**ThisIsFenix** - Diciembre 2024

---

*Parte del ecosistema FenixLaboratory v2.1*