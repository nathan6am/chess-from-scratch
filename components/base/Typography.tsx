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

export function SectionHeader({ children, className }: PageTitleProps) {
  return <h3 className={cn("text-light-200 font-bold text-lg mb-1", className)}>{children}</h3>;
}

interface AnchorProps extends React.HTMLAttributes<HTMLAnchorElement> {
  children?: JSX.Element | string | Array<JSX.Element | string>;
  className?: string;
}
export function Anchor({ children, className, ...props }: AnchorProps) {
  return (
    <a className={cn("hover:text-gold-200 underline", className)} {...props}>
      {children}
    </a>
  );
}

interface BodyProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode | string;
  className?: string;
}

export function Body({ children, className, ...props }: BodyProps) {
  return (
    <p className={cn("text-light-100", className)} {...props}>
      {children}
    </p>
  );
}
