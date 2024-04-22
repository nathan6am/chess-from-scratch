import React from "react";

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const TextArea = React.forwardRef<HTMLTextAreaElement, Props>((props, ref) => {
  return (
    <textarea
      ref={ref}
      {...props}
      className="shadow appearance-none border-2 focus:border-light-200 border-light-400 border-box rounded-md w-full py-1.5 px-3 text-md  
  leading-tight focus:outline-none text-gold-100 placeholder-light-400 bg-elevation-1 focus:bg-elevation-2"
    />
  );
});

TextArea.displayName = "TextArea";

export default TextArea;
