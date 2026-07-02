import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const vertical = node.props.vertical ? " vertical" : "";
  const justify = node.props.justify ? ` justify="${node.props.justify}"` : "";
  const align = node.props.align ? ` align="${node.props.align}"` : "";
  const wrap = node.props.wrap ? ` wrap="${node.props.wrap}"` : "";
  const gap = node.props.gap ? ` gap="${node.props.gap}"` : "";
  const flex = node.props.flex ? ` flex="${node.props.flex}"` : "";
  const className = breakpointStylesCode ? ` className="${breakpointStylesCode}"` : "";

  return `<Flex${vertical}${justify}${align}${wrap}${gap}${flex}${className}>
  ${childrenCode.split("\n").join("\n  ")}
</Flex>`;
};

export default codeGenerator;
