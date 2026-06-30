const { GoogleGenAI } = require('@google/genai');

// Inicializa el cliente oficial de Gemini con la API Key de Vercel
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

module.exports = async (req, res) => {
  // Asegurar que solo se procesen peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { messages, system } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'El historial de mensajes está vacío o es inválido.' });
    }

    // 1. Convertir el historial al formato exacto que exige Gemini (role: 'user' o 'model')
    const contents = messages.map(msg => {
      const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
      return {
        role: role,
        parts: [{ text: msg.content || msg.text || '' }]
      };
    });

    // 2. Preparar la configuración del sistema para la entrevista
    const config = {};
    if (system) {
      config.systemInstruction = system;
    }

    // 3. Llamar a la API de Gemini 1.5 Flash usando el método del SDK oficial
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: contents,
      config: config
    });

    // Extraer el texto de manera segura según la respuesta del SDK oficial de Google
    // La propiedad correcta para obtener el string es 'response.text'
    const textoGenerado = response.text || "Lo siento, no pude procesar la respuesta.";

    // 4. Formatear la salida idéntica a como la lee tu frontend: data.content -> array de objetos con .text
    return res.status(200).json({
      content: [
        { text: textoGenerado }
      ]
    });

  } catch (error) {
    console.error('Error en la Serverless Function de Vercel:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message 
    });
  }
};