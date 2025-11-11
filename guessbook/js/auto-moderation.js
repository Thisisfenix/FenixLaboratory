export class AutoModerationSystem {
  constructor(firebase) {
    this.firebase = firebase;
    this.bannedWords = [
      'spam', 'hack', 'cheat', 'bot', 'fake',
      'scam', 'virus', 'malware', 'phishing'
    ];
    this.suspiciousPatterns = [
      /(.)\1{10,}/g, // Repetición excesiva de caracteres
      /[A-Z]{20,}/g, // Texto en mayúsculas excesivo
      /(https?:\/\/[^\s]+)/g, // URLs sospechosas
      /(\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4})/g // Números de tarjeta
    ];
  }

  // Analizar contenido de texto
  analyzeText(text) {
    if (!text || typeof text !== 'string') return { safe: true, score: 0 };

    let riskScore = 0;
    const issues = [];

    // Verificar palabras prohibidas
    const lowerText = text.toLowerCase();
    this.bannedWords.forEach(word => {
      if (lowerText.includes(word)) {
        riskScore += 30;
        issues.push(`Palabra prohibida: ${word}`);
      }
    });

    // Verificar patrones sospechosos
    this.suspiciousPatterns.forEach((pattern, index) => {
      if (pattern.test(text)) {
        riskScore += [25, 20, 40, 50][index];
        issues.push(['Repetición excesiva', 'Mayúsculas excesivas', 'URL sospechosa', 'Datos sensibles'][index]);
      }
    });

    // Verificar longitud excesiva
    if (text.length > 500) {
      riskScore += 15;
      issues.push('Texto muy largo');
    }

    return {
      safe: riskScore < 50,
      score: riskScore,
      issues: issues,
      action: riskScore >= 80 ? 'block' : riskScore >= 50 ? 'flag' : 'allow'
    };
  }

  // Analizar imagen usando análisis básico
  analyzeImage(imageData) {
    if (!imageData) return { safe: true, score: 0 };

    let riskScore = 0;
    const issues = [];

    // Verificar tamaño de imagen
    const sizeKB = imageData.length / 1024;
    if (sizeKB > 2048) {
      riskScore += 20;
      issues.push('Imagen muy grande');
    }

    // Verificar formato válido
    if (!imageData.startsWith('data:image/')) {
      riskScore += 40;
      issues.push('Formato de imagen inválido');
    }

    return {
      safe: riskScore < 30,
      score: riskScore,
      issues: issues,
      action: riskScore >= 60 ? 'block' : riskScore >= 30 ? 'flag' : 'allow'
    };
  }

  // Analizar comportamiento del usuario
  analyzeUserBehavior(author, recentDrawings) {
    if (!recentDrawings || !Array.isArray(recentDrawings)) {
      return { safe: true, score: 0 };
    }

    let riskScore = 0;
    const issues = [];
    const userDrawings = recentDrawings.filter(d => d.data.autor === author);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // Verificar spam (muchos dibujos en poco tiempo)
    const recentUserDrawings = userDrawings.filter(d => now - d.data.timestamp < oneHour);
    if (recentUserDrawings.length > 5) {
      riskScore += 40;
      issues.push('Posible spam - muchos dibujos en 1 hora');
    }

    // Verificar nombres sospechosos
    if (author && (author.includes('bot') || author.includes('test') || author.length > 30)) {
      riskScore += 20;
      issues.push('Nombre de usuario sospechoso');
    }

    return {
      safe: riskScore < 40,
      score: riskScore,
      issues: issues,
      action: riskScore >= 60 ? 'block' : riskScore >= 40 ? 'flag' : 'allow'
    };
  }

  // Análisis completo de un dibujo
  async analyzeDrawing(drawingData, recentDrawings = []) {
    const textAnalysis = this.analyzeText(drawingData.autor);
    const imageAnalysis = this.analyzeImage(drawingData.imagenData);
    const behaviorAnalysis = this.analyzeUserBehavior(drawingData.autor, recentDrawings);

    const totalScore = textAnalysis.score + imageAnalysis.score + behaviorAnalysis.score;
    const allIssues = [...textAnalysis.issues, ...imageAnalysis.issues, ...behaviorAnalysis.issues];

    const result = {
      safe: totalScore < 70,
      totalScore: totalScore,
      issues: allIssues,
      action: totalScore >= 100 ? 'block' : totalScore >= 70 ? 'flag' : 'allow',
      details: {
        text: textAnalysis,
        image: imageAnalysis,
        behavior: behaviorAnalysis
      }
    };

    // Registrar análisis si es sospechoso
    if (result.action !== 'allow') {
      await this.logModerationAction(drawingData, result);
    }

    return result;
  }

  // Registrar acción de moderación automática
  async logModerationAction(drawingData, analysis) {
    try {
      const logData = {
        type: 'auto_moderation',
        action: analysis.action,
        author: drawingData.autor,
        score: analysis.totalScore,
        issues: analysis.issues,
        timestamp: Date.now(),
        drawingId: drawingData.id || 'unknown'
      };

      await this.firebase.logAutoModeration(logData);
    } catch (error) {
      console.error('Error logging auto-moderation:', error);
    }
  }

  // Aplicar acción automática
  async applyAutoModeration(drawingData, analysis) {
    switch (analysis.action) {
      case 'block':
        console.warn('🚫 Dibujo bloqueado automáticamente:', analysis.issues);
        throw new Error('Contenido bloqueado por moderación automática: ' + analysis.issues.join(', '));
        
      case 'flag':
        console.warn('⚠️ Dibujo marcado para revisión:', analysis.issues);
        // Crear reporte automático
        await this.createAutoReport(drawingData, analysis);
        break;
        
      case 'allow':
      default:
        // Permitir sin restricciones
        break;
    }
  }

  // Crear reporte automático
  async createAutoReport(drawingData, analysis) {
    try {
      const reportData = {
        drawingId: drawingData.id || Date.now().toString(),
        drawingAuthor: drawingData.autor,
        reportedBy: 'Sistema Automático',
        reason: `Detección automática: ${analysis.issues.join(', ')}`,
        type: 'inappropriate_content',
        timestamp: Date.now(),
        status: 'pending',
        autoGenerated: true,
        moderationScore: analysis.totalScore
      };

      await this.firebase.reportDrawing(reportData);
      console.log('📋 Reporte automático creado para:', drawingData.autor);
    } catch (error) {
      console.error('Error creando reporte automático:', error);
    }
  }

  // Actualizar lista de palabras prohibidas
  updateBannedWords(newWords) {
    if (Array.isArray(newWords)) {
      this.bannedWords = [...new Set([...this.bannedWords, ...newWords])];
    }
  }

  // Obtener estadísticas de moderación automática
  async getModerationStats() {
    try {
      const logs = await this.firebase.getAutoModerationLogs();
      if (!logs) return { total: 0, blocked: 0, flagged: 0, allowed: 0 };

      const stats = logs.reduce((acc, log) => {
        acc.total++;
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, { total: 0, block: 0, flag: 0, allow: 0 });

      return {
        total: stats.total,
        blocked: stats.block || 0,
        flagged: stats.flag || 0,
        allowed: stats.allow || 0
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return { total: 0, blocked: 0, flagged: 0, allowed: 0 };
    }
  }
}