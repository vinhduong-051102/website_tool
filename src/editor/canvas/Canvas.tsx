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
  Monitor,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useGlobalState } from "../state/useGlobalState";
import { Layout } from "antd";

const { Header, Sider, Content, Footer } = Layout;

export const Canvas: React.FC = () => {
  const {
    pages,
    layouts,
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
  const activeLayout = layouts.find((l) => l.id === activePage?.layoutId);

  const isSidebarCollapsed = useGlobalState((state) => {
    const data = state.data as Record<string, Record<string, unknown>>;
    const layout = data.layout;
    return (layout?.sidebarCollapsed as boolean | undefined) ?? activeLayout?.config?.sidebarDefaultCollapsed ?? activeLayout?.config?.sidebarCollapsed ?? false;
  }) as boolean;

  const handleToggleSidebar = () => {
    useGlobalState.getState().setState("layout.sidebarCollapsed", !isSidebarCollapsed);
  };

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
                  {activeLayout ? (
                    <Layout 
                      style={{
                        minHeight: "100%",
                        backgroundColor: activeLayout.config?.layoutBg || "#0f172a",
                        gap: activeLayout.config?.layoutGap || "0px",
                        padding: activeLayout.config?.layoutPadding || "0px",
                      }}
                    >
                      {/* Header */}
                      {activeLayout.regions.header && (
                        <Header 
                          style={{
                            minHeight: activeLayout.config?.headerHeight || "64px",
                            height: "auto",
                            backgroundColor: activeLayout.config?.headerBg || "#1e293b",
                            position: activeLayout.config?.headerFixed ? "sticky" : "static",
                            top: 0,
                            zIndex: 10,
                            lineHeight: activeLayout.config?.headerHeight || "64px",
                            padding: "0 24px",
                          }}
                        >
                          <ASTRenderer node={activeLayout.headerAST} />
                        </Header>
                      )}

                      {/* Sidebar & Content area */}
                      <Layout
                        hasSider={activeLayout.regions.sidebar}
                        style={{
                          flexDirection: activeLayout.config?.sidebarPosition === "right" ? "row-reverse" : "row",
                          flex: 1,
                          gap: activeLayout.config?.layoutGap || "0px",
                          background: "transparent",
                        }}
                      >
                        {/* Sidebar */}
                        {activeLayout.regions.sidebar && (() => {
                          const isLeft = activeLayout.config?.sidebarPosition !== "right";
                          const getArrowIcon = () => {
                            if (isLeft) {
                              return isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />;
                            } else {
                              return isSidebarCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />;
                            }
                          };

                          const buttonStyle: React.CSSProperties = {
                            position: "absolute",
                            top: activeLayout.config?.sidebarCollapsePosition === "top" 
                              ? "24px" 
                              : activeLayout.config?.sidebarCollapsePosition === "bottom" 
                                ? "auto" 
                                : "50%",
                            bottom: activeLayout.config?.sidebarCollapsePosition === "bottom" ? "24px" : "auto",
                            transform: activeLayout.config?.sidebarCollapsePosition === "center" ? "translateY(-50%)" : "none",
                            [isLeft ? "right" : "left"]: "-14px",
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            backgroundColor: activeLayout.config?.sidebarBg || "#1e293b",
                            border: "1px solid #374151",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            zIndex: 10,
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                            transition: "all 0.2s ease-in-out",
                          };

                          return (
                            <div 
                              style={{
                                position: activeLayout.config?.sidebarFixed ? "sticky" : "relative",
                                top: activeLayout.config?.sidebarFixed ? 0 : "auto",
                                height: activeLayout.config?.sidebarFixed ? "100vh" : "auto",
                                zIndex: 9,
                              }}
                            >
                              <Sider 
                                width={isSidebarCollapsed 
                                  ? (Number(activeLayout.config?.sidebarCollapsedWidth) || 64) 
                                  : (Number(activeLayout.config?.sidebarWidth) || 240)}
                                collapsible={Boolean(activeLayout.config?.sidebarCollapsible)}
                                collapsed={isSidebarCollapsed}
                                trigger={null}
                                style={{
                                  backgroundColor: activeLayout.config?.sidebarBg || "#1e293b",
                                  height: "100%",
                                  transition: `width ${activeLayout.config?.sidebarAnimationDuration || "300ms"} ${activeLayout.config?.sidebarAnimationEasing || "ease-in-out"}`,
                                  overflow: "hidden",
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                <ASTRenderer node={activeLayout.sidebarAST} />
                              </Sider>
                              {activeLayout.config?.sidebarCollapsible && activeLayout.config?.sidebarCollapseTrigger === "button" && (
                                <button
                                  onClick={handleToggleSidebar}
                                  style={buttonStyle}
                                  className="hover:scale-105 hover:bg-blue-600 transition-all flex items-center justify-center text-white"
                                >
                                  {getArrowIcon()}
                                </button>
                              )}
                            </div>
                          );
                        })()}

                        {/* Main Content (Slot) */}
                        <Content style={{ flex: 1, maxWidth: activeLayout.config?.layoutMaxWidth || "100%", margin: "0 auto", width: "100%", background: "transparent" }}>
                          <ASTRenderer node={rootNode} />
                        </Content>
                      </Layout>

                      {/* Footer */}
                      {activeLayout.regions.footer && (
                        <Footer 
                          style={{
                            minHeight: activeLayout.config?.footerHeight || "48px",
                            height: "auto",
                            backgroundColor: activeLayout.config?.footerBg || "#1e293b",
                            position: activeLayout.config?.footerFixed ? "sticky" : "static",
                            bottom: 0,
                            zIndex: 8,
                            padding: "16px 24px",
                          }}
                        >
                          <ASTRenderer node={activeLayout.footerAST} />
                        </Footer>
                      )}
                    </Layout>
                  ) : (
                    <ASTRenderer node={rootNode} />
                  )}
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
