import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const tailwindClasses = breakpointStylesCode || "";
  const text = node.props.text || "";
  
  return `<span className="${tailwindClasses}">
  ${text}
</span>`;
};
export default codeGenerator;
