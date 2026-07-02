import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const gutter = node.props.gutter !== undefined ? ` gutter={${node.props.gutter}}` : "";
  const justify = node.props.justify ? ` justify="${node.props.justify}"` : "";
  const align = node.props.align ? ` align="${node.props.align}"` : "";
  const wrap = node.props.wrap === false ? " wrap={false}" : "";
  const className = breakpointStylesCode ? ` className="${breakpointStylesCode}"` : "";

  return `<Row${gutter}${justify}${align}${wrap}${className}>
  ${childrenCode.split("\n").join("\n  ")}
</Row>`;
};

export default codeGenerator;
