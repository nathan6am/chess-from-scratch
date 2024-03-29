import { ClipLoader } from "react-spinners";

export default function Loading() {
  return (
    <div className="py-10 w-full flex justify-center items-center">
      <ClipLoader color="#DCB96A" size={20} />
    </div>
  );
}
