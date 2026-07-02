import { Layout, ASTNode } from "../types";

export const createDefaultLayoutRegionNode = (region: "header" | "sidebar" | "footer", name: string): ASTNode => ({
  id: `${region}-root`,
  type: "Container",
  props: {
    name,
  },
  styles: {
    desktop: {
      padding: "16px",
      backgroundColor: region === "header" ? "#1f2937" : region === "sidebar" ? "#111827" : "#1f2937",
      color: "#ffffff",
      display: "flex",
      flexDirection: region === "sidebar" ? "column" : "row",
      gap: "12px",
      width: "100%",
    },
    tablet: {
      padding: "12px",
    },
    mobile: {
      padding: "8px",
    },
  },
  children: [],
});

export const createDefaultMainLayout = (): Layout => ({
  id: "main-layout",
  name: "Main Layout",
  regions: {
    header: true,
    sidebar: true,
    footer: true,
  },
  config: {
    headerHeight: "64px",
    headerFixed: false,
    headerBg: "#1f2937",
    headerBorder: "1px solid #374151",
    headerShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    
    sidebarWidth: "240px",
    sidebarPosition: "left",
    sidebarCollapsed: false,
    sidebarBg: "#111827",
    sidebarFixed: false,
    sidebarCollapsible: true,
    sidebarCollapsedWidth: "64px",
    sidebarDefaultCollapsed: false,
    sidebarCollapseTrigger: "button",
    sidebarCollapsePosition: "center",
    sidebarAnimationDuration: "300ms",
    sidebarAnimationEasing: "ease-in-out",

    footerHeight: "48px",
    footerBg: "#1f2937",
    footerFixed: false,
    
    layoutPadding: "16px",
    layoutGap: "16px",
    layoutBg: "#0f172a",
  },
  headerAST: createDefaultLayoutRegionNode("header", "Header Region"),
  sidebarAST: createDefaultLayoutRegionNode("sidebar", "Sidebar Region"),
  footerAST: createDefaultLayoutRegionNode("footer", "Footer Region"),
});
