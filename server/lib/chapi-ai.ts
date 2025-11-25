import { GoogleGenerativeAI } from "@google/generative-ai";
import { legalArticlesManager } from "./legal-articles";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2000
  }
});
   
 
/* ============================================================
   FORMATEADOR COMPACTO
   ============================================================ */
function formatCompactReply(raw: string, userQuestion: string, maxChars = 1000): string {
  if (!raw?.trim()) return "Lo siento, no pude procesar tu consulta. ¿Puedes repetirla?";

  const text = raw.trim();
  if (text.length <= maxChars) return text;

  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const summary = sentences.slice(0, 2).join(" ");

  const lines = text.split(/\n+/).filter(Boolean);
  const clean = (s: string) =>
    s.replace(/^(\d+\.)+\s*/, "").replace(/\*\*/g, "").replace(/\s+/g, " ").trim();

  const candidates: string[] = [];
  for (const l of lines) {
    if (candidates.length >= 6) break;
    if (/^[\-\*\d]/.test(l) || l.length < 200) candidates.push(clean(l));
  }
  for (const s of sentences.slice(2)) {
    if (candidates.length >= 6) break;
    if (s.length > 20) candidates.push(clean(s));
  }

  const bullets: string[] = [];
  for (const c of candidates) {
    if (bullets.length >= 3) break;
    bullets.push(c);
  }

  const finalBullets = bullets.map((b) => (b.length <= 240 ? b : b.slice(0, 237) + "..."));
  const artMatch = text.match(/Art(?:\.|ículo)?\s*\d{1,4}/i);
  const referencia = artMatch ? `Referencia: ${artMatch[0]}` : "";

  return [
    summary,
    finalBullets.map((b, i) => `${i + 1}. ${b}`).join("\n"),
    referencia,
    '¿Necesitas más detalle? Responde "más" o elige un número.'
  ]
    .filter(Boolean)
    .join("\n\n");
}

/* ============================================================
   CHAPI: AGENTE PRINCIPAL
   ============================================================ */
export async function getChapiResponse(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<string> {
  try {
    // Buscar artículos relevantes
    const articulos = await legalArticlesManager.buscarArticulosRelevantes(userMessage, 5);

    // Resumen legal
    const resumenLegal =
      articulos.length > 0
        ? "ARTÍCULOS RELEVANTES:\n" +
          articulos
            .map((a) => {
              const s = (a.contenido || "").replace(/\s+/g, " ").slice(0, 150);
              return `[${a.ley} Art ${a.numero}${a.titulo ? ": " + a.titulo : ""}] ${s}...`;
            })
            .join("\n") +
          "\n\n"
        : "";

    // Sistema (corto y seguro)
    const systemInstruction = {
      role: "system",
      parts: [
        {
          text:
           
          "Eres Chapi, asistente de tránsito de Ecuador. Responde claro, breve y con artículos legales cuando apliquen. Mantén tono amable." 
        }
      ]
    };

    const chat = model.startChat({
      history: conversationHistory.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      })),
      systemInstruction
    });

    // Unificar mensaje del usuario
    const MAX_LEN = 2000;
    // Manejo de despedidas: si el usuario escribe una despedida común,
    // respondemos con la despedida larga solicitada sin invocar al modelo.
    const trimmedMsg = (userMessage || "").trim();
    const normalizedForFarewell = trimmedMsg.toLowerCase();
    if (/\b(adios|adiós|chao|chau|hasta luego|nos vemos|bye|goodbye)\b/i.test(normalizedForFarewell)) {
      return "Muchas gracias por usarme 😊 No olvides consultarme cada vez que me necesites. ¡Conduce con precaución! 🚗";
    }

    let finalMsg = resumenLegal + "Pregunta: " + userMessage;
    if (finalMsg.length > MAX_LEN)
      finalMsg = finalMsg.slice(0, MAX_LEN) + "\n\n[Contexto recortado]";

    /* ============================================================
       RETRY + BACKOFF
       ============================================================ */
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const MAX_ATTEMPTS = 3;
    let lastErr: any = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        let text = await getTextFromGemini(await chat.sendMessage(finalMsg));

        // Intentar continuaciones si fue cortado
        for (let i = 0; i < 2; i++) {
          if (!text.endsWith("…") && text.length < 1900) break;
          const extra = await getTextFromGemini(await chat.sendMessage("Continúa."));
          if (!extra.trim()) break;
          text += "\n" + extra;
        }

                // Detectar si el modelo inicia con un párrafo que parece saludo.
                let cleaned = text;
                try {
                  const firstParagraphMatch = cleaned.match(/^[\s\S]*?(?:\n\s*\n|$)/);
                  const firstParagraph = firstParagraphMatch ? firstParagraphMatch[0].trim() : '';

                  // Patrón amplio para detectar saludos o presentaciones que mencionen a Chapi
                  const greetingPattern = /^(?:¡?hola\b|buenas\b|buen día\b|buenas tardes\b|buenas noches\b|soy chapi\b|como chapi\b|como tu asistente\b).*$/i;

                  if (greetingPattern.test(firstParagraph) || /\bchapi\b/i.test(firstParagraph)) {
                    // Eliminar el primer párrafo (saludo del modelo) para evitar duplicados
                    cleaned = cleaned.replace(/^[\s\S]*?(?:\n\s*\n|$)/, '').trim();
                  }
                } catch (e) {
                  // en caso de error dejamos el texto original
                }

                const bodyText = cleaned.length ? cleaned : text;
                const responseWithGreeting = "";

                return formatCompactReply(responseWithGreeting, userMessage);
      } catch (err: any) {
        lastErr = err;
        if ([429, 503].includes(err?.status)) {
          await sleep(400 * attempt);
          continue;
        }
        throw err;
      }

    }

    throw lastErr;
  } catch (e: any) {
    if (e?.message?.includes("API_KEY"))
      return "Error: la API de Gemini no está configurada correctamente.";
    return "Lo siento, ocurrió un error procesando tu consulta.";
  }
}

/* ============================================================
   EXTRACTOR SEGURO DE TEXTO DEL SDK
   ============================================================ */
async function getTextFromGemini(result: any): Promise<string> {
  const resp = await result?.response;
  if (!resp) return "";

  // Si es string directo
  if (typeof resp === "string") return resp;

  // Si el SDK trae .text()
  if (typeof resp?.text === "function") return await resp.text();

  // Si es lista de candidatos
  if (Array.isArray(resp)) {
    for (const c of resp) {
      if (typeof c === "string" && c.trim()) return c;
      if (typeof c?.text === "function") {
        const t = await c.text();
        if (t?.trim()) return t;
      }
    }
  }

  // Si tiene content
  if (typeof resp?.content === "string") return resp.content;

  // Última opción
  return String(resp || "").slice(0, 2000);
}
