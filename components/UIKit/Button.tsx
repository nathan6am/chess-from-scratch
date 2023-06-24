import classNames from "classnames";
interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "neutral" | "success" | "danger";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  disabled?: boolean;
  icon?: React.FC<any>;
  width?: "fit" | "full" | "sm" | "md" | "lg";
  label?: string;
  isLoading?: boolean;
  loadingLabel?: string;
  loadingIcon?: React.FC<any>;
  loadingWidth?: "fit" | "full" | "sm" | "md" | "lg";
  outline?: boolean;
  iconClassName?: string;
  labelClassName?: string;
  iconPosition?: "left" | "right";
  size?: "sm" | "md" | "lg";
}

export default function Button({
  variant = "primary",
  onClick,
  className,
  disabled,
  icon: Icon,
  label,
  isLoading,
  width = "full",
  loadingLabel,
  loadingIcon,
  loadingWidth,
  outline,
  iconClassName,
  iconPosition = "left",
  size = "md",
  labelClassName,
  ...props
}: Props) {
  return (
    <button
      onClick={onClick}
      {...props}
      disabled={disabled || isLoading}
      className={classNames(
        "flex items-center flex-row justify-center shadow hover:shadow-lg justify-center rounded-md transition-colors duration-200  font-medium focus:outline-none",
        {
          "bg-gold-300 border-2 border-gold-300 hover:bg-gold-400 hover:border-gold-400 text-light-100":
            variant === "primary" && !disabled,
          "bg-elevation-4 hover:bg-elevation-5 text-light-200 hover:text-gold-100": variant === "neutral" && !disabled,
          "bg-success-700 border-2 border-success-700 hover:bg-success-600 hover:border-success-600 text-light-100":
            variant === "success" && !disabled,
          "w-full": width !== "fit",
          "w-fit": width === "fit",
          "max-w-sm": width === "sm",
          "max-w-md": width === "md",
          "max-w-lg": width === "lg",
          "py-1 px-4 text-sm": size === "sm",
          "py-1.5 px-3": size === "md",
          "py-2 px-4 ": size === "lg",
          "bg-elevation-3 text-light-400": disabled,
        },
        className
      )}
    >
      <>{Icon && iconPosition === "left" && <Icon className={iconClassName} />}</>
      <p className={labelClassName}>{isLoading && loadingIcon ? loadingLabel : label || ""}</p>
      <>{Icon && iconPosition === "right" && <Icon className={iconClassName} />}</>
      <span className=""></span>
    </button>
  );
}
