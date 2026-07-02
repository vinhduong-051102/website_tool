import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const direction = node.props.direction ? ` direction="${node.props.direction}"` : "";
  const size = node.props.size ? ` size="${node.props.size}"` : "";
  const align = node.props.align ? ` align="${node.props.align}"` : "";
  const wrap = node.props.wrap ? " wrap" : "";
  const className = breakpointStylesCode ? ` className="${breakpointStylesCode}"` : "";

  return `<Space${direction}${size}${align}${wrap}${className}>
  ${childrenCode.split("\n").join("\n  ")}
</Space>`;
};

export default codeGenerator;
