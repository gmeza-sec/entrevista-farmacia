module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { messages, system } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'El historial de mensajes es requerido.' });
    }

    // 1. Mapear el historial asegurando que el contenido sea texto limpio
    const contents = messages.map(msg => {
      const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
      const textContent = msg.content || msg.text || '';
      return {
        role: role,
        parts: [{ text: textContent }]
      };
    });

    const requestBody = { 
      contents: contents 
    };

    if (system) {
      requestBody.systemInstruction = {
        parts: [{ text: system }]
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // 2. Endpoint global v1 estable sin sub-versiones beta
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    // 3. Si Google devuelve un mensaje de error, lo exponemos para solucionarlo de inmediato
    if (data.error) {
      return res.status(200).json({
        content: [{ text: `**ERROR DE GOOGLE (${data.error.code}):** ${data.error.message}` }]
      });
    }

    // 4. Retornar la respuesta original de la IA
    if (data && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      return res.status(200).json({
        content: [{ text: data.candidates[0].content.parts[0].text }]
      });
    }

    // Si la respuesta viene vacía por alguna otra razón
    return res.status(200).json({
      content: [{ text: "**SISTEMA:** La API conectó, pero no devolvió texto. Revisa la consola." }]
    });

  } catch (error) {
    console.error('Error crítico:', error);
    return res.status(200).json({
      content: [{ text: `**ERROR CRÍTICO INTERNO:** ${error.message}` }]
    });
  }
};