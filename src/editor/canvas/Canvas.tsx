import React, { useRef, useState, useEffect } from "react";
import { useEditorStore } from "../store/useEditorStore";
import ASTRenderer from "../renderer/ASTRenderer";
import VisualEditorOverlay from "./VisualEditorOverlay";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Grid, 
  Smartphone, 
  Tablet as TabletIcon, 
  Monitor 
} from "lucide-react";

export const Canvas: React.FC = () => {
  const {
    pages,
    activePageId,
    activeBreakpoint,
    zoom,
    pan,
    showGrid,
    snapToGrid,
    setZoom,
    setPan,
    setShowGrid,
    setSnapToGrid,
    setSelectedNodeIds,
    setActiveBreakpoint,
  } = useEditorStore();

  const canvasBgRef = useRef<HTMLDivElement>(null);
  const viewportContentRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);

  // Monitor Space key for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setSpacePressed(true);
        // Prevent default spacebar scrolling
        if (document.activeElement === document.body) {
          e.preventDefault();
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setSpacePressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const activePage = pages.find((p) => p.id === activePageId);
  const rootNode = activePage?.ast;

  const handleMouseDown = (e: React.MouseEvent) => {
    // Left-click on canvas background or middle-click anywhere clears selection or starts panning
    const isBackground = e.target === canvasBgRef.current || e.target === canvasBgRef.current?.firstChild;
    
    if (e.button === 1 || spacePressed || (e.button === 0 && isBackground)) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    } else if (e.button === 0 && isBackground) {
      // Clear selection when clicking the background
      setSelectedNodeIds([]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Determine viewport width based on active breakpoint
  const getViewportWidth = () => {
    switch (activeBreakpoint) {
      case "mobile":
        return "375px";
      case "tablet":
        return "768px";
      case "desktop":
      default:
        return "100%";
    }
  };

  const handleResetCanvas = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-[#111827] h-full select-none">
      {/* Top Toolbar (Controls Zoom, Pan, Grid, Breakpoint) */}
      <div className="h-14 bg-[#1f2937]/90 backdrop-blur border-b border-gray-800 flex items-center justify-between px-6 z-20">
        {/* Breakpoint Switcher */}
        <div className="flex items-center space-x-1 bg-gray-900/60 p-1 rounded-lg border border-gray-800">
          <button
            onClick={() => setActiveBreakpoint("desktop")}
            className={`p-2 rounded-md transition-all ${
              activeBreakpoint === "desktop"
                ? "bg-blue-600 text-white font-medium"
                : "text-gray-400 hover:text-white"
            }`}
            title="Desktop (100%)"
          >
            <Monitor size={18} />
          </button>
          <button
            onClick={() => setActiveBreakpoint("tablet")}
            className={`p-2 rounded-md transition-all ${
              activeBreakpoint === "tablet"
                ? "bg-blue-600 text-white font-medium"
                : "text-gray-400 hover:text-white"
            }`}
            title="Tablet (768px)"
          >
            <TabletIcon size={18} />
          </button>
          <button
            onClick={() => setActiveBreakpoint("mobile")}
            className={`p-2 rounded-md transition-all ${
              activeBreakpoint === "mobile"
                ? "bg-blue-600 text-white font-medium"
                : "text-gray-400 hover:text-white"
            }`}
            title="Mobile (375px)"
          >
            <Smartphone size={18} />
          </button>
        </div>

        {/* Viewport Info */}
        <div className="text-gray-400 text-xs font-mono">
          Viewport: {getViewportWidth() === "100%" ? "Full Width" : getViewportWidth()}
        </div>

        {/* Canvas & Grid Controls */}
        <div className="flex items-center space-x-4">
          {/* Grid Toggle */}
          <div className="flex items-center space-x-1 bg-gray-900/60 p-1 rounded-lg border border-gray-800">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-md transition-all ${
                showGrid ? "bg-gray-800 text-blue-400" : "text-gray-500 hover:text-white"
              }`}
              title="Toggle Grid"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`p-2 rounded-md transition-all text-xs font-mono px-2 ${
                snapToGrid ? "bg-gray-800 text-blue-400" : "text-gray-500 hover:text-white"
              }`}
              title="Snap to Grid"
            >
              SNAP
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center space-x-1 bg-gray-900/60 p-1 rounded-lg border border-gray-800">
            <button
              onClick={() => setZoom(zoom - 0.1)}
              className="p-2 text-gray-400 hover:text-white rounded-md"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <span
              className="text-xs font-mono text-gray-300 w-12 text-center cursor-pointer hover:text-white"
              onClick={handleResetCanvas}
              title="Reset View"
            >
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(zoom + 0.1)}
              className="p-2 text-gray-400 hover:text-white rounded-md"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={handleResetCanvas}
              className="p-2 text-gray-500 hover:text-white rounded-md"
              title="Reset Zoom & Pan"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area (Interactive background for dragging and panning) */}
      <div
        ref={canvasBgRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 overflow-hidden relative cursor-${
          spacePressed || isPanning ? "grabbing" : "grab"
        }`}
        style={{
          backgroundImage: showGrid
            ? "radial-gradient(rgba(255, 255, 255, 0.08) 1.2px, transparent 1.2px)"
            : "none",
          backgroundSize: "20px 20px",
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {/* Transform Group (Zoom and Pan) */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isPanning ? "none" : "transform 0.15s ease-out",
          }}
          className="absolute inset-0 flex items-center justify-center p-20 pointer-events-none"
        >
          {/* Centered Device Viewport Frame */}
          <div
            style={{
              width: getViewportWidth(),
              transition: "width 0.3s ease-in-out",
            }}
            className="h-full max-h-[85vh] bg-[#1f2937] rounded-xl shadow-2xl border border-gray-800 overflow-y-auto pointer-events-auto flex flex-col"
          >
            {/* Viewport Header */}
            <div className="h-8 bg-gray-900 border-b border-gray-800 flex items-center px-4 justify-between shrink-0 select-none text-[10px] text-gray-500 font-mono">
              <div className="flex space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <div>{activePage?.name} - {activeBreakpoint.toUpperCase()} VIEW</div>
              <div>{getViewportWidth() === "100%" ? "1200px" : getViewportWidth()}</div>
            </div>

            {/* Viewport Content */}
            <div ref={viewportContentRef} className="flex-1 overflow-y-auto bg-gray-850 relative">
              {rootNode ? (
                <>
                  <ASTRenderer node={rootNode} />
                  <VisualEditorOverlay zoom={zoom} contentRef={viewportContentRef} />
                </>
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">
                  No root element defined.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hotkey Helper Toast */}
      <div className="absolute bottom-4 left-4 bg-gray-900/90 text-gray-400 text-[10px] px-3 py-1.5 rounded-md border border-gray-800 backdrop-blur z-20 pointer-events-none font-mono">
        Hold <span className="text-white font-bold">SPACE</span> + Drag to Pan | Scroll wheel zoom support coming
      </div>
    </div>
  );
};

export default Canvas;
