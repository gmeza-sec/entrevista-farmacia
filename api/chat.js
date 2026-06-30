const { GoogleGenAI } = require('@google/genai');

// Inicializa el cliente con la variable de entorno
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

module.exports = async (req, res) => {
  // Asegurar que solo se procesen peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { messages, system } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing or invalid "messages" array.' });
    }

    // 1. Formatear el historial de mensajes al formato que espera Gemini (role: 'user' o 'model')
    // Vercel Serverless maneja la última interacción de forma integrada en el historial,
    // o puedes pasar el array completo si ya viene estructurado.
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content || msg.text }]
    }));

    // 2. Configurar las opciones, incluyendo las instrucciones del sistema si vienen en la petición
    const config = {};
    if (system) {
      config.systemInstruction = system;
    }

    // 3. Llamar a la API usando Gemini 1.5 Flash
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: contents,
      config: config
    });

    // 4. Estructurar la respuesta según tu requerimiento exacto
    return res.status(200).json({
      content: [
        { text: response.text }
      ]
    });

  } catch (error) {
    console.error('Error en la Serverless Function:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message 
    });
  }
};