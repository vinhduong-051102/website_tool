import { useState, useCallback, useRef } from "react";
import { useEditorStore, createASTCommand } from "../store/useEditorStore";
import { updateStyles } from "../utils/ast";

export type ResizeHandle =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

interface ResizeState {
  startX: number;
  startY: number;
  initialWidth: number;
  initialHeight: number;
  handle: ResizeHandle;
  initialPages: ReturnType<typeof useEditorStore.getState>["pages"];
}

export const useResize = (nodeId: string) => {
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<ResizeState | null>(null);

  const startResize = useCallback(
    (e: React.MouseEvent | MouseEvent, handle: ResizeHandle) => {
      e.stopPropagation();
      e.preventDefault();

      const wrapper = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement;
      if (!wrapper) return;
      const el = (wrapper.firstElementChild || wrapper) as HTMLElement;

      const store = useEditorStore.getState();
      const zoom = store.zoom;
      const rect = el.getBoundingClientRect();

      // Zoom-compensated width and height
      const initialWidth = rect.width / zoom;
      const initialHeight = rect.height / zoom;

      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialWidth,
        initialHeight,
        handle,
        initialPages: JSON.parse(JSON.stringify(store.pages)),
      };

      setIsResizing(true);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!resizeRef.current) return;
        const currentStore = useEditorStore.getState();
        const currentZoom = currentStore.zoom;
        const activeBreakpoint = currentStore.activeBreakpoint;
        const currentPages = currentStore.pages;
        const activePageId = currentStore.activePageId;

        const { startX, startY, initialWidth: initW, initialHeight: initH, handle: activeHandle } =
          resizeRef.current;

        // Compense mouse delta with zoom
        const deltaX = (moveEvent.clientX - startX) / currentZoom;
        const deltaY = (moveEvent.clientY - startY) / currentZoom;

        let newWidth = initW;
        let newHeight = initH;

        // Calculate size based on handle direction
        if (activeHandle.includes("right")) {
          newWidth = initW + deltaX;
        } else if (activeHandle.includes("left")) {
          newWidth = initW - deltaX;
        }

        if (activeHandle.includes("bottom")) {
          newHeight = initH + deltaY;
        } else if (activeHandle.includes("top")) {
          newHeight = initH - deltaY;
        }

        // Snap to grid if enabled (20px steps)
        if (currentStore.snapToGrid) {
          if (activeHandle.includes("right") || activeHandle.includes("left")) {
            newWidth = Math.round(newWidth / 20) * 20;
          }
          if (activeHandle.includes("bottom") || activeHandle.includes("top")) {
            newHeight = Math.round(newHeight / 20) * 20;
          }
        }

        // Enforce minimum dimensions
        newWidth = Math.max(20, newWidth);
        newHeight = Math.max(20, newHeight);

        // Update pages state (live preview, without history commit yet)
        const activePage = currentPages.find((p) => p.id === activePageId);
        if (!activePage) return;

        const newStyles: React.CSSProperties = {};
        if (activeHandle.includes("left") || activeHandle.includes("right")) {
          newStyles.width = `${newWidth}px`;
        }
        if (activeHandle.includes("top") || activeHandle.includes("bottom")) {
          newStyles.height = `${newHeight}px`;
        }

        const updatedAst = updateStyles(activePage.ast, nodeId, newStyles, activeBreakpoint);
        const updatedPages = currentPages.map((p) =>
          p.id === activePageId ? { ...p, ast: updatedAst } : p
        );

        currentStore.setPages(updatedPages);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);

        if (!resizeRef.current) return;
        const finalPages = useEditorStore.getState().pages;
        const initialPages = resizeRef.current.initialPages;

        // Restore initial pages in state, then run it through executeCommand to properly populate undo history
        useEditorStore.getState().setPages(initialPages);
        useEditorStore.getState().executeCommand(
          createASTCommand("Resize Component", finalPages)
        );

        resizeRef.current = null;
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [nodeId]
  );

  return { isResizing, startResize };
};
