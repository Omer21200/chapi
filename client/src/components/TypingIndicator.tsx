import chapiAvatar from "@assets/generated_images/Chapi_chatbot_mascot_avatar_766667bc.png";

export default function TypingIndicator() {
  return (
    <div className="flex gap-3 max-w-2xl mr-auto" data-testid="indicator-typing">
      <img 
        src={chapiAvatar} 
        alt="Chapi" 
        className="w-8 h-8 rounded-full flex-shrink-0"
      />
      <div className="px-4 py-3 rounded-2xl bg-card rounded-bl-sm">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
      </div>
    </div>
  );
}
