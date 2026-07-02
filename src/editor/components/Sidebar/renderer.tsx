import React from "react";
import { Layout } from "antd";
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
    <Layout.Sider
      width={node.props.width !== undefined ? Number(node.props.width) : 200}
      collapsedWidth={node.props.collapsedWidth !== undefined ? Number(node.props.collapsedWidth) : 80}
      collapsible={Boolean(node.props.collapsible)}
      collapsed={Boolean(node.props.collapsed)}
      defaultCollapsed={Boolean(node.props.defaultCollapsed)}
      reverseArrow={Boolean(node.props.reverseArrow)}
      breakpoint={node.props.breakpoint as any}
      theme={node.props.theme as any}
      style={{
        ...resolvedStyles,
      }}
      className={outlineClasses}
    >
      {isEmpty && !isPreviewMode && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-500 text-[10px] font-mono select-none">
          {isOver ? "Release to drop component!" : "Sider Region (Drop here)"}
        </div>
      )}
      {children}
    </Layout.Sider>
  );
};

export default Renderer;
