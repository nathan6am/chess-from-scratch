import cn from "@/util/cn";

interface PageTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode | string;
  className?: string;
}
/**
 * Page Title Header
 */
export function PageTitle({ children, className }: PageTitleProps) {
  return <h1 className={cn("text-2xl text-light-100", className)}>{children}</h1>;
}

interface LabelProps extends React.HTMLAttributes<HTMLLabelElement> {
  children?: React.ReactNode | string;
  disabled?: boolean;
  className?: string;
}

/**
 *Generic label component
 */
export function Label({ disabled, children, className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "block text-sm font-semibold",
        {
          "text-light-400": disabled,
          "text-light-200": !disabled,
        },
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}

export function H2({ children, className }: LabelProps) {
  return <h2 className={cn("text-xl font-semibold text-gold-200", className)}>{children}</h2>;
}
