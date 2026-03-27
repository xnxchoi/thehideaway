import PageClient from "@/app/(frontend)/(dev)/dev/page.client";

export default async function Page() {
  return (
    <>
      <div className={"p-0"}>
        <div className={"h-full w-full"}>
          <PageClient />
        </div>
      </div>
    </>
  );
}
