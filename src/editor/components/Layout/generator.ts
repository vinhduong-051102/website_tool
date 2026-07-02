import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const hasSider = node.props.hasSider ? " hasSider" : "";
  const className = breakpointStylesCode ? ` className="${breakpointStylesCode}"` : "";

  return `<Layout${hasSider}${className}>
  ${childrenCode.split("\n").join("\n  ")}
</Layout>`;
};

export default codeGenerator;
