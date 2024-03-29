import React from "react";

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const TextArea = React.forwardRef<HTMLTextAreaElement, Props>((props, ref) => {
  return <textarea ref={ref} {...props} className="w-full h-20 p-2 bg-elevation-1 text-gold-200" />;
});

TextArea.displayName = "TextArea";

export default TextArea;
