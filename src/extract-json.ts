/**
 * Extract JSON from model response using a tolerant parser.
 * Removes common wrappers such as markdown fences or variable declarations.
 */
export function extractJson(text: string): string {
  let content = text.trim();

  // Strip ```json or ``` fences
  const fenceMatch = /```(?:json)?\s*([\s\S]*?)\s*```/i.exec(content);
  if (fenceMatch) {
    content = fenceMatch[1];
  }

  // Strip variable declarations like `const foo =` or `let foo =`
  const varMatch = /^\s*(?:const|let|var)\s+\w+\s*=\s*([\s\S]*)/i.exec(content);
  if (varMatch) {
    content = varMatch[1];
    // Remove trailing semicolon if present
    if (content.trim().endsWith(';')) {
      content = content.trim().slice(0, -1);
    }
  }

  // Find the first opening bracket
  const firstObj = content.indexOf('{');
  const firstArr = content.indexOf('[');
  if (firstObj === -1 && firstArr === -1) {
    return text;
  }
  const start =
    firstArr === -1
      ? firstObj
      : firstObj === -1
        ? firstArr
        : Math.min(firstObj, firstArr);
  content = content.slice(start);

  // Try to parse the entire string
  try {
    const parsed = JSON.parse(content) as unknown;
    return JSON.stringify(parsed);
  } catch {
    // Continue with more lenient parsing
  }

  // Find valid JSON boundaries by tracking nesting depth
  const openChar = content[0];
  const closeChar = openChar === '{' ? '}' : ']';

  const closingPositions: number[] = [];
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !inString) {
      inString = true;
      continue;
    }

    if (char === '"' && inString) {
      inString = false;
      continue;
    }

    // Skip content inside strings
    if (inString) continue;

    if (char === openChar) {
      depth++;
    } else if (char === closeChar) {
      depth--;
      if (depth === 0) {
        closingPositions.push(i + 1);
      }
    }
  }

  // Try parsing at each valid closing position, starting from the end
  for (let i = closingPositions.length - 1; i >= 0; i--) {
    try {
      const attempt = content.slice(0, closingPositions[i]);
      const parsed = JSON.parse(attempt) as unknown;
      return JSON.stringify(parsed);
    } catch {
      // Continue trying
    }
  }

  return text;
}
