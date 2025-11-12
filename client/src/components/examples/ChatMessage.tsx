import ChatMessage from '../ChatMessage';

export default function ChatMessageExample() {
  return (
    <div className="space-y-4 p-4 bg-background">
      <ChatMessage 
        sender="user" 
        content="¿Qué pasa si voy a 50 km/h en zona de 30 km/h?"
        timestamp="14:32"
      />
      <ChatMessage 
        sender="bot" 
        content="La multa sería el 30% de un salario básico y 4 puntos menos a la licencia."
        timestamp="14:32"
      />
    </div>
  );
}
