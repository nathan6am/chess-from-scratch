import React from "react";
import { TimeField } from "@mui/x-date-pickers/TimeField";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTime, Duration } from "luxon";

import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
interface Props {
  defaultValue: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}
function TimeInput({ defaultValue, onChange, disabled }: Props) {
  const [key, setKey] = React.useState("stringKey");
  const timeRemaining = defaultValue ? Duration.fromMillis(defaultValue).toFormat("hh:mm:ss") : null;
  const value = timeRemaining ? DateTime.fromFormat(timeRemaining, "hh:mm:ss") : null;
  const fieldRef = React.useRef<any>(null);

  return (
    <LocalizationProvider dateAdapter={AdapterLuxon}>
      <TimeField
        disabled={disabled}
        clearable
        inputRef={fieldRef}
        key={key}
        defaultValue={value}
        onChange={(value, context) => {
          if (!context.validationError) {
            if (value) {
              const obj = value.toObject();
              let hms = {
                hours: obj.hour,
                minutes: obj.minute,
                seconds: obj.second,
              };
              const millis = Duration.fromObject(hms).toMillis();
              onChange(millis);
            } else {
              onChange(null);
            }
          }
        }}
        format="HH:mm:ss"
        // clearable
        variant="filled"
        size="small"
        inputProps={{
          sx: {
            borderRadius: "4px",
            color: "#fff",
            overflow: "hidden",
            backgroundColor: "#303030",
            paddingTop: "8px",
            paddingBottom: "8px",
            paddingRight: 0,
          },
        }}
        sx={{
          backgroundColor: "#303030",
          paddingVertical: "2px",
          borderRadius: "4px",
          paddingRight: 0,
          color: "#fff",
          overflow: "hidden",
        }}
        // slots={{
        //   textField: (params) => {
        //     const { onBlur, onChange, onClick, onFocus, value, inputProps, error, InputProps } = params;

        //     return (
        //       <>
        //         <Input
        //           containerClassName="max-w-xs"
        //           onChange={(e) => {
        //             onChange(e);
        //           }}
        //           onFocus={onFocus}
        //           value={value}
        //           placeholder="--:--:--"
        //           onBlur={(e) => {
        //             console.log(e.target.value);
        //             onBlur(e);
        //           }}
        //           onClick={onClick}
        //           ref={inputProps.ref}
        //           status={error ? "error" : null}
        //         />
        //       </>
        //     );
        //   },
        // }}
      />
    </LocalizationProvider>
  );
}

export default TimeInput;
