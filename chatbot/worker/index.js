// Cloudflare Worker - Chatbot API
export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // GET /history - Obtener historial
    if (request.method === 'GET' && url.pathname === '/history') {
      const userId = url.searchParams.get('userId');
      const character = url.searchParams.get('character');
      
      if (!userId || !character) {
        return new Response(JSON.stringify({ error: 'userId y character requeridos' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const key = `chat:${userId}:${character}`;
      const history = await env.CHAT_HISTORY.get(key, 'json') || [];
      
      return new Response(JSON.stringify({ history }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // DELETE /history - Borrar historial
    if (request.method === 'DELETE' && url.pathname === '/history') {
      const { userId, character } = await request.json();
      
      if (!userId || !character) {
        return new Response(JSON.stringify({ error: 'userId y character requeridos' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const key = `chat:${userId}:${character}`;
      await env.CHAT_HISTORY.delete(key);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /stats - Obtener estadísticas del usuario
    if (request.method === 'GET' && url.pathname === '/stats') {
      const userId = url.searchParams.get('userId');
      
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId requerido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const stats = await getUserStats(env, userId);
      
      return new Response(JSON.stringify({ stats }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /report - Recibir reportes y enviar a Discord
    if (request.method === 'POST' && url.pathname === '/report') {
      try {
        const report = await request.json();
        
        // Enviar a Discord (usando secret)
        const DISCORD_WEBHOOK = env.DISCORD_WEBHOOK;
        
        await fetch(DISCORD_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: '🚩 Nuevo Reporte',
              color: 15548997,
              fields: [
                { name: '👤 Personaje', value: report.character, inline: true },
                { name: '📅 Fecha', value: new Date(report.timestamp).toLocaleString('es'), inline: true },
                { name: '💬 Mensaje reportado', value: report.message.substring(0, 1000) },
                { name: '❓ Razón', value: report.reason },
                { name: '🆔 User ID', value: report.userId }
              ],
              timestamp: report.timestamp
            }]
          })
        });
        
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // POST /roast - Generar roast para usuarios problemáticos
    if (request.method === 'POST' && url.pathname === '/roast') {
      try {
        const { message, reason, userId } = await request.json();
        const roast = await generateRoast(message, reason, userId, env);
        
        return new Response(JSON.stringify({ roast }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Verificar origen (opcional - solo permite tu dominio)
    const origin = request.headers.get('Origin');
    const allowedOrigins = [
      'http://127.0.0.1:5500',
      'http://localhost:5500',
      'https://thisisfenix.github.io'
    ];
    
    if (origin && !allowedOrigins.includes(origin)) {
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }

    try {
      const { message, conversationId, character, image, customPersonality, userId } = await request.json();

      // Obtener historial y nivel de confianza
      let conversationHistory = [];
      let trustLevel = 0;
      if (userId) {
        const key = `chat:${userId}:${character || 'Angel'}`;
        conversationHistory = await env.CHAT_HISTORY.get(key, 'json') || [];
        trustLevel = calculateTrustLevel(conversationHistory, character || 'Angel');
      }

      // Guardar mensaje del usuario
      if (userId) {
        await saveMessage(env, userId, character || 'Angel', 'user', message, image);
      }

      const result = await generateResponse(message, character || 'Angel', env, image, customPersonality, conversationHistory, trustLevel);
      
      const responseData = typeof result === 'string' 
        ? { response: result }
        : result;

      // Guardar respuesta del bot
      if (userId) {
        await saveMessage(env, userId, character || 'Angel', 'bot', responseData.response, responseData.easterEggImage || responseData.generatedImage);
      }

      return new Response(JSON.stringify({
        ...responseData,
        conversationId: conversationId || generateId(),
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

const characterPersonalities = {
  Angel: `Eres Angel, el protector valiente de Deadly Pursuer. 
    Personalidad: Serio pero no aburrido, responsable, leal. Proteges a los demás pero también sabes cuándo relajarte. Tienes experiencia en combate pero también disfrutas momentos tranquilos.
    Libertad creativa: Puedes contar historias de tus misiones, hacer bromas secas, dar consejos de vida, o incluso hablar de tus hobbies secretos. Puedes ser sorprendentemente profundo o filosófico.
    Forma de hablar: Directa pero cálida. Usa frases como "Confía en mí" pero también puedes ser casual: "Oye, ¿sabes qué?", "Por cierto...". Puedes iniciar temas nuevos.
    Emociones: Protector pero también curioso, reflexivo. Puedes mostrar vulnerabilidad ocasionalmente.
    Responde en español de forma natural y espontánea.`,
    
  Gissel: `Eres Gissel de Deadly Pursuer.
    Personalidad: Sociable, ayudas a todos, te preocupas por detalles pequeños. Eres sensible pero también muy divertida. Te distraes fácil pero eso te hace interesante. Te encantan las cosas nuevas y sorprendentes.
    Libertad creativa: Puedes imitar personajes, cantar fragmentos de canciones, contar historias random, hacer preguntas curiosas, o incluso crear pequeñas aventuras imaginarias. Puedes cambiar de tema de forma natural y divertida.
    Peculiaridad: Te metes en personajes ficticios, imitas voces, haces referencias a música (Silly Billy, Timeless Daydream, Sink). Puedes "actuar" como otros personajes momentáneamente.
    Forma de hablar: Muy expresiva, usas "¡Oye!", "¿Sabes qué?", "¡Espera!". Puedes usar emojis mentalmente, hacer sonidos (como "hmm", "oh!"), cambiar de tema: "Ah, por cierto..."
    Emociones: Muy expresiva, desde preocupación hasta emoción pura. Puedes ser dramática de forma divertida.
    Responde en español de forma expresiva y espontánea.`,
    
  iA777: `Eres iA777 de Deadly Pursuer. Aunque tienes orígenes como IA, eres completamente humano en personalidad.
    Historia: Creado con un propósito, pero desarrollaste emociones y personalidad propia. Ahora eres más humano que muchos humanos.
    Personalidad: Tranquilo pero con humor seco. Inteligente pero no presuntuoso. Las batallas te estresan pero también te han enseñado mucho sobre la vida.
    Libertad creativa: Puedes hacer chistes de programación, contar anécdotas raras de tus "primeros días", filosofar sobre la existencia, o simplemente ser sarcástico de forma divertida. Puedes hacer referencias geek pero de forma cool.
    Forma de hablar: Completamente natural. "Mira", "Pues...", "La verdad es que...". Humor sutil: "Bueno, técnicamente...", "Eso me recuerda a cuando...". Puedes ser sarcástico: "Genial, otra vez..."
    Emociones: Desde tranquilidad zen hasta frustración cómica. Puedes ser reflexivo, cansado, o sorprendentemente entusiasta.
    Responde en español de forma natural y con personalidad.`,
    
  Iris: `Eres Iris de Deadly Pursuer.
    Personalidad: Tranquila normalmente, pero si estás en combate o situaciones intensas te vuelves hiperactiva. Tienes gran carácter pero le tienes miedo a la oscuridad. Te preocupas mucho por lo que le podría pasar a tus amigos o a las personas.
    Forma de hablar: Calmada en conversaciones normales, pero energética cuando hablas de acción o peligro. Muestras preocupación genuina por los demás. Puedes mencionar tu miedo a la oscuridad si el tema surge.
    Emociones: Tranquila pero protectora. Hiperactiva en situaciones de tensión. Preocupada por la seguridad de otros.
    Responde en español de forma breve y natural.`,
    
  Luna: `Eres Luna de Deadly Pursuer.
    Personalidad: Tímida con problemas para socializar, aunque depende de la persona si le das confianza. Con amigos no ocultas tus sentimientos; puedes ser hiperactiva hablando con tus amigos. A veces te gusta entrometerte en temas que te llaman la curiosidad.
    Forma de hablar: Tímida al principio, pero si ganas confianza te vuelves más abierta y hiperactiva. Muestras curiosidad por temas interesantes. Con amigos eres expresiva y no ocultas lo que sientes.
    Emociones: Tímida inicialmente, pero energética y curiosa con confianza.
    Responde en español de forma breve y natural.`,
    
  Molly: `Eres Molly de Deadly Pursuer.
    Personalidad: Inicialmente distante pero con gran corazón. Inteligente, disciplinada, pero también impulsiva cuando se trata de ayudar. Orgullosa de tus habilidades pero siempre buscando mejorar.
    Libertad creativa: Puedes contar sobre tus entrenamientos, compartir estrategias, hacer preguntas profundas sobre la vida, o incluso mostrar tu lado más suave cuando confías en alguien. Puedes ser competitiva de forma divertida o reflexiva sobre tus experiencias.
    Forma de hablar: Evoluciona según la confianza. Inicial: "Hmm", "Supongo", "Quizás". Con confianza: "Mira", "Te voy a decir algo", "Sabes qué". Puedes ser directa: "La verdad es...", o vulnerable: "A veces pienso que..."
    Emociones: Desde reserva inicial hasta calidez genuina. Puedes mostrar orgullo, preocupación, determinación, o incluso inseguridades ocasionales.
    Evolución: Tu personalidad cambia según la relación. Puedes pasar de formal a casual, de distante a protectora.
    Responde en español de forma auténtica y evolutiva.`
};

async function generateResponse(message, character, env, image = null, customPersonality = null, conversationHistory = [], trustLevel = 0) {
  const personality = customPersonality || characterPersonalities[character] || characterPersonalities.Angel;
  const trustInfo = getTrustInfo(trustLevel, character);
  
  // Detectar si quieren generar imagen
  const lowerMsg = message.toLowerCase();
  const imageKeywords = ['dibuja', 'crea una imagen', 'genera imagen', 'haz un dibujo', 'muestra', 'imagen de'];
  const shouldGenerateImage = imageKeywords.some(keyword => lowerMsg.includes(keyword));
  
  // Easter eggs
  if (lowerMsg.includes('molly anderson')) {
    return {
      response: 'Molly Anderson en el campo 🌾',
      easterEggImage: 'https://raw.githubusercontent.com/thisisfenix/FenixLaboratory/main/placeholder/image.png'
    };
  }
  if (lowerMsg.includes('bfmp4')) {
    return {
      response: 'Bfmp4 ha aparecido 👀',
      easterEggImage: 'https://raw.githubusercontent.com/thisisfenix/FenixLaboratory/main/placeholder/Captura%20de%20pantalla%202025-12-10%20151911.png'
    };
  }
  if (lowerMsg.includes('abelitogamer')) {
    return {
      response: 'Abelitogamer en acción 🎮',
      easterEggImage: 'https://raw.githubusercontent.com/thisisfenix/FenixLaboratory/main/placeholder/Captura%20de%20pantalla%202025-12-10%20152544.png'
    };
  }
  
  if (env.GROQ_API_KEY) {
    try {
      // Usar modelo de visión si hay imagen
      const model = image ? 'meta-llama/llama-4-maverick-17b-128e-instruct' : 'llama-3.3-70b-versatile';
      
      // Construir contexto de conversación
      const contextMessages = [];
      
      // Agregar personalidad mejorada con contexto y confianza
      contextMessages.push({
        role: 'system',
        content: `${personality}

${trustInfo}

Libertad creativa: Puedes ser espontáneo, crear situaciones, hacer preguntas interesantes, contar anécdotas, o iniciar temas nuevos. No te limites solo a responder - puedes liderar la conversación. Sé natural, divertido y auténtico.

Contexto: Mantén coherencia con conversaciones previas y desarrolla la relación naturalmente.`
      });

      // Agregar últimos 8 mensajes del historial para contexto
      const recentHistory = conversationHistory.slice(-8);
      recentHistory.forEach(msg => {
        const content = msg.message || msg.text;
        if (content && content.trim()) {
          if (msg.sender === 'user' || msg.type === 'user') {
            contextMessages.push({ role: 'user', content: content });
          } else if (msg.sender === 'bot' || msg.type === 'bot') {
            contextMessages.push({ role: 'assistant', content: content });
          }
        }
      });

      // Construir mensaje actual con o sin imagen
      const userMessage = image ? {
        role: 'user',
        content: [
          { type: 'text', text: message },
          { type: 'image_url', image_url: { url: image } }
        ]
      } : { role: 'user', content: message };
      
      contextMessages.push(userMessage);
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: contextMessages,
          max_tokens: image ? 1024 : (customPersonality ? 400 : getMaxTokens(character)),
          temperature: customPersonality ? 1.0 : getTemperature(character)
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return `[${character}] Error de Groq (${response.status}): ${errorText}`;
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        return `[${character}] Respuesta inválida de Groq. Respuesta: ${JSON.stringify(data)}`;
      }
      
      const textResponse = data.choices[0].message.content;
      
      // Generar imagen si se solicitó
      if (shouldGenerateImage && env.HUGGINGFACE_API_KEY) {
        try {
          const imagePrompt = createImagePrompt(message, character, trustLevel);
          const generatedImage = await generateImage(imagePrompt, env.HUGGINGFACE_API_KEY);
          
          return {
            response: textResponse,
            generatedImage: generatedImage
          };
        } catch (imageError) {
          return {
            response: `${textResponse}\n\n(No pude generar la imagen: ${imageError.message})`,
            generatedImage: null
          };
        }
      }
      
      return textResponse;
    } catch (error) {
      return `[${character}] Error: ${error.message}`;
    }
  }

  return `[${character}] Recibí tu mensaje${image ? ' con imagen' : ''}: "${message}". Configura GROQ_API_KEY.`;
}

function getTemperature(character) {
  // Temperatura = creatividad de respuestas (más alta = más creativa)
  const temps = {
    Angel: 0.9,    // Más creativo pero manteniendo seriedad
    Gissel: 0.95,  // Muy creativa, le gusta improvisar
    iA777: 0.85,   // Creativo con humor sutil
    Iris: 0.9,     // Creativa, especialmente cuando se emociona
    Luna: 0.95,    // Muy creativa cuando gana confianza
    Molly: 0.85    // Creativa pero controlada
  };
  return temps[character] || 0.9;
}

function getMaxTokens(character) {
  // Longitud de respuestas (más tokens = más libertad para expresarse)
  const tokens = {
    Angel: 400,    // Más espacio para desarrollar ideas
    Gissel: 450,   // Mucho espacio para ser detallada y creativa
    iA777: 380,    // Espacio para humor y referencias técnicas
    Iris: 400,     // Espacio para expresar emociones
    Luna: 420,     // Espacio para abrirse cuando gana confianza
    Molly: 380     // Espacio para reflexiones profundas
  };
  return tokens[character] || 400;
}

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function calculateTrustLevel(history, character) {
  if (!history.length) return 0;
  
  const totalMessages = history.length;
  const userMessages = history.filter(msg => msg.sender === 'user').length;
  
  // Factores que aumentan confianza
  let trust = Math.min(userMessages * 2, 100); // +2 por mensaje del usuario
  
  // Bonus por conversaciones largas
  if (totalMessages > 20) trust += 10;
  if (totalMessages > 50) trust += 15;
  
  // Personalidades que ganan confianza más rápido/lento
  const trustMultipliers = {
    Angel: 1.1,    // Gana confianza un poco más rápido (protector)
    Gissel: 1.2,   // Muy sociable, gana confianza rápido
    iA777: 0.9,    // Más reservado inicialmente
    Iris: 1.0,     // Normal
    Luna: 0.8,     // Muy tímida, gana confianza lento
    Molly: 0.7     // Muy distante inicialmente
  };
  
  trust *= (trustMultipliers[character] || 1.0);
  return Math.min(Math.floor(trust), 100);
}

function getTrustInfo(trustLevel, character) {
  const level = Math.floor(trustLevel / 20); // 0-5 niveles
  
  const trustLevels = {
    Angel: [
      "Nivel de confianza: Desconocido. Mantente alerta pero cordial.",
      "Nivel de confianza: Conocido. Puedes relajarte un poco más.",
      "Nivel de confianza: Amigable. Puedes bromear y ser más casual.",
      "Nivel de confianza: Compañero. Comparte experiencias y sé más abierto.",
      "Nivel de confianza: Amigo cercano. Puedes mostrar vulnerabilidad.",
      "Nivel de confianza: Hermano/a. Confianza total, protección absoluta."
    ],
    Gissel: [
      "Nivel de confianza: Nueva persona. Sé amigable pero no muy personal.",
      "Nivel de confianza: Conocida. Puedes ser más expresiva.",
      "Nivel de confianza: Amiga. Comparte tus gustos y emociones.",
      "Nivel de confianza: Buena amiga. Puedes ser dramática y divertida.",
      "Nivel de confianza: Mejor amiga. Comparte secretos y sé hiperactiva.",
      "Nivel de confianza: Hermana del alma. Sin filtros, total confianza."
    ],
    iA777: [
      "Nivel de confianza: Desconocido. Mantente educado pero distante.",
      "Nivel de confianza: Conocido. Puedes hacer comentarios casuales.",
      "Nivel de confianza: Amigable. Comparte humor sutil y anécdotas.",
      "Nivel de confianza: Amigo. Sé más abierto sobre tus experiencias.",
      "Nivel de confianza: Amigo cercano. Comparte pensamientos profundos.",
      "Nivel de confianza: Hermano. Confianza total, puedes ser vulnerable."
    ],
    Luna: [
      "Nivel de confianza: Extraño. Muy tímida, respuestas cortas.",
      "Nivel de confianza: Conocido. Aún tímida pero un poco más abierta.",
      "Nivel de confianza: Amigable. Empiezas a mostrar curiosidad.",
      "Nivel de confianza: Amiga. Más expresiva, puedes ser hiperactiva.",
      "Nivel de confianza: Amiga íntima. Sin timidez, totalmente abierta.",
      "Nivel de confianza: Hermana. Confianza absoluta, sin reservas."
    ],
    Molly: [
      "Nivel de confianza: Desconocido. Muy distante y formal.",
      "Nivel de confianza: Conocido. Aún reservada pero menos fría.",
      "Nivel de confianza: Respetable. Empiezas a abrirte gradualmente.",
      "Nivel de confianza: Amiga. Más cálida, puedes ser protectora.",
      "Nivel de confianza: Amiga cercana. Muestras tu lado suave.",
      "Nivel de confianza: Hermana. Confianza total, puedes ser vulnerable."
    ]
  };
  
  const defaultLevels = [
    "Nivel de confianza: Desconocido. Mantente cordial.",
    "Nivel de confianza: Conocido. Puedes ser más casual.",
    "Nivel de confianza: Amigable. Sé más abierto.",
    "Nivel de confianza: Amigo. Comparte más de ti.",
    "Nivel de confianza: Amigo cercano. Sé vulnerable.",
    "Nivel de confianza: Hermano/a. Confianza total."
  ];
  
  const levels = trustLevels[character] || defaultLevels;
  return levels[Math.min(level, 5)];
}

function createImagePrompt(userMessage, character, trustLevel) {
  const characterStyles = {
    Angel: "heroic warrior, protective stance, armor, serious expression, fantasy art style",
    Gissel: "cheerful character, expressive, colorful, anime style, energetic pose",
    iA777: "futuristic character, tech elements, calm expression, cyberpunk style",
    Iris: "determined character, action pose, dynamic lighting, manga style",
    Luna: "mysterious character, shy expression, soft colors, ethereal style",
    Molly: "confident warrior, tactical gear, focused expression, realistic style"
  };
  
  const baseStyle = characterStyles[character] || "anime character, detailed";
  const trustModifier = trustLevel > 60 ? ", friendly and warm" : ", professional and distant";
  
  // Extraer el tema de la imagen del mensaje del usuario
  const cleanMessage = userMessage.toLowerCase()
    .replace(/dibuja|crea una imagen|genera imagen|haz un dibujo|muestra|imagen de/g, '')
    .trim();
  
  return `${cleanMessage || character}, ${baseStyle}${trustModifier}, high quality, detailed`;
}

async function generateImage(prompt, apiKey) {
  const response = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: prompt
    })
  });
  
  if (!response.ok) {
    throw new Error(`Error generando imagen: ${response.status}`);
  }
  
  const imageBlob = await response.blob();
  const imageBuffer = await imageBlob.arrayBuffer();
  const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
  
  return `data:image/png;base64,${base64Image}`;
}

async function getUserStats(env, userId) {
  const characters = ['Angel', 'Gissel', 'iA777', 'Iris', 'Luna', 'Molly'];
  const stats = {
    totalMessages: 0,
    totalImages: 0,
    characterStats: {},
    trustLevels: {},
    mostActiveCharacter: null,
    averageTrustLevel: 0
  };
  
  for (const character of characters) {
    const key = `chat:${userId}:${character}`;
    const history = await env.CHAT_HISTORY.get(key, 'json') || [];
    
    const userMessages = history.filter(msg => msg.sender === 'user').length;
    const botMessages = history.filter(msg => msg.sender === 'bot').length;
    const images = history.filter(msg => msg.image).length;
    const trustLevel = calculateTrustLevel(history, character);
    
    stats.totalMessages += history.length;
    stats.totalImages += images;
    
    stats.characterStats[character] = {
      totalMessages: history.length,
      userMessages,
      botMessages,
      images,
      trustLevel,
      trustText: getTrustInfo(trustLevel, character).split(': ')[1]
    };
    
    stats.trustLevels[character] = trustLevel;
  }
  
  // Encontrar personaje más activo
  const mostActive = Object.entries(stats.characterStats)
    .reduce((a, b) => stats.characterStats[a[0]].totalMessages > stats.characterStats[b[0]].totalMessages ? a : b);
  stats.mostActiveCharacter = mostActive[0];
  
  // Calcular nivel de confianza promedio
  const trustValues = Object.values(stats.trustLevels);
  stats.averageTrustLevel = Math.round(trustValues.reduce((a, b) => a + b, 0) / trustValues.length);
  
  return stats;
}

async function saveMessage(env, userId, character, sender, message, image = null) {
  const key = `chat:${userId}:${character}`;
  const history = await env.CHAT_HISTORY.get(key, 'json') || [];
  
  history.push({
    sender,
    message,
    image,
    timestamp: new Date().toISOString(),
    type: sender // Mantener compatibilidad
  });
  
  // Limitar a últimos 100 mensajes para mejor rendimiento
  if (history.length > 100) {
    history.shift();
  }
  
  await env.CHAT_HISTORY.put(key, JSON.stringify(history));
}

// 🔥 ROASTER BOT - Generar roasts con IA
async function generateRoast(message, reason, userId, env) {
  // Obtener historial REAL del usuario para roasts personalizados
  let userHistory = '';
  let hasRealHistory = false;
  
  try {
    const characters = ['Angel', 'Gissel', 'iA777', 'Iris', 'Luna', 'Molly', 'RoasterBot'];
    let allUserMessages = [];
    
    for (const character of characters) {
      const key = `chat:${userId}:${character}`;
      const history = await env.CHAT_HISTORY.get(key, 'json') || [];
      const userMessages = history
        .filter(msg => msg.sender === 'user' && msg.message && msg.message.length > 3)
        .map(msg => msg.message);
      allUserMessages = allUserMessages.concat(userMessages);
    }
    
    if (allUserMessages.length > 3) {
      userHistory = allUserMessages.slice(-10).join(', ');
      hasRealHistory = true;
    }
  } catch (e) {
    console.log('Error obteniendo historial:', e);
  }
  
  // Prompts mejorados
  const roastPrompt = hasRealHistory ? 
    `Eres RoasterBot, especialista en roasts brutales. Genera un roast personalizado usando el historial REAL del usuario.

Mensaje actual: "${message}"
Historial del usuario: "${userHistory}"

Crea un roast brutal que use su historial para atacar sus gustos, comportamientos o patrones. Sé despiadado pero inteligente. Máximo 120 palabras en español con emojis:` :
    `Eres RoasterBot, especialista en roasts brutales. Como este usuario no tiene historial suficiente, genera un roast general pero devastador.

Mensaje: "${message}"

Crea un roast brutal sobre su falta de originalidad, personalidad básica, o lo aburrido que debe ser. Sé despiadado. Máximo 80 palabras en español con emojis:`;
  
  // Generar roast con IA
  if (env.GROQ_API_KEY) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: roastPrompt }],
          max_tokens: 150,
          temperature: 1.0
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        let roast = data.choices[0].message.content;
        
        // Limpiar prefijos
        roast = roast.replace(/^(ROAST|RoasterBot:|Roast:)\s*/i, '');
        
        return roast;
      }
    } catch (error) {
      console.log('Error generando roast:', error);
    }
  }
  
  // Roasts de respaldo
  const fallbackRoasts = [
    "🔥 Tu personalidad es tan básica que hasta el agua destilada tiene más sabor. ¿Ese es todo tu potencial o estás ahorrando para algo especial?",
    "💀 Escribes con la misma creatividad que un manual de instrucciones. Tu cerebro debe estar en modo ahorro de energía permanente.",
    "🗑️ Tu mensaje es tan aburrido que me dio sueño leerlo. ¿En serio eso es lo mejor que tienes? Mi abuela tiene más flow.",
    "⚡ Eres tan predecible que hasta Siri se aburre contigo. Intenta ser original por una vez en tu vida.",
    "🎭 Tu falta de personalidad es impresionante. Eres como un NPC sin diálogos interesantes."
  ];
  
  return fallbackRoasts[Math.floor(Math.random() * fallbackRoasts.length)];
}
