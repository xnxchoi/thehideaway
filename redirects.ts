import type { Redirect } from "next";

const redirects = async () => {
  return [
    {
      destination: "/ie-incompatible.html",
      has: [
        {
          type: "header",
          key: "user-agent",
          value: "(.*Trident.*)" // all ie browsers
        }
      ],
      permanent: false,
      source: "/:path((?!ie-incompatible.html$).*)" // all pages except the incompatibility page
    }
  ];
};

export default redirects;
