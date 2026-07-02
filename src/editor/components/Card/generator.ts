import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const title = node.props.title ? ` title="${node.props.title}"` : "";
  const bordered = node.props.bordered === false ? " bordered={false}" : "";
  const hoverable = node.props.hoverable ? " hoverable" : "";
  const size = node.props.size ? ` size="${node.props.size}"` : "";
  const loading = node.props.loading ? " loading" : "";
  const className = breakpointStylesCode ? ` className="${breakpointStylesCode}"` : "";

  return `<Card${title}${bordered}${hoverable}${size}${loading}${className}>
  ${childrenCode.split("\n").join("\n  ")}
</Card>`;
};

export default codeGenerator;
