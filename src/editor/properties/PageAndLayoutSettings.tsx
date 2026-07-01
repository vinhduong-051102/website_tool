import React, { useState } from "react";
import { useEditorStore } from "../store/useEditorStore";
import { StateSchemaPanel } from "./StateSchemaPanel";
import { 
  Settings, 
  Database, 
  Layout as LayoutIcon, 
  PanelLeft, 
  PanelBottom, 
  PanelTop,
  Maximize2
} from "lucide-react";
import { Switch, Select, Input } from "antd";

export const PageAndLayoutSettings: React.FC = () => {
  const {
    pages,
    layouts,
    activePageId,
    setPages,
    setLayouts,
  } = useEditorStore();

  const [activeTab, setActiveTab] = useState<"settings" | "state">("settings");

  const activePage = pages.find((p) => p.id === activePageId);
  const activeLayout = layouts.find((l) => l.id === activePage?.layoutId);

  if (!activePage) {
    return (
      <div className="p-4 text-gray-400 text-sm">
        Select a page to configure settings.
      </div>
    );
  }

  const handlePageChange = (key: string, value: any) => {
    const updatedPages = pages.map((p) =>
      p.id === activePageId ? { ...p, [key]: value } : p
    );
    setPages(updatedPages);
  };

  const handleLayoutChange = (key: string, value: any) => {
    if (!activeLayout) return;
    const updatedLayouts = layouts.map((l) =>
      l.id === activeLayout.id 
        ? { 
            ...l, 
            config: {
              ...(l.config || {}),
              [key]: value
            }
          } 
        : l
    );
    setLayouts(updatedLayouts);
  };

  const handleRegionToggle = (region: "header" | "sidebar" | "footer", checked: boolean) => {
    if (!activeLayout) return;
    const updatedLayouts = layouts.map((l) =>
      l.id === activeLayout.id 
        ? { 
            ...l, 
            regions: { 
              ...l.regions, 
              [region]: checked 
            } 
          } 
        : l
    );
    setLayouts(updatedLayouts);
  };

  const config = activeLayout?.config || {};

  return (
    <div className="flex flex-col h-full bg-[#111827] text-gray-200">
      {/* Tabs */}
      <div className="flex border-b border-gray-800 bg-[#1f2937]/50">
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            activeTab === "settings"
              ? "border-b-2 border-blue-500 text-blue-400 bg-blue-500/5"
              : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30"
          }`}
        >
          <Settings size={14} />
          Page & Layout
        </button>
        <button
          onClick={() => setActiveTab("state")}
          className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            activeTab === "state"
              ? "border-b-2 border-blue-500 text-blue-400 bg-blue-500/5"
              : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30"
          }`}
        >
          <Database size={14} />
          State Variables
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === "state" ? (
          <StateSchemaPanel />
        ) : (
          <div className="p-4 space-y-6">
            {/* Page Settings */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1">
                <Settings size={12} />
                Page Settings
              </h3>
              <div className="space-y-3 bg-gray-900/40 p-3 rounded-lg border border-gray-800/55">
                <div>
                  <label className="block text-[10px] text-gray-400 font-medium mb-1">Page Name</label>
                  <Input
                    value={activePage.name}
                    onChange={(e) => handlePageChange("name", e.target.value)}
                    className="bg-gray-950 border-gray-800 text-gray-200 hover:border-gray-700 focus:border-blue-500 text-xs py-1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-medium mb-1">Route Path</label>
                  <Input
                    value={activePage.path}
                    onChange={(e) => handlePageChange("path", e.target.value)}
                    className="bg-gray-950 border-gray-800 text-gray-200 hover:border-gray-700 focus:border-blue-500 text-xs py-1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-medium mb-1">Page Layout</label>
                  <Select
                    value={activePage.layoutId || "none"}
                    onChange={(val) => handlePageChange("layoutId", val === "none" ? undefined : val)}
                    options={[
                      { value: "none", label: "No Layout (Blank)" },
                      ...layouts.map((l) => ({ value: l.id, label: l.name }))
                    ]}
                    className="w-full text-xs"
                    popupClassName="bg-gray-900 border-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Layout Configuration */}
            {activeLayout ? (
              <div className="space-y-6">
                {/* Enabled regions */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1">
                    <LayoutIcon size={12} />
                    Layout Regions
                  </h3>
                  <div className="space-y-3 bg-gray-900/40 p-3 rounded-lg border border-gray-800/55">
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="flex items-center gap-1.5 text-gray-300">
                        <PanelTop size={14} className="text-gray-400" />
                        Header
                      </span>
                      <Switch
                        checked={activeLayout.regions.header}
                        onChange={(val) => handleRegionToggle("header", val)}
                        size="small"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="flex items-center gap-1.5 text-gray-300">
                        <PanelLeft size={14} className="text-gray-400" />
                        Sidebar
                      </span>
                      <Switch
                        checked={activeLayout.regions.sidebar}
                        onChange={(val) => handleRegionToggle("sidebar", val)}
                        size="small"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="flex items-center gap-1.5 text-gray-300">
                        <PanelBottom size={14} className="text-gray-400" />
                        Footer
                      </span>
                      <Switch
                        checked={activeLayout.regions.footer}
                        onChange={(val) => handleRegionToggle("footer", val)}
                        size="small"
                      />
                    </div>
                  </div>
                </div>

                {/* General Layout Styles */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1">
                    <Maximize2 size={12} />
                    Layout Sizing & Styles
                  </h3>
                  <div className="space-y-3 bg-gray-900/40 p-3 rounded-lg border border-gray-800/55">
                    <div>
                      <label className="block text-[10px] text-gray-400 font-medium mb-1">Max Width</label>
                      <Input
                        value={config.layoutMaxWidth || "1200px"}
                        onChange={(e) => handleLayoutChange("layoutMaxWidth", e.target.value)}
                        placeholder="e.g. 1200px or 100%"
                        className="bg-gray-950 border-gray-800 text-gray-200 text-xs py-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-400 font-medium mb-1">Gap</label>
                        <Input
                          value={config.layoutGap || "16px"}
                          onChange={(e) => handleLayoutChange("layoutGap", e.target.value)}
                          placeholder="e.g. 16px"
                          className="bg-gray-950 border-gray-800 text-gray-200 text-xs py-1"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 font-medium mb-1">Padding</label>
                        <Input
                          value={config.layoutPadding || "16px"}
                          onChange={(e) => handleLayoutChange("layoutPadding", e.target.value)}
                          placeholder="e.g. 16px"
                          className="bg-gray-950 border-gray-800 text-gray-200 text-xs py-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 font-medium mb-1">Background Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={(config.layoutBg && config.layoutBg.startsWith("#")) ? config.layoutBg : "#0f172a"}
                          onChange={(e) => handleLayoutChange("layoutBg", e.target.value)}
                          className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                        />
                        <Input
                          value={config.layoutBg || "#0f172a"}
                          onChange={(e) => handleLayoutChange("layoutBg", e.target.value)}
                          className="bg-gray-950 border-gray-800 text-gray-200 text-xs flex-1 py-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Header Configuration */}
                {activeLayout.regions.header && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1">
                      <PanelTop size={12} />
                      Header Config
                    </h3>
                    <div className="space-y-3 bg-gray-900/40 p-3 rounded-lg border border-gray-800/55">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-gray-400 font-medium mb-1">Height</label>
                          <Input
                            value={config.headerHeight || "64px"}
                            onChange={(e) => handleLayoutChange("headerHeight", e.target.value)}
                            className="bg-gray-950 border-gray-800 text-gray-200 text-xs py-1"
                          />
                        </div>
                        <div className="flex items-center justify-between mt-5">
                          <span className="text-[10px] text-gray-400 font-medium">Sticky/Fixed</span>
                          <Switch
                            checked={!!config.headerFixed}
                            onChange={(val) => handleLayoutChange("headerFixed", val)}
                            size="small"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 font-medium mb-1">Background Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={(config.headerBg && config.headerBg.startsWith("#")) ? config.headerBg : "#1f2937"}
                            onChange={(e) => handleLayoutChange("headerBg", e.target.value)}
                            className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                          />
                          <Input
                            value={config.headerBg || "#1f2937"}
                            onChange={(e) => handleLayoutChange("headerBg", e.target.value)}
                            className="bg-gray-950 border-gray-800 text-gray-200 text-xs flex-1 py-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sidebar Configuration */}
                {activeLayout.regions.sidebar && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1">
                      <PanelLeft size={12} />
                      Sidebar Config
                    </h3>
                    <div className="space-y-3 bg-gray-900/40 p-3 rounded-lg border border-gray-800/55">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-gray-400 font-medium mb-1">Width</label>
                          <Input
                            value={config.sidebarWidth || "240px"}
                            onChange={(e) => handleLayoutChange("sidebarWidth", e.target.value)}
                            className="bg-gray-950 border-gray-800 text-gray-200 text-xs py-1"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 font-medium mb-1">Position</label>
                          <Select
                            value={config.sidebarPosition || "left"}
                            onChange={(val) => handleLayoutChange("sidebarPosition", val)}
                            options={[
                              { value: "left", label: "Left" },
                              { value: "right", label: "Right" }
                            ]}
                            className="w-full text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 py-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 font-medium">Fixed/Sticky</span>
                          <Switch
                            checked={!!config.sidebarFixed}
                            onChange={(val) => handleLayoutChange("sidebarFixed", val)}
                            size="small"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 font-medium">Collapsible</span>
                          <Switch
                            checked={!!config.sidebarCollapsible}
                            onChange={(val) => handleLayoutChange("sidebarCollapsible", val)}
                            size="small"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 font-medium mb-1">Background Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={(config.sidebarBg && config.sidebarBg.startsWith("#")) ? config.sidebarBg : "#111827"}
                            onChange={(e) => handleLayoutChange("sidebarBg", e.target.value)}
                            className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                          />
                          <Input
                            value={config.sidebarBg || "#111827"}
                            onChange={(e) => handleLayoutChange("sidebarBg", e.target.value)}
                            className="bg-gray-950 border-gray-800 text-gray-200 text-xs flex-1 py-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Configuration */}
                {activeLayout.regions.footer && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1">
                      <PanelBottom size={12} />
                      Footer Config
                    </h3>
                    <div className="space-y-3 bg-gray-900/40 p-3 rounded-lg border border-gray-800/55">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-gray-400 font-medium mb-1">Height</label>
                          <Input
                            value={config.footerHeight || "48px"}
                            onChange={(e) => handleLayoutChange("footerHeight", e.target.value)}
                            className="bg-gray-950 border-gray-800 text-gray-200 text-xs py-1"
                          />
                        </div>
                        <div className="flex items-center justify-between mt-5">
                          <span className="text-[10px] text-gray-400 font-medium">Sticky/Fixed</span>
                          <Switch
                            checked={!!config.footerFixed}
                            onChange={(val) => handleLayoutChange("footerFixed", val)}
                            size="small"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 font-medium mb-1">Background Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={(config.footerBg && config.footerBg.startsWith("#")) ? config.footerBg : "#1f2937"}
                            onChange={(e) => handleLayoutChange("footerBg", e.target.value)}
                            className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                          />
                          <Input
                            value={config.footerBg || "#1f2937"}
                            onChange={(e) => handleLayoutChange("footerBg", e.target.value)}
                            className="bg-gray-950 border-gray-800 text-gray-200 text-xs flex-1 py-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-blue-500/5 text-blue-400/90 text-xs rounded border border-blue-500/10 text-center">
                This page is currently blank with no layout. Assign a layout to enable Header, Sidebar, and Footer regions.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
