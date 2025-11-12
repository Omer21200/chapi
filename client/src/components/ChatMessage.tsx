import { cn } from "@/lib/utils";
import chapiAvatar from "@assets/generated_images/Chapi_chatbot_mascot_avatar_766667bc.png";

interface ChatMessageProps {
  content: string;
  sender: "user" | "bot";
  timestamp?: string;
  children?: React.ReactNode;
}

export default function ChatMessage({ content, sender, timestamp, children }: ChatMessageProps) {
  const isBot = sender === "bot";
  
  return (
    <div 
      className={cn(
        "flex gap-3 max-w-2xl",
        isBot ? "mr-auto" : "ml-auto"
      )}
      data-testid={`message-${sender}`}
    >
      {isBot && (
        <img 
          src={chapiAvatar} 
          alt="Chapi" 
          className="w-8 h-8 rounded-full flex-shrink-0"
        />
      )}
      <div className={cn("flex flex-col gap-2", !isBot && "items-end")}>
        <div
          className={cn(
            "px-4 py-3 rounded-2xl",
            isBot 
              ? "bg-card text-card-foreground rounded-bl-sm" 
              : "bg-primary text-primary-foreground rounded-br-sm ml-auto"
          )}
        >
          <p className="text-base whitespace-pre-wrap">{content}</p>
        </div>
        {children}
        {timestamp && (
          <span className="text-xs text-muted-foreground px-1">
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
