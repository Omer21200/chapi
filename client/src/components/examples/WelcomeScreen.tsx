import WelcomeScreen from '../WelcomeScreen';

export default function WelcomeScreenExample() {
  return (
    <div className="bg-background min-h-screen">
      <WelcomeScreen onQuickAction={(action) => console.log('Quick action:', action)} />
    </div>
  );
}
