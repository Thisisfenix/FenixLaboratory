# 🎨 Guestbook de Dibujos - Rework Edition

**Mi experimento de guestbook que se salió de control y ahora es casi una red social**

## 📋 ¿Qué es esto?

Empezó como un simple guestbook donde la gente podía dejar dibujos. Ahora tiene perfiles, rankings, logros y más funciones de las que probablemente necesita. Pero hey, está chévere.

## ✨ Lo que tiene (porque se me fue la mano)

### 👤 Sistema de perfiles

- Círculo de perfil fijo en esquina superior izquierda
- Modal de perfil con configuración completa
- Avatares: 12 emojis predefinidos o imagen personalizada
- Sesión persistente (30 días)
- Estadísticas básicas (dibujos, likes, comentarios)
- Sistema de logros automático

### 🏆 Rankings simples

- Top artistas por cantidad de dibujos
- Más populares por likes
- Más activos recientes

### 🏅 Marcos especiales

Los dibujos más populares tienen marcos dorados, plateados y de bronce con efectos visuales.

### 📊 Estadísticas que probablemente nadie ve

Tiene un montón de números que se actualizan solos: cuántos dibujos hay, likes totales, promedios y más data inútil pero interesante.

### 🔄 Todo en tiempo real

Usando Firebase porque soy flojo para hacer backend. Los dibujos aparecen al instante, los rankings se actualizan solos y no tienes que recargar nada.

## 🖌️ Herramientas de dibujo

**Básicas:**
- Pincel con 4 tipos (normal, fino, grueso, arte)
- Borrador
- Relleno (bucket fill)
- Texto con tamaño variable
- Spray/aerógrafo
- Cuentagotas

**Formas:**
- Círculos
- Líneas rectas
- Herramienta de selección

**Efectos:**
- Gradientes
- Neón con resplandor
- Acuarela (transparencia)
- Simetría horizontal

### 🎨 Personalización

- 16 colores predefinidos + selector personalizado
- Control de opacidad del pincel
- 4 tamaños de canvas + tamaño personalizado
- Zoom in/out con atajos de teclado
- 12+ atajos de teclado para herramientas

### 🖼️ Sistema de capas y multimedia

- Sistema de capas completo con opacidad y visibilidad
- Subir imágenes como fondo
- Stickers posicionables con click
- Importar/exportar imágenes PNG
- Filtros: blur, pixel art, vintage, óleo, carbón

### 🔧 Funciones avanzadas

- Historial completo deshacer/rehacer (Ctrl+Z/Ctrl+Y)
- Zoom con atajos (+/-)
- Captura de frames para GIF animado
- Contador de trazos para rankings
- Prevención de salida sin guardar

### 📱 Compatible con móvil

Touch events optimizados y diseño responsive.

### 🌐 Sistema social

- Likes únicos por usuario
- Comentarios en tiempo real
- Búsqueda y filtros
- Sistema de sugerencias

### 📄 Galería

- Paginación de 12 dibujos
- Filtros por autor y categoría
- Modal con comentarios
- Compartir dibujos

### 🛡️ Anti-spam básico

- 5 minutos entre dibujos (para que no spameen)
- Filtro de palabrotas extremas
- Te avisa si te vas sin guardar
- API keys escondidas como debe ser

### ✨ Efectos porque se ve cool

- Partículas cuando dibujas
- Confetti cuando guardas
- Animaciones suaves
- Feedback visual en los botones

## 🛠️ Con qué está hecho

- HTML5 Canvas para el dibujo
- JavaScript vanilla (nada de frameworks raros)
- Bootstrap para no sufrir con CSS
- Firebase para la base de datos
- GitHub Pages para hosting gratis

## 📊 Stats actuales

- ~2,000 líneas de JavaScript
- 10+ herramientas de dibujo implementadas
- Sistema modular (8 archivos JS especializados)
- 11 temas visuales dinámicos
- 5 filtros de imagen + efectos
- Panel de admin con gestión completa
- Sistema dual de comentarios
- Optimizado para móvil y desktop

## 🎯 Para qué sirve

- Libro de visitas pero con dibujos
- Galería colaborativa
- Entretenimiento cuando te aburres
- Competir por likes (porque somos así)

## 🚀 El Rework

Lo que empezó como un guestbook simple ahora tiene:

- Sistema de perfiles con fotos
- Panel de administración
- Sistema de sugerencias
- Rankings en tiempo real
- Herramientas de dibujo avanzadas
- Galería interactiva
- Comentarios y likes

### 🎨 Temas visuales (11 disponibles)

- 🎨 Clásico, 📚 Neón, 💜 Retro, 💻 Hacker
- 🌊 Océano, 🌅 Atardecer, 🌲 Bosque
- 🤖 Cyberpunk, ✨ Dorado, ❄️ Hielo
- 🌈 Funky Atlas (nuevo)

### 🔮 Coming Soon

- [ ] Red social (seguir usuarios)
- [ ] Galería personal por usuario
- [ ] Herramientas de perspectiva y reglas
- [ ] Histograma de colores
- [ ] Herramienta de clonado

## 🔄 Roadmap

### ✅ Implementado
- Sistema completo de dibujo con 10+ herramientas
- Sistema de capas con opacidad y visibilidad
- Perfiles con avatares y estadísticas
- Sistema de logros automático
- Galería con comentarios y likes
- Panel de administración funcional
- Sistema de sugerencias con imágenes
- Rankings en tiempo real (3 tipos)
- Filtros de imagen (5 tipos)
- 11 temas visuales dinámicos
- Captura de frames para GIF
- Estadísticas avanzadas de la galería
- Sistema de comentarios dual (en documento + colección)
- Perfiles de usuario clickeables con modal

### 🔮 En desarrollo
- Generación de GIF animado (frames capturados)
- Herramientas avanzadas (perspectiva, clonado)
- Más efectos visuales

### 💭 Ideas futuras
- Red social completa (seguir usuarios)
- Notificaciones en tiempo real
- Concursos de dibujo
- Modo colaborativo
- Exportar a más formatos

## 🚀 Cómo usarlo

1. Entra y dibuja con las herramientas del panel derecho
2. Haz click en el círculo de arriba a la izquierda para configurar tu perfil
3. Guarda tu dibujo y ve cómo aparece en la galería
4. Dale like y comenta otros dibujos
5. Compite en los rankings

**Atajos útiles:** B=Pincel, E=Borrador, T=Texto, Ctrl+Z=Deshacer, +/-=Zoom

## 👨💻 Hecho por

**ThisIsFenix** - El tipo que no sabe cuándo parar de agregar funciones

---

*Parte del ecosistema FenixLaboratory - Donde los proyectos simples se vuelven complicados*