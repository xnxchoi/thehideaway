/**
 * Converts a markdown string to HTML suitable for insertion into Lexical via $generateNodesFromDOM.
 * Handles: headings (h1-h6), blockquotes, unordered/ordered lists, horizontal rules,
 * fenced code blocks, inline code, bold, italic, strikethrough, and links.
 */
export function markdownToHtml(markdown: string): string {
  let text = markdown;

  // ── Fenced code blocks (must be protected before any other processing)
  const codeBlocks: string[] = [];
  text = text.replace(/```(\w+)?\r?\n([\s\S]*?)```/gm, (_m, lang, code) => {
    const idx = codeBlocks.length;
    const escaped = escapeHtml(code.replace(/\r?\n$/, ""));
    codeBlocks.push(
      `<pre><code${lang ? ` class="language-${lang}"` : ""}>${escaped}</code></pre>`
    );
    return `\x00CODE${idx}\x00`;
  });

  // ── Inline code (protect before inline formatting)
  const inlineCodes: string[] = [];
  text = text.replace(/`([^`\n]+)`/g, (_m, code) => {
    const idx = inlineCodes.length;
    inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
    return `\x00INLINE${idx}\x00`;
  });

  // ── Process line-by-line for block elements
  const lines = text.split(/\r?\n/);
  const output: string[] = [];
  let inUl = false;
  let inOl = false;
  let bqLines: string[] = [];

  const flushBq = () => {
    if (bqLines.length) {
      output.push(`<blockquote><p>${bqLines.join("<br />")}</p></blockquote>`);
      bqLines = [];
    }
  };
  const flushUl = () => {
    if (inUl) {
      output.push("</ul>");
      inUl = false;
    }
  };
  const flushOl = () => {
    if (inOl) {
      output.push("</ol>");
      inOl = false;
    }
  };

  for (const raw of lines) {
    const line = raw;
    const trimmed = line.trim();

    // Protected code block placeholders
    if (/^\x00CODE\d+\x00$/.test(trimmed)) {
      flushUl();
      flushOl();
      flushBq();
      output.push(trimmed);
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      flushUl();
      flushOl();
      flushBq();
      const level = headingMatch[1].length;
      output.push(`<h${level}>${applyInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushUl();
      flushOl();
      flushBq();
      output.push("<hr />");
      continue;
    }

    // Blockquote line
    const bqMatch = trimmed.match(/^>\s*(.*)/);
    if (bqMatch) {
      flushUl();
      flushOl();
      bqLines.push(applyInline(bqMatch[1]));
      continue;
    }
    if (bqLines.length && trimmed === "") {
      flushBq();
    }

    // Unordered list item
    const ulMatch = trimmed.match(/^[-*+]\s+(.*)/);
    if (ulMatch) {
      flushOl();
      flushBq();
      if (!inUl) {
        output.push("<ul>");
        inUl = true;
      }
      output.push(`<li>${applyInline(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list item
    const olMatch = trimmed.match(/^\d+\.\s+(.*)/);
    if (olMatch) {
      flushUl();
      flushBq();
      if (!inOl) {
        output.push("<ol>");
        inOl = true;
      }
      output.push(`<li>${applyInline(olMatch[1])}</li>`);
      continue;
    }

    // Empty line = end of any open block
    if (trimmed === "") {
      flushUl();
      flushOl();
      flushBq();
      output.push("");
      continue;
    }

    // Plain text — close any open list first
    flushUl();
    flushOl();
    flushBq();
    output.push(applyInline(trimmed));
  }

  // Close unclosed blocks
  flushUl();
  flushOl();
  flushBq();

  // ── Wrap consecutive non-block lines into <p> tags
  const html = wrapParagraphs(output.join("\n"));

  // ── Restore protected content
  let result = html;
  inlineCodes.forEach((code, i) => {
    result = result.replace(`\x00INLINE${i}\x00`, code);
  });
  codeBlocks.forEach((block, i) => {
    result = result.replace(`\x00CODE${i}\x00`, block);
  });

  return result;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function applyInline(text: string): string {
  // Bold + italic (must come before bold and italic)
  text = text.replace(/\*{3}(.+?)\*{3}/g, "<strong><em>$1</em></strong>");
  text = text.replace(/_{3}(.+?)_{3}/g, "<strong><em>$1</em></strong>");
  // Bold
  text = text.replace(/\*{2}(.+?)\*{2}/g, "<strong>$1</strong>");
  text = text.replace(/_{2}(.+?)_{2}/g, "<strong>$1</strong>");
  // Italic
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
  text = text.replace(/_(.+?)_/g, "<em>$1</em>");
  // Strikethrough
  text = text.replace(/~~(.+?)~~/g, "<s>$1</s>");
  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // Inline code placeholders pass through untouched
  return text;
}

function wrapParagraphs(html: string): string {
  const BLOCK_START =
    /^(<h[1-6]|<ul|<\/ul|<ol|<\/ol|<li|<blockquote|<\/blockquote|<pre|<hr|\x00CODE)/;

  const lines = html.split("\n");
  const result: string[] = [];
  let paraLines: string[] = [];

  const flushPara = () => {
    const joined = paraLines.filter(Boolean).join("<br />");
    if (joined) result.push(`<p>${joined}</p>`);
    paraLines = [];
  };

  for (const line of lines) {
    if (!line.trim()) {
      flushPara();
      continue;
    }
    if (BLOCK_START.test(line)) {
      flushPara();
      result.push(line);
    } else {
      paraLines.push(line);
    }
  }
  flushPara();
  return result.join("\n");
}
