import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const className = breakpointStylesCode ? ` className="${breakpointStylesCode}"` : "";

  return `<Footer${className}>
  ${childrenCode.split("\n").join("\n  ")}
</Footer>`;
};

export default codeGenerator;
