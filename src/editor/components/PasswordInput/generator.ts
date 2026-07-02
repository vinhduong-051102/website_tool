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

  return `<Input.Password${size}${placeholder}${disabled}${readOnly}${allowClear} className="${breakpointStylesCode || ""}" />`;
};

export default codeGenerator;
