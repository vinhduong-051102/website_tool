import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const tailwindClasses = breakpointStylesCode || "";
  const {
    text = "Button",
    type = "default",
    size = "middle",
    danger = false,
    ghost = false,
    block = false,
    disabled = false,
    loading = false,
    shape = "default",
    href = "",
    target = "",
  } = node.props;

  const propStrings: string[] = [];
  if (type && type !== "default") propStrings.push(`type="${type}"`);
  if (size && size !== "middle") propStrings.push(`size="${size}"`);
  if (shape && shape !== "default") propStrings.push(`shape="${shape}"`);
  if (danger) propStrings.push("danger");
  if (ghost) propStrings.push("ghost");
  if (block) propStrings.push("block");
  if (disabled) propStrings.push("disabled");
  if (loading) propStrings.push("loading");
  if (href) propStrings.push(`href="${href}"`);
  if (target) propStrings.push(`target="${target}"`);
  if (tailwindClasses) propStrings.push(`className="${tailwindClasses}"`);

  return `<Button ${propStrings.join(" ")}>
  ${text}
</Button>`;
};

export default codeGenerator;
