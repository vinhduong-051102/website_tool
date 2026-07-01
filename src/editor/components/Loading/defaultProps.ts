export const defaultProps = {
  visible: true,
  loadingType: "Spinner", // Spinner, Dots, Circular, ProgressBar, Skeleton
  text: "Loading...",
  icon: "Loader2",
  fullScreen: false,
  overlay: false,
  blurBackground: false,
  blockInteraction: true,
  animationType: "fade", // none, fade, scale, rotate, pulse
  size: "medium", // small, medium, large
  color: "#3b82f6",
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  opacity: "1",
  borderRadius: "6px",
  padding: "16px",
  zIndex: "50",
  // Skeleton config
  skeletonRows: 4,
  skeletonAvatar: true,
  skeletonParagraph: true,
  skeletonType: "default", // default, button, card, table
};

export const defaultStyles = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  padding: "16px",
  borderRadius: "6px",
  backgroundColor: "transparent",
  color: "#3b82f6",
};
