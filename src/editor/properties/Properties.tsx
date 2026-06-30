import React, { useState, useEffect } from "react";
import { useEditorStore, createASTCommand } from "../store/useEditorStore";
import { getComponent } from "../components/registry";
import { findNodeById, updateProps, updateStyles } from "../utils/ast";
import { ASTNode } from "../types";
import { ChevronDown, ChevronRight, Sliders, Type, LayoutGrid, Paintbrush, Zap, Link2 } from "lucide-react";
import { EventsPanel } from "./EventsPanel";
import { BindingsPanel } from "./BindingsPanel";
import { StateSchemaPanel } from "./StateSchemaPanel";

export const Properties: React.FC = () => {
  const {
    pages,
    activePageId,
    selectedNodeIds,
    activeBreakpoint,
    setPages,
    executeCommand,
  } = useEditorStore();

  const selectedNodeId = selectedNodeIds[0];
  const activePage = pages.find((p) => p.id === activePageId);
  const rootNode = activePage?.ast;

  // Retrieve the selected node from the AST
  const node = selectedNodeId && rootNode ? findNodeById(rootNode, selectedNodeId) : null;
  const componentDef = node ? getComponent(node.type) : null;

  // Accordion sections collapse state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Content: true,
    Layout: true,
    Typography: true,
    Styles: true,
  });

  const [activeTab, setActiveTab] = useState<"design" | "events" | "bindings">("design");

  // Track old pages snapshot for blur commits (undo history)
  const [pagesSnapshotBeforeEdit, setPagesSnapshotBeforeEdit] = useState<typeof pages | null>(null);

  // Reset snapshot when selection changes
  useEffect(() => {
    setPagesSnapshotBeforeEdit(null);
    setActiveTab("design");
  }, [selectedNodeId]);

  if (!node || !componentDef) {
    return (
      <div className="w-88 bg-[#1f2937]/95 border-l border-gray-800 flex flex-col h-full z-15 backdrop-blur shrink-0 overflow-hidden">
        <StateSchemaPanel />
      </div>
    );
  }

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Helper to resolve cascading values for placeholders
  const getCascadedStyleValue = (key: string): string => {
    if (!node.styles) return "";
    
    const mobileStyles = (node.styles.mobile || {}) as Record<string, unknown>;
    const tabletStyles = (node.styles.tablet || {}) as Record<string, unknown>;
    const desktopStyles = (node.styles.desktop || {}) as Record<string, unknown>;

    if (activeBreakpoint === "mobile") {
      return (
        (mobileStyles[key] as string) ||
        (tabletStyles[key] as string) ||
        (desktopStyles[key] as string) ||
        ""
      );
    }
    if (activeBreakpoint === "tablet") {
      return (
        (tabletStyles[key] as string) ||
        (desktopStyles[key] as string) ||
        ""
      );
    }
    return (desktopStyles[key] as string) || "";
  };

  // Fetch current value of a property
  const getPropertyValue = (key: string, target: "props" | "styles"): string => {
    if (target === "props") {
      return (node.props[key] as string) || "";
    }
    // Return specific value for this breakpoint if it exists, otherwise empty string (cascaded value acts as placeholder)
    const bpStyles = (node.styles[activeBreakpoint] || {}) as Record<string, unknown>;
    return (bpStyles[key] as string) || "";
  };

  // Handle live updating on keystroke (updates canvas preview instantly, without spamming undo history)
  const handleLiveChange = (key: string, value: string, target: "props" | "styles") => {
    if (!activePage) return;

    // Capture pages state snapshot before the very first typing keystroke
    if (!pagesSnapshotBeforeEdit) {
      setPagesSnapshotBeforeEdit(JSON.parse(JSON.stringify(pages)));
    }

    let updatedRoot: ASTNode;
    if (target === "props") {
      updatedRoot = updateProps(activePage.ast, node.id, { [key]: value });
    } else {
      updatedRoot = updateStyles(activePage.ast, node.id, { [key]: value }, activeBreakpoint);
    }

    const nextPages = pages.map((p) =>
      p.id === activePageId ? { ...p, ast: updatedRoot } : p
    );

    // Write straight to Zustand state (transient preview update)
    setPages(nextPages);
  };

  // Commit change to history stack on blur (finishing typing)
  const handleCommitTyping = (
    key: string,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    _target: "props" | "styles"
  ) => {
    if (!pagesSnapshotBeforeEdit || !activePage) return;

    const currentPages = useEditorStore.getState().pages;

    // Create custom command containing the snapshot from before typing began
    const command = {
      name: `Edit ${node.type} ${key}`,
      execute: () => {
        useEditorStore.setState({
          pages: currentPages,
          selectedNodeIds: [node.id],
        });
      },
      undo: () => {
        useEditorStore.setState({
          pages: pagesSnapshotBeforeEdit,
          selectedNodeIds: [node.id],
        });
      },
    };

    executeCommand(command);
    // Reset snapshot
    setPagesSnapshotBeforeEdit(null);
  };

  // Direct commit for single-click inputs (Select, Color picker, Range slider)
  const handleDirectCommit = (key: string, value: string, target: "props" | "styles") => {
    if (!activePage) return;

    let updatedRoot: ASTNode;
    if (target === "props") {
      updatedRoot = updateProps(activePage.ast, node.id, { [key]: value });
    } else {
      updatedRoot = updateStyles(activePage.ast, node.id, { [key]: value }, activeBreakpoint);
    }

    const nextPages = pages.map((p) =>
      p.id === activePageId ? { ...p, ast: updatedRoot } : p
    );

    const command = createASTCommand(
      `Set ${node.type} ${key}`,
      nextPages,
      [node.id]
    );

    executeCommand(command);
  };

  // Group schema fields by section
  const sections: Record<string, typeof componentDef.propertySchema> = {
    Content: [],
    Layout: [],
    Typography: [],
    Styles: [],
  };

  componentDef.propertySchema.forEach((prop) => {
    if (sections[prop.section]) {
      sections[prop.section].push(prop);
    } else {
      sections[prop.section] = [prop];
    }
  });

  const getSectionIcon = (section: string) => {
    switch (section) {
      case "Content":
        return <Type size={14} className="text-blue-400" />;
      case "Layout":
        return <LayoutGrid size={14} className="text-green-400" />;
      case "Typography":
        return <Type size={14} className="text-yellow-400" />;
      case "Styles":
      default:
        return <Paintbrush size={14} className="text-purple-400" />;
    }
  };

  return (
    <div className="w-88 bg-[#1f2937]/95 border-l border-gray-800 flex flex-col h-full z-15 backdrop-blur shrink-0 select-none">
      {/* Panel Title */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <Sliders className="text-blue-500" size={18} />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Properties: {node.type}
          </h2>
        </div>
        <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-mono">
          ID: {node.id.split("-")[1] || node.id}
        </span>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-[#111827]/40 border-b border-gray-800 p-1 space-x-1 shrink-0">
        <button
          onClick={() => setActiveTab("design")}
          className={`flex-1 py-1.5 rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === "design"
              ? "bg-[#1f2937] text-white shadow-sm"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <Sliders size={12} />
          <span>Styles</span>
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`flex-1 py-1.5 rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === "events"
              ? "bg-[#1f2937] text-white shadow-sm"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <Zap size={12} className={activeTab === "events" ? "text-yellow-500" : ""} />
          <span>Events</span>
        </button>
        <button
          onClick={() => setActiveTab("bindings")}
          className={`flex-1 py-1.5 rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === "bindings"
              ? "bg-[#1f2937] text-white shadow-sm"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <Link2 size={12} className={activeTab === "bindings" ? "text-blue-500" : ""} />
          <span>Bindings</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "design" && (
          <div className="h-full flex flex-col overflow-hidden">
            {/* Breakpoint Indicator */}
            <div className="bg-gray-900/40 px-4 py-2 border-b border-gray-800/60 flex items-center justify-between text-xs text-gray-400 shrink-0">
              <span>Active Breakpoint:</span>
              <span className="font-semibold text-blue-400 capitalize">{activeBreakpoint}</span>
            </div>

            {/* Accordion List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {Object.entries(sections).map(([section, fields]) => {
                if (fields.length === 0) return null;
                const isOpen = openSections[section];

                return (
                  <div key={section} className="border border-gray-800/80 rounded-lg overflow-hidden bg-gray-900/10">
                    {/* Accordion Header */}
                    <button
                      onClick={() => toggleSection(section)}
                      className="w-full px-4 py-3 bg-[#111827]/40 hover:bg-[#111827]/70 border-b border-gray-800/60 flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center space-x-2.5">
                        {getSectionIcon(section)}
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                          {section}
                        </span>
                      </div>
                      {isOpen ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
                    </button>

                    {/* Accordion Content */}
                    {isOpen && (
                      <div className="p-4 space-y-4 bg-gray-900/5">
                        {fields.map((field) => {
                          const value = getPropertyValue(field.key, field.target);
                          const cascadedValue = getCascadedStyleValue(field.key);

                          return (
                            <div key={field.key} className="space-y-1.5">
                              <label className="text-[11px] text-gray-400 font-medium flex justify-between">
                                <span>{field.name}</span>
                                {field.target === "styles" && activeBreakpoint !== "desktop" && cascadedValue && !value && (
                                  <span className="text-[9px] text-gray-500 italic">
                                    Inherited: {cascadedValue}
                                  </span>
                                )}
                              </label>

                              {/* Text Inputs */}
                              {field.type === "text" && (
                                <input
                                  type="text"
                                  value={value}
                                  placeholder={cascadedValue || (field.defaultValue as string)}
                                  onChange={(e) => handleLiveChange(field.key, e.target.value, field.target)}
                                  onBlur={() => handleCommitTyping(field.key, field.target)}
                                  className="w-full bg-[#111827] border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 outline-none transition-all"
                                />
                              )}

                              {/* Number Inputs */}
                              {field.type === "number" && (
                                <input
                                  type="number"
                                  value={value}
                                  min={field.min}
                                  max={field.max}
                                  step={field.step}
                                  placeholder={cascadedValue || String(field.defaultValue || "")}
                                  onChange={(e) => handleLiveChange(field.key, e.target.value, field.target)}
                                  onBlur={() => handleCommitTyping(field.key, field.target)}
                                  className="w-full bg-[#111827] border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 outline-none transition-all"
                                />
                              )}

                              {/* Textarea */}
                              {field.type === "textarea" && (
                                <textarea
                                  rows={3}
                                  value={value}
                                  placeholder={cascadedValue || (field.defaultValue as string)}
                                  onChange={(e) => handleLiveChange(field.key, e.target.value, field.target)}
                                  onBlur={() => handleCommitTyping(field.key, field.target)}
                                  className="w-full bg-[#111827] border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 outline-none transition-all resize-none"
                                />
                              )}

                              {/* Dropdown Select */}
                              {field.type === "select" && (
                                <select
                                  value={value || cascadedValue}
                                  onChange={(e) => handleDirectCommit(field.key, e.target.value, field.target)}
                                  className="w-full bg-[#111827] border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2.5 py-1.5 text-xs text-gray-200 outline-none transition-all"
                                >
                                  <option value="">Choose value...</option>
                                  {field.options?.map((opt) => (
                                    <option key={String(opt.value)} value={String(opt.value)}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {/* Color Picker */}
                              {field.type === "color" && (
                                <div className="flex items-center space-x-2">
                                  <div className="relative w-8 h-8 rounded border border-gray-800 overflow-hidden shrink-0">
                                    <input
                                      type="color"
                                      value={value || cascadedValue || "#ffffff"}
                                      onChange={(e) => handleLiveChange(field.key, e.target.value, field.target)}
                                      onBlur={() => handleCommitTyping(field.key, field.target)}
                                      className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] cursor-pointer p-0 border-0"
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    value={value}
                                    placeholder={cascadedValue || "#ffffff"}
                                    onChange={(e) => handleLiveChange(field.key, e.target.value, field.target)}
                                    onBlur={() => handleCommitTyping(field.key, field.target)}
                                    className="flex-1 bg-[#111827] border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 outline-none transition-all font-mono"
                                  />
                                </div>
                              )}

                              {/* Range Slider */}
                              {field.type === "slider" && (
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="range"
                                    min={field.min ?? 0}
                                    max={field.max ?? 100}
                                    step={field.step ?? 1}
                                    value={Number(value || cascadedValue || 0)}
                                    onChange={(e) => handleDirectCommit(field.key, e.target.value, field.target)}
                                    className="flex-1 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                  />
                                  <span className="text-[10px] font-mono text-gray-400 w-8 text-right">
                                    {value || cascadedValue || 0}
                                  </span>
                                </div>
                              )}

                              {/* Switch / Toggle */}
                              {field.type === "switch" && (
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={value === "true" || (!value && cascadedValue === "true")}
                                    onChange={(e) => handleDirectCommit(field.key, String(e.target.checked), field.target)}
                                    className="w-8 h-4 bg-gray-800 checked:bg-blue-500 rounded-full appearance-none cursor-pointer relative transition-all before:content-[''] before:absolute before:w-3 before:h-3 before:bg-white before:rounded-full before:top-[1.5px] before:left-[2px] checked:before:translate-x-[14px] before:transition-all"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "events" && <EventsPanel node={node} />}

        {activeTab === "bindings" && <BindingsPanel node={node} />}
      </div>
    </div>
  );
};

export default Properties;
