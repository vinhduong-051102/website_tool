import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const width = node.props.width !== undefined ? ` width={${node.props.width}}` : "";
  const collapsedWidth = node.props.collapsedWidth !== undefined ? ` collapsedWidth={${node.props.collapsedWidth}}` : "";
  const collapsible = node.props.collapsible ? " collapsible" : "";
  const collapsed = node.props.collapsed !== undefined ? ` collapsed={${node.props.collapsed}}` : "";
  const defaultCollapsed = node.props.defaultCollapsed ? " defaultCollapsed" : "";
  const reverseArrow = node.props.reverseArrow ? " reverseArrow" : "";
  const breakpoint = node.props.breakpoint ? ` breakpoint="${node.props.breakpoint}"` : "";
  const theme = node.props.theme ? ` theme="${node.props.theme}"` : "";
  const className = breakpointStylesCode ? ` className="${breakpointStylesCode}"` : "";

  return `<Sider${width}${collapsedWidth}${collapsible}${collapsed}${defaultCollapsed}${reverseArrow}${breakpoint}${theme}${className}>
  ${childrenCode.split("\n").join("\n  ")}
</Sider>`;
};

export default codeGenerator;
