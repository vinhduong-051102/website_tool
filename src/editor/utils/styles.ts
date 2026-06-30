import React from "react";
import { ASTNode, Breakpoint } from "../types";

export const getResolvedStyles = (
  node: ASTNode,
  activeBreakpoint: Breakpoint
): React.CSSProperties => {
  const desktopStyles = node.styles.desktop || {};
  const tabletStyles = node.styles.tablet || {};
  const mobileStyles = node.styles.mobile || {};

  if (activeBreakpoint === "desktop") {
    return { ...desktopStyles };
  }

  if (activeBreakpoint === "tablet") {
    return {
      ...desktopStyles,
      ...tabletStyles,
    };
  }

  // activeBreakpoint === "mobile"
  return {
    ...desktopStyles,
    ...tabletStyles,
    ...mobileStyles,
  };
};
