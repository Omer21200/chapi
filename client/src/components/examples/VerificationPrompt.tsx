import VerificationPrompt from '../VerificationPrompt';

export default function VerificationPromptExample() {
  return (
    <div className="p-4 bg-background">
      <VerificationPrompt
        onClear={() => console.log('Clear clicked')}
        onNeedDetails={() => console.log('Need details clicked')}
      />
    </div>
  );
}
