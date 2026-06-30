import React from "react";
import { ASTNode } from "../types";
import { getComponent } from "../components/registry";
import { useSelection } from "../hooks/useSelection";
import { useHover } from "../hooks/useHover";
import { useDrag } from "../hooks/useDrag";
import { useDrop } from "../hooks/useDrop";

interface ASTRendererProps {
  node: ASTNode;
}

export const ASTRenderer: React.FC<ASTRendererProps> = ({ node }) => {
  // Hook up event behaviors
  const { isSelected, select } = useSelection(node.id);
  const { isHovered, onMouseEnter, onMouseLeave } = useHover(node.id);
  const { setNodeRef: setDragRef, attributes, listeners, isDragging } = useDrag(node.id);
  const { setNodeRef: setDropRef, isOver } = useDrop(node.id);

  const componentDef = getComponent(node.type);
  if (!componentDef) {
    console.warn(`Component type "${node.type}" is not registered.`);
    return null;
  }

  // Combine drag and drop refs to apply on the actual component's DOM node
  const setCombinedRef = (el: HTMLElement | null) => {
    if (el && el.firstElementChild) {
      const child = el.firstElementChild as HTMLElement;
      setDragRef(child);
      setDropRef(child);
    } else {
      setDragRef(el);
      setDropRef(el);
    }
  };

  // Render children recursively
  const childrenElements = node.children && node.children.length > 0
    ? node.children.map((child) => (
        <ASTRenderer key={child.id} node={child} />
      ))
    : undefined;

  const RendererComponent = componentDef.renderer;

  return (
    <div
      ref={setCombinedRef}
      onClick={select}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ display: "contents" }}
      data-node-id={node.id}
      data-dragging={isDragging ? "true" : "false"}
      {...attributes}
      {...listeners}
    >
      <RendererComponent
        node={node}
        isSelected={isSelected}
        isHovered={isHovered}
        isOver={isOver}
      >
        {childrenElements}
      </RendererComponent>
    </div>
  );
};

export default ASTRenderer;
