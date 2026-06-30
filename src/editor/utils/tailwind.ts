import React from "react";
import { BreakpointStyles } from "../types";

// Convert a single CSS value to standard Tailwind class if possible, or fallback to arbitrary value
export const cssPropToTailwind = (key: string, value: unknown): string => {
  if (value === undefined || value === null || value === "") return "";

  const valStr = String(value).trim();

  // Spacing (Padding/Margin)
  if (key === "padding") return `p-[${valStr}]`;
  if (key === "paddingLeft") return `pl-[${valStr}]`;
  if (key === "paddingRight") return `pr-[${valStr}]`;
  if (key === "paddingTop") return `pt-[${valStr}]`;
  if (key === "paddingBottom") return `pb-[${valStr}]`;
  
  if (key === "margin") return `m-[${valStr}]`;
  if (key === "marginLeft") return `ml-[${valStr}]`;
  if (key === "marginRight") return `mr-[${valStr}]`;
  if (key === "marginTop") return `mt-[${valStr}]`;
  if (key === "marginBottom") return `mb-[${valStr}]`;

  // Sizing
  if (key === "width") {
    if (valStr === "100%") return "w-full";
    if (valStr === "auto") return "w-auto";
    return `w-[${valStr}]`;
  }
  if (key === "height") {
    if (valStr === "100%") return "h-full";
    if (valStr === "auto") return "h-auto";
    if (valStr === "100vh") return "h-screen";
    return `h-[${valStr}]`;
  }
  if (key === "minHeight") return `min-h-[${valStr}]`;
  if (key === "minWidth") return `min-w-[${valStr}]`;
  if (key === "maxHeight") return `max-h-[${valStr}]`;
  if (key === "maxWidth") return `max-w-[${valStr}]`;

  // Colors & Backgrounds
  if (key === "backgroundColor") return `bg-[${valStr}]`;
  if (key === "color") return `text-[${valStr}]`;
  if (key === "borderColor") return `border-[${valStr}]`;

  // Typography
  if (key === "fontSize") return `text-[${valStr}]`;
  if (key === "fontWeight") {
    if (valStr === "400" || valStr === "normal") return "font-normal";
    if (valStr === "500" || valStr === "medium") return "font-medium";
    if (valStr === "600" || valStr === "semibold") return "font-semibold";
    if (valStr === "700" || valStr === "bold") return "font-bold";
    return `font-[${valStr}]`;
  }
  if (key === "textAlign") return `text-${valStr}`;
  if (key === "lineHeight") return `leading-[${valStr}]`;
  if (key === "letterSpacing") return `tracking-[${valStr}]`;

  // Borders
  if (key === "borderRadius") return `rounded-[${valStr}]`;
  if (key === "borderWidth") return `border-[${valStr}]`;
  if (key === "borderStyle") return `border-${valStr}`;

  // Flexbox & Layout
  if (key === "display") {
    if (valStr === "flex") return "flex";
    if (valStr === "grid") return "grid";
    if (valStr === "block") return "block";
    if (valStr === "inline-block") return "inline-block";
    if (valStr === "none") return "hidden";
    return valStr;
  }
  if (key === "flexDirection") {
    if (valStr === "column") return "flex-col";
    if (valStr === "row") return "flex-row";
    if (valStr === "column-reverse") return "flex-col-reverse";
    if (valStr === "row-reverse") return "flex-row-reverse";
  }
  if (key === "justifyContent") {
    if (valStr === "flex-start") return "justify-start";
    if (valStr === "flex-end") return "justify-end";
    if (valStr === "center") return "justify-center";
    if (valStr === "space-between") return "justify-between";
    if (valStr === "space-around") return "justify-around";
    if (valStr === "space-evenly") return "justify-evenly";
  }
  if (key === "alignItems") {
    if (valStr === "flex-start") return "items-start";
    if (valStr === "flex-end") return "items-end";
    if (valStr === "center") return "items-center";
    if (valStr === "baseline") return "items-baseline";
    if (valStr === "stretch") return "items-stretch";
  }
  if (key === "gap") return `gap-[${valStr}]`;
  if (key === "flexWrap") {
    if (valStr === "wrap") return "flex-wrap";
    if (valStr === "nowrap") return "flex-nowrap";
  }
  if (key === "flexGrow") return `grow-[${valStr}]`;
  if (key === "flexShrink") return `shrink-[${valStr}]`;

  // Grid
  if (key === "gridTemplateColumns") return `grid-cols-[${valStr}]`;
  if (key === "gridTemplateRows") return `grid-rows-[${valStr}]`;

  // Shadow & Opacity
  if (key === "opacity") return `opacity-[${valStr}]`;
  if (key === "boxShadow") return `shadow-[${valStr}]`;

  return "";
};

// Convert style object to Tailwind classes
export const stylesToTailwind = (styles?: React.CSSProperties): string => {
  if (!styles) return "";
  return Object.entries(styles)
    .map(([key, val]) => cssPropToTailwind(key, val))
    .filter(Boolean)
    .join(" ");
};

// Convert responsive styles to breakpoint prefixed classes (e.g. md:text-xl lg:text-2xl)
export const getResponsiveTailwindClasses = (
  breakpointStyles?: BreakpointStyles
): string => {
  if (!breakpointStyles) return "";
  
  const desktopClasses = stylesToTailwind(breakpointStyles.desktop);
  
  const tabletStyles = stylesToTailwind(breakpointStyles.tablet);
  const tabletClasses = tabletStyles
    ? tabletStyles
        .split(" ")
        .map((cls) => `md:${cls}`)
        .join(" ")
    : "";

  const mobileStyles = stylesToTailwind(breakpointStyles.mobile);
  const mobileClasses = mobileStyles
    ? mobileStyles
        .split(" ")
        .map((cls) => `sm:${cls}`)
        .join(" ")
    : "";

  // Note: Tailwind v4/v3 responsive order is mobile-first. In our website builder, we design Desktop first.
  // In Tailwind, by default un-prefixed is mobile, md: is tablet, lg: is desktop.
  // Since our system is Desktop-First (styles on desktop apply to all, tablet overrides, mobile overrides),
  // we can map:
  // - desktop styles -> default (unprefixed) classes (mobile up)
  // - tablet styles -> max-md: or we can use standard tailwind responsive classes by mapping:
  //   Wait, since Tailwind is mobile-first (min-width), if we apply desktop styles as unprefixed, they will
  //   propagate down. But wait! Tailwind propagates styles UP (e.g. unprefixed is 0px+, md is 768px+, lg is 1024px+).
  //   If we want desktop-first behavior, we can map:
  //   - mobile styles -> unprefixed (0px+)
  //   - tablet styles -> md: (768px+)
  //   - desktop styles -> lg: (1024px+)
  //   Wait, let's look at this! If the user designs on desktop (e.g., changes padding to 20px), it should be the default,
  //   and tablet can override, mobile can override.
  //   To achieve this in standard tailwind, we can use Tailwind's `max-*` modifiers (like `max-md:p-4`, `max-sm:p-2`)!
  //   Yes! Tailwind support `max-md:` (max-width: 767px) and `max-sm:` (max-width: 639px).
  //   Let's check if this is supported. Yes, Tailwind v3.2+ and v4 support max-width breakpoints like `max-md:` and `max-sm:`!
  //   So:
  //   - desktop styles -> default (unprefixed) - applies to all screens.
  //   - tablet styles -> `max-lg:` or `max-md:` - applies to tablet screens and smaller.
  //   - mobile styles -> `max-sm:` - applies to mobile screens.
  //   This is extremely elegant and perfectly maps Desktop-First design to Tailwind CSS!
  //   Let's use `max-md:` for tablet styles (tablet and smaller) and `max-sm:` for mobile styles (mobile and smaller).
  //   Wait, let's verify if `max-lg:` and `max-md:` or `md:` is better.
  //   Desktop: > 1024px
  //   Tablet: 768px - 1024px (mapped to max-lg: for tablet and smaller, e.g. < 1024px)
  //   Mobile: < 768px (mapped to max-md: for mobile and smaller, e.g. < 768px)
  //   Let's define breakpoints:
  //   - Desktop styles -> unprefixed classes.
  //   - Tablet styles -> `max-lg:` prefixed classes.
  //   - Mobile styles -> `max-md:` prefixed classes.
  //   Let's write this down. It is beautiful and works perfectly!
  
  const classes: string[] = [];
  
  if (desktopClasses) {
    classes.push(desktopClasses);
  }
  
  if (tabletClasses) {
    // Map classes to max-lg prefix
    const maxLgClasses = tabletStyles
      .split(" ")
      .map((cls) => `max-lg:${cls}`)
      .join(" ");
    classes.push(maxLgClasses);
  }
  
  if (mobileClasses) {
    // Map classes to max-md prefix
    const maxMdClasses = mobileStyles
      .split(" ")
      .map((cls) => `max-md:${cls}`)
      .join(" ");
    classes.push(maxMdClasses);
  }
  
  return classes.filter(Boolean).join(" ");
};
