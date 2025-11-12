import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import chapiAvatar from "@assets/generated_images/Chapi_chatbot_mascot_avatar_766667bc.png";

export default function ChatHeader() {
  return (
    <header className="sticky top-0 z-50 h-16 px-4 py-3 bg-card border-b border-card-border flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img 
          src={chapiAvatar} 
          alt="Chapi" 
          className="w-10 h-10 rounded-full"
        />
        <div>
          <h1 className="text-xl font-semibold text-card-foreground">ChatBot Chapi</h1>
          <p className="text-xs text-muted-foreground">Asistente de Tránsito</p>
        </div>
      </div>
      <Button 
        size="icon" 
        variant="ghost"
        data-testid="button-info"
        onClick={() => console.log('Info clicked')}
      >
        <Info className="w-5 h-5" />
      </Button>
    </header>
  );
}
