import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const tailwindClasses = breakpointStylesCode || "";
  const text = (node.props.text as string) || "";
  
  return `<p className="${tailwindClasses}">
  ${text}
</p>`;
};
export default codeGenerator;
