import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const tailwindClasses = breakpointStylesCode || "";
  
  if (!childrenCode || childrenCode.trim() === "") {
    return `<div className="${tailwindClasses}" />`;
  }
  
  return `<div className="${tailwindClasses}">
  ${childrenCode.split("\n").join("\n  ")}
</div>`;
};
export default codeGenerator;
