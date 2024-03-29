import cn from "@/util/cn";

interface PageTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode | string;
  className?: string;
}
/**
 * Page Title Header
 */
export function PageTitle({ children, className }: PageTitleProps) {
  return (
    <h1 className={cn("text-3xl font-bold text-gold-100 my-4 text-center sm:text-left", className)}>{children}</h1>
  );
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

export function PanelHeader({ children, className }: PageTitleProps) {
  return <h2 className={cn("text-gold-100 font-bold text-xl", className)}>{children}</h2>;
}
