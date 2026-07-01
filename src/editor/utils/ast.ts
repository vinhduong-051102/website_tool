import { ASTNode, Breakpoint, Layout } from "../types";

export interface NodeContainerResult {
  target: "page" | "header" | "sidebar" | "footer";
  root: ASTNode;
}

export const findNodeContainer = (
  pageAST: ASTNode,
  layout: Layout | null,
  nodeId: string
): NodeContainerResult | null => {
  if (findNodeById(pageAST, nodeId)) {
    return { target: "page", root: pageAST };
  }
  if (layout) {
    if (layout.regions.header && findNodeById(layout.headerAST, nodeId)) {
      return { target: "header", root: layout.headerAST };
    }
    if (layout.regions.sidebar && findNodeById(layout.sidebarAST, nodeId)) {
      return { target: "sidebar", root: layout.sidebarAST };
    }
    if (layout.regions.footer && findNodeById(layout.footerAST, nodeId)) {
      return { target: "footer", root: layout.footerAST };
    }
  }
  return null;
};

// Helper to generate unique IDs
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Deep clone a node and optionally regenerate IDs (crucial for Copy/Paste)
export const cloneASTNode = (node: ASTNode, regenerateIds = false): ASTNode => {
  const cloned: ASTNode = {
    id: regenerateIds ? generateId() : node.id,
    type: node.type,
    props: JSON.parse(JSON.stringify(node.props)),
    styles: JSON.parse(JSON.stringify(node.styles)),
  };

  if (node.children) {
    cloned.children = node.children.map((child) =>
      cloneASTNode(child, regenerateIds)
    );
  }

  return cloned;
};

// Find a node by ID in the tree
export const findNodeById = (root: ASTNode, id: string): ASTNode | null => {
  if (root.id === id) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
};

// Find parent and index of a node
export const findParentAndIndex = (
  root: ASTNode,
  id: string
): { parent: ASTNode; index: number } | null => {
  if (!root.children) return null;
  
  const index = root.children.findIndex((child) => child.id === id);
  if (index !== -1) {
    return { parent: root, index };
  }

  for (const child of root.children) {
    const found = findParentAndIndex(child, id);
    if (found) return found;
  }

  return null;
};

// Insert a node at a parent with optional index
export const insertNode = (
  root: ASTNode,
  parentId: string,
  nodeToInsert: ASTNode,
  targetIndex?: number
): ASTNode => {
  const newRoot = cloneASTNode(root);
  const parent = findNodeById(newRoot, parentId);
  
  if (parent) {
    if (!parent.children) {
      parent.children = [];
    }
    const idx = targetIndex !== undefined ? targetIndex : parent.children.length;
    parent.children.splice(idx, 0, nodeToInsert);
  }
  
  return newRoot;
};

// Remove a node from the tree and return the deleted node details
export const removeNode = (
  root: ASTNode,
  id: string
): { newRoot: ASTNode; deletedNode: ASTNode; parentId: string; index: number } | null => {
  const newRoot = cloneASTNode(root);
  const result = findParentAndIndex(newRoot, id);
  
  if (result && result.parent.children) {
    const [deletedNode] = result.parent.children.splice(result.index, 1);
    return {
      newRoot,
      deletedNode,
      parentId: result.parent.id,
      index: result.index,
    };
  }
  
  return null;
};

// Update properties of a specific node
export const updateProps = (
  root: ASTNode,
  id: string,
  props: Record<string, unknown>
): ASTNode => {
  const newRoot = cloneASTNode(root);
  const target = findNodeById(newRoot, id);
  if (target) {
    target.props = { ...target.props, ...props };
  }
  return newRoot;
};

// Update styles of a specific node for a specific breakpoint
export const updateStyles = (
  root: ASTNode,
  id: string,
  styles: React.CSSProperties,
  breakpoint: Breakpoint
): ASTNode => {
  const newRoot = cloneASTNode(root);
  const target = findNodeById(newRoot, id);
  if (target) {
    target.styles = {
      ...target.styles,
      [breakpoint]: {
        ...(target.styles[breakpoint] || {}),
        ...styles,
      },
    };
  }
  return newRoot;
};

// Move a node within the tree
export const moveNode = (
  root: ASTNode,
  nodeId: string,
  targetParentId: string,
  targetIndex?: number
): ASTNode => {
  const removeResult = removeNode(root, nodeId);
  if (!removeResult) return root;

  // Insert the deleted node into the new parent
  return insertNode(
    removeResult.newRoot,
    targetParentId,
    removeResult.deletedNode,
    targetIndex
  );
};
