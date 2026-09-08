# Naming

Path is the namespace. The identifier names the **role**. If a word already belongs to Payload, React, or the site
shell, do not reuse it.

Brand strings: `LOSTINSEOUL` (display, i18n) or `lostinseoul` (paths, CSS). Never `LostInSeoul`.

## Cart (canonical example)

| Role                             | Name                                             | Owner                                             |
|----------------------------------|--------------------------------------------------|---------------------------------------------------|
| Plugin cart documents            | `useCart`                                        | `@payloadcms/plugin-ecommerce` — do not re-export |
| Storefront lines over the plugin | `useStoreCart`                                   | `lib/lost-commerce`                               |
| Drawer open/closed               | `useCartOpen`                                    | `@lostinseoul/page-status`                        |
| Overlay frame helpers            | `getCartFrameMetrics`, `getCartChromeTransition` | `@lostinseoul/cart-frame`                         |

## General

- Wrap a vendor hook under a role name (`useStoreCart`), or import the vendor name as-is. Never shadow it.
- Site vs storefront shells: `Header` from `@lostinseoul/...` vs site `Header`. Path distinguishes; do not prefix
  `Lost*`.
- Keep distinctive names that earn their keep (`maisonderetail`).
