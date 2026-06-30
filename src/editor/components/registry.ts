import { BuilderComponent } from "./types";
import { ContainerComponent } from "./Container";
import { ButtonComponent } from "./Button";
import { TextComponent } from "./Text";
import { HeadingComponent } from "./Heading";
import { ParagraphComponent } from "./Paragraph";
import { ImageComponent } from "./Image";
import { RowComponent } from "./Row";
import { ColumnComponent } from "./Column";
import { FlexComponent } from "./Flex";

// Form Components Imports
import { TextInputComponent } from "./TextInput";
import { PasswordInputComponent } from "./PasswordInput";
import { EmailInputComponent } from "./EmailInput";
import { NumberInputComponent } from "./NumberInput";
import { TextareaComponent } from "./Textarea";
import { SearchInputComponent } from "./SearchInput";
import { PhoneInputComponent } from "./PhoneInput";
import { URLInputComponent } from "./URLInput";
import { CheckboxComponent } from "./Checkbox";
import { CheckboxGroupComponent } from "./CheckboxGroup";
import { RadioComponent } from "./Radio";
import { RadioGroupComponent } from "./RadioGroup";
import { SelectComponent } from "./Select";
import { MultiSelectComponent } from "./MultiSelect";
import { SwitchComponent } from "./Switch";
import { DatePickerComponent } from "./DatePicker";
import { TimePickerComponent } from "./TimePicker";
import { DateTimePickerComponent } from "./DateTimePicker";
import { RangePickerComponent } from "./RangePicker";
import { UploadFileComponent } from "./UploadFile";
import { UploadImageComponent } from "./UploadImage";
import { AvatarUploadComponent } from "./AvatarUpload";
import { SliderComponent } from "./Slider";
import { RateComponent } from "./Rate";
import { ColorPickerComponent } from "./ColorPicker";
import { OTPInputComponent } from "./OTPInput";

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
  Flex: FlexComponent,

  // Registered Form Components
  TextInput: TextInputComponent,
  PasswordInput: PasswordInputComponent,
  EmailInput: EmailInputComponent,
  NumberInput: NumberInputComponent,
  Textarea: TextareaComponent,
  SearchInput: SearchInputComponent,
  PhoneInput: PhoneInputComponent,
  URLInput: URLInputComponent,
  Checkbox: CheckboxComponent,
  CheckboxGroup: CheckboxGroupComponent,
  Radio: RadioComponent,
  RadioGroup: RadioGroupComponent,
  Select: SelectComponent,
  MultiSelect: MultiSelectComponent,
  Switch: SwitchComponent,
  DatePicker: DatePickerComponent,
  TimePicker: TimePickerComponent,
  DateTimePicker: DateTimePickerComponent,
  RangePicker: RangePickerComponent,
  UploadFile: UploadFileComponent,
  UploadImage: UploadImageComponent,
  AvatarUpload: AvatarUploadComponent,
  Slider: SliderComponent,
  Rate: RateComponent,
  ColorPicker: ColorPickerComponent,
  OTPInput: OTPInputComponent,
};

// Retrieve component from registry by its type string
export const getComponent = (type: string): BuilderComponent | undefined => {
  return componentRegistry[type];
};

// Programmatic registration for third-party extensions
export const registerComponent = (type: string, component: BuilderComponent) => {
  componentRegistry[type] = component;
};
