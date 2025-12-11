// Updates del chatbot
const UPDATES = [
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
      'Cloudflare Workers para protección de API keys'
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
