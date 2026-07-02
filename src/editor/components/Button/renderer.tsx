import React from "react";
import { Button } from "antd";
import { ASTNode } from "../../types";
import { getResolvedStyles } from "../../utils/styles";
import { useEditorStore } from "../../store/useEditorStore";

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

  // Extract props and trigger events
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
    icon = "",
    href = "",
    target = "",
    triggerEvent,
  } = node.props as any;

  const handleClick = (e: React.MouseEvent) => {
    if (triggerEvent) {
      triggerEvent("onClick", e);
    }
  };

  return (
    <Button
      type={type as any}
      size={size as any}
      danger={Boolean(danger)}
      ghost={Boolean(ghost)}
      block={Boolean(block)}
      disabled={Boolean(disabled)}
      loading={Boolean(loading)}
      shape={shape as any}
      href={href || undefined}
      target={target || undefined}
      onClick={handleClick}
      style={resolvedStyles}
      className={`transition-all duration-150 ${
        isSelected
          ? "outline-2 outline-blue-500 outline-solid ring-4 ring-blue-500/10 z-10"
          : isHovered
          ? "outline-1 outline-blue-400 outline-dashed z-10"
          : ""
      }`}
    >
      {text}
    </Button>
  );
};

export default Renderer;
