// Turns stored card text into plain text with real line breaks, so the study
// screen can render it with `whitespace-pre-line`.
//
// Card text arrives in two shapes:
// - Anki exports with HTML (`<br>`, `<div>`, `<b>`, `&nbsp;`...).
// - Multiple-choice cards written as "Question | A) ... | B) ..." or
//   "Question (A) ... (B) ...".
//
// We never render the HTML: block tags become line breaks, known formatting
// tags are dropped, and anything else (e.g. "<ip>:<port>") is kept as text.

const LINE_BREAK_TAGS = /<br\s*\/?>|<\/?(?:div|p|li|ul|ol|tr|table|tbody|thead|blockquote|pre|h[1-6])\b[^>]*>/gi;
const INLINE_TAGS = /<\/?(?:b|i|u|em|strong|span|sup|sub|code|font|a|small|mark|s|td|th)\b[^>]*>/gi;
const OPTION_SEPARATOR = /\s+\|\s+(?=[A-Ea-e]\))/g;
// "(A)" alone may be ordinary prose, so we only split when "(A)" and "(B)" both appear.
const PAREN_OPTION = /\s+(?=\([A-E]\)\s)/g;
const HAS_PAREN_OPTIONS = /\(A\)[\s\S]*\(B\)/;

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&amp;": "&", // last, so "&amp;lt;" becomes "&lt;" and not "<"
};

export function formatCardText(text: string): string {
  let result = text
    .replace(LINE_BREAK_TAGS, "\n")
    .replace(INLINE_TAGS, "")
    .replace(OPTION_SEPARATOR, "\n");

  if (HAS_PAREN_OPTIONS.test(result)) {
    result = result.replace(PAREN_OPTION, "\n");
  }

  for (const [entity, char] of Object.entries(ENTITIES)) {
    result = result.split(entity).join(char);
  }

  return result
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n") // at most one blank line in a row
    .trim();
}
