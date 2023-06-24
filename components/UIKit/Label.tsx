import classNames from "classnames";
interface Props extends React.HTMLAttributes<HTMLLabelElement> {
  children?: JSX.Element | string | Array<JSX.Element | string>;
  className?: string;
}

export default function Label({ className, children, ...props }: Props) {
  return (
    <label className={classNames("block text-light-300 text-sm font-semibold", className)} {...props}>
      {children}
    </label>
  );
}
