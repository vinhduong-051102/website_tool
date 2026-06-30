import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const tailwindClasses = breakpointStylesCode || "";
  const src = (node.props.src as string) || "";
  const alt = (node.props.alt as string) || "";
  
  return `<img src="${src}" alt="${alt}" className="${tailwindClasses}" />`;
};
export default codeGenerator;
