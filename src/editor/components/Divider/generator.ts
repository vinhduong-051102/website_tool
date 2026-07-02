import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const type = node.props.type ? ` type="${node.props.type}"` : "";
  const orientation = node.props.orientation ? ` orientation="${node.props.orientation}"` : "";
  const dashed = node.props.dashed ? " dashed" : "";
  const plain = node.props.plain ? " plain" : "";
  const className = breakpointStylesCode ? ` className="${breakpointStylesCode}"` : "";

  const content = childrenCode ? `\n  ${childrenCode.split("\n").join("\n  ")}\n` : "";

  return `<Divider${type}${orientation}${dashed}${plain}${className}>${content}</Divider>`;
};

export default codeGenerator;
