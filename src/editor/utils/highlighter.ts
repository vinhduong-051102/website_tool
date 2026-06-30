export const highlightJSX = (code: string): string => {
  // 1. Escape HTML characters first
  let escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Extract and mask all string literals
  const stringLiterals: string[] = [];
  escaped = escaped.replace(
    /(&quot;.*?&quot;|&apos;.*?&apos;|".*?"|'.*?')/g,
    (match) => {
      const placeholder = `__STR_PLACEHOLDER_${stringLiterals.length}__`;
      stringLiterals.push(match);
      return placeholder;
    }
  );

  // 3. Highlight JSX Attributes (words followed by =)
  escaped = escaped.replace(
    /\b([a-zA-Z0-9_-]+)(?=\=)/g,
    '<span style="color: #d19a66;">$1</span>'
  );

  // 4. Highlight JS/TS Keywords
  const keywords = [
    "import",
    "export",
    "default",
    "function",
    "return",
    "from",
    "const",
    "let",
    "var",
    "true",
    "false",
    "null",
  ];
  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b(${keyword})\\b`, "g");
    escaped = escaped.replace(
      regex,
      '<span style="color: #c678dd;">$1</span>'
    );
  });

  // 5. Highlight XML/JSX Tags
  escaped = escaped.replace(
    /(&lt;\/?[a-zA-Z0-9_.-]+)/g,
    '<span style="color: #e06c75;">$1</span>'
  );
  escaped = escaped.replace(
    /(&gt;)/g,
    '<span style="color: #e06c75;">$1</span>'
  );

  // 6. Restore the string literals wrapped in string styling
  stringLiterals.forEach((str, index) => {
    escaped = escaped.replace(
      `__STR_PLACEHOLDER_${index}__`,
      `<span style="color: #98c379;">${str}</span>`
    );
  });

  return escaped;
};
