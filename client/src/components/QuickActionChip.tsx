import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickActionChipProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

export default function QuickActionChip({ icon: Icon, label, onClick }: QuickActionChipProps) {
  return (
    <Button
      variant="outline"
      className="justify-start gap-3 h-auto py-3 px-4 hover-elevate active-elevate-2"
      onClick={onClick}
      data-testid={`chip-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="text-left">{label}</span>
    </Button>
  );
}
