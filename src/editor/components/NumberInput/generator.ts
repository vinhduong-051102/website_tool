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
  const min = node.props.min !== undefined ? ` min={${node.props.min}}` : "";
  const max = node.props.max !== undefined ? ` max={${node.props.max}}` : "";
  const step = node.props.step !== undefined ? ` step={${node.props.step}}` : "";

  return `<InputNumber${size}${placeholder}${disabled}${readOnly}${min}${max}${step} style={{ width: "100%" }} className="${breakpointStylesCode || ""}" />`;
};

export default codeGenerator;
