import React, { useMemo } from "react";
import { ASTNode } from "../types";
import { getComponent } from "../components/registry";
import { useSelection } from "../hooks/useSelection";
import { useHover } from "../hooks/useHover";
import { useDrag } from "../hooks/useDrag";
import { useDrop } from "../hooks/useDrop";
import { useEditorStore } from "../store/useEditorStore";
import { useGlobalState } from "../state/useGlobalState";
import { useBindings } from "../bindings/useBindings";
import { useRuntime } from "../runtime/useRuntime";
import { handleComponentEvent } from "../event-engine/EventEngine";

interface ASTRendererProps {
  node: ASTNode;
}

export const ASTRenderer: React.FC<ASTRendererProps> = ({ node }) => {
  const isPreviewMode = useEditorStore((state) => state.isPreviewMode);

  // Hook up design-time behaviors (disabled in preview mode)
  const { isSelected, select } = useSelection(node.id);
  const { isHovered, onMouseEnter, onMouseLeave } = useHover(node.id);
  const { setNodeRef: setDragRef, attributes, listeners, isDragging } = useDrag(node.id);
  const { setNodeRef: setDropRef, isOver } = useDrop(node.id);

  // Hook up data binding (merges bound state values into props)
  const resolvedProps = useBindings(node);

  // Hook up event execution
  const { createRuntimeContext } = useRuntime();

  const triggerEvent = React.useCallback((eventName: string, nativeEvent?: any) => {
    const ctx = createRuntimeContext(node.id, eventName, nativeEvent);
    handleComponentEvent(node, eventName, ctx);
  }, [node, createRuntimeContext]);

  // Resolve runtime visibility from global state
  const isVisible = useGlobalState((state) => {
    const visibility = state.data.visibility as Record<string, boolean> | undefined;
    return visibility?.[node.id] !== false; // defaults to visible
  });

  // Dynamically map events in preview mode
  const runtimeHandlers = useMemo(() => {
    if (!isPreviewMode || !node.events) return {};
    const handlers: Record<string, (e: React.SyntheticEvent) => void> = {};
    for (const eventConfig of node.events) {
      const eventName = eventConfig.event;
      handlers[eventName] = (e) => {
        // Prevent default/propagation if appropriate
        if (eventName === "onClick") {
          e.stopPropagation();
          if (node.type === "Button") {
            e.preventDefault();
          }
        }
        triggerEvent(eventName, e.nativeEvent);
      };
    }
    return handlers;
  }, [isPreviewMode, node, triggerEvent]);

  const componentDef = getComponent(node.type);
  if (!componentDef) {
    console.warn(`Component type "${node.type}" is not registered.`);
    return null;
  }

  // If hidden and in preview mode, don't render it at all
  if (!isVisible && isPreviewMode) {
    return null;
  }

  // Combine drag and drop refs to apply on the actual component's DOM node (only in design mode)
  const setCombinedRef = React.useCallback((el: HTMLElement | null) => {
    if (isPreviewMode) return;
    if (el && el.firstElementChild) {
      const child = el.firstElementChild as HTMLElement;
      setDragRef(child);
      setDropRef(child);
    } else {
      setDragRef(el);
      setDropRef(el);
    }
  }, [isPreviewMode, setDragRef, setDropRef]);

  // Render children recursively
  const childrenElements = node.children && node.children.length > 0
    ? node.children.map((child) => (
        <ASTRenderer key={child.id} node={child} />
      ))
    : undefined;

  const RendererComponent = componentDef.renderer;

  // Resolve visual highlight indicators (hidden in preview mode)
  const showSelected = isPreviewMode ? false : isSelected;
  const showHovered = isPreviewMode ? false : isHovered;
  const showOver = isPreviewMode ? false : isOver;

  // Apply design-time visual hint (faded opacity) for hidden components
  const designTimeStyles = !isVisible && !isPreviewMode ? { opacity: 0.4, border: "1px dashed #ef4444" } : undefined;

  const componentElement = (
    <RendererComponent
      node={{
        ...node,
        props: {
          ...resolvedProps,
          triggerEvent: isPreviewMode ? triggerEvent : undefined,
        }
      }}
      isSelected={showSelected}
      isHovered={showHovered}
      isOver={showOver}
    >
      {childrenElements}
    </RendererComponent>
  );

  return (
    <div
      ref={isPreviewMode ? undefined : setCombinedRef}
      {...(isPreviewMode ? runtimeHandlers : {
        onClick: select,
        onMouseEnter,
        onMouseLeave,
      })}
      style={{ display: "contents" }}
      data-node-id={node.id}
      data-dragging={isPreviewMode ? undefined : (isDragging ? "true" : "false")}
      {...(isPreviewMode ? {} : attributes)}
      {...(isPreviewMode ? {} : listeners)}
    >
      {!isVisible && !isPreviewMode ? (
        <div style={designTimeStyles} className="relative after:content-['Hidden'] after:absolute after:top-0 after:right-0 after:bg-red-500 after:text-white after:text-[9px] after:px-1 after:rounded after:font-mono after:z-30">
          {componentElement}
        </div>
      ) : (
        componentElement
      )}
    </div>
  );
};

export default ASTRenderer;
