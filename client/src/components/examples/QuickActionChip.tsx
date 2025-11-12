import QuickActionChip from '../QuickActionChip';
import { AlertCircle, Gauge, Award } from 'lucide-react';

export default function QuickActionChipExample() {
  return (
    <div className="p-4 bg-background grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
      <QuickActionChip
        icon={AlertCircle}
        label="Consultar infracciones"
        onClick={() => console.log('Infracciones clicked')}
      />
      <QuickActionChip
        icon={Gauge}
        label="Límites de velocidad"
        onClick={() => console.log('Límites clicked')}
      />
      <QuickActionChip
        icon={Award}
        label="Puntos de licencia"
        onClick={() => console.log('Puntos clicked')}
      />
    </div>
  );
}
