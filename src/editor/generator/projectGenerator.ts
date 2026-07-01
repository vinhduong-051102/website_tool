import JSZip from "jszip";
import { Project, Page, ASTNode, StateVariable } from "../types";
import { generateReactCode } from "./codeGenerator";
import { buildInitialStateCode, generateAllEventHandlers } from "./stateGenerator";

// Scans all pages to see if Ant Design components are used
const checkAntdUsage = (pages: Page[]): boolean => {
  let used = false;
  const scan = (node: ASTNode) => {
    if ([
      "TextInput", "PasswordInput", "EmailInput", "NumberInput", "Textarea",
      "SearchInput", "PhoneInput", "URLInput", "Checkbox", "CheckboxGroup",
      "Radio", "RadioGroup", "Select", "MultiSelect", "Switch", "DatePicker",
      "TimePicker", "DateTimePicker", "RangePicker", "UploadFile", "UploadImage",
      "AvatarUpload", "Slider", "Rate", "ColorPicker", "OTPInput", "Loading"
    ].includes(node.type)) {
      used = true;
    }
    node.children?.forEach(scan);
  };
  pages.forEach((p) => scan(p.ast));
  return used;
};

// Scans all pages to see if Lucide icons are used
const checkLucideUsage = (pages: Page[]): boolean => {
  let used = false;
  const scan = (node: ASTNode) => {
    if (node.type === "Button" || node.props?.icon) {
      used = true;
    }
    node.children?.forEach(scan);
  };
  pages.forEach((p) => scan(p.ast));
  return used;
};

// Scans all pages to see if Axios/API client is used
const checkAxiosUsage = (project: Project): boolean => {
  return project.apis && project.apis.length > 0;
};

export const generateNextJsProjectZip = async (project: Project): Promise<Blob> => {
  const zip = new JSZip();

  const isAntd = checkAntdUsage(project.pages);
  const isLucide = checkLucideUsage(project.pages);
  const isAxios = checkAxiosUsage(project);

  // 1. package.json
  const dependencies: Record<string, string> = {
    "next": "15.5.19",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "zustand": "^5.0.14",
  };

  if (isAntd) {
    dependencies["antd"] = "^6.5.0";
    dependencies["@ant-design/icons"] = "^6.3.2";
    dependencies["@ant-design/nextjs-registry"] = "^1.3.0";
  }
  if (isLucide) {
    dependencies["lucide-react"] = "^0.294.0";
  }
  if (isAxios) {
    dependencies["axios"] = "^1.6.0";
  }

  const packageJson = {
    name: project.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    version: "1.0.0",
    private: true,
    scripts: {
      "dev": "next dev",
      "build": "next build",
      "start": "next start",
      "lint": "next lint"
    },
    dependencies,
    devDependencies: {
      "@types/node": "^20",
      "@types/react": "^19",
      "@types/react-dom": "^19",
      "postcss": "^8",
      "tailwindcss": "^4",
      "@tailwindcss/postcss": "^4",
      "typescript": "^5",
      "eslint": "^9",
      "eslint-config-next": "15.5.19"
    }
  };

  zip.file("package.json", JSON.stringify(packageJson, null, 2));

  // 2. tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: "es5",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "node",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      plugins: [
        {
          name: "next"
        }
      ],
      paths: {
        "@/*": ["./src/*"]
      }
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"]
  };

  zip.file("tsconfig.json", JSON.stringify(tsconfig, null, 2));

  // 3. next.config.ts
  const nextConfig = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
`;
  zip.file("next.config.ts", nextConfig);

  // 4. postcss.config.js
  const postcssConfig = `module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
`;
  zip.file("postcss.config.js", postcssConfig);

  // 5. tailwind.config.ts (placeholder, Tailwind v4 is configured via css, but keeping empty standard file)
  const tailwindConfig = `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
`;
  zip.file("tailwind.config.ts", tailwindConfig);

  // 6. .gitignore
  const gitignore = `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
`;
  zip.file(".gitignore", gitignore);

  // 7. README.md
  const readme = `# ${project.name}

This application was generated using Antigravity Website Builder.

## Getting Started

First, install the dependencies:

\`\`\`bash
npm install
# or
pnpm install
# or
yarn install
\`\`\`

Then, run the development server:

\`\`\`bash
npm run dev
# or
pnpm dev
# or
yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Structure

- \`src/app/\`: Next.js App Router pages and global layouts.
- \`src/store/useGlobalState.ts\`: Zustand global state management.
- \`src/services/apiClient.ts\`: API client configuration.
`;
  zip.file("README.md", readme);

  // 8. .env.example
  let envExample = `# Environment variables template\n`;
  if (project.env) {
    Object.entries(project.env).forEach(([k, v]) => {
      envExample += `${k}=${v}\n`;
    });
  } else {
    envExample += `NEXT_PUBLIC_API_URL=https://api.example.com\n`;
  }
  zip.file(".env.example", envExample);

  // 9. src/store/useGlobalState.ts
  const globalStoreCode = `import { create } from "zustand";

interface StateVariable {
  key: string;
  defaultValue: unknown;
  type: string;
}

interface GlobalState {
  data: Record<string, any>;
  defaults: Record<string, any>;
  setState: (path: string, value: any) => void;
  toggleState: (path: string) => void;
  resetState: (path: string) => void;
  initializeFromSchema: (schema: StateVariable[]) => void;
}

const setByPath = (obj: any, path: string, value: any) => {
  const next = { ...obj };
  const keys = path.split(".");
  let current = next;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) current[key] = {};
    current[key] = { ...current[key] };
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
  return next;
};

const getByPath = (obj: any, path: string): any => {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
};

export const useGlobalState = create<GlobalState>((set, get) => ({
  data: {},
  defaults: {},

  setState: (path, value) => {
    set((state) => ({
      data: setByPath(state.data, path, value),
    }));
  },

  toggleState: (path) => {
    const currentVal = getByPath(get().data, path);
    set((state) => ({
      data: setByPath(state.data, path, !currentVal),
    }));
  },

  resetState: (path) => {
    const defaultVal = getByPath(get().defaults, path);
    set((state) => ({
      data: setByPath(state.data, path, defaultVal),
    }));
  },

  initializeFromSchema: (schema) => {
    const defaults: Record<string, any> = {};
    schema.forEach((v) => {
      const keys = v.key.split(".");
      let current = defaults;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = v.defaultValue;
    });

    set((state) => {
      // Merge new defaults into existing data without losing runtime state
      const mergedData = { ...defaults, ...state.data };
      return {
        defaults,
        data: mergedData,
      };
    });
  },
}));
`;
  zip.folder("src/store")?.file("useGlobalState.ts", globalStoreCode);

  // 10. src/services/apiClient.ts (if axios is used, otherwise fetch wrapper)
  const apiClientCode = `import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
`;
  zip.folder("src/services")?.file("apiClient.ts", apiClientCode);

  // 11. src/app/globals.css
  const globalsCss = `@import "tailwindcss";

body {
  background-color: #111827;
  color: #f3f4f6;
  font-family: ui-sans-serif, system-ui, sans-serif;
  margin: 0;
}
`;
  zip.folder("src/app")?.file("globals.css", globalsCss);

  // 12. src/app/layout.tsx
  let layoutCode = `import "./globals.css";\n`;
  if (isAntd) {
    layoutCode += `import { AntdRegistry } from "@ant-design/nextjs-registry";\n`;
  }
  layoutCode += `
export const metadata = {
  title: "${project.name}",
  description: "Generated by Antigravity Website Builder",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        ${isAntd ? "<AntdRegistry>" : ""}
        {children}
        ${isAntd ? "</AntdRegistry>" : ""}
      </body>
    </html>
  );
}
`;
  zip.folder("src/app")?.file("layout.tsx", layoutCode);

  // 13. Pages generation
  project.pages.forEach((page) => {
    const pageBodyCode = generateReactCode(page.ast, 4);
    const schema = page.stateSchema || [];

    // Collect and generate event handlers
    const handlers = generateAllEventHandlers(page.ast);
    const eventHandlersCode = handlers
      .map((code) => {
        // Rewrite updateState and state references to use our Zustand hook helper
        return code;
      })
      .join("\n\n");

    const antdImports = new Set<string>();
    const iconImports = new Set<string>();

    const collectImports = (node: ASTNode) => {
      switch (node.type) {
        case "TextInput":
        case "PasswordInput":
        case "EmailInput":
        case "Textarea":
        case "SearchInput":
        case "PhoneInput":
        case "URLInput":
        case "OTPInput":
          antdImports.add("Input");
          break;
        case "NumberInput":
          antdImports.add("InputNumber");
          break;
        case "Checkbox":
        case "CheckboxGroup":
          antdImports.add("Checkbox");
          break;
        case "Radio":
        case "RadioGroup":
          antdImports.add("Radio");
          break;
        case "Select":
        case "MultiSelect":
          antdImports.add("Select");
          break;
        case "Switch":
          antdImports.add("Switch");
          break;
        case "DatePicker":
        case "DateTimePicker":
        case "RangePicker":
          antdImports.add("DatePicker");
          break;
        case "TimePicker":
          antdImports.add("TimePicker");
          break;
        case "UploadFile":
          antdImports.add("Upload");
          antdImports.add("Button");
          iconImports.add("UploadOutlined");
          iconImports.add("InboxOutlined");
          break;
        case "UploadImage":
        case "AvatarUpload":
          antdImports.add("Upload");
          iconImports.add("PlusOutlined");
          break;
        case "Slider":
          antdImports.add("Slider");
          break;
        case "Rate":
          antdImports.add("Rate");
          break;
        case "ColorPicker":
          antdImports.add("ColorPicker");
          break;
      }
      node.children?.forEach(collectImports);
    };

    collectImports(page.ast);

    let imports = `"use client";\n\nimport React, { useEffect } from 'react';\nimport { useGlobalState } from '@/store/useGlobalState';\n`;
    if (antdImports.size > 0) {
      imports += `import { ${Array.from(antdImports).sort().join(", ")} } from 'antd';\n`;
    }
    if (iconImports.size > 0) {
      imports += `import { ${Array.from(iconImports).sort().join(", ")} } from '@ant-design/icons';\n`;
    }

    const cleanName = page.name.replace(/[^a-zA-Z0-9]/g, "");

    const pageCode = `${imports}
export default function ${cleanName}Page() {
  const state = useGlobalState((s) => s.data);
  const updateState = useGlobalState((s) => s.setState);

  // Initialize page-specific state schema on mount
  useEffect(() => {
    useGlobalState.getState().initializeFromSchema(${JSON.stringify(schema, null, 2)});
  }, []);

  ${eventHandlersCode ? eventHandlersCode + "\n\n" : ""}  return (
${pageBodyCode}
  );
}
`;

    // Next.js route path structure
    if (page.path === "/") {
      zip.folder("src/app")?.file("page.tsx", pageCode);
    } else {
      const cleanPath = page.path.replace(/^\/+|\/+$/g, ""); // strip / from start/end
      zip.folder(`src/app/${cleanPath}`)?.file("page.tsx", pageCode);
    }
  });

  return await zip.generateAsync({ type: "blob" });
};
