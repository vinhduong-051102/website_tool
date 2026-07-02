import React from "react";
import { Space } from "antd";
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

  const isEmpty = !children || React.Children.count(children) === 0;

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
    <Space
      direction={node.props.direction as any}
      size={node.props.size as any}
      align={node.props.align as any}
      wrap={Boolean(node.props.wrap)}
      style={{
        ...resolvedStyles,
        minHeight: isEmpty && !isPreviewMode ? "40px" : undefined,
      }}
      className={outlineClasses}
    >
      {isEmpty && !isPreviewMode && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-500 text-[10px] font-mono select-none">
          {isOver ? "Release to drop component!" : "Space (Drop items)"}
        </div>
      )}
      {children}
    </Space>
  );
};

export default Renderer;
