import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LostDomainProvider,
  useLostDomain,
  useRoutePathname
} from "./domain-context";
import { lostPublicHref } from "./domain";

const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

function RouteProbe() {
  const pathname = useRoutePathname();
  const lostHost = useLostDomain();
  return <a href={lostPublicHref("/lostinseoul/cart", lostHost)}>{pathname}</a>;
}

describe("host-aware shell paths", () => {
  beforeEach(() => {
    route.pathname = "/";
  });
  it("renders clean and rewritten LOST URLs with the same shell route", () => {
    const render = () =>
      renderToStaticMarkup(
        <LostDomainProvider isLostHost>
          <RouteProbe />
        </LostDomainProvider>
      );
    expect(render()).toBe('<a href="/cart">/lostinseoul</a>');
    route.pathname = "/lostinseoul";
    expect(render()).toBe('<a href="/cart">/lostinseoul</a>');
  });
  it("preserves primary-host and localhost paths and links", () => {
    expect(
      renderToStaticMarkup(
        <LostDomainProvider isLostHost={false}>
          <RouteProbe />
        </LostDomainProvider>
      )
    ).toBe('<a href="/lostinseoul/cart">/</a>');
  });
});
