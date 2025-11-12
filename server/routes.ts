import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getChapiResponse } from "./lib/chapi-ai";
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
