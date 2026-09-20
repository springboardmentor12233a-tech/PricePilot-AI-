import React from 'react';

// Re-export utility functions from chatUtils.js
export {
  extractAssistantText,
  generateMessageId,
  formatMessageTime,
  sanitizeContext,
} from './chatUtils.js';

/**
 * Professional, safe Markdown-to-React parser
 * Renders headers, lists (bullet, numbered), bold, italics, inline code, and code blocks
 * WITHOUT using dangerouslySetInnerHTML, completely preventing XSS injection.
 */
export function renderMarkdown(content = '') {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockContent = [];
  let codeBlockLang = '';
  let inList = false;
  let listItems = [];
  let listType = 'ul'; // 'ul' or 'ol'

  const flushList = () => {
    if (inList && listItems.length > 0) {
      if (listType === 'ol') {
        elements.push(
          <ol key={`ol-${elements.length}`} className="my-2 pl-5 list-decimal space-y-1 text-xs sm:text-sm text-[#334155]">
            {listItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed">{parseInlineMarkdown(item)}</li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="my-2 pl-5 list-disc space-y-1 text-xs sm:text-sm text-[#334155]">
            {listItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed">{parseInlineMarkdown(item)}</li>
            ))}
          </ul>
        );
      }
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check for code block fence ```
    if (trimmed.startsWith('```')) {
      flushList();
      if (inCodeBlock) {
        // Close code block
        elements.push(
          <div key={`code-${elements.length}`} className="my-2.5 rounded-lg bg-[#0F172A] text-[#F8FAFC] p-3 text-xs font-mono overflow-x-auto border border-[#334155]">
            {codeBlockLang && (
              <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1 font-semibold">
                {codeBlockLang}
              </div>
            )}
            <pre className="whitespace-pre-wrap">{codeBlockContent.join('\n')}</pre>
          </div>
        );
        inCodeBlock = false;
        codeBlockContent = [];
        codeBlockLang = '';
      } else {
        // Open code block
        inCodeBlock = true;
        codeBlockLang = trimmed.replace(/^```/, '').trim();
        codeBlockContent = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(rawLine);
      continue;
    }

    // Empty line separates paragraphs
    if (!trimmed) {
      flushList();
      continue;
    }

    // Headings
    if (trimmed.startsWith('#### ')) {
      flushList();
      elements.push(
        <h5 key={`h5-${elements.length}`} className="font-bold text-xs sm:text-sm text-[#0F172A] mt-2.5 mb-1 tracking-tight">
          {parseInlineMarkdown(trimmed.replace(/^#### /, ''))}
        </h5>
      );
      continue;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${elements.length}`} className="font-bold text-sm sm:text-base text-[#0F172A] mt-3 mb-1 tracking-tight">
          {parseInlineMarkdown(trimmed.replace(/^### /, ''))}
        </h4>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${elements.length}`} className="font-bold text-base sm:text-lg text-[#0F172A] mt-3.5 mb-1.5 tracking-tight">
          {parseInlineMarkdown(trimmed.replace(/^## /, ''))}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${elements.length}`} className="font-bold text-lg sm:text-xl text-[#0F172A] mt-4 mb-2 tracking-tight">
          {parseInlineMarkdown(trimmed.replace(/^# /, ''))}
        </h2>
      );
      continue;
    }

    // Bullet Lists (- or * or •)
    if (/^[-*•]\s+/.test(trimmed)) {
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
      }
      listItems.push(trimmed.replace(/^[-*•]\s+/, ''));
      continue;
    }

    // Numbered Lists (1. or 1))
    if (/^\d+[\.)]\s+/.test(trimmed)) {
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
      }
      listItems.push(trimmed.replace(/^\d+[\.)]\s+/, ''));
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${elements.length}`} className="text-xs sm:text-sm text-[#334155] leading-relaxed my-1.5">
        {parseInlineMarkdown(trimmed)}
      </p>
    );
  }

  flushList();

  // If unclosed code block, flush it
  if (inCodeBlock && codeBlockContent.length > 0) {
    elements.push(
      <div key={`code-${elements.length}`} className="my-2.5 rounded-lg bg-[#0F172A] text-[#F8FAFC] p-3 text-xs font-mono overflow-x-auto border border-[#334155]">
        <pre className="whitespace-pre-wrap">{codeBlockContent.join('\n')}</pre>
      </div>
    );
  }

  return elements;
}

/**
 * Parses inline bold, italic, code, and LaTeX-style math into safe React nodes
 */
function parseInlineMarkdown(text = '') {
  if (!text) return text;

  const tokens = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Match inline code: `code`
    const codeMatch = remaining.match(/`([^`]+)`/);
    // Match bold: **text** or __text__
    const boldAsteriskMatch = remaining.match(/\*\*([^*]+)\*\*/);
    const boldUnderscoreMatch = remaining.match(/__([^_]+)__/);
    // Match italic: *text* (single asterisk) or _text_ (single underscore)
    const italicAsteriskMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);
    const italicUnderscoreMatch = remaining.match(/(?<!_)_([^_]+)_(?!_)/);
    // Match math: $formula$ or $$formula$$
    const mathMatch = remaining.match(/\$\$?([^$]+)\$\$?/);

    const boldMatch = [boldAsteriskMatch, boldUnderscoreMatch]
      .filter(Boolean)
      .sort((a, b) => a.index - b.index)[0] || null;

    const italicMatch = [italicAsteriskMatch, italicUnderscoreMatch]
      .filter(Boolean)
      .sort((a, b) => a.index - b.index)[0] || null;

    // Find earliest match
    const matches = [
      codeMatch ? { type: 'code', index: codeMatch.index, len: codeMatch[0].length, val: codeMatch[1] } : null,
      boldMatch ? { type: 'bold', index: boldMatch.index, len: boldMatch[0].length, val: boldMatch[1] } : null,
      italicMatch ? { type: 'italic', index: italicMatch.index, len: italicMatch[0].length, val: italicMatch[1] } : null,
      mathMatch ? { type: 'math', index: mathMatch.index, len: mathMatch[0].length, val: mathMatch[1] } : null,
    ]
      .filter(Boolean)
      .sort((a, b) => a.index - b.index);

    if (matches.length === 0) {
      tokens.push(remaining);
      break;
    }

    const first = matches[0];
    if (first.index > 0) {
      tokens.push(remaining.substring(0, first.index));
    }

    if (first.type === 'code') {
      tokens.push(
        <code key={`inline-code-${keyIndex++}`} className="px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#2563EB] font-mono text-[11px] sm:text-xs border border-[#E2E8F0]">
          {first.val}
        </code>
      );
    } else if (first.type === 'bold') {
      tokens.push(
        <strong key={`inline-bold-${keyIndex++}`} className="font-semibold text-[#0F172A]">
          {first.val}
        </strong>
      );
    } else if (first.type === 'italic') {
      tokens.push(
        <em key={`inline-italic-${keyIndex++}`} className="italic text-[#475569]">
          {first.val}
        </em>
      );
    } else if (first.type === 'math') {
      tokens.push(
        <span key={`inline-math-${keyIndex++}`} className="px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] font-mono text-[11px] sm:text-xs border border-[#BFDBFE]">
          {first.val}
        </span>
      );
    }

    remaining = remaining.substring(first.index + first.len);
  }

  return tokens;
}
