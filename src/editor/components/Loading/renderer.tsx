import React from "react";
import { ASTNode } from "../../types";
import { useEditorStore } from "../../store/useEditorStore";
import { getResolvedStyles } from "../../utils/styles";
import { Loader2 } from "lucide-react";

export const Renderer = ({
  node,
  isSelected,
  isHovered,
}: {
  node: ASTNode;
  isSelected: boolean;
  isHovered: boolean;
}) => {
  const activeBreakpoint = useEditorStore((state) => state.activeBreakpoint);
  const isPreviewMode = useEditorStore((state) => state.isPreviewMode);
  
  const resolvedStyles = getResolvedStyles(node, activeBreakpoint);

  // Extract props with defaults
  const visible = node.props.visible !== false; // default true
  const loadingType = (node.props.loadingType as string) || "Spinner";
  const text = node.props.text !== undefined ? String(node.props.text) : "Loading...";
  const fullScreen = !!node.props.fullScreen;
  const overlay = !!node.props.overlay;
  const blurBackground = !!node.props.blurBackground;
  const blockInteraction = node.props.blockInteraction !== false;
  const animationType = (node.props.animationType as string) || "fade";
  const size = (node.props.size as string) || "medium";
  const color = (node.props.color as string) || "#3b82f6";
  const backgroundColor = (node.props.backgroundColor as string) || "rgba(0, 0, 0, 0.4)";
  const opacity = node.props.opacity !== undefined ? String(node.props.opacity) : "1";
  const borderRadius = (node.props.borderRadius as string) || "6px";
  const padding = (node.props.padding as string) || "16px";
  const zIndex = (node.props.zIndex as string) || "50";

  // Skeleton specific props
  const skeletonType = (node.props.skeletonType as string) || "default";
  const skeletonRows = Number(node.props.skeletonRows) || 4;
  const skeletonAvatar = node.props.skeletonAvatar !== false;
  const skeletonParagraph = node.props.skeletonParagraph !== false;

  // Determine size in pixels
  let sizePx = 40;
  if (size === "small") sizePx = 24;
  if (size === "large") sizePx = 64;

  // If invisible and NOT selected, and we are in PREVIEW mode, return null
  if (!visible && isPreviewMode) {
    return null;
  }

  // If invisible and NOT selected, and we are in EDITOR mode, render a placeholder so it's not invisible
  if (!visible && !isSelected && !isPreviewMode) {
    return (
      <div
        style={{
          padding: "8px 12px",
          border: "1px dashed #ef4444",
          backgroundColor: "#fef2f2",
          color: "#ef4444",
          borderRadius: "4px",
          fontSize: "11px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          opacity: 0.6,
          cursor: "pointer",
        }}
        className={`${
          isHovered ? "outline-1 outline-blue-400 outline-dashed" : ""
        }`}
      >
        <Loader2 className="animate-spin" size={12} />
        <span>Loading Component (Hidden: {node.id.split("-")[1] || node.id})</span>
      </div>
    );
  }

  // Render different types
  const renderLoadingGraphic = () => {
    switch (loadingType) {
      case "Dots":
        return (
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <div
              className="loading-dot"
              style={{
                width: sizePx / 3,
                height: sizePx / 3,
                backgroundColor: color,
                borderRadius: "50%",
                animation: "loading-bounce 1.4s infinite ease-in-out both",
                animationDelay: "-0.32s",
              }}
            />
            <div
              className="loading-dot"
              style={{
                width: sizePx / 3,
                height: sizePx / 3,
                backgroundColor: color,
                borderRadius: "50%",
                animation: "loading-bounce 1.4s infinite ease-in-out both",
                animationDelay: "-0.16s",
              }}
            />
            <div
              className="loading-dot"
              style={{
                width: sizePx / 3,
                height: sizePx / 3,
                backgroundColor: color,
                borderRadius: "50%",
                animation: "loading-bounce 1.4s infinite ease-in-out both",
              }}
            />
          </div>
        );

      case "Circular":
        return (
          <svg
            viewBox="0 0 50 50"
            style={{
              width: sizePx,
              height: sizePx,
              animation: "loading-rotate 2s linear infinite",
            }}
          >
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeMiterlimit="10"
              style={{
                strokeDasharray: "1, 200",
                strokeDashoffset: 0,
                strokeLinecap: "round",
                animation: "loading-dash 1.5s ease-in-out infinite",
              }}
            />
          </svg>
        );

      case "ProgressBar":
        return (
          <div
            style={{
              width: "100%",
              maxWidth: "200px",
              height: "4px",
              backgroundColor: "rgba(229, 231, 235, 0.4)",
              borderRadius: "2px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                backgroundColor: color,
                position: "absolute",
                top: 0,
                width: "40%",
                borderRadius: "2px",
                animation: "loading-progress 1.5s infinite linear",
              }}
            />
          </div>
        );

      case "Skeleton":
        return renderSkeleton();

      case "Spinner":
      default:
        return (
          <svg
            style={{
              width: sizePx,
              height: sizePx,
              color: color,
              animation: "loading-rotate 1s linear infinite",
            }}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              style={{ opacity: 0.2 }}
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
    }
  };

  const renderSkeleton = () => {
    const rowCount = Math.max(1, skeletonRows);
    
    // Skeleton animation and base colors
    const baseSkStyle: React.CSSProperties = {
      background: "linear-gradient(90deg, #374151 25%, #4b5563 37%, #374151 63%)",
      backgroundSize: "400% 100%",
      animation: "loading-shimmer 1.4s ease infinite",
      borderRadius: "4px",
    };

    if (skeletonType === "button") {
      return (
        <div
          style={{
            ...baseSkStyle,
            width: "120px",
            height: "36px",
            borderRadius: "6px",
          }}
        />
      );
    }

    if (skeletonType === "card") {
      return (
        <div
          style={{
            border: "1px solid #374151",
            borderRadius: "8px",
            padding: "16px",
            backgroundColor: "#1f2937",
            width: "280px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ ...baseSkStyle, width: "100%", height: "140px", borderRadius: "6px" }} />
          <div style={{ ...baseSkStyle, width: "70%", height: "16px" }} />
          <div style={{ ...baseSkStyle, width: "90%", height: "12px" }} />
          <div style={{ ...baseSkStyle, width: "40%", height: "12px" }} />
        </div>
      );
    }

    if (skeletonType === "table") {
      return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Header Row */}
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ ...baseSkStyle, flex: 1, height: "24px" }} />
            <div style={{ ...baseSkStyle, flex: 2, height: "24px" }} />
            <div style={{ ...baseSkStyle, flex: 1, height: "24px" }} />
          </div>
          <hr style={{ borderColor: "#374151", margin: "4px 0" }} />
          {/* Body Rows */}
          {Array.from({ length: rowCount }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: "12px" }}>
              <div style={{ ...baseSkStyle, flex: 1, height: "18px" }} />
              <div style={{ ...baseSkStyle, flex: 2, height: "18px" }} />
              <div style={{ ...baseSkStyle, flex: 1, height: "18px" }} />
            </div>
          ))}
        </div>
      );
    }

    // Default Layout: Avatar + Paragraph
    return (
      <div style={{ display: "flex", gap: "16px", width: "100%", maxWidth: "400px" }}>
        {skeletonAvatar && (
          <div
            style={{
              ...baseSkStyle,
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              flexShrink: 0,
            }}
          />
        )}
        {skeletonParagraph && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
            <div style={{ ...baseSkStyle, width: "50%", height: "16px" }} />
            <div style={{ ...baseSkStyle, width: "90%", height: "12px" }} />
            <div style={{ ...baseSkStyle, width: "80%", height: "12px" }} />
            {rowCount > 2 && (
              <div style={{ ...baseSkStyle, width: "60%", height: "12px" }} />
            )}
          </div>
        )}
      </div>
    );
  };

  // Base overlay container styles
  let containerStyle: React.CSSProperties = {
    ...resolvedStyles,
    opacity: Number(opacity),
    zIndex: Number(zIndex) || 50,
  };

  // Overlay vs Full Screen logic
  if (fullScreen) {
    containerStyle = {
      ...containerStyle,
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor,
      pointerEvents: blockInteraction ? "all" : "none",
      backdropFilter: blurBackground ? "blur(4px)" : "none",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    };
  } else if (overlay) {
    containerStyle = {
      ...containerStyle,
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor,
      borderRadius,
      pointerEvents: blockInteraction ? "all" : "none",
      backdropFilter: blurBackground ? "blur(4px)" : "none",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    };
  }

  // Animation CSS styles
  let animationClass = "";
  if (animationType === "fade") animationClass = "animate-pulse"; // Standard css fallback
  if (animationType === "pulse") animationClass = "animate-pulse";

  // Custom keyframe injections
  const styleInjections = `
    @keyframes loading-rotate {
      100% { transform: rotate(360deg); }
    }
    @keyframes loading-dash {
      0% { stroke-dasharray: 1, 200; stroke-dashoffset: 0; }
      50% { stroke-dasharray: 89, 200; stroke-dashoffset: -35px; }
      100% { stroke-dasharray: 89, 200; stroke-dashoffset: -124px; }
    }
    @keyframes loading-bounce {
      0%, 100% { transform: scale(0); }
      50% { transform: scale(1.0); }
    }
    @keyframes loading-progress {
      0% { left: -40%; }
      50% { left: 100%; }
      100% { left: 100%; }
    }
    @keyframes loading-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;

  return (
    <div
      style={containerStyle}
      className={`transition-all duration-300 ${animationClass} ${
        isSelected
          ? "outline-2 outline-blue-500 outline-solid ring-4 ring-blue-500/10 z-20"
          : isHovered
          ? "outline-1 outline-blue-400 outline-dashed z-20"
          : ""
      }`}
    >
      <style>{styleInjections}</style>
      
      {renderLoadingGraphic()}
      
      {loadingType !== "Skeleton" && text && (
        <span
          style={{
            color: fullScreen || overlay ? "#ffffff" : color,
            fontSize: size === "small" ? "12px" : size === "large" ? "18px" : "14px",
            fontWeight: "500",
            textShadow: fullScreen || overlay ? "0 1px 2px rgba(0,0,0,0.5)" : "none",
          }}
        >
          {text}
        </span>
      )}
    </div>
  );
};

export default Renderer;
