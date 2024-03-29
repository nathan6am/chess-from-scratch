export const WhiteIcon = () => {
  return <div className="bg-white h-[1em] w-[1em] rounded-sm"></div>;
};
export const BlackIcon = () => {
  return <div className="bg-black h-[1em] w-[1em] rounded-sm"></div>;
};
export const DrawIcon = () => {
  return <div className="bg-gray-400 h-[1em] w-[1em] rounded-sm"></div>;
};

export const RandomIcon = () => {
  return (
    <div
      className="relative h-[1em] w-[1em] rounded-sm"
      style={{
        backgroundImage: "linear-gradient(to bottom right, White 50%, Black 50%)",
      }}
    ></div>
  );
};
