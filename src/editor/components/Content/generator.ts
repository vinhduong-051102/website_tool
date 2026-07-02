import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const className = breakpointStylesCode ? ` className="${breakpointStylesCode}"` : "";

  return `<Content${className}>
  ${childrenCode.split("\n").join("\n  ")}
</Content>`;
};

export default codeGenerator;
