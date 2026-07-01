import { ASTNode } from "../../types";

export const codeGenerator = (
  node: ASTNode,
  childrenCode: string,
  breakpointStylesCode?: string
): string => {
  const tailwindClasses = breakpointStylesCode || "";
  
  // Extract props with defaults
  const loading = node.props.loading !== undefined ? node.props.loading !== false : node.props.visible !== false;
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
  const delay = Number(node.props.delay) || 0;
  const spinnerPosition = (node.props.spinnerPosition as string) || "center";

  // Skeleton specific props
  const skeletonType = (node.props.skeletonType as string) || "default";
  const skeletonRows = Number(node.props.skeletonRows) || 4;
  const skeletonAvatar = node.props.skeletonAvatar !== false;
  const skeletonParagraph = node.props.skeletonParagraph !== false;

  // Determine size
  let sizePx = 40;
  if (size === "small") sizePx = 24;
  if (size === "large") sizePx = 64;

  const hasChildren = !!childrenCode && childrenCode.trim().length > 0;

  // Spinner position layout rules
  let alignmentStylesStr = `display: "flex", gap: "12px"`;
  switch (spinnerPosition) {
    case "top":
      alignmentStylesStr += `, flexDirection: "column", alignItems: "center", justifyContent: "flex-start"`;
      break;
    case "bottom":
      alignmentStylesStr += `, flexDirection: "column", alignItems: "center", justifyContent: "flex-end"`;
      break;
    case "left":
      alignmentStylesStr += `, flexDirection: "row", alignItems: "center", justifyContent: "center"`;
      break;
    case "right":
      alignmentStylesStr += `, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center"`;
      break;
    case "center":
    default:
      alignmentStylesStr += `, flexDirection: "column", alignItems: "center", justifyContent: "center"`;
      break;
  }

  // Base wrapper styles (if there are children, wrapper is relative)
  const wrapperStyleStr = `position: "relative", width: "100%", display: "block"`;

  // Overlay styles
  let overlayStyleStr = `${alignmentStylesStr}, opacity: ${opacity}, zIndex: ${zIndex}, padding: "${padding}", borderRadius: "${borderRadius}"`;
  
  if (fullScreen) {
    overlayStyleStr = `${alignmentStylesStr}, position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "${backgroundColor}", pointerEvents: "${blockInteraction ? "all" : "none"}", backdropFilter: "${blurBackground ? "blur(4px)" : "none"}", zIndex: ${zIndex}`;
  } else if (overlay || hasChildren) {
    overlayStyleStr = `${alignmentStylesStr}, position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", backgroundColor: "${backgroundColor}", borderRadius: "${borderRadius}", pointerEvents: "${blockInteraction ? "all" : "none"}", backdropFilter: "${blurBackground ? "blur(4px)" : "none"}", zIndex: ${zIndex}`;
  }

  // Animation class
  let animationClass = "";
  if (animationType === "fade" || animationType === "pulse") {
    animationClass = " animate-pulse";
  }

  // Generate graphics code
  let graphicsJSX = "";
  if (loadingType === "Dots") {
    graphicsJSX = `
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <div style={{ width: "${sizePx / 3}px", height: "${sizePx / 3}px", backgroundColor: "${color}", borderRadius: "50%", animation: "loading-bounce 1.4s infinite ease-in-out both", animationDelay: "-0.32s" }} />
        <div style={{ width: "${sizePx / 3}px", height: "${sizePx / 3}px", backgroundColor: "${color}", borderRadius: "50%", animation: "loading-bounce 1.4s infinite ease-in-out both", animationDelay: "-0.16s" }} />
        <div style={{ width: "${sizePx / 3}px", height: "${sizePx / 3}px", backgroundColor: "${color}", borderRadius: "50%", animation: "loading-bounce 1.4s infinite ease-in-out both" }} />
      </div>
    `;
  } else if (loadingType === "Circular") {
    graphicsJSX = `
      <svg viewBox="0 0 50 50" style={{ width: "${sizePx}px", height: "${sizePx}px", animation: "loading-rotate 2s linear infinite" }}>
        <circle cx="25" cy="25" r="20" fill="none" stroke="${color}" strokeWidth="4" strokeMiterlimit="10" style={{ strokeDasharray: "1, 200", strokeDashoffset: 0, strokeLinecap: "round", animation: "loading-dash 1.5s ease-in-out infinite" }} />
      </svg>
    `;
  } else if (loadingType === "ProgressBar") {
    graphicsJSX = `
      <div style={{ width: "100%", maxWidth: "200px", height: "4px", backgroundColor: "rgba(229, 231, 235, 0.4)", borderRadius: "2px", position: "relative", overflow: "hidden" }}>
        <div style={{ height: "100%", backgroundColor: "${color}", position: "absolute", top: 0, width: "40%", borderRadius: "2px", animation: "loading-progress 1.5s infinite linear" }} />
      </div>
    `;
  } else if (loadingType === "Skeleton") {
    const baseSkStyle = `background: "linear-gradient(90deg, #374151 25%, #4b5563 37%, #374151 63%)", backgroundSize: "400% 100%", animation: "loading-shimmer 1.4s ease infinite", borderRadius: "4px"`;
    if (skeletonType === "button") {
      graphicsJSX = `<div style={{ ${baseSkStyle}, width: "120px", height: "36px", borderRadius: "6px" }} />`;
    } else if (skeletonType === "card") {
      graphicsJSX = `
        <div style={{ border: "1px solid #374151", borderRadius: "8px", padding: "16px", backgroundColor: "#1f2937", width: "280px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ ${baseSkStyle}, width: "100%", height: "140px", borderRadius: "6px" }} />
          <div style={{ ${baseSkStyle}, width: "70%", height: "16px" }} />
          <div style={{ ${baseSkStyle}, width: "90%", height: "12px" }} />
          <div style={{ ${baseSkStyle}, width: "40%", height: "12px" }} />
        </div>
      `;
    } else if (skeletonType === "table") {
      const rows = Array.from({ length: skeletonRows })
        .map(() => `
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ ${baseSkStyle}, flex: 1, height: "18px" }} />
            <div style={{ ${baseSkStyle}, flex: 2, height: "18px" }} />
            <div style={{ ${baseSkStyle}, flex: 1, height: "18px" }} />
          </div>
        `).join("");
      graphicsJSX = `
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ ${baseSkStyle}, flex: 1, height: "24px" }} />
            <div style={{ ${baseSkStyle}, flex: 2, height: "24px" }} />
            <div style={{ ${baseSkStyle}, flex: 1, height: "24px" }} />
          </div>
          <hr style={{ borderColor: "#374151", margin: "4px 0" }} />
          ${rows}
        </div>
      `;
    } else {
      // Default
      graphicsJSX = `
        <div style={{ display: "flex", gap: "16px", width: "100%", maxWidth: "400px" }}>
          ${skeletonAvatar ? `<div style={{ ${baseSkStyle}, width: "48px", height: "48px", borderRadius: "50%", flexShrink: 0 }} />` : ""}
          ${skeletonParagraph ? `
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
              <div style={{ ${baseSkStyle}, width: "50%", height: "16px" }} />
              <div style={{ ${baseSkStyle}, width: "90%", height: "12px" }} />
              <div style={{ ${baseSkStyle}, width: "80%", height: "12px" }} />
            </div>
          ` : ""}
        </div>
      `;
    }
  } else {
    // Spinner
    graphicsJSX = `
      <svg style={{ width: "${sizePx}px", height: "${sizePx}px", color: "${color}", animation: "loading-rotate 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.2 }} />
        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    `;
  }

  const labelTextJSX = loadingType !== "Skeleton" && text ? `
    <span style={{
      color: ${fullScreen || overlay || hasChildren ? '"#ffffff"' : `"${color}"`},
      fontSize: "${size === "small" ? "12px" : size === "large" ? "18px" : "14px"}",
      fontWeight: "500",
      textShadow: ${fullScreen || overlay || hasChildren ? '"0 1px 2px rgba(0,0,0,0.5)"' : '"none"'}
    }}>${text}</span>
  ` : "";

  // The outer wrapper binds `loading` and `visible` attributes.
  // The CSS rule hides `.loading-overlay` when [loading="false"] or [visible="false"].
  return `<div
  loading={${loading ? "true" : "false"}}
  visible={${loading ? "true" : "false"}}
  className="${tailwindClasses}"
  style={{ ${wrapperStyleStr} }}
>
  <style>{\`
    [loading="false"] .loading-overlay, [visible="false"] .loading-overlay { display: none !important; }
    @keyframes loading-rotate { 100% { transform: rotate(360deg); } }
    @keyframes loading-dash {
      0% { stroke-dasharray: 1, 200; stroke-dashoffset: 0; }
      50% { stroke-dasharray: 89, 200; stroke-dashoffset: -35px; }
      100% { stroke-dasharray: 89, 200; stroke-dashoffset: -124px; }
    }
    @keyframes loading-bounce { 0%, 100% { transform: scale(0); } 50% { transform: scale(1.0); } }
    @keyframes loading-progress { 0% { left: -40%; } 50% { left: 100%; } 100% { left: 100%; } }
    @keyframes loading-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  \`}</style>

  ${childrenCode.trim()}

  <div
    className="loading-overlay${animationClass}"
    style={{
      ${overlayStyleStr},
      transition: "opacity 0.3s ease",
      ${delay > 0 ? `transitionDelay: "${delay}ms"` : ""}
    }}
  >
    ${graphicsJSX.trim()}
    ${labelTextJSX.trim()}
  </div>
</div>`;
};

export default codeGenerator;
