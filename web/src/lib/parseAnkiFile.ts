export interface ParsedCard {
  front: string;
  back: string;
}

export interface ParseResult {
  cards: ParsedCard[];
  delimiter: string;
  skipped: number;
}

// Anki exports use tab, semicolon, or comma as delimiters.
// Lines starting with # are comments. Empty lines are skipped.
// Each line must have exactly two fields: front and back.

function detectDelimiter(line: string): string {
  if (line.includes("\t")) return "\t";
  if (line.includes(";")) return ";";
  return ",";
}

export function parseAnkiFile(content: string): ParseResult {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  if (lines.length === 0) {
    return { cards: [], delimiter: "", skipped: 0 };
  }

  const delimiter = detectDelimiter(lines[0]);
  const cards: ParsedCard[] = [];
  let skipped = 0;

  for (const line of lines) {
    const parts = line.split(delimiter);
    if (parts.length < 2) {
      skipped++;
      continue;
    }

    const front = parts[0].trim();
    const back  = parts.slice(1).join(delimiter).trim(); // back may contain the delimiter

    if (!front || !back) {
      skipped++;
      continue;
    }

    cards.push({ front, back });
  }

  return { cards, delimiter, skipped };
}