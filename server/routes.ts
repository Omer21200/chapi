import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getChapiResponse } from "./lib/chapi-ai";
import { legalArticlesManager } from "./lib/legal-articles";
import { insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";

const chatRequestSchema = z.object({
  message: z.string().min(1),
  conversationHistory: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string()
  })).optional().default([])
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health endpoint: useful to quickly validate server status
  app.get("/api/health", async (_req, res) => {
    try {
      res.json({ ok: true, totalArticles: legalArticlesManager.getTotalArticulos(), success: true });
    } catch (error) {
      console.error("Error in /api/health:", error);
      res.status(500).json({ ok: false, success: false });
    }
  });

  // Debug preview: devuelve el systemInstruction y el contexto resumido que
  // se enviaría al modelo en una petición real. No llama a Gemini.
  app.post("/api/debug/preview", async (req, res) => {
    try {
      const body = req.body || {};
      const message = typeof body.message === "string" ? body.message : "";

      if (!message) {
        return res.status(400).json({ error: "message is required", success: false });
      }

      const articulosRelevantes = await legalArticlesManager.buscarArticulosRelevantes(message, 5);
      const contextoArticulos = legalArticlesManager.formatearArticulosParaContexto(articulosRelevantes);

      // Small system instruction (matches what the server tries to use)
      const systemInstruction = `Eres Chapi, un asistente virtual especializado en consultas sobre tránsito y movilidad en Ecuador. Responde de forma clara y cita artículos legales relevantes cuando correspondan.`;

      // Build a summarized context (short snippets) to preview what would be included
      const contextoResumido = articulosRelevantes.map(a => ({
        ley: a.ley,
        numero: a.numero,
        titulo: a.titulo,
        snippet: (a.contenido || "").replace(/\s+/g, " ").trim().slice(0, 300)
      }));

      const combinedUserMessage = `${contextoResumido.map(x => `[${x.ley} Art ${x.numero}] ${x.snippet}...`).join("\n\n")}\n\nPregunta: ${message}`;

      res.json({ systemInstruction, contextoArticulos: contextoResumido, combinedUserMessage, success: true });
    } catch (error) {
      console.error("Error in /api/debug/preview:", error);
      res.status(500).json({ error: "Error generating preview", success: false });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, conversationHistory } = chatRequestSchema.parse(req.body);
      
      await storage.createChatMessage({
        content: message,
        sender: "user"
      });

      const botResponse = await getChapiResponse(message, conversationHistory);

      await storage.createChatMessage({
        content: botResponse,
        sender: "bot"
      });

      res.json({ 
        response: botResponse,
        success: true 
      });
    } catch (error) {
      console.error("Error in /api/chat:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Datos inválidos",
          success: false 
        });
      }

      res.status(500).json({ 
        error: "Error al procesar la consulta",
        success: false 
      });
    }
  });

  app.get("/api/chat/history", async (_req, res) => {
    try {
      const messages = await storage.getChatMessages(50);
      res.json({ messages, success: true });
    } catch (error) {
      console.error("Error in /api/chat/history:", error);
      res.status(500).json({ 
        error: "Error al obtener historial",
        success: false 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
