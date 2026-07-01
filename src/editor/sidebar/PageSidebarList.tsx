import React, { useState } from "react";
import { useEditorStore, createASTCommand } from "../store/useEditorStore";
import { Page, ASTNode } from "../types";
import { 
  FileText, 
  Plus, 
  Home, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Edit3, 
  Check, 
  X, 
  Search,
  Globe
} from "lucide-react";
import { message } from "antd";

const createDefaultRootNode = (): ASTNode => ({
  id: "root",
  type: "Container",
  props: {
    name: "Body Container",
    padding: "24px",
    backgroundColor: "#ffffff font-sans",
  },
  styles: {
    desktop: {
      minHeight: "100vh",
      backgroundColor: "#ffffff",
      padding: "24px",
      display: "flex",
      flexDirection: "column",
    },
    tablet: {},
    mobile: {},
  },
  children: [],
});

export const PageSidebarList: React.FC = () => {
  const { 
    pages, 
    activePageId, 
    setActivePageId, 
    executeCommand 
  } = useEditorStore();

  const [searchQuery, setSearchQuery] = useState("");
  
  // Creation States
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPath, setNewPath] = useState("");

  // Edit States
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPath, setEditPath] = useState("");

  // Search Filter
  const filteredPages = pages.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to generate a unique route path
  const makeUniquePath = (basePath: string, currentPages: Page[]): string => {
    let path = basePath.startsWith("/") ? basePath : `/${basePath}`;
    let uniquePath = path;
    let counter = 1;
    while (currentPages.some(p => p.path === uniquePath)) {
      uniquePath = `${path}-${counter}`;
      counter++;
    }
    return uniquePath;
  };

  // Helper to update AST links when a page path/id is affected
  const updatePageReferencesInAST = (node: ASTNode, pageId: string, action: "update" | "delete", newPath?: string): ASTNode => {
    const updatedProps = { ...node.props };
    
    // Update link props if pointing to this page
    if (updatedProps.linkToPageId === pageId) {
      if (action === "delete") {
        delete updatedProps.linkToPageId;
        delete updatedProps.linkRouteParams;
        delete updatedProps.linkQueryParams;
        delete updatedProps.linkNewTab;
      }
    }

    // Update navigate actions in events if pointing to this page
    const updatedEvents = node.events?.map(evt => {
      const updatedActions = evt.actions.map(act => {
        if (act.type === "navigate" && act.params.targetPageId === pageId) {
          if (action === "delete") {
            // Keep the action but reset the page target
            return {
              ...act,
              params: {
                ...act.params,
                targetPageId: "",
              }
            };
          }
        }
        return act;
      });
      return {
        ...evt,
        actions: updatedActions,
      };
    });

    const updatedChildren = node.children?.map(child => 
      updatePageReferencesInAST(child, pageId, action, newPath)
    );

    return {
      ...node,
      props: updatedProps,
      events: updatedEvents,
      children: updatedChildren,
    };
  };

  const handleCreatePage = () => {
    if (!newName.trim()) {
      message.error("Page name is required");
      return;
    }
    const pathCandidate = newPath.trim() ? newPath.trim() : `/${newName.toLowerCase().replace(/\s+/g, "-")}`;
    const formattedPath = makeUniquePath(pathCandidate, pages);

    const newPageObj: Page = {
      id: `page-${Math.random().toString(36).substr(2, 9)}`,
      name: newName.trim(),
      path: formattedPath,
      ast: createDefaultRootNode(),
      stateSchema: [],
    };

    const nextPages = [...pages, newPageObj];
    const command = createASTCommand(`Create Page "${newName}"`, nextPages, []);
    executeCommand(command);

    // Reset Creation inputs
    setNewName("");
    setNewPath("");
    setIsCreating(false);
    setActivePageId(newPageObj.id);
    message.success(`Page "${newPageObj.name}" created at ${newPageObj.path}`);
  };

  const handleStartEdit = (page: Page) => {
    setEditingPageId(page.id);
    setEditName(page.name);
    setEditPath(page.path);
  };

  const handleSaveEdit = (pageId: string) => {
    if (!editName.trim()) {
      message.error("Page name cannot be empty");
      return;
    }
    let pathCandidate = editPath.trim();
    if (!pathCandidate.startsWith("/")) {
      pathCandidate = `/${pathCandidate}`;
    }

    // Verify uniqueness excluding current page
    const routeConflict = pages.some(p => p.id !== pageId && p.path === pathCandidate);
    if (routeConflict) {
      message.error("Another page is already using this route path");
      return;
    }

    const nextPages = pages.map(p => {
      if (p.id === pageId) {
        return {
          ...p,
          name: editName.trim(),
          path: pathCandidate,
        };
      }
      return p;
    });

    const command = createASTCommand("Update Page Settings", nextPages, []);
    executeCommand(command);
    setEditingPageId(null);
    message.success("Page settings updated");
  };

  const handleDuplicatePage = (page: Page) => {
    const copyName = `${page.name} Copy`;
    const copyPath = makeUniquePath(`${page.path}-copy`, pages);
    const copyId = `page-${Math.random().toString(36).substr(2, 9)}`;

    // Deep copy the page AST
    const copyAST = JSON.parse(JSON.stringify(page.ast)) as ASTNode;

    const copyPageObj: Page = {
      id: copyId,
      name: copyName,
      path: copyPath,
      ast: copyAST,
      stateSchema: page.stateSchema ? JSON.parse(JSON.stringify(page.stateSchema)) : [],
    };

    const nextPages = [...pages, copyPageObj];
    const command = createASTCommand(`Duplicate Page "${page.name}"`, nextPages, []);
    executeCommand(command);
    setActivePageId(copyId);
    message.success(`Duplicated "${page.name}" as "${copyName}"`);
  };

  const handleDeletePage = (pageId: string, pageName: string) => {
    if (pages.length <= 1) {
      message.warning("A project must contain at least one page.");
      return;
    }

    if (!confirm(`Are you sure you want to delete page "${pageName}"? This cannot be undone.`)) {
      return;
    }

    // 1. Filter out the deleted page
    let nextPages = pages.filter(p => p.id !== pageId);

    // 2. Clear navigation references to this deleted page across all remaining page ASTs
    nextPages = nextPages.map(p => ({
      ...p,
      ast: updatePageReferencesInAST(p.ast, pageId, "delete"),
    }));

    // 3. Update active page if deleted page was active
    if (activePageId === pageId) {
      setActivePageId(nextPages[0].id);
    }

    const command = createASTCommand(`Delete Page "${pageName}"`, nextPages, []);
    executeCommand(command);
    message.success(`Page "${pageName}" deleted`);
  };

  const handleSetHome = (pageId: string) => {
    const targetPage = pages.find(p => p.id === pageId);
    if (!targetPage) return;

    const nextPages = pages.map(p => {
      if (p.id === pageId) {
        return { ...p, path: "/" };
      }
      if (p.path === "/") {
        // Shift old home page route to a unique non-home route
        const uniqueShifted = makeUniquePath(`/home-old`, pages);
        return { ...p, path: uniqueShifted };
      }
      return p;
    });

    const command = createASTCommand(`Set "${targetPage.name}" as Home Page`, nextPages, []);
    executeCommand(command);
    message.success(`"${targetPage.name}" is now the Home Page (/)`);
  };

  const handleMovePage = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    const nextPages = [...pages];
    const temp = nextPages[index];
    nextPages[index] = nextPages[targetIndex];
    nextPages[targetIndex] = temp;

    const command = createASTCommand("Reorder Pages", nextPages, []);
    executeCommand(command);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden text-gray-300">
      {/* Top Search & Create controls */}
      <div className="p-3 border-b border-gray-800 space-y-2 shrink-0 bg-gray-900/10">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111827] border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 outline-none transition-all"
          />
        </div>

        {!isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center justify-center space-x-1.5 transition-all shadow"
          >
            <Plus size={13} />
            <span>Create New Page</span>
          </button>
        ) : (
          <div className="p-2.5 bg-[#111827] border border-gray-800 rounded space-y-2.5 animate-fadeIn">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">New Page Details</h4>
            <div className="space-y-1">
              <input
                type="text"
                placeholder="Page Name (e.g. About)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-gray-950 border border-gray-850 focus:border-blue-500 rounded px-2.5 py-1 text-xs text-gray-200 outline-none"
              />
            </div>
            <div className="space-y-1">
              <input
                type="text"
                placeholder="Route Path (e.g. /about)"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                className="w-full bg-gray-950 border border-gray-850 focus:border-blue-500 rounded px-2.5 py-1 text-xs text-gray-200 outline-none font-mono"
              />
            </div>
            <div className="flex space-x-2 pt-1">
              <button
                onClick={handleCreatePage}
                className="flex-1 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-all"
              >
                Create
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pages List Area */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {filteredPages.map((page, idx) => {
          const isActive = page.id === activePageId;
          const isHome = page.path === "/";
          const isEditing = editingPageId === page.id;

          if (isEditing) {
            return (
              <div key={page.id} className="p-2.5 bg-gray-900/60 border border-blue-600/50 rounded-lg space-y-2 animate-fadeIn">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-850 rounded px-2.5 py-1 text-xs text-gray-200 outline-none"
                />
                <input
                  type="text"
                  value={editPath}
                  onChange={(e) => setEditPath(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-850 rounded px-2.5 py-1 text-xs text-gray-200 outline-none font-mono"
                />
                <div className="flex space-x-1.5 justify-end pt-1">
                  <button
                    onClick={() => handleSaveEdit(page.id)}
                    className="p-1 rounded bg-green-700/80 hover:bg-green-600 text-white transition-all"
                    title="Save"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={() => setEditingPageId(null)}
                    className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 transition-all"
                    title="Cancel"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={page.id}
              onClick={() => setActivePageId(page.id)}
              className={`p-2.5 rounded-lg border group relative flex items-center justify-between transition-all cursor-pointer select-none ${
                isActive 
                  ? "bg-blue-600/10 border-blue-500/55 text-white" 
                  : "bg-gray-900/20 border-gray-850 hover:bg-gray-900/40 hover:border-gray-800 text-gray-400 hover:text-gray-200"
              }`}
            >
              <div className="flex items-center space-x-2.5 overflow-hidden pr-10">
                {isHome ? (
                  <Home size={14} className={isActive ? "text-blue-400" : "text-gray-500"} />
                ) : (
                  <FileText size={14} className={isActive ? "text-blue-400" : "text-gray-500"} />
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold truncate">{page.name}</span>
                  <span className="text-[10px] text-gray-500 font-mono truncate">{page.path}</span>
                </div>
              </div>

              {/* Action Buttons (visible on hover) */}
              <div className="absolute right-2 top-2.5 flex items-center space-x-1 bg-gradient-to-l from-gray-900/90 via-gray-900/80 to-transparent pl-4 pr-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Move Up */}
                <button
                  disabled={idx === 0}
                  onClick={(e) => { e.stopPropagation(); handleMovePage(idx, "up"); }}
                  className={`p-0.5 hover:bg-gray-800 rounded transition-colors ${idx === 0 ? "opacity-25 cursor-not-allowed" : "text-gray-400 hover:text-gray-200"}`}
                  title="Move Page Up"
                >
                  <ArrowUp size={11} />
                </button>

                {/* Move Down */}
                <button
                  disabled={idx === pages.length - 1}
                  onClick={(e) => { e.stopPropagation(); handleMovePage(idx, "down"); }}
                  className={`p-0.5 hover:bg-gray-800 rounded transition-colors ${idx === pages.length - 1 ? "opacity-25 cursor-not-allowed" : "text-gray-400 hover:text-gray-200"}`}
                  title="Move Page Down"
                >
                  <ArrowDown size={11} />
                </button>

                {/* Set Home */}
                {!isHome && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSetHome(page.id); }}
                    className="p-0.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded transition-colors"
                    title="Set as Home Page"
                  >
                    <Globe size={11} />
                  </button>
                )}

                {/* Rename / Edit Settings */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleStartEdit(page); }}
                  className="p-0.5 text-gray-400 hover:text-yellow-400 hover:bg-gray-800 rounded transition-colors"
                  title="Edit Page"
                >
                  <Edit3 size={11} />
                </button>

                {/* Duplicate */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDuplicatePage(page); }}
                  className="p-0.5 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded transition-colors"
                  title="Duplicate Page"
                >
                  <Copy size={11} />
                </button>

                {/* Delete */}
                <button
                  disabled={pages.length <= 1}
                  onClick={(e) => { e.stopPropagation(); handleDeletePage(page.id, page.name); }}
                  className={`p-0.5 rounded transition-colors ${pages.length <= 1 ? "opacity-25 cursor-not-allowed" : "text-gray-400 hover:text-red-400 hover:bg-gray-800"}`}
                  title="Delete Page"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredPages.length === 0 && (
          <div className="text-center py-6 text-xs text-gray-500 font-medium">
            No pages match search filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default PageSidebarList;
