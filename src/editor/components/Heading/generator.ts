import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const tailwindClasses = breakpointStylesCode || "";
  const tag = (node.props.tag as string) || "h2";
  const text = (node.props.text as string) || "";
  
  return `<${tag} className="${tailwindClasses}">
  ${text}
</${tag}>`;
};
export default codeGenerator;
