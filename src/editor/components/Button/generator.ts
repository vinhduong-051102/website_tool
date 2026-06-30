import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const tailwindClasses = breakpointStylesCode || "";
  const text = node.props.text || "Button";
  
  return `<button className="${tailwindClasses}">
  ${text}
</button>`;
};
export default codeGenerator;
