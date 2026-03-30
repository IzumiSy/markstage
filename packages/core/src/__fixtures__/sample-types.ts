/** Description of the button */
export type ButtonProps = {
  /** The visual style variant */
  variant: "default" | "outline" | "ghost";
  /** Button label text */
  label: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick?: () => void;
  /**
   * Size of the button
   * @default "md"
   */
  size?: "sm" | "md" | "lg";
};

export type Base = {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
};

export type Extended = Base & {
  /** Email address */
  email: string;
  /** Is admin user */
  isAdmin?: boolean;
};

export type Picked = Pick<ButtonProps, "variant" | "label">;

export type Omitted = Omit<ButtonProps, "onClick" | "size">;
