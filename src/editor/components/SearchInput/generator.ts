import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const size = node.props.size ? ` size="${node.props.size}"` : "";
  const placeholder = node.props.placeholder ? ` placeholder="${node.props.placeholder}"` : "";
  const disabled = node.props.disabled ? " disabled" : "";
  const readOnly = node.props.readOnly ? " readOnly" : "";
  const allowClear = node.props.allowClear ? " allowClear" : "";
  const enterButton = node.props.enterButton !== false ? " enterButton" : "";

  return `<Input.Search${size}${placeholder}${disabled}${readOnly}${allowClear}${enterButton} className="${breakpointStylesCode || ""}" />`;
};

export default codeGenerator;
