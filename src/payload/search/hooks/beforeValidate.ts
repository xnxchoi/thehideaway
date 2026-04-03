"use server";
import { FieldHook } from "payload";
import { Search } from "@payload-types";
import { getDefaultCategorySearch } from "@/components/layouts/Categories/actions/getDefaultCat";

export const populateCategory: FieldHook<Search, Search["category"], Omit<Search, "category">> = async (args) => {
  const { data, value, overrideAccess, operation, originalDoc, req, previousValue } = args;
  let finalValue = value;
  if (!finalValue || finalValue.length < 1) {
    switch (operation) {
      case "update": {
        if (previousValue && previousValue.length > 0) finalValue = previousValue; else if (originalDoc && originalDoc.category && originalDoc.category.length > 0) finalValue = originalDoc.category;
      }
    }
    if (!finalValue || finalValue.length < 1) {
      finalValue = await getDefaultCategorySearch(req);
      data && (data.category = finalValue);
    }
  }
  return finalValue;
};