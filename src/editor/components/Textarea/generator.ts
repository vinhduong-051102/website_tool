import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const placeholder = node.props.placeholder ? ` placeholder="${node.props.placeholder}"` : "";
  const disabled = node.props.disabled ? " disabled" : "";
  const readOnly = node.props.readOnly ? " readOnly" : "";
  const allowClear = node.props.allowClear ? " allowClear" : "";
  const rows = node.props.rows !== undefined ? ` rows={${node.props.rows}}` : "";

  return `<Input.TextArea${placeholder}${disabled}${readOnly}${allowClear}${rows} className="${breakpointStylesCode || ""}" />`;
};

export default codeGenerator;
