import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";

type ButtonProps = ComponentProps<typeof Button>;

export interface IconButtonProps extends Omit<ButtonProps, "children" | "size"> {
  label: string;
  icon: React.ReactNode;
  size?: Extract<ButtonProps["size"], "icon" | "icon-xs" | "icon-sm" | "icon-lg">;
}

export function IconButton({
  label,
  icon,
  size = "icon",
  variant = "ghost",
  ...props
}: IconButtonProps) {
  return (
    <Button type="button" size={size} variant={variant} aria-label={label} title={label} {...props}>
      {icon}
    </Button>
  );
}
