// Updates del chatbot
const UPDATES = [
  {
    version: 'v1.1',
    title: 'Protección Legal y Reportes',
    emoji: '⚖️',
    features: [
      'Canal Legal con Términos y Condiciones',
      'Política de Privacidad completa',
      'Modal de aceptación de términos (primera visita)',
      'Confirmación de edad (+13 años)',
      'Botón de reporte en mensajes del bot (🚩)',
      'Sistema de reportes enviados a Discord',
      'Rate limiting (10 mensajes por minuto)',
      'Analytics anónimo de uso',
      'Estadísticas de mensajes en configuración',
      'Webhook seguro con Cloudflare Secrets',
      'Descargo de responsabilidad por contenido IA',
      'Créditos a creadores de assets'
    ]
  },
  {
    version: 'v1.0',
    title: 'Lanzamiento Inicial',
    emoji: '🚀',
    features: [
      'Diseño completo estilo WhatsApp Web',
      'Mini sidebar con navegación (Estados, Canales, Chats, Archivados)',
      'Soporte para imágenes con visión IA (Llama 4 Maverick)',
      '6 personajes de Deadly Pursuer con personalidades únicas',
      'Easter eggs (Molly Anderson, Bfmp4, Abelitogamer)',
      'Sistema de configuración (nombre, sonido, tamaño fuente)',
      'Foto de perfil personalizable',
      'Personajes personalizados con IA',
      'Panel de gestión de personajes (crear/eliminar)',
      'Canal oficial de Updates',
      'Modo Retro 3D con terminal',
      'Cloudflare Workers para protección de API keys',
      'Pantalla de carga estilo WhatsApp',
      'Guardado de conversaciones en Cloudflare KV (500 mensajes)',
      'Historial persistente por personaje',
      'Hora y checks de visto en mensajes',
      'Responsive para móviles con menú hamburguesa',
      'Sistema de archivado de personajes (long press 0.8s)',
      'Click derecho para desarchivar',
      'Filtrado automático de archivados',
      'Alertas automáticas de errores en móviles',
      'Sistema de reporte de bugs para Discord (@thisisankush)'
    ]
  }
];

function getUpdatesHTML() {
  let html = `
    <div class="message bot">
      🎉 <strong>Bienvenido al canal de Updates</strong><br><br>
      Aquí encontrarás todas las actualizaciones del chatbot.
    </div>
  `;

  UPDATES.forEach(update => {
    html += `
      <div class="message bot">
        ${update.emoji} <strong>${update.version} - ${update.title}</strong><br><br>
        ${update.features.map(f => `• ${f}`).join('<br>')}
      </div>
    `;
  });

  return html;
}
