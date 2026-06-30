import { useDraggable } from "@dnd-kit/core";

export const useDrag = (nodeId: string) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: nodeId,
    disabled: nodeId === "root", // Do not allow dragging the main root page container
  });

  return { attributes, listeners, setNodeRef, transform, isDragging };
};
