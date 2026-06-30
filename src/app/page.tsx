"use client";

import React, { useEffect, useState } from "react";
import EditorLayout from "@/editor/EditorLayout";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent SSR hydration issues since store loads state from LocalStorage
  if (!mounted) {
    return (
      <div className="h-screen w-screen bg-[#111827] flex items-center justify-center text-gray-400 font-mono text-xs select-none">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Mounting workspace...</span>
        </div>
      </div>
    );
  }

  return <EditorLayout />;
}
