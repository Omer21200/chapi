import { useState, useRef, useEffect } from "react";
import ChatHeader from "@/components/ChatHeader";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import WelcomeScreen from "@/components/WelcomeScreen";
import TypingIndicator from "@/components/TypingIndicator";
import VerificationPrompt from "@/components/VerificationPrompt";
import ThemeToggle from "@/components/ThemeToggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: string;
  showVerification?: boolean;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendGreeting = () => {
    const greeting: Message = {
      id: Date.now().toString(),
      content: "Hola, mi nombre es Chapi, soy tu agente virtual de tránsito. Estoy aquí para ayudarte con dudas sobre la movilidad.",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([greeting]);
    setConversationHistory([]);
    setShowWelcome(false);
  };

  const handleSendMessage = async (content: string) => {
    if (messages.length === 0) {
      sendGreeting();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setShowWelcome(false);
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          conversationHistory,
        }),
      });

      if (!res.ok) {
        throw new Error("Error en la respuesta del servidor");
      }

      const data = await res.json() as { response: string; success: boolean };

      if (data.success && data.response) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
          showVerification: !data.response.includes("Disculpa, mi conocimiento"),
        };

        setMessages(prev => [...prev, botMessage]);
        
        setConversationHistory(prev => [
          ...prev,
          { role: "user", content },
          { role: "assistant", content: data.response }
        ]);
      } else {
        throw new Error("Respuesta inválida del servidor");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Lo siento, hubo un problema al procesar tu consulta. Por favor, intenta de nuevo.",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVerificationClear = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, showVerification: false } : msg
    ));
    
    setTimeout(() => {
      const farewell: Message = {
        id: Date.now().toString(),
        content: "¡Muchas gracias por usarme! No olvides consultarme. ¡Conduce con precaución!",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, farewell]);
    }, 500);
  };

  const handleVerificationDetails = () => {
    const detailsMessage: Message = {
      id: Date.now().toString(),
      content: "Por supuesto, estaré encantado de darte más detalles. ¿Qué aspecto específico te gustaría que te explique con más profundidad?",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => prev.map(msg => ({ ...msg, showVerification: false })));
    setMessages(prev => [...prev, detailsMessage]);
  };

  const handleQuickAction = (action: string) => {
    handleSendMessage(action);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="w-10"></div>
        <ChatHeader />
        <ThemeToggle />
      </div>
      
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="p-4 space-y-4 max-w-4xl mx-auto">
          {showWelcome && messages.length === 0 ? (
            <WelcomeScreen onQuickAction={handleQuickAction} />
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  content={message.content}
                  sender={message.sender}
                  timestamp={message.timestamp}
                >
                  {message.showVerification && (
                    <VerificationPrompt
                      onClear={() => handleVerificationClear(message.id)}
                      onNeedDetails={handleVerificationDetails}
                    />
                  )}
                </ChatMessage>
              ))}
              {isTyping && <TypingIndicator />}
            </>
          )}
        </div>
      </ScrollArea>

      <ChatInput onSend={handleSendMessage} disabled={isTyping} />
    </div>
  );
}
