import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  // Collect flex box specific styles from props
  const flexStyles: Record<string, any> = {
    display: "flex",
    flexDirection: node.props.direction || "row",
    justifyContent: node.props.justifyContent || "flex-start",
    alignItems: node.props.alignItems || "stretch",
    flexWrap: node.props.wrap || "nowrap",
  };

  // Add optional style properties
  if (node.props.rowGap) flexStyles.rowGap = node.props.rowGap;
  if (node.props.columnGap) flexStyles.columnGap = node.props.columnGap;
  
  const widthVal = node.props.width === "custom" ? node.props.customWidth : node.props.width;
  if (widthVal) flexStyles.width = widthVal;
  
  const heightVal = node.props.height === "custom" ? node.props.customHeight : node.props.height;
  if (heightVal) flexStyles.height = heightVal;

  if (node.props.paddingTop) flexStyles.paddingTop = node.props.paddingTop;
  if (node.props.paddingRight) flexStyles.paddingRight = node.props.paddingRight;
  if (node.props.paddingBottom) flexStyles.paddingBottom = node.props.paddingBottom;
  if (node.props.paddingLeft) flexStyles.paddingLeft = node.props.paddingLeft;

  if (node.props.marginTop) flexStyles.marginTop = node.props.marginTop;
  if (node.props.marginRight) flexStyles.marginRight = node.props.marginRight;
  if (node.props.marginBottom) flexStyles.marginBottom = node.props.marginBottom;
  if (node.props.marginLeft) flexStyles.marginLeft = node.props.marginLeft;

  if (node.props.backgroundColor) flexStyles.backgroundColor = node.props.backgroundColor;
  if (node.props.backgroundImage) flexStyles.backgroundImage = `url(${node.props.backgroundImage})`;
  
  if (node.props.borderStyle && node.props.borderStyle !== "none") {
    flexStyles.borderStyle = node.props.borderStyle;
    if (node.props.borderWidth) flexStyles.borderWidth = node.props.borderWidth;
    if (node.props.borderColor) flexStyles.borderColor = node.props.borderColor;
  }
  if (node.props.borderRadius) flexStyles.borderRadius = node.props.borderRadius;
  if (node.props.overflow && node.props.overflow !== "visible") flexStyles.overflow = node.props.overflow;

  // Format style object
  const styleEntries = Object.entries(flexStyles)
    .map(([k, v]) => `    ${k}: ${typeof v === "number" ? v : `"${v}"`},`)
    .join("\n");

  const styleString = `style={{\n${styleEntries}\n  }}`;
  const tailwindClasses = breakpointStylesCode || "";
  const classNameProp = tailwindClasses ? ` className="${tailwindClasses}"` : "";

  if (!childrenCode || childrenCode.trim() === "") {
    return `<div ${styleString}${classNameProp} />`;
  }

  return `<div ${styleString}${classNameProp}>
  ${childrenCode.split("\n").join("\n  ")}
</div>`;
};

export default codeGenerator;
