import JSZip from "jszip";
import { Project, Page, ASTNode } from "../types";
import { generateReactCode } from "./codeGenerator";
import { generateAllEventHandlers } from "./stateGenerator";

// Scans all pages to see if Ant Design components are used
const checkAntdUsage = (pages: Page[]): boolean => {
  let used = false;
  const scan = (node: ASTNode) => {
    if ([
      "TextInput", "PasswordInput", "EmailInput", "NumberInput", "Textarea",
      "SearchInput", "PhoneInput", "URLInput", "Checkbox", "CheckboxGroup",
      "Radio", "RadioGroup", "Select", "MultiSelect", "Switch", "DatePicker",
      "TimePicker", "DateTimePicker", "RangePicker", "UploadFile", "UploadImage",
      "AvatarUpload", "Slider", "Rate", "ColorPicker", "OTPInput", "Loading",
      "Flex", "Row", "Column", "Container", "Layout", "Header", "Sidebar",
      "Content", "Footer", "Space", "Divider", "Card"
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

// Scans node recursively to check if any Link property is used
const checkLinkUsage = (node: ASTNode): boolean => {
  if (node.props?.linkToPageId) return true;
  return node.children?.some(checkLinkUsage) ?? false;
};

export const generateNextJsProjectZip = async (project: Project): Promise<Blob> => {
  const zip = new JSZip();

  const isAntd = checkAntdUsage(project.pages);
  const isLucide = checkLucideUsage(project.pages) || (project.layouts || []).some(l => l.regions.sidebar && l.config?.sidebarCollapsible && l.config?.sidebarCollapseTrigger === "button");
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
        case "Flex":
        case "Container":
          antdImports.add("Flex");
          break;
        case "Row":
          antdImports.add("Row");
          break;
        case "Column":
          antdImports.add("Col");
          break;
        case "Layout":
        case "Header":
        case "Sidebar":
        case "Content":
        case "Footer":
          antdImports.add("Layout");
          break;
        case "Space":
          antdImports.add("Space");
          break;
        case "Divider":
          antdImports.add("Divider");
          break;
        case "Card":
          antdImports.add("Card");
          break;
      }
      node.children?.forEach(collectImports);
    };

    collectImports(page.ast);

    // Resolve linked layout
    const projectLayouts = project.layouts || [];
    const layout = projectLayouts.find((l) => l.id === page.layoutId);
    let wrappedBody = "";
    let layoutImport = "";

    if (layout) {
      const cleanLayoutName = layout.name.replace(/[^a-zA-Z0-9]/g, "");
      layoutImport = `import ${cleanLayoutName}Layout from '@/components/layouts/${layout.id}';\n`;
      wrappedBody = `  return (
    <${cleanLayoutName}Layout>
      <div className="w-full h-full">
        ${pageBodyCode.trim().split("\n").join("\n      ")}
      </div>
    </${cleanLayoutName}Layout>
  );`;
    } else {
      wrappedBody = `  return (
${pageBodyCode}
  );`;
    }

    let imports = `"use client";\n\nimport React, { useEffect } from 'react';\nimport { useGlobalState } from '@/store/useGlobalState';\nimport { useRouter } from 'next/navigation';\n`;
    if (layoutImport) {
      imports += layoutImport;
    }
    if (checkLinkUsage(page.ast)) {
      imports += `import Link from 'next/link';\n`;
    }
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
  const router = useRouter();

  // Initialize page-specific state schema on mount
  useEffect(() => {
    useGlobalState.getState().initializeFromSchema(${JSON.stringify(schema, null, 2)});
  }, []);

  ${eventHandlersCode ? eventHandlersCode + "\n\n" : ""}${wrappedBody}
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

  // 14. Layouts generation
  const projectLayouts = project.layouts || [];
  projectLayouts.forEach((layout) => {
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
        case "Flex":
        case "Container":
          antdImports.add("Flex");
          break;
        case "Row":
          antdImports.add("Row");
          break;
        case "Column":
          antdImports.add("Col");
          break;
        case "Layout":
        case "Header":
        case "Sidebar":
        case "Content":
        case "Footer":
          antdImports.add("Layout");
          break;
        case "Space":
          antdImports.add("Space");
          break;
        case "Divider":
          antdImports.add("Divider");
          break;
        case "Card":
          antdImports.add("Card");
          break;
      }
      node.children?.forEach(collectImports);
    };

    if (layout.regions.header) collectImports(layout.headerAST);
    if (layout.regions.sidebar) collectImports(layout.sidebarAST);
    if (layout.regions.footer) collectImports(layout.footerAST);

    let imports = `import React from 'react';\n`;
    if (antdImports.size > 0) {
      imports += `import { ${Array.from(antdImports).sort().join(", ")} } from 'antd';\n`;
    }
    if (iconImports.size > 0) {
      imports += `import { ${Array.from(iconImports).sort().join(", ")} } from '@ant-design/icons';\n`;
    }
    if (layout.regions.sidebar) {
      imports += `import { useGlobalState } from '@/store/useGlobalState';\n`;
      if (layout.config?.sidebarCollapsible && layout.config?.sidebarCollapseTrigger === "button") {
        imports += `import { ChevronLeft, ChevronRight } from 'lucide-react';\n`;
      }
    }

    const headerCode = layout.regions.header ? generateReactCode(layout.headerAST, 10) : "";
    const sidebarCode = layout.regions.sidebar ? generateReactCode(layout.sidebarAST, 10) : "";
    const footerCode = layout.regions.footer ? generateReactCode(layout.footerAST, 10) : "";

    const headerSection = layout.regions.header ? `
      <Header 
        style={{
          minHeight: "${layout.config?.headerHeight || '64px'}",
          height: "auto",
          backgroundColor: "${layout.config?.headerBg || '#1e293b'}",
          position: ${layout.config?.headerFixed ? '"sticky"' : '"static"'},
          top: 0,
          zIndex: 10,
          lineHeight: "${layout.config?.headerHeight || '64px'}",
          padding: "0 24px",
        }}
      >
${headerCode}
      </Header>` : "";

    const sidebarSection = layout.regions.sidebar ? `
        <div 
          style={{
            position: ${layout.config?.sidebarFixed ? '"sticky"' : '"relative"'},
            top: ${layout.config?.sidebarFixed ? '0' : '"auto"'},
            height: ${layout.config?.sidebarFixed ? '"100vh"' : '"auto"'},
            zIndex: 9,
          }}
        >
          <Sider 
            width={isSidebarCollapsed ? ${layout.config?.sidebarCollapsedWidth || 80} : ${layout.config?.sidebarWidth || 240}}
            collapsible={${Boolean(layout.config?.sidebarCollapsible)}}
            collapsed={isSidebarCollapsed}
            trigger={null}
            style={{
              backgroundColor: "${layout.config?.sidebarBg || '#111827'}",
              height: "100%",
              transition: "width ${layout.config?.sidebarAnimationDuration || '300ms'} ${layout.config?.sidebarAnimationEasing || 'ease-in-out'}",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
${sidebarCode}
          </Sider>
          ${layout.config?.sidebarCollapsible && layout.config?.sidebarCollapseTrigger === "button" ? `
          <button
            onClick={handleToggleSidebar}
            style={{
              position: "absolute",
              top: "${layout.config?.sidebarCollapsePosition === 'top' ? '24px' : layout.config?.sidebarCollapsePosition === 'bottom' ? 'auto' : '50%'}",
              bottom: "${layout.config?.sidebarCollapsePosition === 'bottom' ? '24px' : 'auto'}",
              transform: "${layout.config?.sidebarCollapsePosition === 'center' ? 'translateY(-50%)' : 'none'}",
              ${layout.config?.sidebarPosition === 'right' ? 'left' : 'right'}: "-14px",
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: "${layout.config?.sidebarBg || '#111827'}",
              border: "1px solid #374151",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 10,
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
              transition: "all 0.2s ease-in-out",
            }}
          >
            {isSidebarCollapsed ? (${layout.config?.sidebarPosition === 'right' ? '<ChevronLeft size={14} />' : '<ChevronRight size={14} />'}) : (${layout.config?.sidebarPosition === 'right' ? '<ChevronRight size={14} />' : '<ChevronLeft size={14} />'})}
          </button>
          ` : ""}
        </div>` : "";

    const footerSection = layout.regions.footer ? `
      <Footer 
        style={{
          minHeight: "${layout.config?.footerHeight || '48px'}",
          height: "auto",
          backgroundColor: "${layout.config?.footerBg || '#1e293b'}",
          position: ${layout.config?.footerFixed ? '"sticky"' : '"static"'},
          bottom: 0,
          zIndex: 8,
          padding: "16px 24px",
        }}
      >
${footerCode}
      </Footer>` : "";

    const cleanLayoutName = layout.name.replace(/[^a-zA-Z0-9]/g, "");

    const layoutCodeStr = `${imports}
const { Header, Sider, Content, Footer } = Layout;

export default function ${cleanLayoutName}Layout({ children }: { children: React.ReactNode }) {
  ${layout.regions.sidebar ? `
  const isSidebarCollapsed = useGlobalState((s) => s.data.layout?.sidebarCollapsed ?? ${layout.config?.sidebarDefaultCollapsed ?? false});
  const updateState = useGlobalState((s) => s.setState);
  
  const handleToggleSidebar = () => {
    updateState("layout.sidebarCollapsed", !isSidebarCollapsed);
  };
  ` : ""}
  return (
    <Layout 
      style={{
        minHeight: "100vh",
        backgroundColor: "${layout.config?.layoutBg || '#0f172a'}",
        gap: "${layout.config?.layoutGap || '0px'}",
        padding: "${layout.config?.layoutPadding || '0px'}",
      }}
    >
      ${headerSection}

      <Layout 
        hasSider={${Boolean(layout.regions.sidebar)}}
        style={{
          display: "flex",
          flexDirection: "${layout.config?.sidebarPosition === 'right' ? 'row-reverse' : 'row'}",
          flex: 1,
          gap: "${layout.config?.layoutGap || '0px'}",
          background: "transparent",
        }}
      >
        ${sidebarSection}

        <Content style={{ flex: 1, maxWidth: "${layout.config?.layoutMaxWidth || '100%'}", margin: "0 auto", width: "100%", background: "transparent" }}>
          {children}
        </Content>
      </Layout>

      ${footerSection}
    </Layout>
  );
}
`;
    zip.folder("src/components/layouts")?.file(`${layout.id}.tsx`, layoutCodeStr);
  });

  return await zip.generateAsync({ type: "blob" });
};
