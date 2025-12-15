import React from 'react';

interface AiResponseTextProps {
  text: string;
  className?: string;
}

/**
 * Renders AI response text with proper formatting:
 * - Splits paragraphs properly
 * - Handles numbered lists (1. 2. 3.)
 * - Handles line breaks within paragraphs
 * - Renders clean, readable text without markdown artifacts
 */
const AiResponseText: React.FC<AiResponseTextProps> = ({ text, className = '' }) => {
  // Split text into paragraphs (double newline or single newline followed by number)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());

  const renderParagraph = (paragraph: string, index: number) => {
    // Check if this looks like a numbered list item
    const numberedMatch = paragraph.match(/^(\d+)\.\s*(.+)$/s);
    if (numberedMatch) {
      const [, number, content] = numberedMatch;
      return (
        <div key={index} className="flex gap-2 my-1">
          <span className="text-indigo-600 font-semibold shrink-0">{number}.</span>
          <span>{content.trim()}</span>
        </div>
      );
    }

    // Check if paragraph contains multiple numbered items on separate lines
    const lines = paragraph.split('\n').filter(l => l.trim());
    const hasNumberedLines = lines.some(l => /^\d+\.\s/.test(l.trim()));

    if (hasNumberedLines && lines.length > 1) {
      return (
        <div key={index} className="space-y-1 my-2">
          {lines.map((line, lineIdx) => {
            const lineMatch = line.trim().match(/^(\d+)\.\s*(.+)$/);
            if (lineMatch) {
              const [, num, content] = lineMatch;
              return (
                <div key={lineIdx} className="flex gap-2">
                  <span className="text-indigo-600 font-semibold shrink-0">{num}.</span>
                  <span>{content.trim()}</span>
                </div>
              );
            }
            return <p key={lineIdx}>{line.trim()}</p>;
          })}
        </div>
      );
    }

    // Regular paragraph - handle single line breaks as spaces or soft breaks
    const cleanedParagraph = paragraph
      .split('\n')
      .map(l => l.trim())
      .join(' ')
      .trim();

    return (
      <p key={index} className="my-1.5 first:mt-0 last:mb-0">
        {cleanedParagraph}
      </p>
    );
  };

  return (
    <div className={`text-sm leading-relaxed ${className}`}>
      {paragraphs.map((para, idx) => renderParagraph(para, idx))}
    </div>
  );
};

export default AiResponseText;
