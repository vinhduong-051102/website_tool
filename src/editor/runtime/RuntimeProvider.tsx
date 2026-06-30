import React, { useEffect } from "react";
import { useEditorStore } from "../store/useEditorStore";
import { useGlobalState } from "../state/useGlobalState";

interface RuntimeProviderProps {
  children: React.ReactNode;
}

export const RuntimeProvider: React.FC<RuntimeProviderProps> = ({ children }) => {
  const pages = useEditorStore((state) => state.pages);
  const activePageId = useEditorStore((state) => state.activePageId);

  const activePage = pages.find((p) => p.id === activePageId);
  const stateSchema = activePage?.stateSchema || [];

  // Initialize/reset global state whenever we switch pages or the page schema changes
  useEffect(() => {
    useGlobalState.getState().initializeFromSchema(stateSchema);
  }, [activePageId, stateSchema]);

  return <>{children}</>;
};

export default RuntimeProvider;
