import React, { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { componentRegistry } from "../components/registry";
import { ComponentTree } from "./ComponentTree";
import { 
  Box, 
  MousePointer, 
  Type, 
  Heading, 
  AlignLeft, 
  Image as ImageIcon, 
  CreditCard, 
  Columns, 
  LayoutGrid, 
  Layout, 
  FormInput, 
  CheckSquare, 
  Radio, 
  List, 
  Layers,
  SquareSplitHorizontal,
  Lock,
  Mail,
  Hash,
  Search,
  Phone,
  Link2,
  ToggleLeft,
  Calendar,
  Clock,
  CalendarRange,
  CalendarDays,
  UploadCloud,
  ImagePlus,
  UserCircle2,
  Sliders,
  Star,
  Palette,
  KeyRound,
  Loader2,
  FileText
} from "lucide-react";
import { PageSidebarList } from "./PageSidebarList";
import { LayoutSidebarList } from "./LayoutSidebarList";

// Map string icon names to Lucide icon components
export const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case "Box":
      return <Box size={20} />;
    case "MousePointer":
      return <MousePointer size={20} />;
    case "Type":
      return <Type size={20} />;
    case "Heading":
      return <Heading size={20} />;
    case "AlignLeft":
      return <AlignLeft size={20} />;
    case "ImageIcon":
      return <ImageIcon size={20} />;
    case "CreditCard":
      return <CreditCard size={20} />;
    case "Columns":
      return <Columns size={20} />;
    case "LayoutGrid":
      return <LayoutGrid size={20} />;
    case "Layout":
      return <Layout size={20} />;
    case "FormInput":
      return <FormInput size={20} />;
    case "CheckSquare":
      return <CheckSquare size={20} />;
    case "Radio":
      return <Radio size={20} />;
    case "List":
      return <List size={20} />;
    case "SquareSplitHorizontal":
      return <SquareSplitHorizontal size={20} />;
    case "Lock":
      return <Lock size={20} />;
    case "Mail":
      return <Mail size={20} />;
    case "Hash":
      return <Hash size={20} />;
    case "Search":
      return <Search size={20} />;
    case "Phone":
      return <Phone size={20} />;
    case "Link2":
      return <Link2 size={20} />;
    case "ToggleLeft":
      return <ToggleLeft size={20} />;
    case "Calendar":
      return <Calendar size={20} />;
    case "Clock":
      return <Clock size={20} />;
    case "CalendarRange":
      return <CalendarRange size={20} />;
    case "CalendarDays":
      return <CalendarDays size={20} />;
    case "UploadCloud":
      return <UploadCloud size={20} />;
    case "ImagePlus":
      return <ImagePlus size={20} />;
    case "UserCircle2":
      return <UserCircle2 size={20} />;
    case "Sliders":
      return <Sliders size={20} />;
    case "Star":
      return <Star size={20} />;
    case "Palette":
      return <Palette size={20} />;
    case "KeyRound":
      return <KeyRound size={20} />;
    case "Loader2":
      return <Loader2 size={20} className="animate-spin" />;
    default:
      return <Layers size={20} />;
  }
};

interface DraggableItemProps {
  type: string;
  name: string;
  iconName: string;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ type, name, iconName }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library-${type}`,
    data: {
      type,
      isLibraryItem: true,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-3 bg-gray-800 hover:bg-gray-700/80 border border-gray-700 hover:border-blue-500 rounded-lg cursor-grab flex flex-col items-center justify-center text-center space-y-2 transition-all duration-150 shadow-md ${
        isDragging ? "opacity-30 border-blue-500 scale-95" : ""
      }`}
    >
      <div className="text-blue-400 group-hover:text-blue-300">
        {getIconComponent(iconName)}
      </div>
      <span className="text-[11px] text-gray-300 font-medium select-none">
        {name}
      </span>
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"library" | "structure" | "pages">("library");

  // Group registry components by category
  const components = Object.values(componentRegistry);
  
  const categories: Record<string, typeof components> = {
    Layout: [],
    Basic: [],
    Form: [],
    Media: [],
  };

  components.forEach((comp) => {
    if (categories[comp.metadata.category]) {
      categories[comp.metadata.category].push(comp);
    } else {
      categories[comp.metadata.category] = [comp];
    }
  });

  return (
    <div className="w-64 bg-[#1f2937]/95 border-r border-gray-800 flex flex-col h-full z-15 backdrop-blur">
      {/* Sidebar Header Tabs */}
      <div className="p-2 border-b border-gray-800 flex flex-col shrink-0 bg-gray-900/30">
        <div className="flex bg-gray-950/60 p-1 rounded-lg border border-gray-850">
          <button
            onClick={() => setActiveTab("library")}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === "library"
                ? "bg-blue-600/90 text-white shadow shadow-blue-500/10"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/40"
            }`}
          >
            <Box size={13} />
            <span>Library</span>
          </button>
          <button
            onClick={() => setActiveTab("structure")}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === "structure"
                ? "bg-blue-600/90 text-white shadow shadow-blue-500/10"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/40"
            }`}
          >
            <Layers size={13} />
            <span>Structure</span>
          </button>
          <button
            onClick={() => setActiveTab("pages")}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === "pages"
                ? "bg-blue-600/90 text-white shadow shadow-blue-500/10"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/40"
            }`}
          >
            <FileText size={13} />
            <span>Pages</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "library" ? (
          <div className="h-full overflow-y-auto p-4 space-y-6">
            {Object.entries(categories).map(([category, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={category} className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest select-none">
                    {category}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map((item) => (
                      <DraggableItem
                        key={item.metadata.type}
                        type={item.metadata.type}
                        name={item.metadata.name}
                        iconName={item.metadata.icon}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : activeTab === "structure" ? (
          <ComponentTree />
        ) : (
          <div className="h-full flex flex-col divide-y divide-gray-800">
            <div className="flex-1 min-h-0 overflow-y-auto">
              <PageSidebarList />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <LayoutSidebarList />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
