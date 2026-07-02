import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const span = node.props.span !== undefined ? ` span={${node.props.span}}` : "";
  const offset = node.props.offset !== undefined && node.props.offset !== 0 ? ` offset={${node.props.offset}}` : "";
  const order = node.props.order !== undefined && node.props.order !== 0 ? ` order={${node.props.order}}` : "";
  const push = node.props.push !== undefined && node.props.push !== 0 ? ` push={${node.props.push}}` : "";
  const pull = node.props.pull !== undefined && node.props.pull !== 0 ? ` pull={${node.props.pull}}` : "";
  const flex = node.props.flex ? ` flex="${node.props.flex}"` : "";

  // Responsive attributes
  const xs = node.props.xs !== undefined ? ` xs={${node.props.xs}}` : "";
  const sm = node.props.sm !== undefined ? ` sm={${node.props.sm}}` : "";
  const md = node.props.md !== undefined ? ` md={${node.props.md}}` : "";
  const lg = node.props.lg !== undefined ? ` lg={${node.props.lg}}` : "";
  const xl = node.props.xl !== undefined ? ` xl={${node.props.xl}}` : "";
  const xxl = node.props.xxl !== undefined ? ` xxl={${node.props.xxl}}` : "";

  const className = breakpointStylesCode ? ` className="${breakpointStylesCode}"` : "";

  return `<Col${span}${offset}${order}${push}${pull}${flex}${xs}${sm}${md}${lg}${xl}${xxl}${className}>
  ${childrenCode.split("\n").join("\n  ")}
</Col>`;
};

export default codeGenerator;
