import { defaultCountries } from "@payloadcms/plugin-ecommerce/client/react";
import { describe, expect, it } from "vitest";
import { addressCountries } from "./address-countries";
import en from "../../../../messages/en.json";
import ko from "../../../../messages/ko.json";

describe("supported account address countries", () => {
  it("retains every vendor country and adds Korea once", () => {
    expect(addressCountries).toEqual(expect.arrayContaining(defaultCountries));
    expect(addressCountries.filter(({ value }) => value === "KR")).toEqual([
      { value: "KR", label: en.Commerce.countries.KR }
    ]);
    expect(new Set(addressCountries.map(({ value }) => value)).size).toBe(
      addressCountries.length
    );
    expect(ko.Commerce.countries.KR).toBeTruthy();
  });
});
