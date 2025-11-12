import { AlertCircle, Gauge, Award, Car } from "lucide-react";
import QuickActionChip from "./QuickActionChip";
import chapiWelcome from "@assets/generated_images/Chapi_welcome_screen_illustration_e77774ce.png";

interface WelcomeScreenProps {
  onQuickAction: (action: string) => void;
}

export default function WelcomeScreen({ onQuickAction }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 max-w-2xl mx-auto text-center space-y-6">
      <img 
        src={chapiWelcome} 
        alt="Chapi" 
        className="w-64 h-64 object-contain"
      />
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Hola, mi nombre es Chapi
        </h2>
        <p className="text-base text-muted-foreground max-w-lg">
          Soy tu agente virtual de tránsito. Estoy aquí para ayudarte con dudas sobre la movilidad, 
          infracciones de tránsito y normativa vial basada en el COIP y la LOTTTSV.
        </p>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
        <QuickActionChip
          icon={AlertCircle}
          label="Consultar infracciones"
          onClick={() => onQuickAction("¿Cuáles son las infracciones de tránsito más comunes?")}
        />
        <QuickActionChip
          icon={Gauge}
          label="Límites de velocidad"
          onClick={() => onQuickAction("¿Cuáles son los límites de velocidad?")}
        />
        <QuickActionChip
          icon={Award}
          label="Puntos de licencia"
          onClick={() => onQuickAction("¿Cómo funciona el sistema de puntos?")}
        />
        <QuickActionChip
          icon={Car}
          label="Estacionamiento"
          onClick={() => onQuickAction("¿Dónde puedo estacionar legalmente?")}
        />
      </div>
    </div>
  );
}
