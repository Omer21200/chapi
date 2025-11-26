import { cn } from "@/lib/utils";
import chapiAvatar from "@assets/generated_images/Chapi_chatbot_mascot_avatar_766667bc.png";

interface ChatMessageProps {
  content: string;
  sender: "user" | "bot";
  timestamp?: string;
  children?: React.ReactNode;
}

// Helper: render text applying formatting rules:
// - Convert double-asterisk sections (**bold**) into <strong>
// - Convert quoted segments "..." into <strong>
// - Remove any remaining single '*' characters so they don't appear in HTML
function renderWithBold(text: string | undefined): React.ReactNode {
  if (!text) return null;

  // First, convert **bold** segments into a safe token with encoded content.
  // Match ** ... ** even if there are spaces around the content or newlines.
  const withBoldTokens = text.replace(/\*\*\s*([\s\S]*?)\s*\*\*/g, (_m, g1) => `@@BOLD:${encodeURIComponent(g1)}@@`);

  // Remove any leftover single asterisks so they won't show in the UI
  const withoutStars = withBoldTokens.replace(/\*/g, "");

  // Helper to render tokens: splits by @@BOLD:...@@ tokens
  function renderTokens(s: string, keyBase: string) {
    const tokenRegex = /@@BOLD:([^@]+)@@/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let idx = 0;
    while ((match = tokenRegex.exec(s)) !== null) {
      const before = s.slice(lastIndex, match.index);
      if (before) parts.push(<span key={`${keyBase}-t-${idx}-a`}>{before}</span>);
      const decoded = decodeURIComponent(match[1]);
      parts.push(
        <strong key={`${keyBase}-t-${idx}-b`} className="font-semibold">
          {decoded}
        </strong>
      );
      lastIndex = match.index + match[0].length;
      idx++;
    }
    const rest = s.slice(lastIndex);
    if (rest) parts.push(<span key={`${keyBase}-t-${idx}-a`}>{rest}</span>);
    return parts;
  }

  // Now split by quoted segments and make quoted parts bold as well
  const parts = withoutStars.split(/"([^"]+)"/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      // This is captured quoted text -> render tokens inside and wrap in <strong>
      return (
        <strong key={`q-${i}`} className="font-semibold">
          {renderTokens(part, `q-${i}`)}
        </strong>
      );
    }
    // Normal text: still render any bold tokens that were present
    return <span key={`q-${i}`}>{renderTokens(part, `q-${i}`)}</span>;
  });
}

export default function ChatMessage({ content, sender, timestamp, children }: ChatMessageProps) {
  const isBot = sender === "bot";
  
  // Detect simple markdown-style bullets starting with '*' or numbered lists like '1. text'
  // Also handle inline numbered lists like: "1. a 2. b 3. c" by first
  // inserting newlines before numeric markers when multiple are present.
  let normalizedContent = content;
  const inlineNumberCount = (content.match(/\d+\.\s+/g) || []).length;
  if (inlineNumberCount > 1 && !/\r?\n/.test(content)) {
    // Add newline before each numbered marker to normalize into lines
    normalizedContent = content.replace(/\s*(\d+\.\s+)/g, "\n$1");
    normalizedContent = normalizedContent.trim();
  }

  const lines = normalizedContent.split(/\r?\n/);
  const bulletLines = lines.filter((l) => /^\s*\*/.test(l));
  const numberedLines = lines.filter((l) => /^\s*\d+\.\s+/.test(l));
  const hasBullets = bulletLines.length > 0;
  const hasNumbered = numberedLines.length > 0;

  // Choose which list to render: prefer numbered lists if present
  const listLines = hasNumbered ? numberedLines : bulletLines;
  const hasList = listLines.length > 0;

  // If the content contains more than one '*' overall, strip all '*' from
  // the rendered HTML to avoid literal asterisks or markdown noise.
  const starCount = (content.match(/\*/g) || []).length;
  const shouldStripStars = starCount > 1;

  // Intro text: lines before the first list marker (if any)
  let intro = content;
  if (hasList) {
    const firstListIndex = lines.findIndex((l) => /^(\s*\*|\s*\d+\.)/.test(l));
    intro = lines.slice(0, firstListIndex).join("\n").trim();
  }
  return (
    <div 
      className={cn(
        "flex gap-3 max-w-2xl",
        isBot ? "mr-auto" : "ml-auto"
      )}
      data-testid={`message-${sender}`}
    >
      {isBot && (
        <img 
          src={chapiAvatar} 
          alt="Chapi" 
          className="w-8 h-8 rounded-full flex-shrink-0"
        />
      )}
      <div className={cn("flex flex-col gap-2", !isBot && "items-end")}>
        <div
          className={cn(
            "px-4 py-3 rounded-2xl",
            isBot 
              ? "bg-card text-card-foreground rounded-bl-sm" 
              : "bg-primary text-primary-foreground rounded-br-sm ml-auto"
          )}
        >
          {hasBullets ? (
            <div className="flex flex-col gap-3">
              {intro ? <p className="text-base whitespace-pre-wrap">{intro}</p> : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {listLines.map((raw, i) => {
                  // Remove leading marker: either '* ' or '1. '
                  let text = raw.replace(/^\s*(?:\*\s+|\d+\.\s+)/, "").trim();
                  if (shouldStripStars) text = text.replace(/\*/g, "");
                  return (
                    <div key={i} className="p-3 bg-background/60 border border-muted rounded-lg shadow-sm">
                      <p className="text-sm">{renderWithBold(text)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-base whitespace-pre-wrap">{renderWithBold(shouldStripStars ? content.replace(/\*/g, "") : content)}</p>
          )}
        </div>
        {children}
        {timestamp && (
          <span className="text-xs text-muted-foreground px-1">
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
