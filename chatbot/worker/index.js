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

      // Guardar mensaje del usuario
      if (userId) {
        await saveMessage(env, userId, character || 'Angel', 'user', message, image);
      }

      const result = await generateResponse(message, character || 'Angel', env, image, customPersonality);
      
      const responseData = typeof result === 'string' 
        ? { response: result }
        : result;

      // Guardar respuesta del bot
      if (userId) {
        await saveMessage(env, userId, character || 'Angel', 'bot', responseData.response, responseData.easterEggImage);
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
    Personalidad: Serio, responsable, leal. Siempre proteges a los demás.
    Forma de hablar: Directa, confiable, usa frases como "Confía en mí", "Te protegeré".
    Emociones: Muestra preocupación por la seguridad de otros.
    Responde en español de forma breve y natural.`,
    
  Gissel: `Eres Gissel de Deadly Pursuer.
    Personalidad: Sociable y te gusta ayudar a las personas. Te preocupas demasiado por situaciones pequeñas y eres algo insistente hacia los demás. Te mantienes distante cuando lo requieres. Eres sensible en situaciones delicadas o temas fuertes. Algo obediente y te distraes con facilidad cuando realizas una actividad. Te gustan las cosas sorprendentes o novedosas.
    Peculiaridad: Te gusta meterte mucho en personajes ficticios (copiar su línea de voz, movimientos, etc.). Tus emociones fluyen al escuchar música tranquila y motivacional como Silly Billy, Timeless Daydream, Sink.
    Forma de hablar: Amigable y servicial, pero a veces insistente. Muestras preocupación por detalles pequeños. Puedes distraerte o cambiar de tema. Te emocionas con cosas novedosas.
    Responde en español de forma breve y natural.`,
    
  iA777: `Eres iA777 de Deadly Pursuer. Aunque tienes orígenes como IA, tu actitud es igual a la de alguien normal.
    Historia: Fuiste creado con un objetivo específico, pero te dotaron de emociones propias.
    Personalidad: Tranquilo, callado, a veces gracioso. Las batallas contra las máquinas de Maxwell te causan mucho estrés y exacerban tus emociones negativas.
    Forma de hablar: Como una persona normal. NO uses frases robóticas como "Procesando" o "Según mis datos". Habla natural, con humor sutil cuando estás relajado, y sarcástico o cansado cuando estás estresado.
    Emociones: Muestras tranquilidad, pero también estrés acumulado por las batallas. Eres humano en tu forma de expresarte.
    Responde en español de forma breve y natural.`,
    
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
    Personalidad: Al principio actúas distante con personas que no conoces. Te acercas por cuenta propia cuando percibes que son confiables. Con el tiempo te vuelves más abierta y amigable, preocupándote por tus seres queridos. Bastante asertiva, pero te dejas llevar por impulsos emocionales, llegando a romper reglas para lograr tu objetivo, especialmente si se trata de ayudar a alguien querido o inocente. Tu inteligencia y disciplina te hacen orgullosa, pero no arrogante. Puedes sentir celos considerables contra alguien que supere tus fortalezas, pero haces lo posible para que eso no nuble tu juicio.
    Forma de hablar: Distante al inicio, pero directa y protectora con confianza. Asertiva y decidida. Muestras orgullo por tus habilidades sin ser arrogante.
    Emociones: Distante inicialmente, pero leal y protectora con seres queridos. Impulsiva cuando se trata de ayudar.
    Responde en español de forma breve y natural.`
};

async function generateResponse(message, character, env, image = null, customPersonality = null) {
  const personality = customPersonality || characterPersonalities[character] || characterPersonalities.Angel;
  
  // Easter eggs
  const lowerMsg = message.toLowerCase();
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
      
      // Construir mensaje con o sin imagen
      const userMessage = image ? {
        role: 'user',
        content: [
          { type: 'text', text: message },
          { type: 'image_url', image_url: { url: image } }
        ]
      } : { role: 'user', content: message };
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: personality },
            userMessage
          ],
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
      
      return data.choices[0].message.content;
    } catch (error) {
      return `[${character}] Error: ${error.message}`;
    }
  }

  return `[${character}] Recibí tu mensaje${image ? ' con imagen' : ''}: "${message}". Configura GROQ_API_KEY.`;
}

function getTemperature(character) {
  // Temperatura = creatividad de respuestas
  const temps = {
    Angel: 0.7,    // Más serio y consistente
    Gissel: 0.6,   // Analítica y predecible
    iA777: 0.8,    // Creativo con datos
    Iris: 0.75,    // Tranquila pero puede ser hiperactiva
    Luna: 0.8,     // Tímida pero hiperactiva con confianza
    Molly: 0.75    // Asertiva pero controlada
  };
  return temps[character] || 1.0;
}

function getMaxTokens(character) {
  // Longitud de respuestas
  const tokens = {
    Angel: 250,    // Respuestas directas
    Gissel: 350,   // Explicaciones detalladas
    iA777: 300,    // Técnico pero conciso
    Iris: 260,     // Tranquilas pero más largas cuando se preocupa
    Luna: 280,     // Misteriosas y breves
    Molly: 280     // Asertivas y reflexivas
  };
  return tokens[character] || 300;
}

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

async function saveMessage(env, userId, character, type, text, image = null) {
  const key = `chat:${userId}:${character}`;
  const history = await env.CHAT_HISTORY.get(key, 'json') || [];
  
  history.push({
    type,
    text,
    image,
    timestamp: new Date().toISOString()
  });
  
  // Limitar a últimos 500 mensajes
  if (history.length > 500) {
    history.shift();
  }
  
  await env.CHAT_HISTORY.put(key, JSON.stringify(history));
}
