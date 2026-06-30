import React from "react";
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
  const resolvedStyles = getResolvedStyles(node, activeBreakpoint);

  // Map flex props to styles
  const flexStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: (node.props.direction || "row") as any,
    justifyContent: (node.props.justifyContent || "flex-start") as any,
    alignItems: (node.props.alignItems || "stretch") as any,
    flexWrap: (node.props.wrap || "nowrap") as any,
    rowGap: (node.props.rowGap || undefined) as any,
    columnGap: (node.props.columnGap || undefined) as any,
    width: (node.props.width === "custom" ? node.props.customWidth : node.props.width) as any,
    height: (node.props.height === "custom" ? node.props.customHeight : node.props.height) as any,
    paddingTop: node.props.paddingTop as any,
    paddingRight: node.props.paddingRight as any,
    paddingBottom: node.props.paddingBottom as any,
    paddingLeft: node.props.paddingLeft as any,
    marginTop: node.props.marginTop as any,
    marginRight: node.props.marginRight as any,
    marginBottom: node.props.marginBottom as any,
    marginLeft: node.props.marginLeft as any,
    backgroundColor: (node.props.backgroundColor || "transparent") as any,
    backgroundImage: node.props.backgroundImage ? `url(${node.props.backgroundImage})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
    borderWidth: (node.props.borderWidth || undefined) as any,
    borderStyle: (node.props.borderStyle || "none") as any,
    borderColor: (node.props.borderColor || undefined) as any,
    borderRadius: (node.props.borderRadius || undefined) as any,
    overflow: (node.props.overflow || "visible") as any,
  };

  const combinedStyles = {
    ...flexStyles,
    ...resolvedStyles,
  };

  const isEmpty = !children || React.Children.count(children) === 0;

  return (
    <div
      style={combinedStyles}
      className={`relative transition-all duration-150 ${
        isSelected
          ? "outline-2 outline-blue-500 outline-solid ring-4 ring-blue-500/10 z-10"
          : isOver
          ? "outline-2 outline-green-500 outline-solid ring-4 ring-green-500/20 z-10 bg-green-500/5"
          : isHovered
          ? "outline-1 outline-blue-400 outline-dashed z-10"
          : ""
      }`}
    >
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-500 text-xs font-mono select-none min-h-[80px]">
          {isOver ? "Release to drop!" : "Flex Layout Container"}
        </div>
      )}
      {children}
    </div>
  );
};

export default Renderer;
