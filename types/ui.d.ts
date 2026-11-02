declare module "@/components/ui/card" {
  export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>>;
  export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>>;
}

declare module "@/components/ui/input" {
  export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>>;
}

declare module "@/components/ui/button" {
  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "destructive" | "outline" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
    asChild?: boolean;
  }
  export const Button: React.FC<ButtonProps>;
}

declare module "@/components/ui/table" {
  export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>>;
  export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>>;
  export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>>;
  export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>>;
  export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>>;
  export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>>;
}

declare module "@/components/ui/dropdown-menu" {
  export const DropdownMenu: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const DropdownMenuTrigger: React.FC<React.HTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>;
  export const DropdownMenuContent: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const DropdownMenuItem: React.FC<React.HTMLAttributes<HTMLDivElement>>;
}

declare module "@/components/ui/alert" {
  export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "destructive";
  }
  export const Alert: React.FC<AlertProps>;
  export const AlertTitle: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const AlertDescription: React.FC<React.HTMLAttributes<HTMLDivElement>>;
}

declare module "@/components/ui/skeleton" {
  export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>>;
}

declare module "@/components/ui/switch" {
  export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onCheckedChange?: (checked: boolean) => void;
  }
  export const Switch: React.FC<SwitchProps>;
}

declare module "@/components/ui/textarea" {
  export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>>;
}

declare module "@/components/ui/label" {
  export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>>;
}
