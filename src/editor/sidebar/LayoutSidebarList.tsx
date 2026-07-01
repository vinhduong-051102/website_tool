import React, { useState } from "react";
import { useEditorStore, createASTCommand } from "../store/useEditorStore";
import { Layout, ASTNode } from "../types";
import { 
  Layout as LayoutIcon, 
  Plus, 
  Trash2, 
  Copy, 
  Edit3, 
  Check, 
  X, 
  Search,
  Star
} from "lucide-react";
import { message, Modal } from "antd";
import { createDefaultLayoutRegionNode } from "../utils/defaultLayout";

export const LayoutSidebarList: React.FC = () => {
  const { 
    pages, 
    layouts, 
    setLayouts,
    setPages,
    executeCommand 
  } = useEditorStore();

  const [searchQuery, setSearchQuery] = useState("");
  
  // Creation States
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");

  // Edit States
  const [editingLayoutId, setEditingLayoutId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Search Filter
  const filteredLayouts = layouts.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateLayout = () => {
    if (!newName.trim()) {
      message.error("Layout name cannot be empty");
      return;
    }

    const newLayoutId = `layout-${Math.random().toString(36).substr(2, 9)}`;
    const newLayoutObj: Layout = {
      id: newLayoutId,
      name: newName.trim(),
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
    };

    // If it's the first layout, make it default
    if (layouts.length === 0) {
      newLayoutObj.isDefault = true;
    }

    const nextLayouts = [...layouts, newLayoutObj];
    
    const command = createASTCommand(
      `Create Layout "${newName}"`,
      pages,
      [],
      nextLayouts
    );
    executeCommand(command);

    setNewName("");
    setIsCreating(false);
    message.success(`Layout "${newLayoutObj.name}" created.`);
  };

  const handleStartEdit = (layout: Layout) => {
    setEditingLayoutId(layout.id);
    setEditName(layout.name);
  };

  const handleSaveEdit = (layoutId: string) => {
    if (!editName.trim()) {
      message.error("Layout name cannot be empty");
      return;
    }

    const nextLayouts = layouts.map(l => 
      l.id === layoutId ? { ...l, name: editName.trim() } : l
    );

    const command = createASTCommand(
      `Rename Layout to "${editName}"`,
      pages,
      [],
      nextLayouts
    );
    executeCommand(command);
    setEditingLayoutId(null);
    message.success("Layout renamed.");
  };

  const handleDuplicateLayout = (layout: Layout) => {
    const duplicatedId = `layout-${Math.random().toString(36).substr(2, 9)}`;
    
    // Deep clone the AST roots to prevent referencing sharing
    const cloneAST = (node: ASTNode): ASTNode => {
      const cloned = { ...node, id: `${node.type.toLowerCase()}-${Math.random().toString(36).substr(2, 9)}` };
      if (node.children) {
        cloned.children = node.children.map(cloneAST);
      }
      return cloned;
    };

    const duplicatedLayout: Layout = {
      ...layout,
      id: duplicatedId,
      name: `${layout.name} (Copy)`,
      isDefault: false,
      headerAST: cloneAST(layout.headerAST),
      sidebarAST: cloneAST(layout.sidebarAST),
      footerAST: cloneAST(layout.footerAST),
    };

    const nextLayouts = [...layouts, duplicatedLayout];
    const command = createASTCommand(
      `Duplicate Layout "${layout.name}"`,
      pages,
      [],
      nextLayouts
    );
    executeCommand(command);
    message.success(`Duplicated "${layout.name}" layout.`);
  };

  const handleSetDefault = (layoutId: string) => {
    const nextLayouts = layouts.map(l => ({
      ...l,
      isDefault: l.id === layoutId
    }));

    const command = createASTCommand(
      `Set Default Layout`,
      pages,
      [],
      nextLayouts
    );
    executeCommand(command);
    message.success("Default layout updated.");
  };

  const handleDeleteLayout = (layoutId: string, layoutName: string) => {
    if (layouts.length <= 1) {
      message.error("Cannot delete the last layout. Projects must have at least one layout.");
      return;
    }

    Modal.confirm({
      title: "Delete Layout",
      content: `Are you sure you want to delete the layout "${layoutName}"? Pages currently using this layout will revert to No Layout.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        const nextLayouts = layouts.filter(l => l.id !== layoutId);
        
        // If the deleted layout was default, make another one default
        const deletedLayout = layouts.find(l => l.id === layoutId);
        if (deletedLayout?.isDefault && nextLayouts.length > 0) {
          nextLayouts[0].isDefault = true;
        }

        // Clean references in pages
        const nextPages = pages.map(p => 
          p.layoutId === layoutId ? { ...p, layoutId: undefined } : p
        );

        const command = createASTCommand(
          `Delete Layout "${layoutName}"`,
          nextPages,
          [],
          nextLayouts
        );
        executeCommand(command);
        message.success(`Layout "${layoutName}" deleted.`);
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#111827] text-gray-200">
      {/* Header Controls */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Layout Manager
        </span>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1.5 rounded-md hover:bg-gray-800 text-blue-400 hover:text-white transition-colors"
          title="Create New Layout"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Creation Input Form */}
      {isCreating && (
        <div className="p-3 bg-gray-900/50 border-b border-gray-800 space-y-2.5 shrink-0">
          <div>
            <label className="block text-[10px] text-gray-400 font-medium mb-1">Layout Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Admin Dashboard Layout"
              className="w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-1 text-xs text-gray-200 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 text-xs">
            <button
              onClick={() => setIsCreating(false)}
              className="px-2.5 py-1 rounded hover:bg-gray-800 text-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateLayout}
              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="p-2 border-b border-gray-800 shrink-0">
        <div className="relative">
          <span className="absolute left-2.5 top-2.5 text-gray-500">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search layouts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded pl-8 pr-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-gray-700"
          />
        </div>
      </div>

      {/* Layouts List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
        {filteredLayouts.length === 0 ? (
          <div className="text-center text-xs text-gray-500 py-6">
            No layouts found.
          </div>
        ) : (
          filteredLayouts.map((layout) => {
            const isEditing = editingLayoutId === layout.id;
            const pagesUsingLayout = pages.filter(p => p.layoutId === layout.id).length;

            return (
              <div
                key={layout.id}
                className="group relative flex flex-col p-2.5 rounded-lg border border-gray-800/60 bg-gray-900/10 hover:bg-gray-900/30 hover:border-gray-800 transition-all"
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditingLayoutId(null)}
                        className="p-1 rounded hover:bg-gray-800 text-gray-400"
                      >
                        <X size={14} />
                      </button>
                      <button
                        onClick={() => handleSaveEdit(layout.id)}
                        className="p-1 rounded hover:bg-gray-800 text-green-400"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded bg-gray-800 text-gray-400 shrink-0">
                        <LayoutIcon size={14} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-gray-200">
                            {layout.name}
                          </span>
                          {layout.isDefault && (
                            <span className="text-[9px] font-mono px-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                              <Star size={8} className="fill-amber-400" />
                              default
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500">
                          {pagesUsingLayout === 1 
                            ? "1 page linked" 
                            : `${pagesUsingLayout} pages linked`}
                        </span>
                      </div>
                    </div>

                    {/* Hover Actions */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!layout.isDefault && (
                        <button
                          onClick={() => handleSetDefault(layout.id)}
                          className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-amber-400 transition-colors"
                          title="Set as Default Layout"
                        >
                          <Star size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => handleStartEdit(layout)}
                        className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-blue-400 transition-colors"
                        title="Rename"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={() => handleDuplicateLayout(layout)}
                        className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-green-400 transition-colors"
                        title="Duplicate"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteLayout(layout.id, layout.name)}
                        className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
