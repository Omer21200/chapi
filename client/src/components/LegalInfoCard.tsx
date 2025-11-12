interface LegalInfoCardProps {
  infraction: string;
  fine: string;
  points: string;
  reference?: string;
}

export default function LegalInfoCard({ infraction, fine, points, reference }: LegalInfoCardProps) {
  return (
    <div className="mt-3 p-4 bg-accent/50 border-l-4 border-primary rounded-md" data-testid="card-legal-info">
      <h4 className="font-semibold text-accent-foreground mb-2">{infraction}</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Multa</p>
          <p className="font-medium text-accent-foreground">{fine}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Puntos</p>
          <p className="font-medium text-accent-foreground">{points}</p>
        </div>
      </div>
      {reference && (
        <p className="text-xs font-mono text-muted-foreground mt-3">{reference}</p>
      )}
    </div>
  );
}
