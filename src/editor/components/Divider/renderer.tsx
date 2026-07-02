import React from "react";
import { Divider } from "antd";
import { ASTNode } from "../../types";
import { useEditorStore } from "../../store/useEditorStore";
import { getResolvedStyles } from "../../utils/styles";

export const Renderer = ({
  node,
  isSelected,
  isHovered,
  isOver = false,
  children,
}: {
  node: ASTNode;
  isSelected: boolean;
  isHovered: boolean;
  isOver?: boolean;
  children?: React.ReactNode;
}) => {
  const activeBreakpoint = useEditorStore((state) => state.activeBreakpoint);
  const isPreviewMode = useEditorStore((state) => state.isPreviewMode);
  const resolvedStyles = getResolvedStyles(node, activeBreakpoint);

  const outlineClasses = !isPreviewMode
    ? `relative transition-all duration-150 ${
        isSelected
          ? "outline-2 outline-blue-500 outline-solid ring-4 ring-blue-500/10 z-10"
          : isOver
          ? "outline-2 outline-green-500 outline-solid ring-4 ring-green-500/20 z-10 bg-green-500/5"
          : isHovered
          ? "outline-1 outline-blue-400 outline-dashed z-10"
          : ""
      }`
    : "";

  return (
    <div className={outlineClasses} style={{ display: node.props.type === "vertical" ? "inline-block" : "block" }}>
      <Divider
        type={node.props.type as any}
        orientation={node.props.orientation as any}
        dashed={Boolean(node.props.dashed)}
        plain={Boolean(node.props.plain)}
        style={{
          ...resolvedStyles,
          margin: 0,
        }}
      >
        {children}
      </Divider>
    </div>
  );
};

export default Renderer;
