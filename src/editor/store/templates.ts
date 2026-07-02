import { Page, StateVariable, ASTNode, Layout, EventActionConfig } from "../types";
import { createDefaultRootNode } from "../utils/defaultRoot";

// Helper to generate a unique random ID
const genId = (type: string) => `${type.toLowerCase()}-${Math.random().toString(36).substr(2, 5)}`;

export interface TemplateData {
  pages: Page[];
  layouts?: Layout[];
  apis: { name: string; url: string; method: string; headers?: string; body?: string }[];
  env?: Record<string, string>;
}

// Helper to create a container
const createContainer = (name: string, children: ASTNode[] = [], flexDir: "column" | "row" = "column", gap = "16px", padding = "24px"): ASTNode => ({
  id: genId("Container"),
  type: "Container",
  props: { name },
  styles: {
    desktop: {
      display: "flex",
      flexDirection: flexDir,
      gap,
      padding,
      backgroundColor: "#1f2937",
      color: "#ffffff",
      minHeight: "100%",
    }
  },
  children,
});

// Helper to create a heading
const createHeading = (text: string, level: 1 | 2 | 3 = 1): ASTNode => ({
  id: genId("Heading"),
  type: "Heading",
  props: { text, level: level.toString() },
  styles: {
    desktop: {
      color: "#ffffff",
      fontWeight: "bold",
      fontSize: level === 1 ? "2rem" : level === 2 ? "1.5rem" : "1.2rem",
    }
  }
});

// Helper to create simple text
const createText = (text: string, fontSize = "14px", color = "#9ca3af"): ASTNode => ({
  id: genId("Text"),
  type: "Text",
  props: { text },
  styles: {
    desktop: { fontSize, color }
  }
});

// Helper to create a button
const createButton = (text: string, onClickActions: EventActionConfig[] = []): ASTNode => ({
  id: genId("Button"),
  type: "Button",
  props: { text, type: "primary" },
  styles: {
    desktop: {
      backgroundColor: "#2563eb",
      color: "#ffffff",
      padding: "8px 16px",
      borderRadius: "6px",
      border: "none",
      cursor: "pointer",
    }
  },
  events: onClickActions.length > 0 ? [{ event: "onClick", actions: onClickActions }] : undefined,
});

// Helper to create a TextInput
const createInput = (name: string, label: string, placeholder: string, valuePath?: string): ASTNode => ({
  id: genId("TextInput"),
  type: "TextInput",
  props: { name, label, placeholder },
  styles: {
    desktop: { width: "100%" }
  },
  bindings: valuePath ? [{ prop: "value", expression: valuePath }] : undefined,
});

export const TEMPLATES: Record<string, TemplateData> = {
  blank: {
    pages: [
      {
        id: "home",
        name: "Home",
        path: "/",
        ast: createDefaultRootNode(),
        stateSchema: [],
      }
    ],
    apis: [],
  },

  admin: {
    pages: [
      {
        id: "dashboard",
        name: "Dashboard",
        path: "/",
        stateSchema: [
          { key: "loading", type: "boolean", defaultValue: false },
          { key: "stats.users", type: "number", defaultValue: 1240 },
          { key: "stats.revenue", type: "number", defaultValue: 45200 },
        ],
        ast: createContainer("Dashboard Root", [
          createHeading("Admin Dashboard", 1),
          createText("Welcome back! Here is a summary of your app's performance.", "14px", "#9ca3af"),
          // Loading Indicator Wrapper
          {
            id: genId("Loading"),
            type: "Loading",
            props: { visible: false },
            bindings: [{ prop: "visible", expression: "loading" }],
            styles: { desktop: { width: "100%", minHeight: "150px" } },
            children: [
              // Stats Row
              {
                id: genId("Row"),
                type: "Row",
                props: { gutter: "16" },
                styles: { desktop: { width: "100%", gap: "16px" } },
                children: [
                  {
                    id: genId("Column"),
                    type: "Column",
                    props: { span: "12" },
                    styles: { desktop: {} },
                    children: [
                      createContainer("Stats Card 1", [
                        createText("Total Users", "12px", "#9ca3af"),
                        {
                          id: genId("Heading"),
                          type: "Heading",
                          props: { text: "1,240", level: "2" },
                          styles: { desktop: { fontSize: "1.8rem", color: "#3b82f6" } },
                          bindings: [{ prop: "text", expression: "stats.users" }]
                        }
                      ], "column", "8px", "16px")
                    ]
                  },
                  {
                    id: genId("Column"),
                    type: "Column",
                    props: { span: "12" },
                    styles: { desktop: {} },
                    children: [
                      createContainer("Stats Card 2", [
                        createText("Monthly Revenue", "12px", "#9ca3af"),
                        {
                          id: genId("Heading"),
                          type: "Heading",
                          props: { text: "$45,200", level: "2" },
                          styles: { desktop: { fontSize: "1.8rem", color: "#10b981" } },
                          bindings: [{ prop: "text", expression: "stats.revenue" }]
                        }
                      ], "column", "8px", "16px")
                    ]
                  }
                ]
              }
            ]
          },
          // Refresh Button
          createButton("Refresh Analytics", [
            {
              id: genId("action"),
              type: "setState",
              params: { path: "loading", valueSource: "custom", value: "true" }
            },
            {
              id: genId("action"),
              type: "delay",
              params: { duration: 1500 }
            },
            {
              id: genId("action"),
              type: "setState",
              params: { path: "stats.users", valueSource: "custom", value: "1358" }
            },
            {
              id: genId("action"),
              type: "setState",
              params: { path: "stats.revenue", valueSource: "custom", value: "48900" }
            },
            {
              id: genId("action"),
              type: "setState",
              params: { path: "loading", valueSource: "custom", value: "false" }
            }
          ])
        ])
      },
      {
        id: "settings",
        name: "Settings",
        path: "/settings",
        stateSchema: [
          { key: "form.settings.username", type: "string", defaultValue: "admin_user" },
          { key: "form.settings.email", type: "string", defaultValue: "admin@example.com" },
        ],
        ast: createContainer("Settings Root", [
          createHeading("Account Settings", 1),
          createText("Manage your profile settings here.", "14px", "#9ca3af"),
          createInput("username", "Username", "Enter username", "form.settings.username"),
          createInput("email", "Email Address", "Enter email address", "form.settings.email"),
          createButton("Save Profile", [
            {
              id: genId("action"),
              type: "showToast",
              params: { message: "Profile saved successfully!", toastType: "success" }
            }
          ])
        ])
      }
    ],
    apis: [
      { name: "Get Profile", url: "https://api.example.com/user/profile", method: "GET" }
    ]
  },

  landing: {
    pages: [
      {
        id: "home",
        name: "Home",
        path: "/",
        stateSchema: [
          { key: "form.contact.name", type: "string", defaultValue: "" },
          { key: "form.contact.email", type: "string", defaultValue: "" },
          { key: "form.contact.message", type: "string", defaultValue: "" },
        ],
        ast: createContainer("Landing Root", [
          // Hero Container
          createContainer("Hero Section", [
            createHeading("Build Apps Blazing Fast", 1),
            createText("Deploy responsive Next.js applications directly from your design dashboard with standard quality code.", "16px", "#9ca3af"),
            createButton("Get Started Now", [])
          ], "column", "12px", "40px"),
          
          // Contact Form
          createContainer("Contact Form Section", [
            createHeading("Get in touch", 2),
            createInput("name", "Name", "Your name", "form.contact.name"),
            createInput("email", "Email", "Your email", "form.contact.email"),
            createInput("message", "Message", "Tell us more", "form.contact.message"),
            createButton("Submit Form", [
              {
                id: genId("action"),
                type: "showToast",
                params: { message: "Thank you for reaching out!", toastType: "success" }
              }
            ])
          ], "column", "16px", "24px")
        ])
      }
    ],
    apis: []
  },

  crm: {
    pages: [
      {
        id: "contacts",
        name: "Contacts",
        path: "/",
        stateSchema: [
          { key: "searchQuery", type: "string", defaultValue: "" },
          { key: "selectedContact", type: "string", defaultValue: "No Contact Selected" },
        ],
        ast: createContainer("CRM Root", [
          createHeading("CRM Contact Center", 1),
          createText("Search and manage customer relations.", "14px", "#9ca3af"),
          createInput("search", "Search Contacts", "Type name or email...", "searchQuery"),
          createContainer("Contact Detail Panel", [
            createText("Active Selection:", "12px", "#9ca3af"),
            {
              id: genId("Heading"),
              type: "Heading",
              props: { text: "Select a contact to view details", level: "3" },
              bindings: [{ prop: "text", expression: "selectedContact" }],
              styles: { desktop: { color: "#60a5fa" } }
            }
          ], "column", "8px", "16px"),
          createButton("Open John Doe", [
            {
              id: genId("action"),
              type: "setState",
              params: { path: "selectedContact", valueSource: "custom", value: "\"John Doe - Senior Engineer\"" }
            }
          ]),
          createButton("Open Jane Smith", [
            {
              id: genId("action"),
              type: "setState",
              params: { path: "selectedContact", valueSource: "custom", value: "\"Jane Smith - VP of Sales\"" }
            }
          ])
        ])
      }
    ],
    apis: []
  },

  ecommerce: {
    pages: [
      {
        id: "products",
        name: "Products",
        path: "/",
        stateSchema: [
          { key: "cart.count", type: "number", defaultValue: 0 },
        ],
        ast: createContainer("Store Root", [
          createHeading("Fresh Gadget Store", 1),
          createText("Add items to your cart below.", "14px", "#9ca3af"),
          createContainer("Cart Indicator", [
            createText("Items in cart:", "14px", "#9ca3af"),
            {
              id: genId("Heading"),
              type: "Heading",
              props: { text: "0", level: "2" },
              bindings: [{ prop: "text", expression: "cart.count" }],
              styles: { desktop: { color: "#fbbf24" } }
            }
          ], "row", "8px", "12px"),
          createButton("Buy Smart Watch ($299)", [
            {
              id: genId("action"),
              type: "setState",
              params: { path: "cart.count", valueSource: "custom", value: "1" }
            },
            {
              id: genId("action"),
              type: "showToast",
              params: { message: "Item added to cart!", toastType: "success" }
            }
          ]),
          createButton("Buy Wireless Earbuds ($99)", [
            {
              id: genId("action"),
              type: "setState",
              params: { path: "cart.count", valueSource: "custom", value: "2" }
            },
            {
              id: genId("action"),
              type: "showToast",
              params: { message: "Item added to cart!", toastType: "success" }
            }
          ])
        ])
      }
    ],
    apis: []
  },

  blog: {
    pages: [
      {
        id: "blog-home",
        name: "Blog",
        path: "/",
        stateSchema: [
          { key: "activeCategory", type: "string", defaultValue: "All" },
        ],
        ast: createContainer("Blog Root", [
          createHeading("Tech Insights Blog", 1),
          createText("Filtering thoughts on architecture & development.", "14px", "#9ca3af"),
          createContainer("Active Filter Display", [
            createText("Active category:", "14px", "#9ca3af"),
            {
              id: genId("Heading"),
              type: "Heading",
              props: { text: "All", level: "3" },
              bindings: [{ prop: "text", expression: "activeCategory" }],
              styles: { desktop: { color: "#ec4899" } }
            }
          ], "row", "8px", "12px"),
          createButton("Show React Articles", [
            {
              id: genId("action"),
              type: "setState",
              params: { path: "activeCategory", valueSource: "custom", value: "\"React\"" }
            }
          ]),
          createButton("Show Node.js Articles", [
            {
              id: genId("action"),
              type: "setState",
              params: { path: "activeCategory", valueSource: "custom", value: "\"Node.js\"" }
            }
          ])
        ])
      }
    ],
    apis: []
  }
};
