import React, { useState } from "react";
import { DndContext, DragOverlay, DragStartEvent, DragEndEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { useEditorStore, createASTCommand } from "./store/useEditorStore";
import { getComponent } from "./components/registry";
import { insertNode, findNodeById, generateId, findParentAndIndex, removeNode, cloneASTNode, moveNode } from "./utils/ast";
import Sidebar, { getIconComponent } from "./sidebar/Sidebar";
import Canvas from "./canvas/Canvas";
import Properties from "./properties/Properties";
import { 
  Undo2, 
  Redo2, 
  Code, 
  RotateCcw,
  Sparkles,
  Trash2,
  Copy,
  Clipboard,
  Play,
  Edit3
} from "lucide-react";
import { message, Modal } from "antd";
import { generateFullPageCode } from "./generator/codeGenerator";
import { ASTNode } from "./types";
import { highlightJSX } from "./utils/highlighter";
import { RuntimeProvider } from "./runtime/RuntimeProvider";

export const EditorLayout: React.FC = () => {
  const {
    pages,
    activePageId,
    selectedNodeIds,
    setSelectedNodeIds,
    clipboard,
    setClipboard,
    executeCommand,
    undo,
    redo,
    canUndo,
    canRedo,
    resetProject,
    isPreviewMode,
    setIsPreviewMode,
  } = useEditorStore();

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Actions: Delete, Copy, Paste
  const handleDelete = () => {
    if (selectedNodeIds.length === 0) return;
    const selectedId = selectedNodeIds[0];
    if (selectedId === "root") {
      message.warning("Cannot delete the root body container.");
      return;
    }

    const activePage = pages.find((p) => p.id === activePageId);
    if (!activePage) return;

    const result = removeNode(activePage.ast, selectedId);
    if (result) {
      const { newRoot, deletedNode, parentId, index } = result;
      const nextPages = pages.map((p) =>
        p.id === activePageId ? { ...p, ast: newRoot } : p
      );

      const command = {
        name: `Delete ${deletedNode.type}`,
        execute: () => {
          useEditorStore.setState({
            pages: nextPages,
            selectedNodeIds: [],
          });
        },
        undo: () => {
          const restoredRoot = insertNode(activePage.ast, parentId, deletedNode, index);
          const restoredPages = pages.map((p) =>
            p.id === activePageId ? { ...p, ast: restoredRoot } : p
          );
          useEditorStore.setState({
            pages: restoredPages,
            selectedNodeIds: [selectedId],
          });
        },
      };

      executeCommand(command);
      message.success(`Deleted ${deletedNode.type} component.`);
    }
  };

  const handleCopy = () => {
    if (selectedNodeIds.length === 0) return;
    const selectedId = selectedNodeIds[0];
    
    const activePage = pages.find((p) => p.id === activePageId);
    if (!activePage) return;

    const nodeToCopy = findNodeById(activePage.ast, selectedId);
    if (!nodeToCopy) return;

    const clonedNode = cloneASTNode(nodeToCopy);
    setClipboard([clonedNode]);
    message.success(`Copied ${nodeToCopy.type} to clipboard.`);
  };

  const handlePaste = () => {
    if (!clipboard || clipboard.length === 0) {
      message.warning("Clipboard is empty.");
      return;
    }

    const activePage = pages.find((p) => p.id === activePageId);
    if (!activePage) return;

    let targetParentId = "root";
    let pasteIndex: number | undefined = undefined;

    if (selectedNodeIds.length > 0) {
      const selectedId = selectedNodeIds[0];
      const selectedNode = findNodeById(activePage.ast, selectedId);
      
      if (selectedNode) {
        const def = getComponent(selectedNode.type);
        if (def?.validator?.canAcceptChild && ["Container", "Row", "Column"].includes(selectedNode.type)) {
          targetParentId = selectedId;
        } else {
          const parentInfo = findParentAndIndex(activePage.ast, selectedId);
          if (parentInfo) {
            targetParentId = parentInfo.parent.id;
            pasteIndex = parentInfo.index + 1;
          }
        }
      }
    }

    const assignNewIds = (n: ASTNode): ASTNode => {
      const cloned = JSON.parse(JSON.stringify(n)) as ASTNode;
      cloned.id = `${n.type.toLowerCase()}-${generateId()}`;
      if (cloned.children) {
        cloned.children = cloned.children.map(assignNewIds);
      }
      return cloned;
    };

    const nodeToPaste = assignNewIds(clipboard[0]);

    const targetParentNode = findNodeById(activePage.ast, targetParentId);
    if (!targetParentNode) return;

    const parentDef = getComponent(targetParentNode.type);
    if (
      parentDef?.validator?.canAcceptChild &&
      !parentDef.validator.canAcceptChild(nodeToPaste.type)
    ) {
      message.warning(`${targetParentNode.type} cannot accept ${nodeToPaste.type} children.`);
      return;
    }

    const itemDef = getComponent(nodeToPaste.type);
    if (
      itemDef?.validator?.canBeDroppedIn &&
      !itemDef.validator.canBeDroppedIn(targetParentNode.type)
    ) {
      message.warning(`${nodeToPaste.type} cannot be dropped inside ${targetParentNode.type}.`);
      return;
    }

    const newRoot = insertNode(activePage.ast, targetParentId, nodeToPaste, pasteIndex);
    const newPages = pages.map((p) =>
      p.id === activePageId ? { ...p, ast: newRoot } : p
    );

    const command = createASTCommand(
      `Paste ${nodeToPaste.type}`,
      newPages,
      [nodeToPaste.id]
    );

    executeCommand(command);
    message.success(`Pasted ${nodeToPaste.type} component.`);
  };

  // Keyboard Shortcuts Handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.hasAttribute("contenteditable"))
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      if (
        (cmdOrCtrl && e.key.toLowerCase() === "y") ||
        (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault();
        redo();
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDelete();
      }

      if (cmdOrCtrl && e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopy();
      }

      if (cmdOrCtrl && e.key.toLowerCase() === "v") {
        e.preventDefault();
        handlePaste();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, activePageId, selectedNodeIds, clipboard]);

  const handleDragStart = (event: DragStartEvent) => {
    if (isPreviewMode) return;
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (isPreviewMode) return;
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) return;

    const targetId = over.id as string;
    const activeIdStr = active.id as string;

    const activePage = pages.find((p) => p.id === activePageId);
    if (!activePage) return;

    // Resolve the final target parent node and insertion index
    // If the target is a leaf element, insert next to it inside its parent container
    let finalParentId = targetId;
    let targetIndex: number | undefined = undefined;

    const targetNode = findNodeById(activePage.ast, targetId);
    if (!targetNode) return;

    const isLeafTarget = !["Container", "Row", "Column"].includes(targetNode.type);
    const targetParentInfo = findParentAndIndex(activePage.ast, targetId);

    if (isLeafTarget && targetParentInfo) {
      finalParentId = targetParentInfo.parent.id;
      targetIndex = targetParentInfo.index;
    }

    const parentNode = findNodeById(activePage.ast, finalParentId);
    if (!parentNode) {
      message.error("Target container not found.");
      return;
    }

    const parentDef = getComponent(parentNode.type);

    // 1. Drop coming from the Library
    if (activeIdStr.startsWith("library-")) {
      const componentType = active.data.current?.type;
      if (!componentType) return;

      const componentDef = getComponent(componentType);
      if (!componentDef) return;

      // Validate component dropping hierarchy rules
      if (
        parentDef?.validator?.canAcceptChild &&
        !parentDef.validator.canAcceptChild(componentType)
      ) {
        message.warning(`${parentNode.type} cannot accept ${componentType} children.`);
        return;
      }

      if (
        componentDef.validator?.canBeDroppedIn &&
        !componentDef.validator.canBeDroppedIn(parentNode.type)
      ) {
        message.warning(`${componentType} cannot be dropped inside ${parentNode.type}.`);
        return;
      }

      // Create new AST node
      const newNode = {
        id: `${componentType.toLowerCase()}-${generateId()}`,
        type: componentType,
        props: JSON.parse(JSON.stringify(componentDef.defaultProps)),
        styles: {
          desktop: JSON.parse(JSON.stringify(componentDef.defaultStyles)),
          tablet: {},
          mobile: {},
        },
        children: ["Container", "Row", "Column"].includes(componentType) ? [] : undefined,
      };

      const newRoot = insertNode(activePage.ast, finalParentId, newNode, targetIndex);
      const newPages = pages.map((p) =>
        p.id === activePageId ? { ...p, ast: newRoot } : p
      );

      executeCommand(
        createASTCommand(`Add ${componentType}`, newPages, [newNode.id])
      );
      message.success(`Added ${componentType} component.`);
    } else {
      // 2. Drag/Move/Reorder on the Canvas itself
      const draggedNode = findNodeById(activePage.ast, activeIdStr);
      if (!draggedNode) return;

      // Prevent dropping onto itself or one of its descendants
      if (draggedNode.id === parentNode.id) return;

      const isDescendant = (parent: ASTNode, childId: string): boolean => {
        if (!parent.children) return false;
        if (parent.children.some((c) => c.id === childId)) return true;
        return parent.children.some((c) => isDescendant(c, childId));
      };

      if (isDescendant(draggedNode, parentNode.id)) {
        message.warning("Cannot drop a parent element inside its own child.");
        return;
      }

      // Validate constraints
      const componentDef = getComponent(draggedNode.type);
      if (
        parentDef?.validator?.canAcceptChild &&
        !parentDef.validator.canAcceptChild(draggedNode.type)
      ) {
        message.warning(`${parentNode.type} cannot accept ${draggedNode.type} children.`);
        return;
      }

      if (
        componentDef?.validator?.canBeDroppedIn &&
        !componentDef.validator.canBeDroppedIn(parentNode.type)
      ) {
        message.warning(`${draggedNode.type} cannot be dropped inside ${parentNode.type}.`);
        return;
      }

      // If we move inside the same parent and insert at targetIndex,
      // adjust targetIndex because detaching the node might shift the siblings' indices!
      const currentParentInfo = findParentAndIndex(activePage.ast, activeIdStr);
      if (
        currentParentInfo &&
        currentParentInfo.parent.id === finalParentId &&
        targetIndex !== undefined &&
        currentParentInfo.index < targetIndex
      ) {
        targetIndex = targetIndex - 1;
      }

      const newRoot = moveNode(activePage.ast, activeIdStr, finalParentId, targetIndex);
      const newPages = pages.map((p) =>
        p.id === activePageId ? { ...p, ast: newRoot } : p
      );

      executeCommand(
        createASTCommand(`Move ${draggedNode.type}`, newPages, [activeIdStr])
      );
      message.success(`Reordered ${draggedNode.type} component.`);
    }
  };

  // JSON Import & Export Actions
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && Array.isArray(json.pages) && json.activePageId) {
          useEditorStore.setState({
            pages: json.pages,
            activePageId: json.activePageId,
            selectedNodeIds: [],
          });
          message.success("Project imported successfully!");
        } else {
          message.error("Invalid project file format.");
        }
      } catch {
        message.error("Failed to parse project file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExportJSON = () => {
    const state = useEditorStore.getState();
    const projectData = {
      pages: state.pages,
      activePageId: state.activePageId,
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `project-${activePageId}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success("Project exported as JSON.");
  };

  // Export React Code Modal State & Actions
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  const handleOpenExportModal = () => {
    const activePage = pages.find((p) => p.id === activePageId);
    if (!activePage) return;
    const code = generateFullPageCode(activePage.ast, activePage.name.replace(/\s+/g, ""), activePage.stateSchema);
    setGeneratedCode(code);
    setIsExportModalOpen(true);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    message.success("Code copied to clipboard!");
  };

  const handleDownloadCode = () => {
    const activePage = pages.find((p) => p.id === activePageId);
    const fileName = activePage ? `${activePage.name.replace(/\s+/g, "")}.tsx` : "Page.tsx";
    const blob = new Blob([generatedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success(`Downloaded ${fileName}`);
  };

  const getDraggedComponentInfo = () => {
    if (!activeDragId) return null;
    if (activeDragId.startsWith("library-")) {
      const type = activeDragId.replace("library-", "");
      return getComponent(type);
    }
    const activePage = pages.find((p) => p.id === activePageId);
    if (!activePage) return null;
    const node = findNodeById(activePage.ast, activeDragId);
    if (!node) return null;
    return getComponent(node.type);
  };

  const draggedComp = getDraggedComponentInfo();

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#111827] text-white">
        {/* Top Header */}
        <header className="h-16 bg-[#1f2937]/95 border-b border-gray-800 flex items-center justify-between px-6 z-35 shrink-0 select-none backdrop-blur">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg shadow-lg">
              <Sparkles size={18} className="text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                Antigravity Website Builder
              </h1>
              <p className="text-[10px] text-gray-500 font-medium">Clean Architecture Edition</p>
            </div>
          </div>

          {/* Center Toolbar (Undo/Redo & Actions) */}
          <div className="flex items-center space-x-2">
            <button
              onClick={undo}
              disabled={!canUndo()}
              className={`p-2 rounded-md border border-gray-800 bg-gray-900/60 hover:bg-gray-800 transition-all ${
                !canUndo() ? "opacity-35 cursor-not-allowed" : "text-gray-300 hover:text-white"
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo()}
              className={`p-2 rounded-md border border-gray-800 bg-gray-900/60 hover:bg-gray-800 transition-all ${
                !canRedo() ? "opacity-35 cursor-not-allowed" : "text-gray-300 hover:text-white"
              }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={16} />
            </button>

            <span className="w-px h-6 bg-gray-850 mx-1" />

            <button
              onClick={handleCopy}
              disabled={selectedNodeIds.length === 0}
              className={`p-2 rounded-md border border-gray-800 bg-gray-900/60 hover:bg-gray-800 transition-all ${
                selectedNodeIds.length === 0 ? "opacity-35 cursor-not-allowed" : "text-gray-300 hover:text-white"
              }`}
              title="Copy (Ctrl+C)"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={handlePaste}
              disabled={!clipboard || clipboard.length === 0}
              className={`p-2 rounded-md border border-gray-800 bg-gray-900/60 hover:bg-gray-800 transition-all ${
                !clipboard || clipboard.length === 0 ? "opacity-35 cursor-not-allowed" : "text-gray-300 hover:text-white"
              }`}
              title="Paste (Ctrl+V)"
            >
              <Clipboard size={16} />
            </button>
            <button
              onClick={handleDelete}
              disabled={selectedNodeIds.length === 0 || selectedNodeIds[0] === "root"}
              className={`p-2 rounded-md border border-gray-800 bg-gray-900/60 hover:bg-red-950/30 transition-all ${
                selectedNodeIds.length === 0 || selectedNodeIds[0] === "root" 
                  ? "opacity-35 cursor-not-allowed" 
                  : "text-red-400 hover:text-red-300 hover:border-red-950/60"
              }`}
              title="Delete (Delete)"
            >
              <Trash2 size={16} />
            </button>

            <span className="w-px h-6 bg-gray-800 mx-2" />

            {/* Reset Project Button */}
            <button
              onClick={() => {
                if (confirm("Are you sure you want to reset the project? All progress will be lost.")) {
                  resetProject();
                  message.info("Project reset successfully.");
                }
              }}
              className="p-2 rounded-md border border-gray-800 bg-gray-900/60 hover:bg-red-950/40 text-gray-400 hover:text-red-400 hover:border-red-900/60 transition-all text-xs flex items-center space-x-1.5"
              title="Reset Project"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {/* Play/Design Toggle */}
            <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-850 space-x-1 mr-2">
              <button
                onClick={() => setIsPreviewMode(false)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  !isPreviewMode
                    ? "bg-blue-600/90 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-900/40"
                }`}
                title="Design Mode"
              >
                <Edit3 size={12} />
                <span>Design</span>
              </button>
              <button
                onClick={() => {
                  setSelectedNodeIds([]); // Clear selections in preview mode
                  setIsPreviewMode(true);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  isPreviewMode
                    ? "bg-green-600/90 text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-900/40"
                }`}
                title="Preview Interactivity"
              >
                <Play size={12} />
                <span>Preview</span>
              </button>
            </div>
            {/* Import JSON */}
            <label className="px-3 py-1.5 rounded-lg border border-gray-800 bg-gray-900/60 hover:bg-gray-850 hover:text-white font-medium text-xs text-gray-400 cursor-pointer transition-all">
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>

            {/* Export JSON */}
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-lg border border-gray-800 bg-gray-900/60 hover:bg-gray-850 hover:text-white font-medium text-xs text-gray-400 transition-all"
            >
              Export JSON
            </button>

            {/* Generate & Export Code Button */}
            <button
              onClick={handleOpenExportModal}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-medium text-xs text-white shadow-lg shadow-blue-500/20 flex items-center space-x-2 transition-all"
            >
              <Code size={14} />
              <span>Export React Code</span>
            </button>
          </div>
        </header>

        {/* Editor Main Split View */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Sidebar */}
          <Sidebar />

          {/* Center Canvas */}
          <RuntimeProvider>
            <Canvas />
          </RuntimeProvider>

          {/* Right Sidebar */}
          <Properties />
        </div>
      </div>

      {/* Drag Overlay (Visual helper while dragging) */}
      <DragOverlay>
        {draggedComp ? (
          <div className="px-4 py-2 bg-blue-600/90 text-white rounded-lg border border-blue-400 shadow-2xl opacity-90 text-xs font-semibold flex items-center space-x-2.5 pointer-events-none cursor-grabbing backdrop-blur-sm">
            {getIconComponent(draggedComp.metadata.icon)}
            <span>{draggedComp.metadata.name}</span>
          </div>
        ) : null}
      </DragOverlay>

      {/* Export Code Modal */}
      <Modal
        title={
          <div className="text-gray-200 font-semibold flex items-center space-x-2">
            <Code className="text-blue-500" size={18} />
            <span>Generated React & Tailwind CSS Code</span>
          </div>
        }
        open={isExportModalOpen}
        onCancel={() => setIsExportModalOpen(false)}
        width={800}
        className="dark-theme-modal"
        footer={[
          <button
            key="copy"
            onClick={handleCopyCode}
            className="px-4 py-2 mr-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 hover:border-gray-500 text-xs font-semibold transition-all"
          >
            Copy Code
          </button>,
          <button
            key="download"
            onClick={handleDownloadCode}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-all"
          >
            Download .tsx File
          </button>,
        ]}
        styles={{
          mask: { backdropFilter: "blur(4px)" },
        }}
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-400">
            Copy and paste this clean, responsive component code directly into your React/Next.js and Tailwind CSS project:
          </p>
          
          {/* IDE-style Window Wrapper */}
          <div className="rounded-lg border border-gray-800 bg-[#0d1117] overflow-hidden shadow-2xl">
            {/* macOS Window Header */}
            <div className="bg-[#161b22] px-4 py-3 flex items-center justify-between border-b border-gray-800 select-none">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
              <span className="text-xs text-gray-400 font-mono">Page.tsx</span>
              <div className="w-12" /> {/* Spacer */}
            </div>
            
            {/* Code Body */}
            <pre className="p-5 text-xs font-mono text-gray-300 overflow-x-auto max-h-[55vh] whitespace-pre overflow-y-auto leading-relaxed select-all">
              <code dangerouslySetInnerHTML={{ __html: highlightJSX(generatedCode) }} />
            </pre>
          </div>
        </div>
      </Modal>
    </DndContext>
  );
};

export default EditorLayout;
