// Sistema de estadísticas avanzadas
export class StatsManager {
  constructor() {
    this.init();
  }
  
  init() {
    // Crear indicador de cambios sin guardar
    this.createUnsavedIndicator();
  }
  
  createUnsavedIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'unsavedIndicator';
    indicator.style.cssText = `
      display: none; color: #ffc107; margin-bottom: 10px; 
      font-size: 0.8em; text-align: center;
    `;
    indicator.innerHTML = '⚠️ Tienes cambios sin guardar';
    
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.parentElement.insertBefore(indicator, saveBtn);
    }
  }
  
  showCounter(allDrawings) {
    const gallery = document.getElementById('gallery');
    const totalDrawings = allDrawings.length;
    
    if (totalDrawings === 0) return;
    
    // Calcular estadísticas
    const totalLikes = allDrawings.reduce((sum, d) => sum + (d.data.likes || 0), 0);
    const totalComments = allDrawings.reduce((sum, d) => sum + (d.data.comments?.length || 0), 0);
    const totalStrokes = allDrawings.reduce((sum, d) => sum + (d.data.strokes || 0), 0);
    const avgLikes = totalDrawings > 0 ? (totalLikes / totalDrawings).toFixed(1) : 0;
    const avgStrokes = totalDrawings > 0 ? Math.round(totalStrokes / totalDrawings) : 0;
    
    // Categorías más populares
    const categories = {};
    allDrawings.forEach(d => {
      const cat = d.data.categoria || 'Arte';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    
    // Dispositivos
    const devices = { mobile: 0, desktop: 0 };
    allDrawings.forEach(d => {
      const device = d.data.device || 'desktop';
      devices[device]++;
    });
    
    const counterDiv = document.createElement('div');
    counterDiv.className = 'col-12 text-center mt-4';
    counterDiv.innerHTML = `
      <div style="background: var(--bg-light); border-radius: 15px; padding: 25px; border: 1px solid var(--primary);">
        <h5 style="color: var(--primary); margin: 0 0 20px 0; font-size: 1.3em;">📊 Estadísticas de la Galería</h5>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
          <div style="background: var(--bg-dark); padding: 15px; border-radius: 10px; border: 1px solid var(--primary);">
            <div style="font-size: 1.5em; color: var(--primary);">🎨</div>
            <div style="font-size: 1.2em; font-weight: bold; color: var(--text-primary);">${totalDrawings}</div>
            <div style="font-size: 0.8em; color: var(--text-secondary);">Obras Totales</div>
          </div>
          
          <div style="background: var(--bg-dark); padding: 15px; border-radius: 10px; border: 1px solid var(--primary);">
            <div style="font-size: 1.5em; color: var(--primary);">❤️</div>
            <div style="font-size: 1.2em; font-weight: bold; color: var(--text-primary);">${totalLikes}</div>
            <div style="font-size: 0.8em; color: var(--text-secondary);">Likes Totales</div>
          </div>
          
          <div style="background: var(--bg-dark); padding: 15px; border-radius: 10px; border: 1px solid var(--primary);">
            <div style="font-size: 1.5em; color: var(--primary);">💬</div>
            <div style="font-size: 1.2em; font-weight: bold; color: var(--text-primary);">${totalComments}</div>
            <div style="font-size: 0.8em; color: var(--text-secondary);">Comentarios</div>
          </div>
          
          <div style="background: var(--bg-dark); padding: 15px; border-radius: 10px; border: 1px solid var(--primary);">
            <div style="font-size: 1.5em; color: var(--primary);">🔥</div>
            <div style="font-size: 1.2em; font-weight: bold; color: var(--text-primary);">${avgLikes}</div>
            <div style="font-size: 0.8em; color: var(--text-secondary);">Promedio Likes</div>
          </div>
        </div>
        
        <div style="display: flex; justify-content: center; gap: 30px; flex-wrap: wrap; margin-bottom: 15px; font-size: 0.9em;">
          <span style="color: var(--text-secondary);">📱 Móvil: <strong style="color: var(--primary);">${devices.mobile}</strong></span>
          <span style="color: var(--text-secondary);">💻 Desktop: <strong style="color: var(--primary);">${devices.desktop}</strong></span>
          <span style="color: var(--text-secondary);">🎨 Trazos Promedio: <strong style="color: var(--primary);">${avgStrokes}</strong></span>
          ${topCategory ? `<span style="color: var(--text-secondary);">🏷️ Top Categoría: <strong style="color: var(--primary);">${topCategory[0]} (${topCategory[1]})</strong></span>` : ''}
        </div>
        
        <div style="border-top: 1px solid var(--primary); padding-top: 15px;">
          <p style="color: var(--text-secondary); margin: 5px 0; font-size: 0.9em;">⌨️ <strong>Atajos:</strong> B=Pincel, S=Spray, C=Círculo, L=Línea, T=Texto, E=Borrador</p>
          <small style="color: var(--text-secondary); font-size: 0.8em;">Ctrl+Z=Deshacer, Ctrl+Y=Rehacer, F=Relleno, I=Cuentagotas</small>
        </div>
        
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--primary); font-size: 0.8em; color: var(--text-secondary);">
          <p style="margin: 0;">🔬 <strong>FenixLaboratory</strong> - Experimento de arte colaborativo</p>
          <p style="margin: 5px 0 0 0;">Creado por <strong style="color: var(--primary);">@ThisIsFenix</strong> | Powered by Firebase & Canvas API</p>
        </div>
      </div>
    `;
    
    gallery.appendChild(counterDiv);
  }
  
  updateUnsavedIndicator(hasChanges) {
    const indicator = document.getElementById('unsavedIndicator');
    if (indicator) {
      indicator.style.display = hasChanges ? 'block' : 'none';
    }
  }
}