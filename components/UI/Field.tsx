import React from "react";
import { useField } from "formik";
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error: string | null;
  status: "success" | "warning" | "error" | null;
  label?: string;
  name: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  id: string;
}

export default function Field({
  id,
  label,
  error,
  status,
  onChange,
  ...props
}: InputProps) {
  const [field, meta, helpers] = useField(props);
  return (
    <div className="mb-4 w-full">
      {label && (
        <label
          className="block text-white/[0.6] text-md font-semibold mb-2"
          htmlFor={id}
        >
          {label}
        </label>
      )}
      <input
        {...field}
        {...props}
        onChange={(e) => {
          onChange(e);
          field.onChange(e);
        }}
        className={`${
          status === "error" ? "border-red-400" : "border-white/[0.3]"
        } shadow appearance-none border-2 focus:border-white/[0.8] border-box rounded-md w-full py-2 px-3 text-md bg-black/[0.3] text-sepia placeholder:text-gray-300 leading-tight focus:outline-none`}
        id={id}
      />
      {error && (
        <p className="text-red-400 text-sm mt-1 text-left ml-2">{error}</p>
      )}
      {meta.touched && meta.error && (
        <p className="text-red-400 text-sm mt-1 text-left ml-2">{meta.error}</p>
      )}
    </div>
  );
}
