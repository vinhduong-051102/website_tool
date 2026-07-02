import React, { useState, useEffect } from "react";
import { useEditorStore, createASTCommand } from "../store/useEditorStore";
import { getComponent } from "../components/registry";
import { findNodeById, updateProps, updateStyles, findNodeContainer } from "../utils/ast";
import { ASTNode, StateVariable } from "../types";
import { ChevronDown, ChevronRight, Sliders, Type, LayoutGrid, Paintbrush, Zap, Link2 } from "lucide-react";
import { EventsPanel } from "./EventsPanel";
import { BindingsPanel } from "./BindingsPanel";
import { PageAndLayoutSettings } from "./PageAndLayoutSettings";
import { useGlobalState } from "../state/useGlobalState";
import { message } from "antd";

const PropertyBindingIndicator: React.FC<{ propKey: string; node: ASTNode; pageStateSchema?: StateVariable[] }> = ({ propKey, node, pageStateSchema }) => {
  const binding = node.bindings?.find((b) => b.prop === propKey);
  const runtimeData = useGlobalState((s) => s.data);
  if (!binding) return null;

  const expression = binding.expression;
  const stateVar = pageStateSchema?.find((v) => v.key === expression || v.key === `state.${expression}` || `state.${v.key}` === expression);
  const resolvedValue = useGlobalState.getState().getState(expression);
  const typeStr = stateVar?.type || typeof resolvedValue || "unknown";

  let displayValue = "";
  if (resolvedValue === null || resolvedValue === undefined) {
    displayValue = "undefined";
  } else if (Array.isArray(resolvedValue)) {
    displayValue = `Array(${resolvedValue.length})`;
  } else if (typeof resolvedValue === "object") {
    displayValue = JSON.stringify(resolvedValue);
  } else {
    displayValue = String(resolvedValue);
  }

  return (
    <div className="mt-1 p-2 bg-blue-950/20 border border-blue-900/40 rounded text-[10px] space-y-0.5 font-mono text-blue-300">
      <div><span className="text-gray-400">State:</span> {expression}</div>
      <div><span className="text-gray-400">Type:</span> {typeStr}</div>
      <div><span className="text-gray-400">Current Value:</span> <span className="text-amber-400 font-bold">{displayValue}</span></div>
    </div>
  );
};

export const Properties: React.FC = () => {
  const {
    pages,
    layouts,
    setLayouts,
    activePageId,
    selectedNodeIds,
    activeBreakpoint,
    setPages,
    executeCommand,
  } = useEditorStore();

  const selectedNodeId = selectedNodeIds[0];
  const activePage = pages.find((p) => p.id === activePageId);
  const activeLayout = layouts.find((l) => l.id === activePage?.layoutId);

  // Find the selected node and its containing AST target
  let node: ASTNode | null = null;
  let containerInfo: { target: "page" | "header" | "sidebar" | "footer"; root: ASTNode } | null = null;

  if (activePage && selectedNodeId) {
    containerInfo = findNodeContainer(activePage.ast, activeLayout || null, selectedNodeId);
    if (containerInfo) {
      node = findNodeById(containerInfo.root, selectedNodeId);
    }
  }

  const componentDef = node ? getComponent(node.type) : null;

  // Accordion sections collapse state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Content: true,
    Layout: true,
    Typography: true,
    Styles: true,
  });

  const activeTab = useEditorStore((s) => s.propertiesTab);
  const setActiveTab = useEditorStore((s) => s.setPropertiesTab);

  // Track old snapshots for blur commits (undo history)
  const [pagesSnapshotBeforeEdit, setPagesSnapshotBeforeEdit] = useState<typeof pages | null>(null);
  const [layoutsSnapshotBeforeEdit, setLayoutsSnapshotBeforeEdit] = useState<typeof layouts | null>(null);

  // Reset snapshot and auto-route tab when selection changes
  useEffect(() => {
    setPagesSnapshotBeforeEdit(null);
    setLayoutsSnapshotBeforeEdit(null);

    if (selectedNodeId && node) {
      const selectedVarKey = useEditorStore.getState().selectedVariableKey;
      if (selectedVarKey) {
        // If this component is bound to selectedVarKey, switch to bindings tab
        const hasBinding = node.bindings?.some(b => 
          b.expression === selectedVarKey || 
          b.expression === `state.${selectedVarKey}`
        );
        if (hasBinding) {
          setActiveTab("bindings");
          return;
        }

        // If this component uses selectedVarKey in events, switch to events tab
        const hasEventVar = node.events?.some(ev => 
          ev.actions.some(act => {
            const statePath = act.params?.statePath as string;
            if (statePath) {
              const cleanPath = statePath.startsWith("state.") ? statePath.substring(6) : statePath;
              if (cleanPath === selectedVarKey || cleanPath.startsWith(selectedVarKey + ".")) return true;
            }
            return false;
          })
        );
        if (hasEventVar) {
          setActiveTab("events");
          return;
        }
      }
    }
    setActiveTab("design");
  }, [selectedNodeId, node]);

  if (!node || !componentDef) {
    return (
      <div className="w-88 bg-[#1f2937]/95 border-l border-gray-800 flex flex-col h-full z-15 backdrop-blur shrink-0 overflow-hidden">
        <PageAndLayoutSettings />
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
    if (!activePage || !containerInfo || !node) return;

    // Capture state snapshots before the very first typing keystroke
    if (!pagesSnapshotBeforeEdit) {
      setPagesSnapshotBeforeEdit(JSON.parse(JSON.stringify(pages)));
      setLayoutsSnapshotBeforeEdit(JSON.parse(JSON.stringify(layouts)));
    }

    let updatedRoot: ASTNode;
    if (target === "props") {
      updatedRoot = updateProps(containerInfo.root, node.id, { [key]: value });
    } else {
      updatedRoot = updateStyles(containerInfo.root, node.id, { [key]: value }, activeBreakpoint);
    }

    if (containerInfo.target === "page") {
      const nextPages = pages.map((p) =>
        p.id === activePageId ? { ...p, ast: updatedRoot } : p
      );
      setPages(nextPages);
    } else {
      const updatedLayout = { ...activeLayout!, [`${containerInfo.target}AST`]: updatedRoot };
      const nextLayouts = layouts.map((l) => l.id === activeLayout!.id ? updatedLayout : l);
      setLayouts(nextLayouts);
    }
  };

  // Commit change to history stack on blur (finishing typing)
  const handleCommitTyping = (
    key: string,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    _target: "props" | "styles"
  ) => {
    if (!pagesSnapshotBeforeEdit || !layoutsSnapshotBeforeEdit || !activePage || !node) return;

    const currentPages = useEditorStore.getState().pages;
    const currentLayouts = useEditorStore.getState().layouts;

    // Create custom command containing the snapshot from before typing began
    const command = {
      name: `Edit ${node.type} ${key}`,
      execute: () => {
        useEditorStore.setState({
          pages: currentPages,
          layouts: currentLayouts,
          selectedNodeIds: [node.id],
        });
      },
      undo: () => {
        useEditorStore.setState({
          pages: pagesSnapshotBeforeEdit,
          layouts: layoutsSnapshotBeforeEdit,
          selectedNodeIds: [node.id],
        });
      },
    };

    executeCommand(command);
    // Reset snapshots
    setPagesSnapshotBeforeEdit(null);
    setLayoutsSnapshotBeforeEdit(null);
  };

  // Direct commit for single-click inputs (Select, Color picker, Range slider)
  const handleDirectCommit = (key: string, value: any, target: "props" | "styles") => {
    if (!activePage || !containerInfo || !node) return;

    let updatedRoot: ASTNode;
    if (target === "props") {
      updatedRoot = updateProps(containerInfo.root, node.id, { [key]: value });
    } else {
      updatedRoot = updateStyles(containerInfo.root, node.id, { [key]: value }, activeBreakpoint);
    }

    let nextPages = pages;
    let nextLayouts = layouts;

    if (containerInfo.target === "page") {
      nextPages = pages.map((p) =>
        p.id === activePageId ? { ...p, ast: updatedRoot } : p
      );
    } else {
      const updatedLayout = { ...activeLayout!, [`${containerInfo.target}AST`]: updatedRoot };
      nextLayouts = layouts.map((l) => l.id === activeLayout!.id ? updatedLayout : l);
    }

    const command = createASTCommand(
      `Set ${node.type} ${key}`,
      nextPages,
      [node.id],
      nextLayouts
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
                          const isBound = node.bindings?.some((b) => b.prop === field.key);

                          // Resolve enum/select options
                          const fieldOptions = field.enum 
                            ? field.enum.map(opt => typeof opt === "string" ? { label: opt, value: opt } : opt)
                            : field.options || [];

                          return (
                            <div key={field.key} className="space-y-1.5 border-b border-gray-800/40 pb-3 last:border-b-0 last:pb-0">
                              <label className="text-[11px] text-gray-400 font-medium flex justify-between items-center">
                                <span className="flex items-center space-x-1">
                                  <span>{field.name}</span>
                                  {isBound && <Link2 size={10} className="text-blue-400 animate-pulse" />}
                                </span>
                                {field.target === "styles" && activeBreakpoint !== "desktop" && cascadedValue && !value && (
                                  <span className="text-[9px] text-gray-500 italic">
                                    Inherited: {cascadedValue}
                                  </span>
                                )}
                              </label>

                              {/* Render binding indicator/current-value if bound */}
                              {isBound && (
                                <PropertyBindingIndicator 
                                  propKey={field.key} 
                                  node={node} 
                                  pageStateSchema={activePage?.stateSchema} 
                                />
                              )}

                              {/* Only show editor inputs if not bound */}
                              {!isBound && (
                                <>
                                  {/* Text / String Inputs */}
                                  {(field.type === "text" || field.type === "string") && (
                                    <input
                                      type="text"
                                      value={value}
                                      placeholder={cascadedValue || String(field.defaultValue ?? "")}
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
                                      placeholder={cascadedValue || String(field.defaultValue ?? "")}
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
                                      placeholder={cascadedValue || String(field.defaultValue ?? "")}
                                      onChange={(e) => handleLiveChange(field.key, e.target.value, field.target)}
                                      onBlur={() => handleCommitTyping(field.key, field.target)}
                                      className="w-full bg-[#111827] border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 outline-none transition-all resize-none"
                                    />
                                  )}

                                  {/* Dropdown Select / Enum */}
                                  {(field.type === "select" || field.type === "enum") && (
                                    <select
                                      value={value || cascadedValue}
                                      onChange={(e) => handleDirectCommit(field.key, e.target.value, field.target)}
                                      className="w-full bg-[#111827] border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2.5 py-1.5 text-xs text-gray-200 outline-none transition-all"
                                    >
                                      <option value="">Choose value...</option>
                                      {fieldOptions.map((opt) => (
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

                                  {/* Range Slider / slider */}
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

                                  {/* Switch / Toggle / boolean */}
                                  {(field.type === "switch" || field.type === "boolean") && (
                                    <div className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={value === "true" || (value as any) === true || (!value && cascadedValue === "true")}
                                        onChange={(e) => handleDirectCommit(field.key, e.target.checked, field.target)}
                                        className="w-8 h-4 bg-gray-800 checked:bg-blue-500 rounded-full appearance-none cursor-pointer relative transition-all before:content-[''] before:absolute before:w-3 before:h-3 before:bg-white before:rounded-full before:top-[1.5px] before:left-[2px] checked:before:translate-x-[14px] before:transition-all"
                                      />
                                    </div>
                                  )}

                                  {/* Object / Array JSON Editors */}
                                  {(field.type === "object" || field.type === "array") && (
                                    <textarea
                                      rows={4}
                                      defaultValue={typeof value === "object" ? JSON.stringify(value, null, 2) : String(value ?? "")}
                                      placeholder={typeof cascadedValue === "object" ? JSON.stringify(cascadedValue, null, 2) : String(field.defaultValue ? JSON.stringify(field.defaultValue, null, 2) : "")}
                                      onBlur={(e) => {
                                        try {
                                          const val = e.target.value.trim();
                                          if (!val) {
                                            handleDirectCommit(field.key, field.type === "array" ? [] : {}, field.target);
                                          } else {
                                            const parsed = JSON.parse(val);
                                            handleDirectCommit(field.key, parsed, field.target);
                                          }
                                        } catch (err) {
                                          message.error(`Invalid JSON for ${field.name}`);
                                        }
                                      }}
                                      className="w-full bg-[#111827] border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 outline-none transition-all resize-y font-mono"
                                    />
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Navigation Section */}
              {(() => {
                const isOpen = !!openSections["Navigation"];
                const linkToPageId = (node.props.linkToPageId as string) || "";
                const linkRouteParams = (node.props.linkRouteParams as string) || "";
                const linkQueryParams = (node.props.linkQueryParams as string) || "";
                const linkNewTab = !!node.props.linkNewTab;

                return (
                  <div className="border border-gray-800/80 rounded-lg overflow-hidden bg-gray-900/10">
                    <button
                      onClick={() => toggleSection("Navigation")}
                      className="w-full px-4 py-3 bg-[#111827]/40 hover:bg-[#111827]/70 border-b border-gray-800/60 flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Link2 size={14} className="text-pink-400" />
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                          Navigation (Link)
                        </span>
                      </div>
                      {isOpen ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
                    </button>

                    {isOpen && (
                      <div className="p-4 space-y-4 bg-gray-900/5">
                        {/* Target Page */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-gray-400 font-medium flex justify-between">
                            <span>Link to Page</span>
                          </label>
                          <select
                            value={linkToPageId}
                            onChange={(e) => handleDirectCommit("linkToPageId", e.target.value, "props")}
                            className="w-full bg-[#111827] border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2.5 py-1.5 text-xs text-gray-200 outline-none transition-all"
                          >
                            <option value="">None (No navigation)</option>
                            {pages.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.path})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Route Params */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-gray-400 font-medium flex justify-between">
                            <span>Route Params (JSON)</span>
                          </label>
                          <textarea
                            rows={2}
                            value={linkRouteParams}
                            placeholder='e.g. {"id": "{{state.selectedProduct.id}}"}'
                            onChange={(e) => handleLiveChange("linkRouteParams", e.target.value, "props")}
                            onBlur={() => handleCommitTyping("linkRouteParams", "props")}
                            className="w-full bg-[#111827] border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 outline-none transition-all resize-none font-mono"
                          />
                        </div>

                        {/* Query Params */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-gray-400 font-medium flex justify-between">
                            <span>Query Params (JSON)</span>
                          </label>
                          <textarea
                            rows={2}
                            value={linkQueryParams}
                            placeholder='e.g. {"ref": "home"}'
                            onChange={(e) => handleLiveChange("linkQueryParams", e.target.value, "props")}
                            onBlur={() => handleCommitTyping("linkQueryParams", "props")}
                            className="w-full bg-[#111827] border border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 outline-none transition-all resize-none font-mono"
                          />
                        </div>

                        {/* New Tab */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-gray-400 font-medium">Open in new tab</span>
                          <input
                            type="checkbox"
                            checked={linkNewTab}
                            onChange={(e) => handleDirectCommit("linkNewTab", e.target.checked, "props")}
                            className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-800 rounded focus:ring-blue-500 focus:ring-offset-gray-900 focus:ring-2"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
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
