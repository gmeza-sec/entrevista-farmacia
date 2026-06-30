const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, system } = req.body;

  const geminiMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: geminiMessages
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta';
    res.status(200).json({ content: [{ text }] });
  } catch (error) {
    res.status(500).json({ error: 'Error al conectar con Gemini' });
  }
};

module.exports = handler;