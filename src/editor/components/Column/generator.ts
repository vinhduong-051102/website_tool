import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const tailwindClasses = breakpointStylesCode || "";
  
  return `<div className="${tailwindClasses}">
  ${childrenCode}
</div>`;
};
export default codeGenerator;
