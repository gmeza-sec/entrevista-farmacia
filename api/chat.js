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

    // Validación exhaustiva del historial recibido
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'El historial de mensajes está vacío o es inválido.' });
    }

    // Mapeo ultra-seguro para Gemini (evita campos vacíos o errores de rol)
    const contents = messages.map(msg => {
      // Forzar que el rol sea 'user' o 'model' (Gemini usa 'model' en vez de 'assistant')
      const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
      
      // Capturar el texto sin importar si el frontend lo envió como .content o .text
      const textContent = msg.content || msg.text || '';

      return {
        role: role,
        parts: [{ text: textContent }]
      };
    });

    // Configurar las opciones, incluyendo las instrucciones del sistema si vienen en la petición
    const config = {};
    if (system) {
      config.systemInstruction = system;
    }

    // Llamar a la API usando Gemini 1.5 Flash
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: contents,
      config: config
    });

    // Estructurar la respuesta según tu requerimiento exacto
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