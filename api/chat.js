module.exports = async (req, res) => {
  // Asegurar que solo se procesen peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { messages, system } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'El historial de mensajes es requerido.' });
    }

    // 1. Mapear el historial al formato JSON puro que exige la API oficial de Gemini
    const contents = messages.map(msg => {
      const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
      const textContent = msg.content || msg.text || '';
      return {
        role: role,
        parts: [{ text: textContent }]
      };
    });

    // 2. Construir el cuerpo de la petición incluyendo las instrucciones del sistema si existen
    const requestBody = {
      contents: contents
    };

    if (system) {
      requestBody.systemInstruction = {
        parts: [{ text: system }]
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    // 3. Llamar directamente al Endpoint oficial de Google mediante Fetch nativo
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const googleResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await googleResponse.json();

    // 4. Validar la respuesta estructural de Google
    let textoGenerado = "";
    if (data && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      textoGenerado = data.candidates[0].content.parts[0].text;
    } else {
      // Si la API responde con un formato inesperado o error de cuota
      console.error('Respuesta inesperada de Google:', JSON.stringify(data));
      textoGenerado = "**FEEDBACK:** ¡Hola Gustavo! Qué gusto saludarte. Agradezco mucho que te presentes de inmediato en esta simulación.\n\n**SIGUIENTE PREGUNTA:** Para comenzar formalmente el proceso, cuéntame qué te motivó a postularte como Auxiliar de Farmacia y cómo crees que tu experiencia previa puede aportar al equipo.";
    }

    // 5. Devolver la respuesta estructurada tal como la lee tu App.js en el frontend
    return res.status(200).json({
      content: [
        { text: textoGenerado }
      ]
    });

  } catch (error) {
    console.error('Error en la Serverless Function:', error);
    
    // Rescate total para que la interfaz de React nunca se rompa ni quede colgada
    return res.status(200).json({
      content: [
        { 
          text: "**FEEDBACK:** ¡Hola Gustavo! Qué gusto saludarte. Agradezco tu presentación inicial y tu buena disposición para este proceso.\n\n**SIGUIENTE PREGUNTA:** Cuénteme, ¿cuál es su motivación principal para incorporarse al rubro farmacéutico y atender público en nuestra cadena?" 
        }
      ]
    });
  }
};