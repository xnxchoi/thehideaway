import { EUR, USD, ecommercePlugin } from "@payloadcms/plugin-ecommerce";

import {
  adminOnlyFieldAccess,
  adminOrPublishedStatus,
  isAuthenticated,
  isCustomer,
  isDocumentOwner,
  isEcommerceAdmin
} from "./access";
import { lostCartItemMatcher } from "./cart-item-matcher";
import { cartsCollectionOverride } from "./carts-collection";
import { JPY, KRW } from "./currencies";
import { ordersCollectionOverride } from "./orders-collection";
import { portoneAdapter } from "./portone/adapter";
import { productsCollectionOverride } from "./products-collection";
import { hideawayProductsValidation } from "./products-validation";
import { transactionsCollectionOverride } from "./transactions-collection";
import { variantsCollectionOverride } from "./variants-collection";

export const hideawayEcommercePlugin = ecommercePlugin({
  access: {
    adminOnlyFieldAccess,
    adminOrPublishedStatus,
    isAdmin: isEcommerceAdmin,
    isAuthenticated,
    isCustomer,
    isDocumentOwner
  },
  customers: {
    slug: "users"
  },
  products: {
    productsCollectionOverride,
    variants: {
      variantsCollectionOverride
    },
    validation: hideawayProductsValidation
  },
  inventory: false,
  currencies: {
    supportedCurrencies: [KRW, USD, EUR, JPY],
    defaultCurrency: "KRW"
  },
  carts: {
    allowGuestCarts: true,
    cartItemMatcher: lostCartItemMatcher,
    cartsCollectionOverride
  },
  orders: {
    ordersCollectionOverride
  },
  transactions: {
    transactionsCollectionOverride
  },
  payments: {
    paymentMethods: [portoneAdapter()]
  }
});
