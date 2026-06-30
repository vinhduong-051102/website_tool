import React from "react";
import { ASTNode } from "../../types";
import { useEditorStore } from "../../store/useEditorStore";
import { getResolvedStyles } from "../../utils/styles";

export const Renderer = ({
  node,
  isSelected,
  isHovered,
}: {
  node: ASTNode;
  isSelected: boolean;
  isHovered: boolean;
}) => {
  const activeBreakpoint = useEditorStore((state) => state.activeBreakpoint);
  const resolvedStyles = getResolvedStyles(node, activeBreakpoint);

  return (
    <button
      style={resolvedStyles}
      className={`transition-all duration-150 active:scale-[0.98] ${
        isSelected
          ? "outline-2 outline-blue-500 outline-solid ring-4 ring-blue-500/10 z-10"
          : isHovered
          ? "outline-1 outline-blue-400 outline-dashed z-10"
          : ""
      }`}
    >
      {(node.props.text as string) || "Button"}
    </button>
  );
};
export default Renderer;
