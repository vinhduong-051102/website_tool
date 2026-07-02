import React from "react";
import { Col } from "antd";
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
    <Col
      span={node.props.span !== undefined ? Number(node.props.span) : undefined}
      offset={node.props.offset !== undefined ? Number(node.props.offset) : undefined}
      order={node.props.order !== undefined ? Number(node.props.order) : undefined}
      push={node.props.push !== undefined ? Number(node.props.push) : undefined}
      pull={node.props.pull !== undefined ? Number(node.props.pull) : undefined}
      flex={node.props.flex !== undefined ? (node.props.flex as any) : undefined}
      xs={node.props.xs !== undefined ? Number(node.props.xs) : undefined}
      sm={node.props.sm !== undefined ? Number(node.props.sm) : undefined}
      md={node.props.md !== undefined ? Number(node.props.md) : undefined}
      lg={node.props.lg !== undefined ? Number(node.props.lg) : undefined}
      xl={node.props.xl !== undefined ? Number(node.props.xl) : undefined}
      xxl={node.props.xxl !== undefined ? Number(node.props.xxl) : undefined}
      style={{
        ...resolvedStyles,
        minHeight: isEmpty && !isPreviewMode ? "50px" : undefined,
      }}
      className={outlineClasses}
    >
      {isEmpty && !isPreviewMode && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-500 text-[10px] font-mono select-none">
          {isOver ? "Release to drop component!" : "Col (Drop here)"}
        </div>
      )}
      {children}
    </Col>
  );
};

export default Renderer;
