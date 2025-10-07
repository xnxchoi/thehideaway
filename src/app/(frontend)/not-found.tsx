import { Missing } from "@/components/layouts/Missing/Missing";
import { LinkUnderlined } from "@/components/UX/Link/Link";

import { MissingLayout } from "../../components/layouts/Missing/lays.client";

const ItemNotFound = () => {
  return (
    <div className="h-screen w-screen">
      <div className="title-wrapper fixed h-full w-full">
        <MissingLayout />
      </div>
      <Missing />
      <div
        className={"fixed z-1 flex h-full w-full items-center justify-center"}
      >
        <LinkUnderlined
          className={"link-underlined bg-transparent hover:text-red-500"}
          href="/home"
          style={{ position: "relative", bottom: "20px" }}
        >
          Come Back.
        </LinkUnderlined>
      </div>
    </div>
  );
};
export default ItemNotFound;

export const generateMetadata = () => {
  return {
    title: "404...",
    description: "NOT AN EXIT"
  };
};
