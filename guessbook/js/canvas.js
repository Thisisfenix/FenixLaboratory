export class CanvasManager {
  constructor() {
    this.canvas = document.getElementById('drawCanvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.isDrawing = false;
    this.currentColor = '#000000';
    this.currentSize = 3;
    this.currentOpacity = 1;
    this.currentTool = 'brush';
    this.currentBrushType = 'normal';
    this.currentEffect = null;
    this.symmetryEnabled = false;
    this.strokeCount = 0;
    this.history = [];
    this.historyStep = -1;
    this.stickers = [];
    this.isShapeDrawing = false;
    this.shapeStartX = 0;
    this.shapeStartY = 0;
    this.zoomLevel = 1;
    this.appliedFilters = [];
    this.layers = [];
    this.currentLayer = 0;
    this.layerMode = false; // Modo simple por defecto
    this.initializeLayers();
    this.originalImageData = null;
    
    this.init();
  }
  
  init() {
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.setupEvents();
    this.saveState();
  }
  
  initializeLayers() {
    // Crear capa base
    const baseLayer = {
      id: 0,
      canvas: document.createElement('canvas'),
      opacity: 1,
      visible: true
    };
    baseLayer.canvas.width = this.canvas.width;
    baseLayer.canvas.height = this.canvas.height;
    this.layers = [baseLayer];
  }
  
  setupEvents() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseout', () => this.stopDrawing());
    
    // Touch events
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    }, { passive: false });
    
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    }, { passive: false });
    
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const mouseEvent = new MouseEvent('mouseup', {});
      this.canvas.dispatchEvent(mouseEvent);
    }, { passive: false });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }
  
  getCoordinates(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }
  
  startDrawing(e) {
    this.isDrawing = true;
    const coords = this.getCoordinates(e);
    
    if (this.currentTool === 'brush') {
      this.ctx.beginPath();
      this.ctx.moveTo(coords.x, coords.y);
    } else if (this.currentTool === 'eraser') {
      this.ctx.beginPath();
      this.ctx.moveTo(coords.x, coords.y);
    } else if (this.currentTool === 'text') {
      const text = prompt('Escribe tu texto:');
      if (text) {
        this.ctx.font = `${this.currentSize * 3}px Arial`;
        this.ctx.fillStyle = this.currentColor;
        if (this.currentEffect === 'neon') {
          this.ctx.shadowColor = this.currentColor;
          this.ctx.shadowBlur = 15;
        }
        this.ctx.fillText(text, coords.x, coords.y);
        this.ctx.shadowBlur = 0;
        this.saveState();
      }
    } else if (['circle', 'line'].includes(this.currentTool)) {
      this.isShapeDrawing = true;
      this.shapeStartX = coords.x;
      this.shapeStartY = coords.y;
    } else if (this.currentTool === 'select') {
      console.log('Selection tool activated');
    }
  }
  
  draw(e) {
    if (!this.isDrawing) return;
    
    const coords = this.getCoordinates(e);
    this.setupBrush();
    
    if (this.currentTool === 'brush') {
      this.ctx.lineTo(coords.x, coords.y);
      this.ctx.stroke();
      
      if (this.symmetryEnabled) {
        const centerX = this.canvas.width / 2;
        const mirrorX = centerX + (centerX - coords.x);
        this.ctx.lineTo(mirrorX, coords.y);
        this.ctx.stroke();
      }
      this.strokeCount++;
    } else if (this.currentTool === 'eraser') {
      this.ctx.lineTo(coords.x, coords.y);
      this.ctx.stroke();
    } else if (this.currentTool === 'spray') {
      this.drawSpray(coords.x, coords.y);
    } else if (this.currentTool === 'bucket') {
      this.bucketFill(coords.x, coords.y);
    } else if (this.currentTool === 'eyedropper') {
      this.pickColor(coords.x, coords.y);
    }
  }
  

  
  renderAllLayersImmediate() {
    // Usar el método seguro que no modifica contenido
    this.renderLayersOnly();
  }
  
  setupBrush(ctx = this.ctx) {
    // Configurar para todas las herramientas excepto borrador
    if (this.currentTool !== 'eraser') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = this.currentOpacity;
      ctx.strokeStyle = this.getEffectColor(ctx);
    } else {
      // Configuración específica para borrador
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1;
    }
    ctx.lineWidth = this.getBrushSize();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }
  
  drawBrush(coords, ctx = this.ctx) {
    // Aplicar efectos
    if (this.currentEffect === 'neon') {
      ctx.shadowColor = this.currentColor;
      ctx.shadowBlur = 10;
    } else if (this.currentEffect === 'watercolor') {
      ctx.globalAlpha = 0.3;
    }
    
    // Dibujar línea principal
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    
    // Simetría si está habilitada
    if (this.symmetryEnabled) {
      const centerX = this.canvas.width / 2;
      const mirrorX = centerX + (centerX - coords.x);
      ctx.lineTo(mirrorX, coords.y);
      ctx.stroke();
    }
    
    // Limpiar efectos
    ctx.shadowBlur = 0;
    this.strokeCount++;
  }
  
  getEffectColor(ctx = this.ctx) {
    if (this.currentEffect === 'gradient') {
      const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, 0);
      gradient.addColorStop(0, this.currentColor);
      gradient.addColorStop(1, '#ffffff');
      return gradient;
    }
    return this.currentColor;
  }
  
  getBrushSize() {
    const multipliers = {
      'fine': 0.5,
      'normal': 1,
      'thick': 2,
      'art': 1.5
    };
    return this.currentSize * (multipliers[this.currentBrushType] || 1);
  }
  
  stopDrawing(e) {
    if (this.isDrawing || this.isShapeDrawing) {
      if (this.isShapeDrawing && e) {
        const coords = this.getCoordinates(e);
        this.drawShape(this.shapeStartX, this.shapeStartY, coords.x, coords.y);
        this.isShapeDrawing = false;
      }
      this.isDrawing = false;
      
      // Restaurar configuración por defecto
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.globalAlpha = 1;
      
      // En modo capas, guardar el trazo en la capa actual
      if (this.layerMode) {
        this.saveDrawingToCurrentLayer();
      }
      
      this.saveState();
    }
  }
  
  drawShape(startX, startY, endX, endY, ctx = this.ctx) {
    ctx.strokeStyle = this.currentColor;
    ctx.lineWidth = this.currentSize;
    ctx.globalCompositeOperation = 'source-over';
    
    if (this.currentTool === 'circle') {
      const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      ctx.beginPath();
      ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (this.currentTool === 'line') {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }
  
  drawSpray(x, y, ctx = this.ctx) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = this.currentColor;
    for (let i = 0; i < 20; i++) {
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;
      ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
    }
  }
  
  bucketFill(startX, startY) {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    const startPos = (Math.floor(startY) * this.canvas.width + Math.floor(startX)) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];
    
    const fillColor = this.hexToRgb(this.currentColor);
    if (!fillColor) return;
    
    const stack = [[Math.floor(startX), Math.floor(startY)]];
    const visited = new Set();
    
    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const key = `${x},${y}`;
      
      if (visited.has(key) || x < 0 || x >= this.canvas.width || y < 0 || y >= this.canvas.height) continue;
      visited.add(key);
      
      const pos = (y * this.canvas.width + x) * 4;
      const r = data[pos];
      const g = data[pos + 1];
      const b = data[pos + 2];
      const a = data[pos + 3];
      
      if (r === startR && g === startG && b === startB && a === startA) {
        data[pos] = fillColor.r;
        data[pos + 1] = fillColor.g;
        data[pos + 2] = fillColor.b;
        data[pos + 3] = 255;
        
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    this.saveState();
  }
  
  pickColor(x, y) {
    const imageData = this.ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1);
    const data = imageData.data;
    const r = data[0];
    const g = data[1];
    const b = data[2];
    
    const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    this.currentColor = hex;
    document.getElementById('customColor').value = hex;
    document.querySelector('.color-btn.active')?.classList.remove('active');
    this.setTool('brush');
  }
  
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  
  setTool(tool) {
    this.currentTool = tool;
    this.currentEffect = null;
    this.canvas.style.cursor = 'crosshair';
  }
  
  setEffect(effect) {
    this.currentEffect = effect;
    if (effect === 'symmetry') {
      this.symmetryEnabled = !this.symmetryEnabled;
    }
  }
  
  setBrushType(type) {
    this.currentBrushType = type;
  }
  
  setColor(color) {
    this.currentColor = color;
  }
  
  setSize(size) {
    this.currentSize = size;
  }
  
  setOpacity(opacity) {
    this.currentOpacity = opacity / 100;
  }
  
  saveState() {
    // Solo guardar estado en modo simple
    if (this.layerMode) return;
    
    this.historyStep++;
    if (this.historyStep < this.history.length) {
      this.history.length = this.historyStep;
    }
    
    this.history.push(this.canvas.toDataURL());
    
    if (this.history.length > 50) {
      this.history.shift();
      this.historyStep--;
    }
  }
  
  undo() {
    if (this.layerMode) {
      if (window.guestbookApp?.ui?.showNotification) {
        window.guestbookApp.ui.showNotification('⚠️ Deshacer no disponible en modo capas. Usa el borrador.', 'info');
      }
      return;
    }
    if (this.historyStep > 0) {
      this.historyStep--;
      this.restoreState();
    }
  }
  
  redo() {
    if (this.layerMode) {
      if (window.guestbookApp?.ui?.showNotification) {
        window.guestbookApp.ui.showNotification('⚠️ Rehacer no disponible en modo capas. Usa el borrador.', 'info');
      }
      return;
    }
    if (this.historyStep < this.history.length - 1) {
      this.historyStep++;
      this.restoreState();
    }
  }
  
  restoreState() {
    const state = this.history[this.historyStep];
    
    const img = new Image();
    img.onload = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.globalAlpha = 1;
      this.ctx.drawImage(img, 0, 0);
    };
    img.src = state;
  }
  
  clear() {
    // Solo limpiar el canvas principal, no las capas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.strokeCount = 0;
    this.stickers = [];
    
    // Restaurar configuración por defecto
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.globalAlpha = 1;
    
    this.saveState();
  }
  
  isEmpty() {
    const blank = document.createElement('canvas');
    blank.width = this.canvas.width;
    blank.height = this.canvas.height;
    return this.canvas.toDataURL() === blank.toDataURL();
  }
  
  getImageData() {
    // Si hay frames capturados, crear GIF animado
    if (this.animationFrames && this.animationFrames.length > 1) {
      return this.createAnimatedGIF();
    }
    return this.canvas.toDataURL();
  }
  
  // Crear GIF animado del proceso de dibujo
  createAnimatedGIF() {
    return new Promise((resolve) => {
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: this.canvas.width,
        height: this.canvas.height
      });
      
      // Agregar cada frame capturado
      this.animationFrames.forEach(frameData => {
        const img = new Image();
        img.onload = () => {
          gif.addFrame(img, { delay: 800 }); // 800ms entre frames
        };
        img.src = frameData;
      });
      
      gif.on('finished', (blob) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      
      gif.render();
    });
  }
  
  // Capturar frame del estado actual
  captureFrame() {
    if (!this.animationFrames) {
      this.animationFrames = [];
    }
    this.animationFrames.push(this.canvas.toDataURL());
    
    if (window.guestbookApp?.ui?.showNotification) {
      window.guestbookApp.ui.showNotification(`📸 Frame ${this.animationFrames.length} capturado`, 'success');
    }
  }
  
  // Limpiar frames capturados
  clearFrames() {
    this.animationFrames = [];
    if (window.guestbookApp?.ui?.showNotification) {
      window.guestbookApp.ui.showNotification('🗑️ Frames eliminados', 'info');
    }
  }
  
  // Obtener número de frames
  getFrameCount() {
    return this.animationFrames ? this.animationFrames.length : 0;
  }
  

  
  exportImage() {
    const link = document.createElement('a');
    link.download = `dibujo-${Date.now()}.png`;
    link.href = this.canvas.toDataURL();
    link.click();
  }
  
  handleKeyboard(e) {
    if (e.ctrlKey || e.metaKey) {
      switch(e.key) {
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            this.redo();
          } else {
            this.undo();
          }
          break;
        case 'y':
          e.preventDefault();
          this.redo();
          break;
      }
    }
    
    // Tool shortcuts
    switch(e.key) {
      case 'b': this.setTool('brush'); break;
      case 's': this.setTool('spray'); break;
      case 'e': this.setTool('eraser'); break;
      case 't': this.setTool('text'); break;
      case 'c': this.setTool('circle'); break;
      case 'l': this.setTool('line'); break;
      case 'f': this.setTool('bucket'); break;
      case 'i': this.setTool('eyedropper'); break;
      case 'v': this.setTool('select'); break;
      case 'g': this.setEffect('gradient'); break;
      case 'n': this.setEffect('neon'); break;
      case 'w': this.setEffect('watercolor'); break;
      case 'm': this.setEffect('symmetry'); break;
      case '=': case '+': this.zoomIn(); break;
      case '-': case '_': this.zoomOut(); break;
    }
  }
  
  // Zoom functionality
  zoomIn() {
    this.zoomLevel = Math.min(this.zoomLevel * 1.2, 3);
    this.applyZoom();
  }
  
  zoomOut() {
    this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.5);
    this.applyZoom();
  }
  
  applyZoom() {
    const container = this.canvas.parentElement;
    this.canvas.style.transform = `scale(${this.zoomLevel})`;
    this.canvas.style.transformOrigin = 'center center';
  }
  
  // Filter functionality
  applyFilter(filterType) {
    if (!this.originalImageData) {
      this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
    
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;
    
    switch(filterType) {
      case 'blur':
        this.applyBlurFilter(imageData);
        break;
      case 'pixel':
        this.applyPixelFilter(imageData);
        break;
      case 'vintage':
        this.applyVintageFilter(data);
        break;
      case 'oleo':
        this.applyOleoFilter(data);
        break;
      case 'carbon':
        this.applyCarbonFilter(data);
        break;
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    this.appliedFilters.push(filterType);
    this.saveState();
  }
  
  applyBlurFilter(imageData) {
    // Simple blur implementation
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const output = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        let r = 0, g = 0, b = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const i = ((y + dy) * width + (x + dx)) * 4;
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
          }
        }
        
        output[idx] = r / 9;
        output[idx + 1] = g / 9;
        output[idx + 2] = b / 9;
      }
    }
    
    for (let i = 0; i < data.length; i++) {
      data[i] = output[i];
    }
  }
  
  applyPixelFilter(imageData) {
    const data = imageData.data;
    const pixelSize = 8;
    
    for (let y = 0; y < imageData.height; y += pixelSize) {
      for (let x = 0; x < imageData.width; x += pixelSize) {
        const idx = (y * imageData.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        for (let dy = 0; dy < pixelSize && y + dy < imageData.height; dy++) {
          for (let dx = 0; dx < pixelSize && x + dx < imageData.width; dx++) {
            const i = ((y + dy) * imageData.width + (x + dx)) * 4;
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
          }
        }
      }
    }
  }
  
  applyVintageFilter(data) {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      data[i] = Math.min(255, r * 1.2 + 30);
      data[i + 1] = Math.min(255, g * 1.1 + 20);
      data[i + 2] = Math.min(255, b * 0.8 + 10);
    }
  }
  
  applyOleoFilter(data) {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      data[i] = Math.min(255, r * 1.3);
      data[i + 1] = Math.min(255, g * 1.2);
      data[i + 2] = Math.min(255, b * 1.1);
    }
  }
  
  applyCarbonFilter(data) {
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const carbon = Math.max(0, 255 - gray * 1.5);
      
      data[i] = carbon;
      data[i + 1] = carbon;
      data[i + 2] = carbon;
    }
  }
  
  clearFilters() {
    if (this.originalImageData) {
      this.ctx.putImageData(this.originalImageData, 0, 0);
      this.appliedFilters = [];
      this.saveState();
    }
  }
  
  // Layer functionality
  toggleLayerMode() {
    this.layerMode = !this.layerMode;
    
    if (this.layerMode) {
      // Activar modo capas
      this.history = []; // Limpiar historial
      this.historyStep = -1;
      if (window.guestbookApp?.ui?.showNotification) {
        window.guestbookApp.ui.showNotification('🎨 Modo Capas activado. Deshacer/Rehacer deshabilitado.', 'info');
      }
    } else {
      // Activar modo simple
      this.saveState(); // Guardar estado actual
      if (window.guestbookApp?.ui?.showNotification) {
        window.guestbookApp.ui.showNotification('✏️ Modo Simple activado. Deshacer/Rehacer habilitado.', 'success');
      }
    }
    
    this.updateModeUI();
  }
  
  updateModeUI() {
    const layerControls = document.getElementById('layerControls');
    const modeToggle = document.getElementById('layerModeToggle');
    
    if (layerControls) {
      layerControls.style.display = this.layerMode ? 'block' : 'none';
    }
    
    if (modeToggle) {
      modeToggle.textContent = this.layerMode ? '✏️ Modo Simple' : '🎨 Modo Capas';
      modeToggle.title = this.layerMode ? 'Cambiar a modo simple (con deshacer/rehacer)' : 'Cambiar a modo capas (sin deshacer/rehacer)';
    }
  }
  
  addLayer() {
    if (!this.layerMode) {
      if (window.guestbookApp?.ui?.showNotification) {
        window.guestbookApp.ui.showNotification('⚠️ Activa el modo capas primero', 'warning');
      }
      return;
    }
    
    const newLayer = {
      id: this.layers.length,
      canvas: document.createElement('canvas'),
      opacity: 1,
      visible: true
    };
    
    newLayer.canvas.width = this.canvas.width;
    newLayer.canvas.height = this.canvas.height;
    this.layers.push(newLayer);
    this.currentLayer = newLayer.id;
    
    // Limpiar canvas para la nueva capa
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Renderizar capas anteriores como referencia
    for (let i = 0; i < this.currentLayer; i++) {
      if (this.layers[i] && this.layers[i].visible && this.layers[i].canvas) {
        this.ctx.globalAlpha = this.layers[i].opacity * 0.5; // Más transparente como referencia
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.drawImage(this.layers[i].canvas, 0, 0);
      }
    }
    
    // Restaurar configuración
    this.ctx.globalAlpha = 1;
    this.ctx.globalCompositeOperation = 'source-over';
    
    this.updateLayersList();
    
    if (window.guestbookApp?.ui?.showNotification) {
      window.guestbookApp.ui.showNotification(`✨ Capa ${this.layers.length} creada`, 'success');
    }
  }
  
  deleteLayer() {
    if (this.layers.length > 1) {
      if (confirm(`¿Eliminar Capa ${this.currentLayer + 1}? Esta acción no se puede deshacer.`)) {
        this.layers.splice(this.currentLayer, 1);
        this.currentLayer = Math.max(0, this.currentLayer - 1);
        this.updateLayersList();
        this.renderLayers();
        
        // Mostrar notificación
        if (window.guestbookApp?.ui?.showNotification) {
          window.guestbookApp.ui.showNotification('🗑️ Capa eliminada', 'info');
        }
      }
    } else {
      if (window.guestbookApp?.ui?.showNotification) {
        window.guestbookApp.ui.showNotification('⚠️ No puedes eliminar la única capa', 'error');
      }
    }
  }
  
  updateLayersList() {
    const layersList = document.getElementById('layersList');
    if (!layersList) return;
    
    layersList.innerHTML = '';
    this.layers.forEach((layer, index) => {
      const layerItem = document.createElement('div');
      layerItem.className = `layer-item ${index === this.currentLayer ? 'active' : ''}`;
      layerItem.dataset.layer = index;
      layerItem.style.cssText = `
        display: flex; align-items: center; gap: 8px; padding: 8px;
        background: ${index === this.currentLayer ? 'var(--primary)' : 'var(--bg-dark)'};
        border: 1px solid var(--primary); border-radius: 6px; margin-bottom: 4px;
        cursor: pointer; transition: all 0.2s ease;
      `;
      
      // Crear botón de visibilidad
      const visibilityBtn = document.createElement('button');
      visibilityBtn.className = 'visibility-btn';
      visibilityBtn.dataset.layer = index;
      visibilityBtn.style.cssText = `
        background: ${layer.visible ? '#28a745' : '#dc3545'};
        color: white; border: none; border-radius: 4px;
        width: 24px; height: 24px; font-size: 12px;
        cursor: pointer; transition: all 0.2s ease;
      `;
      visibilityBtn.textContent = layer.visible ? '👁️' : '🙈';
      visibilityBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleLayerVisibility(index);
      });
      
      // Crear span del nombre
      const nameSpan = document.createElement('span');
      nameSpan.style.cssText = 'flex: 1; color: var(--text-primary); font-size: 0.8em;';
      nameSpan.textContent = `🎨 Capa ${index + 1}`;
      
      // Crear slider de opacidad
      const opacitySlider = document.createElement('input');
      opacitySlider.type = 'range';
      opacitySlider.className = 'opacity-slider';
      opacitySlider.dataset.layer = index;
      opacitySlider.min = '0';
      opacitySlider.max = '100';
      opacitySlider.value = layer.opacity * 100;
      opacitySlider.style.cssText = 'width: 60px; accent-color: var(--primary);';
      opacitySlider.title = `Opacidad: ${Math.round(layer.opacity * 100)}%`;
      opacitySlider.addEventListener('input', (e) => {
        const opacity = parseFloat(e.target.value) / 100;
        this.setLayerOpacity(index, opacity);
        percentSpan.textContent = `${Math.round(opacity * 100)}%`;
        opacitySlider.title = `Opacidad: ${Math.round(opacity * 100)}%`;
      });
      
      // Crear span del porcentaje
      const percentSpan = document.createElement('span');
      percentSpan.style.cssText = 'color: var(--text-secondary); font-size: 0.7em; min-width: 30px;';
      percentSpan.textContent = `${Math.round(layer.opacity * 100)}%`;
      
      // Agregar elementos al item
      layerItem.appendChild(visibilityBtn);
      layerItem.appendChild(nameSpan);
      layerItem.appendChild(opacitySlider);
      layerItem.appendChild(percentSpan);
      
      // Event listener para seleccionar capa
      layerItem.addEventListener('click', (e) => {
        if (e.target === layerItem || e.target === nameSpan) {
          this.switchToLayer(index);
        }
      });
      
      layersList.appendChild(layerItem);
    });
  }
  
  renderLayers() {
    // Limpiar canvas principal
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Renderizar todas las capas visibles en orden
    this.layers.forEach((layer, index) => {
      if (layer.visible && layer.canvas) {
        this.ctx.globalAlpha = layer.opacity;
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.drawImage(layer.canvas, 0, 0);
      }
    });
    
    // Restaurar configuración por defecto
    this.ctx.globalAlpha = 1;
    this.ctx.globalCompositeOperation = 'source-over';
  }
  
  toggleLayerVisibility(layerIndex) {
    if (this.layers[layerIndex]) {
      // Siempre guardar contenido actual antes de cambiar visibilidad
      if (this.layerMode && this.layers[this.currentLayer]) {
        this.saveCurrentDrawingToLayer();
      }
      
      this.layers[layerIndex].visible = !this.layers[layerIndex].visible;
      this.updateLayersList();
      
      // Renderizar todas las capas
      this.renderLayers();
    }
  }
  
  setLayerOpacity(layerIndex, opacity) {
    if (this.layers[layerIndex]) {
      this.layers[layerIndex].opacity = Math.max(0, Math.min(1, opacity));
      // Renderizar todas las capas sin guardar contenido
      this.renderLayers();
    }
  }
  
  getLayers() {
    return this.layers.map(layer => ({
      id: layer.id,
      opacity: layer.opacity,
      visible: layer.visible,
      data: layer.canvas ? layer.canvas.toDataURL() : null
    }));
  }
  
  getAppliedFilters() {
    return this.appliedFilters;
  }
  
  // Nuevos métodos para manejo de capas
  ensureCurrentLayerExists() {
    if (!this.layers[this.currentLayer]) {
      this.initializeLayers();
    }
  }
  
  saveCurrentLayerContent() {
    if (!this.layers[this.currentLayer] || !this.layers[this.currentLayer].canvas) return;
    
    const layerCtx = this.layers[this.currentLayer].canvas.getContext('2d');
    
    // Crear canvas temporal para extraer solo la capa actual
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Copiar contenido actual del canvas principal
    tempCtx.drawImage(this.canvas, 0, 0);
    
    // Restar todas las otras capas visibles para obtener solo la capa actual
    this.layers.forEach((layer, index) => {
      if (index !== this.currentLayer && layer.visible && layer.canvas) {
        tempCtx.globalCompositeOperation = 'destination-out';
        tempCtx.globalAlpha = layer.opacity;
        tempCtx.drawImage(layer.canvas, 0, 0);
      }
    });
    
    // Limpiar la capa y guardar el contenido extraído
    layerCtx.clearRect(0, 0, this.layers[this.currentLayer].canvas.width, this.layers[this.currentLayer].canvas.height);
    layerCtx.globalAlpha = 1;
    layerCtx.globalCompositeOperation = 'source-over';
    layerCtx.drawImage(tempCanvas, 0, 0);
  }
  
  extractCurrentLayerFromCanvas(layerCtx) {
    // Si hay contenido previo en la capa, preservarlo
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Copiar contenido actual del canvas principal
    tempCtx.drawImage(this.canvas, 0, 0);
    
    // Restar las otras capas para obtener solo la capa actual
    this.layers.forEach((layer, index) => {
      if (index !== this.currentLayer && layer.visible && layer.canvas) {
        tempCtx.globalCompositeOperation = 'destination-out';
        tempCtx.globalAlpha = layer.opacity;
        tempCtx.drawImage(layer.canvas, 0, 0);
      }
    });
    
    // Guardar el resultado en la capa
    layerCtx.drawImage(tempCanvas, 0, 0);
  }
  
  prepareCurrentLayerForEditing() {
    // Limpiar canvas principal
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Renderizar todas las capas de fondo (no editables)
    this.layers.forEach((layer, index) => {
      if (layer.visible && layer.canvas && index !== this.currentLayer) {
        this.ctx.globalAlpha = layer.opacity;
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.drawImage(layer.canvas, 0, 0);
      }
    });
    
    // Renderizar la capa actual encima (editable)
    if (this.layers[this.currentLayer] && this.layers[this.currentLayer].canvas) {
      this.ctx.globalAlpha = this.layers[this.currentLayer].opacity;
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.drawImage(this.layers[this.currentLayer].canvas, 0, 0);
    }
    
    // Restaurar configuración para edición
    this.ctx.globalAlpha = 1;
    this.ctx.globalCompositeOperation = 'source-over';
  }
  
  switchToLayer(layerIndex) {
    if (!this.layerMode || layerIndex < 0 || layerIndex >= this.layers.length || layerIndex === this.currentLayer) return;
    
    // Cambiar a la nueva capa
    this.currentLayer = layerIndex;
    
    // Renderizar todas las capas visibles
    this.renderLayers();
    
    this.updateLayersList();
  }
  
  saveCurrentLayerContentSafely() {
    if (!this.layers[this.currentLayer] || !this.layers[this.currentLayer].canvas) return;
    
    // Solo guardar si realmente hay contenido nuevo
    const currentData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const layerCtx = this.layers[this.currentLayer].canvas.getContext('2d');
    const layerData = layerCtx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    
    // Comparar si hay diferencias significativas
    let hasChanges = false;
    for (let i = 0; i < currentData.data.length; i += 4) {
      if (Math.abs(currentData.data[i] - layerData.data[i]) > 5) {
        hasChanges = true;
        break;
      }
    }
    
    if (hasChanges) {
      try {
        this.saveCurrentLayerContent();
      } catch (error) {
        console.warn('Error guardando capa:', error);
      }
    }
  }
  
  renderAllLayers() {
    // Guardar contenido de la capa actual de forma segura
    this.saveCurrentLayerContentSafely();
    
    // Renderizar todas las capas
    this.renderLayersOnly();
  }
  
  renderAllVisibleLayers() {
    if (!this.layersEnabled || this.layers.length <= 1) return;
    
    // Guardar contenido actual en la capa activa antes de renderizar
    if (this.layers[this.currentLayer]) {
      const currentLayerCanvas = this.layers[this.currentLayer].canvas;
      const layerCtx = currentLayerCanvas.getContext('2d');
      layerCtx.clearRect(0, 0, currentLayerCanvas.width, currentLayerCanvas.height);
      layerCtx.drawImage(this.canvas, 0, 0);
    }
    
    // Limpiar canvas principal
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Renderizar todas las capas visibles en orden
    this.layers.forEach(layer => {
      if (layer.visible && layer.canvas) {
        this.ctx.globalAlpha = layer.opacity;
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.drawImage(layer.canvas, 0, 0);
      }
    });
    
    // Restaurar configuración
    this.ctx.globalAlpha = 1;
    this.ctx.globalCompositeOperation = 'source-over';
  }
  
  renderLayersOnly() {
    this.renderAllVisibleLayers();
  }
  
  showCurrentLayerForEditing() {
    // Mostrar todas las capas pero permitir edición solo en la actual
    this.renderAllLayers();
  }
  
  saveCurrentDrawingToLayer() {
    if (!this.layers[this.currentLayer]) return;
    
    const currentLayerCanvas = this.layers[this.currentLayer].canvas;
    const layerCtx = currentLayerCanvas.getContext('2d');
    
    // Crear canvas temporal con todas las capas anteriores
    const backgroundCanvas = document.createElement('canvas');
    backgroundCanvas.width = this.canvas.width;
    backgroundCanvas.height = this.canvas.height;
    const bgCtx = backgroundCanvas.getContext('2d');
    
    // Renderizar todas las capas anteriores a la actual
    for (let i = 0; i < this.currentLayer; i++) {
      if (this.layers[i] && this.layers[i].visible && this.layers[i].canvas) {
        bgCtx.globalAlpha = this.layers[i].opacity;
        bgCtx.globalCompositeOperation = 'source-over';
        bgCtx.drawImage(this.layers[i].canvas, 0, 0);
      }
    }
    
    // Añadir el contenido existente de la capa actual
    bgCtx.globalAlpha = 1;
    bgCtx.globalCompositeOperation = 'source-over';
    bgCtx.drawImage(currentLayerCanvas, 0, 0);
    
    // Crear canvas temporal para extraer solo el nuevo contenido
    const newContentCanvas = document.createElement('canvas');
    newContentCanvas.width = this.canvas.width;
    newContentCanvas.height = this.canvas.height;
    const newCtx = newContentCanvas.getContext('2d');
    
    // Copiar canvas actual
    newCtx.drawImage(this.canvas, 0, 0);
    
    // Restar el fondo (capas anteriores + contenido previo de capa actual)
    newCtx.globalCompositeOperation = 'destination-out';
    newCtx.drawImage(backgroundCanvas, 0, 0);
    
    // Añadir solo el nuevo contenido a la capa actual
    layerCtx.globalCompositeOperation = 'source-over';
    layerCtx.globalAlpha = 1;
    layerCtx.drawImage(newContentCanvas, 0, 0);
  }
  
  prepareCanvasForDrawing() {
    if (!this.layers[this.currentLayer]) return;
    
    // Guardar cualquier cambio pendiente en la capa actual antes de preparar
    this.saveDrawingToCurrentLayer();
    
    // Limpiar canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Renderizar todas las capas visibles
    this.layers.forEach(layer => {
      if (layer.visible && layer.canvas) {
        this.ctx.globalAlpha = layer.opacity;
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.drawImage(layer.canvas, 0, 0);
      }
    });
    
    // Restaurar configuración
    this.ctx.globalAlpha = 1;
    this.ctx.globalCompositeOperation = 'source-over';
  }
  
  saveDrawingToCurrentLayer() {
    if (!this.layers[this.currentLayer]) return;
    
    // Simplemente copiar todo el canvas actual a la capa
    // Esto preserva tanto el dibujo como el borrado
    const layerCtx = this.layers[this.currentLayer].canvas.getContext('2d');
    layerCtx.clearRect(0, 0, this.layers[this.currentLayer].canvas.width, this.layers[this.currentLayer].canvas.height);
    layerCtx.globalCompositeOperation = 'source-over';
    layerCtx.globalAlpha = 1;
    layerCtx.drawImage(this.canvas, 0, 0);
  }
  
  exportImage() {
    const link = document.createElement('a');
    link.download = `dibujo-${Date.now()}.png`;
    link.href = this.canvas.toDataURL();
    link.click();
  }
  }
