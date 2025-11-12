import LegalInfoCard from '../LegalInfoCard';

export default function LegalInfoCardExample() {
  return (
    <div className="p-4 bg-background max-w-lg">
      <LegalInfoCard
        infraction="Exceso de velocidad (20 km/h sobre límite)"
        fine="30% del SBU"
        points="4 puntos"
        reference="COIP Art. 385 / LOTTTSV Art. 142"
      />
    </div>
  );
}
