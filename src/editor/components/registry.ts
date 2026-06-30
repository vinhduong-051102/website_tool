import { BuilderComponent } from "./types";
import { ContainerComponent } from "./Container";
import { ButtonComponent } from "./Button";
import { TextComponent } from "./Text";
import { HeadingComponent } from "./Heading";
import { ParagraphComponent } from "./Paragraph";
import { ImageComponent } from "./Image";
import { RowComponent } from "./Row";
import { ColumnComponent } from "./Column";

// Dictionary registry holding all builder components
export const componentRegistry: Record<string, BuilderComponent> = {
  Container: ContainerComponent,
  Button: ButtonComponent,
  Text: TextComponent,
  Heading: HeadingComponent,
  Paragraph: ParagraphComponent,
  Image: ImageComponent,
  Row: RowComponent,
  Column: ColumnComponent,
};

// Retrieve component from registry by its type string
export const getComponent = (type: string): BuilderComponent | undefined => {
  return componentRegistry[type];
};

// Programmatic registration for third-party extensions
export const registerComponent = (type: string, component: BuilderComponent) => {
  componentRegistry[type] = component;
};
