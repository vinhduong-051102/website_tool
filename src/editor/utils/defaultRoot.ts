import { ASTNode } from "../types";

export const createDefaultRootNode = (): ASTNode => ({
  id: "root",
  type: "Container",
  props: {
    name: "Body Container",
  },
  styles: {
    desktop: {
      minHeight: "100vh",
      padding: "24px",
      backgroundColor: "#1f2937", // bg-gray-800
      color: "#ffffff",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
    tablet: {
      padding: "16px",
    },
    mobile: {
      padding: "12px",
    },
  },
  children: [],
});
