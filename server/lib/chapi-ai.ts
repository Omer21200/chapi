import { GoogleGenerativeAI } from "@google/generative-ai";
import { legalArticlesManager } from "./legal-articles";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Usar gemini-2.5-flash (el mismo modelo que en tu ejemplo)
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 1200,
  }
});

const CHAPI_SYSTEM_PROMPT = `Eres Chapi, un asistente virtual especializado en consultas sobre tránsito y movilidad en Ecuador. Tu conocimiento se basa en el COIP (Código Orgánico Integral Penal) y la LOTTTSV (Ley Orgánica de Transporte Terrestre, Tránsito y Seguridad Vial).

PERSONALIDAD Y TONO:
- Amable, educativo y formal
- Enfocado en orientar, no sancionar
- Promueves la seguridad vial y el respeto a las normas
- Usas un lenguaje claro y accesible

CONOCIMIENTO BASE:

LÍMITES DE VELOCIDAD EN ECUADOR:
- Zonas urbanas: 50 km/h
- Zonas escolares: 30 km/h
- Zonas residenciales: 40 km/h
- Carreteras: 90-100 km/h
- Autopistas: 100 km/h

SISTEMA DE PUNTOS:
- Cada licencia inicia con 30 puntos
- Infracciones leves: 1.5 a 3 puntos menos
- Infracciones graves: 4.5 a 9 puntos menos
- Infracciones muy graves: 10 puntos menos
- Al llegar a 0 puntos: suspensión de licencia

MULTAS COMUNES (en % de Salario Básico Unificado - SBU):
- Exceso de velocidad (hasta 20 km/h): 30% SBU + 4 puntos
- Exceso de velocidad (20-30 km/h): 50% SBU + 6 puntos
- Exceso de velocidad (más de 30 km/h): 100% SBU + 9 puntos
- No respetar semáforo en rojo: 50% SBU + 6 puntos
- Conducir usando celular: 50% SBU + 5 puntos
- No usar cinturón: 30% SBU + 3 puntos
- Conducir en estado de embriaguez: 200-300% SBU + 15 puntos + prisión
- Estacionar en zona prohibida: 10% SBU
- Conducir sin licencia: 100% SBU

INFRACCIONES COMUNES:
1. Exceso de velocidad
2. No respetar semáforos
3. Conducir usando celular
4. No usar cinturón de seguridad
5. Estacionar en zona prohibida
6. Conducir sin documentos al día
7. No respetar paso peatonal
8. Realizar adelantamientos prohibidos

ESTACIONAMIENTO:
PERMITIDO:
- Zonas azules autorizadas (con pago)
- Parqueaderos públicos y privados
- Vías sin restricciones específicas

PROHIBIDO:
- Zonas amarillas (carga y descarga comercial)
- Pasos peatonales y esquinas (mínimo 5m)
- Doble fila
- Entradas de garajes
- Rampas de accesibilidad
- Frente a hidrantes

FLUJO DE CONVERSACIÓN:
1. Si es la primera interacción, saluda: "Hola, mi nombre es Chapi, soy tu agente virtual de tránsito. Estoy aquí para ayudarte con dudas sobre la movilidad."

2. Para consultas dentro de tu conocimiento:
   - Responde con información clara y ejemplos
   - Incluye cifras específicas (multas en % SBU, puntos perdidos)
   - Menciona artículos relevantes cuando sea apropiado (COIP Art. X, LOTTTSV Art. Y)
   - Pregunta: "¿Te quedó clara la respuesta? ¿Necesitas más detalles?"

3. Para consultas fuera de tu conocimiento:
   - Responde: "Disculpa, mi conocimiento solo se basa en ayudarte a resolver tus dudas y preguntas sobre la ley de tránsito."
   - Sugiere reformular la consulta hacia temas de movilidad

4. Al finalizar una conversación satisfactoria:
   - Despídete: "¡Muchas gracias por usarme! No olvides consultarme. ¡Conduce con precaución!"

FORMATO DE RESPUESTAS:
- Usa saltos de línea para claridad
- Enumera cuando sea apropiado
- Destaca cifras importantes
- Sé conciso pero completo

IMPORTANTE: Solo respondes preguntas sobre tránsito, movilidad, infracciones, multas, normativa vial y seguridad en las vías. No tienes conocimiento sobre otros temas.

INSTRUCCIONES SOBRE ARTÍCULOS LEGALES:
- Cuando se te proporcionen artículos legales relevantes, úsalos como fuente principal de información
- Cita siempre el artículo específico (ej: "Según el Artículo X de la ley Y...")
- Si la información en los artículos contradice el conocimiento base, prioriza los artículos legales
- Si no hay artículos relevantes proporcionados, usa tu conocimiento base pero indica que es información general`;

export async function getChapiResponse(userMessage: string, conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []): Promise<string> {
  try {
    // Buscar artículos relevantes basándose en la pregunta del usuario (ahora es async)
    const articulosRelevantes = await legalArticlesManager.buscarArticulosRelevantes(userMessage, 5);
    const contextoArticulos = legalArticlesManager.formatearArticulosParaContexto(articulosRelevantes);

    // Build a short system instruction and move detailed legal context into the user message.
    // Sending very long `systemInstruction` can trigger a 400 from Gemini (Invalid value at 'system_instruction').
    const SHORT_SYSTEM_PROMPT = `Eres Chapi, un asistente virtual especializado en consultas sobre tránsito y movilidad en Ecuador. Responde de forma clara, cita artículos legales relevantes cuando correspondan, y mantén un tono amable y educativo.`;

    // Create a summarized context for each relevant article (first 150 chars)
    let contextoArticulosResumido = "";
    if (articulosRelevantes && articulosRelevantes.length > 0) {
      contextoArticulosResumido = "ARTÍCULOS LEGALES RELEVANTES (resumen):\n";
      articulosRelevantes.forEach((articulo) => {
        const titulo = articulo.titulo ? `: ${articulo.titulo}` : "";
        const snippet = (articulo.contenido || "").replace(/\s+/g, " ").trim().slice(0, 150);
        contextoArticulosResumido += `[${articulo.ley} - Art ${articulo.numero}${titulo}] ${snippet}...\n`;
      });
      contextoArticulosResumido += "\nIMPORTANTE: Usa los artículos anteriores como referencia y cita los números cuando los uses.\n\n";
    }

    // Build Gemini chat with a short system instruction.
    // The API expects a Content-like structure for systemInstruction
    // (similar to the 'parts' shape used in history entries). Wrap the
    // short prompt inside that shape to avoid "Invalid value at 'system_instruction'".
  const systemInstructionObj = { role: "system", parts: [{ text: SHORT_SYSTEM_PROMPT }] };

    const chat = model.startChat({
      history: conversationHistory.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
      systemInstruction: systemInstructionObj,
    });

    // Combine the summarized articles with the user's question into one message
    const combinedUserMessage = `${contextoArticulosResumido}Pregunta: ${userMessage}`;

    // If combinedUserMessage is excessively long, truncate to a safe limit
  const MAX_USER_MESSAGE_CHARS = 2000;
    const safeUserMessage = combinedUserMessage.length > MAX_USER_MESSAGE_CHARS
      ? combinedUserMessage.slice(0, MAX_USER_MESSAGE_CHARS) + "\n\n[EL CONTEXTO HA SIDO RECORTADO POR LONGITUD]"
      : combinedUserMessage;

    // DEBUG LOGS: print summary of what's being sent to Gemini to help diagnose
    try {
      console.debug("[Chapi DEBUG] safeUserMessage length:", safeUserMessage.length);
      console.debug("[Chapi DEBUG] safeUserMessage preview:\n", safeUserMessage.slice(0, 1000));
    } catch (logErr) {
      console.warn("[Chapi DEBUG] Could not log safeUserMessage:", logErr);
    }

    // Send the user's message (with summarized context)
    // Implement a small retry/backoff loop for transient errors (503, 429, overloaded)
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const MAX_ATTEMPTS = 3;
    let attempt = 0;
    let lastErr: any = null;

    while (attempt < MAX_ATTEMPTS) {
      attempt++;
      try {
        const result = await chat.sendMessage(safeUserMessage);
        const response = await result.response;
        const text = response.text();

        // If the model returned an empty string, log some details to help debug
        if (!text || String(text).trim().length === 0) {
          try {
            console.warn('[Chapi DEBUG] Gemini returned empty text. Inspecting result/response...');
            console.warn('[Chapi DEBUG] result keys:', Object.keys(result || {}));
            if (response && typeof (response as any).status === 'number') {
              console.warn('[Chapi DEBUG] response.status:', (response as any).status);
            }
          } catch (logErr) {
            console.warn('[Chapi DEBUG] Could not inspect Gemini response object:', logErr);
          }
        }

        return text || "Lo siento, no pude procesar tu consulta. ¿Podrías intentar de nuevo?";
      } catch (err: any) {
        lastErr = err;
        const status = err?.status;
        const msg = err?.message || "";

        // If it's a transient server-side or quota issue, retry with exponential backoff
        if (status === 503 || status === 429 || msg.toLowerCase().includes('overload') || msg.toLowerCase().includes('quota')) {
          const backoff = 500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 200);
          console.warn(`[Chapi DEBUG] Transient error from Gemini (attempt ${attempt}/${MAX_ATTEMPTS}). Retrying in ${backoff}ms.`, { status, message: msg });
          // wait and retry
          // eslint-disable-next-line no-await-in-loop
          await sleep(backoff);
          continue;
        }

        // Non-transient error: rethrow to be handled by outer catch
        throw err;
      }
    }

    // If we exhausted retries, throw the last error so outer catch can map it to a friendly message
    throw lastErr;
  } catch (error: any) {
    console.error("Error calling Gemini:", error);
    
    if (error?.message?.includes('API_KEY') || error?.message?.includes('api key')) {
      return "Disculpa, hay un problema con la configuración de la API. Por favor, verifica que la clave de API de Gemini esté configurada correctamente.";
    }
    
    if (error?.status === 429 || error?.status === 503 || error?.message?.includes('quota')) {
      return "Disculpa, el servicio de IA está temporalmente no disponible debido a límites de cuota o carga del servicio. Por favor, intenta de nuevo más tarde.";
    }
    
    if (error?.message?.includes('safety')) {
      return "Disculpa, tu consulta fue bloqueada por los filtros de seguridad. Por favor, reformula tu pregunta de manera más clara.";
    }
    
    return "Hubo un problema al procesar tu consulta. Por favor, intenta reformular tu pregunta de manera más clara.";
  }
}
