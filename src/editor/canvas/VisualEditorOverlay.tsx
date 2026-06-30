import React, { useEffect, useState, useRef, useCallback } from "react";
import { useEditorStore } from "../store/useEditorStore";
import { findNodeById } from "../utils/ast";
import { useResize } from "../hooks/useResize";

interface VisualEditorOverlayProps {
  zoom: number;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

interface ElementBounds {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const VisualEditorOverlay: React.FC<VisualEditorOverlayProps> = ({
  zoom,
  contentRef,
}) => {
  const {
    selectedNodeIds,
    hoveredNodeId,
    pages,
    activePageId,
  } = useEditorStore();

  const selectedNodeId = selectedNodeIds[0];
  const [selectedBounds, setSelectedBounds] = useState<ElementBounds | null>(null);
  const [hoveredBounds, setHoveredBounds] = useState<ElementBounds | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Retrieve active AST root
  const activePage = pages.find((p) => p.id === activePageId);
  const rootNode = activePage?.ast;

  // Selected node metadata
  const selectedNode =
    selectedNodeId && rootNode ? findNodeById(rootNode, selectedNodeId) : null;

  const { startResize } = useResize(selectedNodeId || "");

  // Measure bounding rectangles relative to the scrolled content container
  const measureBounds = useCallback(() => {
    if (!contentRef.current) return;

    const container = contentRef.current;
    const containerRect = container.getBoundingClientRect();

    if (selectedNodeId) {
      const wrapper = container.querySelector(`[data-node-id="${selectedNodeId}"]`);
      const el = wrapper ? (wrapper.firstElementChild || wrapper) : null;
      if (el) {
        const elRect = el.getBoundingClientRect();
        setSelectedBounds({
          left: (elRect.left - containerRect.left) / zoom + container.scrollLeft,
          top: (elRect.top - containerRect.top) / zoom + container.scrollTop,
          width: elRect.width / zoom,
          height: elRect.height / zoom,
        });
      } else {
        setSelectedBounds(null);
      }
    } else {
      setSelectedBounds(null);
    }

    if (hoveredNodeId && hoveredNodeId !== selectedNodeId) {
      const wrapper = container.querySelector(`[data-node-id="${hoveredNodeId}"]`);
      const el = wrapper ? (wrapper.firstElementChild || wrapper) : null;
      if (el) {
        const elRect = el.getBoundingClientRect();
        setHoveredBounds({
          left: (elRect.left - containerRect.left) / zoom + container.scrollLeft,
          top: (elRect.top - containerRect.top) / zoom + container.scrollTop,
          width: elRect.width / zoom,
          height: elRect.height / zoom,
        });
      } else {
        setHoveredBounds(null);
      }
    } else {
      setHoveredBounds(null);
    }
  }, [contentRef, selectedNodeId, hoveredNodeId, zoom]);

  // Re-measure bounds on any visual state changes
  useEffect(() => {
    measureBounds();

    // Setup Mutation & Resize Observers to automatically realign overlays
    const resizeObserver = new ResizeObserver(() => {
      measureBounds();
    });

    const mutationObserver = new MutationObserver(() => {
      measureBounds();
    });

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
      mutationObserver.observe(contentRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }

    window.addEventListener("resize", measureBounds);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", measureBounds);
    };
  }, [
    measureBounds,
    contentRef,
  ]);

  // Periodic polling safety check to sync layout modifications
  useEffect(() => {
    const interval = setInterval(measureBounds, 100);
    return () => clearInterval(interval);
  }, [measureBounds]);

  // Don't show handles on the root canvas element
  const supportsResize = selectedNodeId && selectedNodeId !== "root";

  // Position label cleanly
  const renderLabel = () => {
    if (!selectedBounds || !selectedNode) return null;
    const isAtTop = selectedBounds.top < 24;
    return (
      <div
        style={{
          position: "absolute",
          left: `${selectedBounds.left}px`,
          top: isAtTop
            ? `${selectedBounds.top}px`
            : `${selectedBounds.top - 20}px`,
        }}
        className="bg-blue-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded shadow-md z-45 flex items-center pointer-events-none"
      >
        {selectedNode.type}
        <span className="opacity-60 ml-1">#{selectedNode.id}</span>
      </div>
    );
  };

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 pointer-events-none z-30"
      style={{ width: "100%", height: "100%" }}
    >
      {/* Hover Highlight Box */}
      {hoveredBounds && (
        <div
          style={{
            position: "absolute",
            left: `${hoveredBounds.left}px`,
            top: `${hoveredBounds.top}px`,
            width: `${hoveredBounds.width}px`,
            height: `${hoveredBounds.height}px`,
          }}
          className="border border-dashed border-blue-400 pointer-events-none z-35"
        />
      )}

      {/* Selected Element Highlight Box */}
      {selectedBounds && (
        <div
          style={{
            position: "absolute",
            left: `${selectedBounds.left}px`,
            top: `${selectedBounds.top}px`,
            width: `${selectedBounds.width}px`,
            height: `${selectedBounds.height}px`,
          }}
          className="border border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.15)] z-40"
        >
          {/* Resize Handles */}
          {supportsResize && (
            <>
              {/* Corner Handles */}
              <div
                onMouseDown={(e) => startResize(e, "top-left")}
                className="w-2.5 h-2.5 bg-white border border-blue-500 absolute -top-1.5 -left-1.5 cursor-nwse-resize pointer-events-auto rounded shadow-sm hover:scale-125 transition-transform"
              />
              <div
                onMouseDown={(e) => startResize(e, "top-right")}
                className="w-2.5 h-2.5 bg-white border border-blue-500 absolute -top-1.5 -right-1.5 cursor-nesw-resize pointer-events-auto rounded shadow-sm hover:scale-125 transition-transform"
              />
              <div
                onMouseDown={(e) => startResize(e, "bottom-left")}
                className="w-2.5 h-2.5 bg-white border border-blue-500 absolute -bottom-1.5 -left-1.5 cursor-nesw-resize pointer-events-auto rounded shadow-sm hover:scale-125 transition-transform"
              />
              <div
                onMouseDown={(e) => startResize(e, "bottom-right")}
                className="w-2.5 h-2.5 bg-white border border-blue-500 absolute -bottom-1.5 -right-1.5 cursor-nwse-resize pointer-events-auto rounded shadow-sm hover:scale-125 transition-transform"
              />

              {/* Edge Handles */}
              <div
                onMouseDown={(e) => startResize(e, "top")}
                className="w-4 h-1 bg-white border border-blue-500 absolute -top-1 left-1/2 -translate-x-1/2 cursor-ns-resize pointer-events-auto rounded-sm hover:scale-y-150 transition-transform"
              />
              <div
                onMouseDown={(e) => startResize(e, "bottom")}
                className="w-4 h-1 bg-white border border-blue-500 absolute -bottom-1 left-1/2 -translate-x-1/2 cursor-ns-resize pointer-events-auto rounded-sm hover:scale-y-150 transition-transform"
              />
              <div
                onMouseDown={(e) => startResize(e, "left")}
                className="w-1 h-4 bg-white border border-blue-500 absolute top-1/2 -translate-y-1/2 -left-1 cursor-ew-resize pointer-events-auto rounded-sm hover:scale-x-150 transition-transform"
              />
              <div
                onMouseDown={(e) => startResize(e, "right")}
                className="w-1 h-4 bg-white border border-blue-500 absolute top-1/2 -translate-y-1/2 -right-1 cursor-ew-resize pointer-events-auto rounded-sm hover:scale-x-150 transition-transform"
              />
            </>
          )}
        </div>
      )}

      {/* Selected Label Tag */}
      {renderLabel()}
    </div>
  );
};

export default VisualEditorOverlay;
