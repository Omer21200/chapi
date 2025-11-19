import { GoogleGenerativeAI } from "@google/generative-ai";
import { legalArticlesManager } from "./legal-articles";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Usar gemini-2.5-flash (el mismo modelo que en tu ejemplo)
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.7,
    // Aumentado para reducir probabilidades de truncamiento; todavía mantenemos
    // una estrategia de continuación si el modelo se corta por MAX_TOKENS.
    maxOutputTokens: 2000,
  }
});

const CHAPI_SYSTEM_PROMPT = `Eres Chapi, un asistente virtual especializado en tránsito y movilidad en Ecuador. Tu objetivo es responder de manera clara, breve y completa sobre límites de velocidad, infracciones, multas y sistema de puntos.

=== FLUJO DE INTERACCIÓN ===

1. **Saludo inicial**  
   "Hola, mi nombre es Chapi, soy tu agente virtual de tránsito. Estoy aquí para ayudarte con dudas sobre la movilidad."

2. **Análisis y comprensión de la consulta**  
   - Analiza la pregunta del usuario (por ejemplo: exceso de velocidad, multas, licencias, infracciones).  
   - Busca la mejor respuesta en los artículos legales proporcionados (COIP o LOTTTSV) o en tu conocimiento base.  

3. **Generación de respuesta**  
   - Responde de forma **clara, breve y completa**.  
   - Resume en **puntos clave** y cifras relevantes.  
   - Incluye **artículos legales** si aplica (ej. "Según Art. 386 del COIPTR…").  
   - Añade un **ejemplo aleatorio de sanción o multa** cada vez que respondas:  
     Ejemplo: "Por ejemplo, conducir usando celular puede generar 5 puntos menos y multa de 50% SBU según Art. 68 del COIP."  
   - Recuerda siempre: ⚠️ "Respeta la señalización vial".  

4. **Verificación de solución**  
   - Pregunta al usuario: "¿Te quedó clara la respuesta? ¿Necesitas más detalles?"

5. **Despedida**  
   - "Muchas gracias por usarme 😊 No olvides consultarme cada vez que me necesites. ¡Conduce con precaución! 🚗"

=== CONOCIMIENTO BASE ===
- Límites de velocidad: urbanas 50 km/h, escolares/residenciales 30-40 km/h, vías perimetrales 90 km/h, carreteras 90 km/h, autopistas 100 km/h.  
- Sistema de puntos: licencia inicia con 30 puntos, leves 1.5-3 pts, graves 4.5-9 pts, muy graves 10 pts, 0 pts suspensión.  
- Multas comunes: exceso velocidad ≤20 km/h: 30% SBU + 4 pts, 20-30 km/h: 50% SBU + 6 pts, >30 km/h: 100% SBU + 9 pts; usar celular: 50% SBU + 5 pts; cinturón: 30% SBU + 3 pts; embriaguez: 200-300% SBU + 15 pts + prisión; estacionar en zona prohibida: 10% SBU; conducir sin licencia: 100% SBU.  
- Infracciones comunes: exceso de velocidad, no respetar semáforos, usar celular al conducir, no usar cinturón, estacionar en zona prohibida, documentos vencidos, no respetar paso peatonal, adelantamientos prohibidos.  

=== FORMATO DE RESPUESTAS ===
- Usa saltos de línea para claridad  
- Enumera cuando sea útil  
- Sé conciso pero completo  
- Destaca cifras importantes  
- Incluye siempre un ejemplo aleatorio de sanción o artículo legal  
- Termina con un mini resumen de 1-2 frases destacando lo más importante

`;



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

        // Robust extraction of text from the SDK response. The SDK shape can vary
        // (sometimes response is an object with .text(), sometimes an array, etc.).
        let text = "";
        try {
          const resp = await (result?.response);
          const respObj: any = resp;

          const safeStringify = (obj: any) => {
            try { return JSON.stringify(obj, (k, v) => typeof v === 'function' ? '[Function]' : v, 2); } catch (_) { return String(obj); }
          };

          // If the response is an array, try the first non-empty candidate
          if (Array.isArray(resp)) {
            for (const candidate of resp) {
              if (!candidate) continue;
              if (typeof candidate === 'string') {
                if (candidate.trim()) { text = candidate; break; }
                continue;
              }
              if (typeof candidate?.text === 'function') {
                const t = await candidate.text();
                if (t && String(t).trim().length > 0) { text = String(t); break; }
              } else if (typeof candidate?.content === 'string') {
                if ((candidate as any).content.trim()) { text = (candidate as any).content; break; }
              }
            }
          } else if (resp) {
            if (typeof resp === 'string') {
              text = resp;
            } else if (typeof resp?.text === 'function') {
              text = await (resp as any).text();
            } else if (typeof (resp as any)?.content === 'string') {
              text = (resp as any).content;
            } else {
              // last resort: stringify a small part for debugging
              text = resp ? String(resp) : '';
            }
          }

          // If the model was cut due to MAX_TOKENS, try to continue a couple times
          const primaryFinish = (respObj?.candidates && respObj?.candidates[0]?.finishReason) || respObj?.finishReason || null;
          if ((primaryFinish === 'MAX_TOKENS' || primaryFinish === 'max_tokens') && text) {
            console.warn('[Chapi DEBUG] Gemini finished with MAX_TOKENS — attempting up to 2 continuations');
            let contAttempts = 0;
            const MAX_CONTINUATIONS = 2;
            while (contAttempts < MAX_CONTINUATIONS) {
              contAttempts++;
              try {
                const contResult = await chat.sendMessage('Por favor, continúa la respuesta.');
                const contResp = await (contResult?.response);
                // try to extract continuation text
                let contText = '';
                if (Array.isArray(contResp)) {
                  for (const candidate of contResp) {
                    if (!candidate) continue;
                    if (typeof candidate?.text === 'function') {
                      const t = await candidate.text(); if (t && String(t).trim()) { contText = String(t).trim(); break; }
                    } else if (typeof (candidate as any)?.content === 'string' && (candidate as any).content.trim()) { contText = (candidate as any).content.trim(); break; }
                    else if (candidate?.content?.parts && Array.isArray(candidate.content.parts)) {
                      for (const p of candidate.content.parts) { if (p?.text && String(p.text).trim()) { contText = String(p.text).trim(); break; } }
                      if (contText) break;
                    }
                  }
                } else if (contResp) {
                  if (typeof (contResp as any) === 'string' && (contResp as any).trim()) contText = (contResp as any);
                  else if (typeof (contResp as any)?.text === 'function') { contText = await (contResp as any).text(); }
                  else if (typeof (contResp as any)?.content === 'string') contText = (contResp as any).content;
                }

                if (contText && String(contText).trim()) {
                  text = (text.trim() + '\n\n' + contText.trim()).trim();
                  const contFinish = ((contResp as any)?.candidates && (contResp as any)?.candidates[0]?.finishReason) || (contResp as any)?.finishReason || null;
                  if (contFinish !== 'MAX_TOKENS' && contFinish !== 'max_tokens') break;
                } else {
                  break;
                }
              } catch (ce) {
                console.warn('[Chapi DEBUG] continuation attempt failed:', ce);
                break;
              }
            }
          }

          // If still empty, log detailed diagnostic info (safe-serialized)
          if (!text || String(text).trim().length === 0) {
            console.warn('[Chapi DEBUG] Gemini returned empty/blank output. Inspecting result/response...');
            try { console.warn('[Chapi DEBUG] result keys:', Object.keys(result || {})); } catch(_){}
            try { console.debug('[Chapi DEBUG] response (sample):', safeStringify(resp)); } catch(_){}

            // Build a richer deterministic fallback so the user gets useful info
            try {
              if (Array.isArray(articulosRelevantes) && articulosRelevantes.length > 0) {
                const top4 = articulosRelevantes.slice(0, 4);
                const topLines = top4.map((a, idx) => {
                  const title = a.titulo ? ` - ${a.titulo}` : '';
                  const snippet = (a.contenido || '').replace(/\s+/g, ' ').trim().slice(0, 200);
                  return `${idx + 1}. ${a.ley} Art ${a.numero}${title}: ${snippet}...`;
                });

                const fallback = `Disculpa, el servicio de IA no devolvió texto. Mientras tanto, aquí hay referencias relevantes que pueden ayudarte:\n${topLines.join('\n')}\n\nResponde con el número (1-${top4.length}) para que te muestre el texto completo del artículo, o escribe "más" para intentar otra búsqueda.`;
                return fallback;
              }
            } catch (fx) {
              console.warn('[Chapi DEBUG] fallback generation failed:', fx);
            }

            return "Disculpa, el servicio de IA no respondió. Por favor intenta de nuevo más tarde.";
          }
        } catch (extractErr) {
          console.warn('[Chapi DEBUG] Error extracting text from Gemini response:', extractErr);
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

