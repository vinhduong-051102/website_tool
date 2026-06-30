import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { componentRegistry } from "../components/registry";
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
  SquareSplitHorizontal
} from "lucide-react";

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
      <div className="p-4 border-b border-gray-800 flex items-center space-x-2 shrink-0">
        <Layout className="text-blue-500" size={20} />
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider select-none">
          Component Library
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
    </div>
  );
};

export default Sidebar;
