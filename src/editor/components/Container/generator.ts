import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const isVertical = node.styles?.desktop?.flexDirection === "column";
  const verticalAttr = isVertical ? " vertical" : "";
  const className = breakpointStylesCode ? ` className="${breakpointStylesCode}"` : "";

  return `<Flex${verticalAttr}${className}>
  ${childrenCode.split("\n").join("\n  ")}
</Flex>`;
};

export default codeGenerator;
