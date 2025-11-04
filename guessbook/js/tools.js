// Herramientas avanzadas de dibujo
export class AdvancedTools {
  constructor(canvasManager) {
    this.canvas = canvasManager;
    this.ctx = canvasManager.ctx;
  }
  
  bucketFill(x, y, color) {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.canvas.width, this.canvas.canvas.height);
    const data = imageData.data;
    const startPos = (Math.floor(y) * this.canvas.canvas.width + Math.floor(x)) * 4;
    const startR = data[startPos];
    const fillColor = this.hexToRgb(color);
    if (!fillColor) return;
    
    const stack = [[Math.floor(x), Math.floor(y)]];
    const visited = new Set();
    
    while (stack.length > 0) {
      const [px, py] = stack.pop();
      if (visited.has(`${px},${py}`) || px < 0 || px >= this.canvas.canvas.width || py < 0 || py >= this.canvas.canvas.height) continue;
      visited.add(`${px},${py}`);
      
      const pos = (py * this.canvas.canvas.width + px) * 4;
      if (data[pos] === startR) {
        data[pos] = fillColor.r;
        data[pos + 1] = fillColor.g;
        data[pos + 2] = fillColor.b;
        data[pos + 3] = 255;
        stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
      }
    }
    
    this.ctx.putImageData(imageData, 0, 0);
  }
  
  pickColor(x, y) {
    const imageData = this.ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1);
    const data = imageData.data;
    return `#${((1 << 24) + (data[0] << 16) + (data[1] << 8) + data[2]).toString(16).slice(1)}`;
  }
  
  drawCircle(startX, startY, endX, endY, color, size) {
    const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = size;
    this.ctx.beginPath();
    this.ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
    this.ctx.stroke();
  }
  
  drawLine(startX, startY, endX, endY, color, size) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = size;
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
  }
  
  drawText(x, y, text, color, size) {
    this.ctx.font = `${size * 3}px Arial`;
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);
  }
  
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}