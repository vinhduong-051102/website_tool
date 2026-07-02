import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const className = breakpointStylesCode ? ` className="${breakpointStylesCode}"` : "";

  return `<Header${className}>
  ${childrenCode.split("\n").join("\n  ")}
</Header>`;
};

export default codeGenerator;
