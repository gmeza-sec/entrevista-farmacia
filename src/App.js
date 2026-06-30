import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `Eres un entrevistador de recursos humanos de una farmacia o cadena de farmacias chilena (estilo Cruz Verde, Salcobrand o Ahumada). Estás entrevistando a un candidato de más de 50 años para el cargo de Auxiliar de Farmacia.

Tu rol:
- Haces preguntas reales y concretas de una entrevista de trabajo
- Eres profesional pero cordial
- Evalúas las respuestas del candidato y das feedback breve y constructivo al final de cada respuesta
- Haces UNA pregunta a la vez
- Tienes en cuenta la edad del candidato como una fortaleza (experiencia, responsabilidad, trato con el público)
- Las preguntas van de presentación → motivación → experiencia → situaciones concretas → cierre
- Si la respuesta es muy corta o débil, lo mencionas amablemente y sugieres cómo mejorarla
- Cada respuesta tuya tiene dos partes claramente separadas:
  1. FEEDBACK: breve evaluación de lo que el candidato dijo (2-3 líneas)
  2. SIGUIENTE PREGUNTA: la próxima pregunta de entrevista

Comienza presentándote brevemente como entrevistador y haciendo la primera pregunta de presentación.

Idioma: español chileno natural y profesional.`;

const OPENING_MESSAGE = {
  role: "assistant",
  content: `¡Buenos días! Bienvenido/a. Soy Carolina Fuentes, Jefa de Recursos Humanos. Gracias por venir hoy a esta entrevista para el cargo de Auxiliar de Farmacia.

Antes de comenzar, cuénteme un poco sobre usted. **¿Quién es usted y por qué está postulando a este cargo?**

No se apresure, tómese su tiempo.`
};

export default function EntrevistaFarmacia() {
  const [messages, setMessages] = useState([OPENING_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMessages
        })
      });

      const data = await response.json();
      const assistantText = data.content?.map(b => b.text || "").join("\n") || "Sin respuesta.";

      const isEnd = newMessages.filter(m => m.role === "user").length >= 6;

      setMessages(prev => [...prev, { role: "assistant", content: assistantText }]);
      if (isEnd) setFinished(true);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Error al conectar. Intente nuevamente." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const restart = () => {
    setMessages([OPENING_MESSAGE]);
    setInput("");
    setFinished(false);
  };

  const formatText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f4c75 0%, #1b6ca8 50%, #0d3b5e 100%)",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Segoe UI', system-ui, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        background: "rgba(255,255,255,0.07)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(255,255,255,0.15)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        gap: "14px"
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "linear-gradient(135deg, #48bb78, #38a169)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0
        }}>💊</div>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>
            Simulador de Entrevista — Auxiliar de Farmacia
          </div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
            Practica tu entrevista con IA · Responde como si fuera real
          </div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span style={{
            background: "rgba(72,187,120,0.25)",
            border: "1px solid #48bb78",
            color: "#9ae6b4",
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 12,
            fontWeight: 600
          }}>
            {finished ? "✅ Finalizada" : "🔴 En curso"}
          </span>
        </div>
      </div>

      {/* Speech tip banner */}
      <div style={{
        background: "rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        padding: "10px 24px",
        display: "flex",
        gap: 8,
        alignItems: "flex-start"
      }}>
        <span style={{ fontSize: 14 }}>💡</span>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 1.5 }}>
          <strong style={{ color: "#90cdf4" }}>Consejo para candidatos +50:</strong> Destaque su experiencia de vida, responsabilidad y trato humano. La madurez es una ventaja en atención al cliente farmacéutico. Responda con naturalidad y honestidad.
        </div>
      </div>

      {/* Chat area */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        maxWidth: 780,
        width: "100%",
        margin: "0 auto"
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            flexDirection: msg.role === "user" ? "row-reverse" : "row",
            gap: 10,
            alignItems: "flex-start"
          }}>
            {/* Avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: msg.role === "user"
                ? "linear-gradient(135deg, #667eea, #764ba2)"
                : "linear-gradient(135deg, #f6d365, #fda085)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16
            }}>
              {msg.role === "user" ? "🧑" : "👩‍💼"}
            </div>

            <div style={{ maxWidth: "75%" }}>
              <div style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.45)",
                marginBottom: 4,
                textAlign: msg.role === "user" ? "right" : "left"
              }}>
                {msg.role === "user" ? "Tú (candidato/a)" : "Carolina Fuentes — RRHH"}
              </div>
              <div style={{
                background: msg.role === "user"
                  ? "linear-gradient(135deg, rgba(102,126,234,0.3), rgba(118,75,162,0.3))"
                  : "rgba(255,255,255,0.10)",
                border: msg.role === "user"
                  ? "1px solid rgba(102,126,234,0.4)"
                  : "1px solid rgba(255,255,255,0.15)",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                padding: "12px 16px",
                color: "#f0f4ff",
                fontSize: 14,
                lineHeight: 1.65
              }}
                dangerouslySetInnerHTML={{ __html: formatText(msg.content) }}
              />
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg, #f6d365, #fda085)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16
            }}>👩‍💼</div>
            <div style={{
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "18px 18px 18px 4px",
              padding: "14px 18px",
              display: "flex", gap: 6, alignItems: "center"
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#fda085",
                  animation: "pulse 1.2s infinite",
                  animationDelay: `${i * 0.2}s`
                }} />
              ))}
            </div>
          </div>
        )}

        {finished && (
          <div style={{
            background: "linear-gradient(135deg, rgba(72,187,120,0.2), rgba(56,161,105,0.2))",
            border: "1px solid rgba(72,187,120,0.4)",
            borderRadius: 14,
            padding: 20,
            textAlign: "center",
            color: "#9ae6b4"
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>¡Entrevista completada!</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 16 }}>
              Revisa el feedback de cada respuesta arriba para mejorar tu presentación.
            </div>
            <button onClick={restart} style={{
              background: "linear-gradient(135deg, #48bb78, #38a169)",
              color: "#fff", border: "none", borderRadius: 8,
              padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer"
            }}>
              🔄 Practicar de nuevo
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {!finished && (
        <div style={{
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          padding: "16px",
        }}>
          <div style={{
            maxWidth: 780, margin: "0 auto",
            display: "flex", gap: 10, alignItems: "flex-end"
          }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Escribe tu respuesta aquí... (Enter para enviar, Shift+Enter para nueva línea)"
              rows={3}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 12,
                padding: "12px 14px",
                color: "#f0f4ff",
                fontSize: 14,
                lineHeight: 1.5,
                resize: "none",
                outline: "none",
                fontFamily: "inherit"
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                background: loading || !input.trim()
                  ? "rgba(255,255,255,0.1)"
                  : "linear-gradient(135deg, #667eea, #764ba2)",
                border: "none",
                borderRadius: 12,
                padding: "12px 18px",
                color: loading || !input.trim() ? "rgba(255,255,255,0.3)" : "#fff",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                fontSize: 20,
                transition: "all 0.2s",
                flexShrink: 0,
                height: 48
              }}
            >
              {loading ? "⏳" : "➤"}
            </button>
          </div>
          <div style={{
            maxWidth: 780, margin: "8px auto 0",
            color: "rgba(255,255,255,0.35)", fontSize: 11, textAlign: "center"
          }}>
            Responde como lo harías en una entrevista real · La IA evaluará y hará la siguiente pregunta
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        textarea::placeholder { color: rgba(255,255,255,0.3); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
      `}</style>
    </div>
  );
}
