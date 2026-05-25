import { Missing } from "@/components/layouts/Missing/Missing";
import { LinkUnderlined } from "@/components/core/Link/Link";
import { RPage } from "@/components/UX/Transition";

import { MissingLayout } from "../../components/layouts/Missing/lays.client";

const ItemNotFound = () => {
  return (
    <RPage type="404" slug={["404"]}>
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
    </RPage>
  );
};
export default ItemNotFound;

export const generateMetadata = () => {
  return {
    title: "404...",
    description: "NOT AN EXIT"
  };
};
