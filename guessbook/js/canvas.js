export class CanvasManager {
  constructor() {
    this.canvas = document.getElementById('drawCanvas');
    this.ctx = this.canvas.getContext('2d');
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
    this.layers = [{ id: 0, canvas: null, opacity: 1, visible: true }];
    this.currentLayer = 0;
    this.originalImageData = null;
    
    this.init();
  }
  
  init() {
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.setupEvents();
    this.saveState();
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
    
    if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
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
      // Selection tool placeholder
      console.log('Selection tool activated');
    }
  }
  
  draw(e) {
    if (!this.isDrawing) return;
    
    const coords = this.getCoordinates(e);
    this.setupBrush();
    
    if (this.currentTool === 'brush') {
      this.drawBrush(coords);
    } else if (this.currentTool === 'eraser') {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.globalAlpha = 1;
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
  
  setupBrush() {
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.strokeStyle = this.getEffectColor();
    this.ctx.lineWidth = this.getBrushSize();
    this.ctx.globalAlpha = this.currentOpacity;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }
  
  drawBrush(coords) {
    if (this.currentEffect === 'neon') {
      this.ctx.shadowColor = this.currentColor;
      this.ctx.shadowBlur = 10;
    } else if (this.currentEffect === 'watercolor') {
      this.ctx.globalAlpha = 0.3;
    }
    
    this.ctx.lineTo(coords.x, coords.y);
    this.ctx.stroke();
    
    if (this.symmetryEnabled) {
      const centerX = this.canvas.width / 2;
      const mirrorX = centerX + (centerX - coords.x);
      this.ctx.lineTo(mirrorX, coords.y);
      this.ctx.stroke();
    }
    
    this.ctx.shadowBlur = 0;
    this.strokeCount++;
  }
  
  getEffectColor() {
    if (this.currentEffect === 'gradient') {
      const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
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
      this.saveState();
    }
  }
  
  drawShape(startX, startY, endX, endY) {
    this.ctx.strokeStyle = this.currentColor;
    this.ctx.lineWidth = this.currentSize;
    this.ctx.globalCompositeOperation = 'source-over';
    
    if (this.currentTool === 'circle') {
      const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      this.ctx.beginPath();
      this.ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
      this.ctx.stroke();
    } else if (this.currentTool === 'line') {
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
    }
  }
  
  drawSpray(x, y) {
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = this.currentColor;
    for (let i = 0; i < 20; i++) {
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;
      this.ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
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
    this.historyStep++;
    if (this.historyStep < this.history.length) {
      this.history.length = this.historyStep;
    }
    this.history.push(this.canvas.toDataURL());
  }
  
  undo() {
    if (this.historyStep > 0) {
      this.historyStep--;
      this.restoreState();
    }
  }
  
  redo() {
    if (this.historyStep < this.history.length - 1) {
      this.historyStep++;
      this.restoreState();
    }
  }
  
  restoreState() {
    const img = new Image();
    img.onload = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.globalAlpha = 1;
      this.ctx.drawImage(img, 0, 0);
    };
    img.src = this.history[this.historyStep];
  }
  
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.strokeCount = 0;
    this.stickers = [];
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
  addLayer() {
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
    this.updateLayersList();
    
    // Mostrar notificación
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
      
      layerItem.innerHTML = `
        <button class="visibility-btn" data-layer="${index}" style="
          background: ${layer.visible ? '#28a745' : '#dc3545'};
          color: white; border: none; border-radius: 4px;
          width: 24px; height: 24px; font-size: 12px;
          cursor: pointer; transition: all 0.2s ease;
        ">
          ${layer.visible ? '👁️' : '🙈'}
        </button>
        <span style="flex: 1; color: var(--text-primary); font-size: 0.8em;">🎨 Capa ${index + 1}</span>
        <input type="range" class="opacity-slider" data-layer="${index}" min="0" max="100" value="${layer.opacity * 100}" 
               style="width: 60px; accent-color: var(--primary);" title="Opacidad: ${Math.round(layer.opacity * 100)}%">
        <span style="color: var(--text-secondary); font-size: 0.7em; min-width: 30px;">${Math.round(layer.opacity * 100)}%</span>
      `;
      
      // Event listener para seleccionar capa
      layerItem.addEventListener('click', (e) => {
        if (!e.target.classList.contains('visibility-btn') && !e.target.classList.contains('opacity-slider')) {
          this.currentLayer = index;
          this.updateLayersList();
        }
      });
      
      layersList.appendChild(layerItem);
    });
    
    // Event listeners para botones de visibilidad
    document.querySelectorAll('.visibility-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const layerIndex = parseInt(btn.dataset.layer);
        this.toggleLayerVisibility(layerIndex);
      });
    });
    
    // Event listeners para sliders de opacidad
    document.querySelectorAll('.opacity-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const layerIndex = parseInt(slider.dataset.layer);
        const opacity = parseFloat(e.target.value) / 100;
        this.setLayerOpacity(layerIndex, opacity);
        
        // Actualizar el texto del porcentaje
        const percentText = slider.nextElementSibling;
        if (percentText) {
          percentText.textContent = `${Math.round(opacity * 100)}%`;
        }
        
        // Actualizar tooltip
        slider.title = `Opacidad: ${Math.round(opacity * 100)}%`;
      });
    });
  }
  
  renderLayers() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.layers.forEach(layer => {
      if (layer.visible && layer.canvas) {
        this.ctx.globalAlpha = layer.opacity;
        this.ctx.drawImage(layer.canvas, 0, 0);
      }
    });
    this.ctx.globalAlpha = 1;
  }
  
  toggleLayerVisibility(layerIndex) {
    if (this.layers[layerIndex]) {
      this.layers[layerIndex].visible = !this.layers[layerIndex].visible;
      this.updateLayersList();
      this.renderLayers();
    }
  }
  
  setLayerOpacity(layerIndex, opacity) {
    if (this.layers[layerIndex]) {
      this.layers[layerIndex].opacity = Math.max(0, Math.min(1, opacity));
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
  
  exportImage() {
    const link = document.createElement('a');
    link.download = `dibujo-${Date.now()}.png`;
    link.href = this.canvas.toDataURL();
    link.click();
  }
  }
