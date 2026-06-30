import React, { useState, useEffect, useRef, useCallback } from "react";
import { useEditorStore, createASTCommand } from "../store/useEditorStore";
import { ASTNode } from "../types";
import { findNodeById, findParentAndIndex, moveNode } from "../utils/ast";
import { getComponent } from "../components/registry";
import { getIconComponent } from "./Sidebar";
import { 
  ChevronRight, 
  ChevronDown, 
  Eye, 
  EyeOff 
} from "lucide-react";
import { message } from "antd";

interface DropIndicator {
  targetId: string;
  position: "BEFORE" | "AFTER" | "INSIDE";
}

// Find all ancestor IDs of a node in the tree
const getAncestors = (root: ASTNode, targetId: string, currentPath: string[] = []): string[] => {
  if (root.id === targetId) return currentPath;
  if (root.children) {
    for (const child of root.children) {
      const path = getAncestors(child, targetId, [...currentPath, root.id]);
      if (path.length > 0) return path;
    }
  }
  return [];
};

// Check if a target is a descendant of parent
const isDescendant = (parent: ASTNode, childId: string): boolean => {
  if (!parent.children) return false;
  if (parent.children.some((c) => c.id === childId)) return true;
  return parent.children.some((c) => isDescendant(c, childId));
};

export const ComponentTree: React.FC = () => {
  const { 
    pages, 
    activePageId, 
    selectedNodeIds, 
    setSelectedNodeIds,
    hoveredNodeId,
    setHoveredNodeId,
    executeCommand 
  } = useEditorStore();

  const activePage = pages.find((p) => p.id === activePageId);
  const rootNode = activePage?.ast;

  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set(["root"]));
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);
  const draggedNodeIdRef = useRef<string | null>(null);

  const selectedNodeId = selectedNodeIds[0] || null;

  // Auto-expand parents when selected node changes in editor
  useEffect(() => {
    if (!selectedNodeId || !rootNode) return;

    const ancestors = getAncestors(rootNode, selectedNodeId);
    if (ancestors.length > 0) {
      setExpandedNodeIds((prev) => {
        const next = new Set(prev);
        ancestors.forEach((id) => next.add(id));
        return next;
      });
    }

    // Scroll the tree item into view
    setTimeout(() => {
      const el = document.getElementById(`tree-node-${selectedNodeId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 100);
  }, [selectedNodeId, rootNode]);

  const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeIds([nodeId]);
    
    // Scroll the corresponding element in the editor canvas
    setTimeout(() => {
      const element = document.querySelector(`[data-node-id="${nodeId}"]`);
      if (element) {
        const child = element.firstElementChild || element;
        child.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 100);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    e.stopPropagation();
    draggedNodeIdRef.current = nodeId;
    e.dataTransfer.setData("text/plain", nodeId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, node: ASTNode) => {
    e.preventDefault();
    e.stopPropagation();

    const draggedId = draggedNodeIdRef.current;
    if (!draggedId || draggedId === node.id) {
      setDropIndicator(null);
      return;
    }

    // Validate descendant rule (cannot drop inside own child)
    if (rootNode) {
      const draggedNode = findNodeById(rootNode, draggedId);
      if (draggedNode && isDescendant(draggedNode, node.id)) {
        setDropIndicator(null);
        return;
      }
    }

    const canAcceptChildren = ["Container", "Row", "Column", "Flex"].includes(node.type);
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    
    let position: "BEFORE" | "AFTER" | "INSIDE";
    if (canAcceptChildren) {
      if (relativeY < rect.height * 0.3) {
        position = "BEFORE";
      } else if (relativeY > rect.height * 0.7) {
        position = "AFTER";
      } else {
        position = "INSIDE";
      }
    } else {
      if (relativeY < rect.height * 0.5) {
        position = "BEFORE";
      } else {
        position = "AFTER";
      }
    }

    setDropIndicator({ targetId: node.id, position });
  };

  const handleDragLeave = (e: React.DragEvent, nodeId: string) => {
    e.stopPropagation();
    if (dropIndicator?.targetId === nodeId) {
      setDropIndicator(null);
    }
  };

  const handleDragEnd = () => {
    setDropIndicator(null);
    draggedNodeIdRef.current = null;
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const draggedId = e.dataTransfer.getData("text/plain") || draggedNodeIdRef.current;
    if (!draggedId || !dropIndicator || !rootNode || !activePage) {
      setDropIndicator(null);
      return;
    }

    const position = dropIndicator.position;
    setDropIndicator(null);

    if (draggedId === targetId) return;

    // Find parent and index for insertion
    let finalParentId = targetId;
    let targetIndex: number | undefined = undefined;

    if (position === "INSIDE") {
      finalParentId = targetId;
      targetIndex = undefined; // appends at the end
    } else {
      const parentInfo = findParentAndIndex(rootNode, targetId);
      if (!parentInfo) return;
      finalParentId = parentInfo.parent.id;
      targetIndex = position === "BEFORE" ? parentInfo.index : parentInfo.index + 1;
    }

    // Move logic inside the AST
    const draggedNode = findNodeById(rootNode, draggedId);
    if (!draggedNode) return;

    // If we move inside the same parent and targetIndex is after current index, offset it
    const currentParentInfo = findParentAndIndex(rootNode, draggedId);
    if (
      currentParentInfo &&
      currentParentInfo.parent.id === finalParentId &&
      targetIndex !== undefined &&
      currentParentInfo.index < targetIndex
    ) {
      targetIndex = targetIndex - 1;
    }

    const newRoot = moveNode(rootNode, draggedId, finalParentId, targetIndex);
    const newPages = pages.map((p) =>
      p.id === activePageId ? { ...p, ast: newRoot } : p
    );

    executeCommand(
      createASTCommand(`Move ${draggedNode.type}`, newPages, [draggedId])
    );
    message.success(`Moved ${draggedNode.type} component.`);
  };

  // Recursive Node Renderer
  const renderTreeNode = (node: ASTNode, depth: number = 0): React.ReactNode => {
    const isSelected = selectedNodeId === node.id;
    const isHovered = hoveredNodeId === node.id;
    const isExpanded = expandedNodeIds.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    const componentDef = getComponent(node.type);
    const icon = componentDef ? getIconComponent(componentDef.metadata.icon) : null;
    const displayName = String(node.props.name || node.props.text || componentDef?.metadata.name || node.type);

    // Visual indicators for Drag & Drop
    const isIndicatorTarget = dropIndicator?.targetId === node.id;
    let itemBorderClass = "border-transparent";
    let itemBgClass = "hover:bg-gray-800/40";

    if (isIndicatorTarget) {
      if (dropIndicator.position === "BEFORE") {
        itemBorderClass = "border-t-2 border-blue-500";
      } else if (dropIndicator.position === "AFTER") {
        itemBorderClass = "border-b-2 border-blue-500";
      } else if (dropIndicator.position === "INSIDE") {
        itemBgClass = "bg-blue-600/10 border border-blue-500/50";
      }
    }

    if (isSelected) {
      itemBgClass = "bg-blue-600/20 text-blue-400 border-l-2 border-blue-500";
    } else if (isHovered) {
      itemBgClass = "bg-gray-800/60 text-gray-200";
    }

    return (
      <div key={node.id} className="flex flex-col select-none">
        {/* Node Row */}
        <div
          id={`tree-node-${node.id}`}
          onClick={() => handleNodeClick(node.id)}
          onMouseEnter={() => setHoveredNodeId(node.id)}
          onMouseLeave={() => setHoveredNodeId(null)}
          draggable={node.id !== "root"}
          onDragStart={(e) => handleDragStart(e, node.id)}
          onDragOver={(e) => handleDragOver(e, node)}
          onDragLeave={(e) => handleDragLeave(e, node.id)}
          onDrop={(e) => handleDrop(e, node.id)}
          onDragEnd={handleDragEnd}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={`group flex items-center py-2 pr-2 text-xs cursor-pointer border-y transition-all ${itemBorderClass} ${itemBgClass}`}
        >
          {/* Collapse/Expand Chevron */}
          <span className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-300 rounded shrink-0 mr-0.5">
            {node.children !== undefined ? (
              <button
                onClick={(e) => toggleExpand(node.id, e)}
                className="p-0.5 hover:bg-gray-800 rounded transition-all"
              >
                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
            ) : (
              <span className="w-2 h-2 rounded-full bg-gray-700/60 ml-0.5" />
            )}
          </span>

          {/* Component Icon */}
          <span className="text-gray-400 group-hover:text-blue-400 transition-colors shrink-0 mr-2 scale-90">
            {icon}
          </span>

          {/* Display Label */}
          <span className={`truncate font-medium flex-1 ${isSelected ? "text-blue-400 font-semibold" : "text-gray-300"}`}>
            {displayName}
          </span>

          {/* Type / ID Badge on hover */}
          <span className="opacity-0 group-hover:opacity-100 text-[9px] font-mono text-gray-500 bg-gray-900/60 px-1 py-0.2 rounded transition-opacity shrink-0 ml-2">
            {node.id}
          </span>
        </div>

        {/* Children Sub-Tree */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {node.children?.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#1f2937]/95 overflow-hidden text-gray-200">
      <div className="flex-1 overflow-y-auto py-2">
        {rootNode ? (
          renderTreeNode(rootNode, 0)
        ) : (
          <div className="p-8 text-center text-gray-500 text-xs">
            No page AST loaded.
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentTree;
