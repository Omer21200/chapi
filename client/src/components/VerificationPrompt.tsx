import { Button } from "@/components/ui/button";
import { Check, HelpCircle } from "lucide-react";

interface VerificationPromptProps {
  onClear: () => void;
  onNeedDetails: () => void;
}

export default function VerificationPrompt({ onClear, onNeedDetails }: VerificationPromptProps) {
  return (
    <div className="flex gap-3 mt-2" data-testid="prompt-verification">
      <Button
        size="sm"
        variant="outline"
        className="gap-2 hover-elevate active-elevate-2"
        onClick={onClear}
        data-testid="button-clear"
      >
        <Check className="w-4 h-4" />
        Sí, está claro
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="gap-2 hover-elevate active-elevate-2"
        onClick={onNeedDetails}
        data-testid="button-details"
      >
        <HelpCircle className="w-4 h-4" />
        Necesito más detalles
      </Button>
    </div>
  );
}
