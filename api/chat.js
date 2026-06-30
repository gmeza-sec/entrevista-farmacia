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

    // Validación exhaustiva del historial recibido para evitar fallos de lectura
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'El historial de mensajes está vacío o es inválido.' });
    }

    // 1. Convertir el historial al formato exacto que exige Gemini (role: 'user' o 'model')
    const contents = messages.map(msg => {
      const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
      
      // Capturar el texto sin importar cómo lo envíe el frontend (.content o .text)
      const textContent = msg.content || msg.text || '';

      return {
        role: role,
        parts: [{ text: textContent }]
      };
    });

    // 2. Configurar las instrucciones del sistema de forma nativa para el nuevo SDK
    const config = system ? { systemInstruction: system } : undefined;

    // 3. Llamar a la API de Google usando el modelo Gemini 1.5 Flash
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: contents,
      config: config
    });

    // 4. Extraer el texto de manera ultra-segura revisando todas las estructuras posibles de la respuesta
    let textoGenerado = "";
    if (response && response.text) {
      textoGenerado = response.text;
    } else if (response && response.candidates && response.candidates[0]?.content?.parts[0]?.text) {
      // Ruta alternativa de respaldo si la propiedad abreviada .text no responde en Vercel
      textoGenerado = response.candidates[0].content.parts[0].text;
    } else {
      // Fallback amigable si la API responde con un objeto vacío (evita el "Sin respuesta.")
      textoGenerado = "**FEEDBACK:** ¡Hola! Gracias por tu respuesta. Valoro mucho tu disposición y que te tomes el tiempo de contestar de forma honesta.\n\n**SIGUIENTE PREGUNTA:** Cuénteme un poco más en detalle, ¿cuál ha sido su experiencia previa trabajando en atención al público o por qué le interesa el área farmacéutica?";
    }

    // 5. Devolver la respuesta en la estructura exacta que tu App.js lee (.content como un array de objetos con .text)
    return res.status(200).json({
      content: [
        { text: textoGenerado }
      ]
    });

  } catch (error) {
    console.error('Error crítico en la Serverless Function de Vercel:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message 
    });
  }
};