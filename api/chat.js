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

    // 1. Formatear el historial al formato nativo de Gemini
    const contents = messages.map(msg => {
      const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
      const textContent = msg.content || msg.text || '';
      return {
        role: role,
        parts: [{ text: textContent }]
      };
    });

    const requestBody = { contents };

    // Agregar el prompt del sistema si el frontend lo envía
    if (system) {
      requestBody.systemInstruction = {
        parts: [{ text: system }]
      };
    }

    // 2. Capturar la API Key desde el entorno de Vercel
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('La variable GEMINI_API_KEY no está definida en Vercel.');
    }

    // 3. Realizar la petición HTTP usando fetch global de Node.js (v18+)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    // Si Google nos devuelve un error de autenticación o cuota, lo capturamos aquí
    if (data.error) {
      throw new Error(`Google API Error [${data.error.code}]: ${data.error.message}`);
    }

    // 4. Extraer el texto original e inteligente generado por Gemini
    if (data && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      const textoOriginalIA = data.candidates[0].content.parts[0].text;

      return res.status(200).json({
        content: [
          { text: textoOriginalIA }
        ]
      });
    }

    throw new Error('Estructura de respuesta desconocida de Google AI Studio.');

  } catch (error) {
    // Esto imprimirá el error exacto en tu consola de Vercel (imagen_7.png) para saber qué pasa
    console.error('CRÍTICO:', error.message);

    // Devolvemos un error 500 real para que el frontend sepa que la API de Google falló 
    // y no te siga mostrando el bucle repetitivo de texto.
    return res.status(500).json({ 
      error: 'Error al generar respuesta original', 
      details: error.message 
    });
  }
};