# Ecommerce

Catalog, cart, order, and transaction primitives belong to
`@payloadcms/plugin-ecommerce@3.88.0` (pin to the Payload 3.x release; do not
float `latest`). Membership billing and ticketing stay separate. The launch
uses manual operations and finite sale limits; warehouse functionality is deferred.

Plugin config: `src/payload/plugins/ecommerce/plugin.ts`, registered from
`src/payload/plugins/index.ts` as `hideawayEcommercePlugin`.

---

Read [ECOMMERCE_HANDOFF.md](ECOMMERCE_HANDOFF.md) for the active candidate,
current verification, fixture state and next implementation slice. This document
owns launch requirements and architecture; the handoff owns changing status.

## Launch contract — three cases, manual operations

**This section supersedes earlier exploratory readiness/warehouse proposals.**
It is the development, test, deployment, and integration backlog requested by
the user. It is a requirements/design artifact, not a claim that the features
are implemented or live. Card payment is a launch requirement in every case.

### Scope and operating model

| Case                              | Sale / payment model                                                                                                                                                                  | Operator work                                                                                                                                         | Customer service                                                                                                                                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Small drop / premade batch     | Finite quantity that the owner enters manually; release can be occasional and unscheduled in advance. Card checkout.                                                                  | Produce/source, pack and dispatch personally; manually enter carrier, tracking and delivery updates.                                                  | Standard applicable cancellation/return/refund policy; defect exchange; order history.                                                                                                                                                  |
| 2. Time-window preorder           | Accept orders during a published window; production quantity is the final paid, non-canceled quantity, including **one**. Full card payment is collected when ordering (D1 resolved). | Close/reconcile the window, export production quantities, manually update production progress and dispatch.                                           | Cancellation permitted while the window is open. Requested post-close policy is no discretionary cancellation/return, defects exchangeable; mandatory rights and seller non-performance remedies remain policy-validation requirements. |
| 3. Tickets / memberships / points | One-time digital purchases; recurring billing is deferred. Card payment for paid tickets/memberships. Every customer has promotional points.                                          | Sell/distribute/manage the December event for 50–70 attendees; issue tickets, operate check-in and staff points redemption. Optional goodies address. | Ticket/access/payment history plus points balance and activity. Refund/benefit terms remain explicit decisions.                                                                                                                         |

The launch does **not** require warehouse software, stock locations, lots,
receiving, purchase orders, production automation, carrier integrations, label
purchasing, delivery polling, or a fulfillment contract. A manually entered
**sellable limit** for a drop or event is still necessary to avoid accepting
more paid commitments than can be honored. That limit and checkout capacity
claims are not a physical-stock ledger. Neither inventory plugin is activated
by this contract.

Use the existing VPS for both domains. Use plugin collections and admin
surfaces wherever they fit. Keep a modular monolith and PostgreSQL; no new
server, microservice, message broker, generalized workflow engine, or custom
ecommerce replacement is required.

### Product decisions to resolve before the affected feature is enabled

| ID  | Decision                                                                     | Planning position / boundary                                                                                                                                                                                                                                                                                                                                                                                           |
| --- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Preorder card collection: full upfront, deposit/balance, or charge at close? | **Resolved: full card payment when ordering.** Deposits, balance payments and charge-at-close are out of launch scope.                                                                                                                                                                                                                                                                                                 |
| D2  | Recurring card subscriptions at launch?                                      | **Resolved: out of scope.** No recurring offers, billing-key setup, automatic charges or recurring release tests. One-time memberships remain in scope.                                                                                                                                                                                                                                                                |
| D3  | Domestic-only or international physical shipping?                            | **Resolved: South Korea only for launch; configure fees before sales open.** Carrier choices, fee amounts, tax display and address validation still need configuration. Preserve KRW/USD/JPY/EUR capability; enable only tested currency/channel combinations. International physical shipping is unavailable.                                                                                                         |
| D4  | Exact refund/return periods, fees, shipping-cost allocation, defect process? | Version the approved policies; no invented number of days. Validate the requested preorder restriction before publication. A preorder label alone is not evidence that mandatory cancellation rights can be excluded.                                                                                                                                                                                                  |
| D5  | Preorder deadline and in-flight payment grace?                               | Choose when an initiated payment must be paid, how the grace period works, and the final reconciliation cutoff. Server/provider time governs; browser clocks do not.                                                                                                                                                                                                                                                   |
| D6  | Ticket ownership and event policy?                                           | Define purchaser vs attendee, capacity/per-person cap, event cancellation/reschedule, admission rules and refunds. No existing hardcoded refund schedule is adopted automatically.                                                                                                                                                                                                                                     |
| D7  | One-time membership period, cancellation and refund policy?                  | Define fixed-term/lifetime access, repeat-purchase/extension behavior, refundability and effect on existing benefits. Automatic renewal and recurring failed-charge rules are deferred.                                                                                                                                                                                                                                |
| D8  | Promotional points terms and other digital benefits?                         | Points balances, early-registration gifts and event redemption are required. Decide which registration qualifies, cutoff, points amount, reward costs/eligible event, expiration or retention of unspent points, and effects of ticket cancellation or spent-grant reversal. Points stay account-owned and integer-valued; no paid top-up, cash-out or transfer system at launch. Other access grants remain separate. |
| D9  | Mixed purchases, partial shipping and address cutoff?                        | Proposed: separate drop, each preorder window, tickets, and membership into compatible checkouts. Support line/quantity cancellations and refunds; ordinary dispatch can remain one parcel per order. Manual split parcels only if required; no automatic split-shipping engine.                                                                                                                                       |
| D10 | Merchant, provider and event setup?                                          | Confirm merchant entity, receipts/tax display, support contact and PortOne one-time card channel. Set the exact December event date, capacity within the planned 50–70 attendance and assigned staff; rehearse check-in and points redemption before it. Recurring/billing-key approval is deferred.                                                                                                                   |

These decisions do not block documenting all branches. They do block claiming
the affected offer is ready. Unsupported combinations must be unavailable in
both UI and API, with a clear explanation and preserved cart.

### Required capabilities and acceptance criteria

Requirement IDs M03–M05 and gate E17 are retired from launch with recurring
billing. Existing IDs are kept stable; they are not missing implementation work.

Every ID below needs an implementation owner, applicable automated tests,
browser/operator evidence, and a deployment/wiring check. Existing source alone
does not mark an ID done.

#### Shared catalog, identity and cart

| ID  | Must work                                                                                                                                                                                                                                                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C01 | Owner can create/edit/publish/unpublish a product, SKU/option, drop, preorder window, event or plan; customer sees correct images, description, price, availability, delivery expectation and policy. Draft/private/inactive offers cannot be bought by direct API. Historical purchases survive edits or unpublishing.     |
| C02 | Authoritative pricing uses plugin integer currency units and currency decimals correctly: KRW/JPY zero decimals, USD/EUR configured units. Validate selected currency, finite integer quantity, min/max, variant-product ownership and mode on every line; reject tampered amount/price/relationship and unavailable price. |
| C03 | Guest can add/change/remove/clear items and resume after refresh/browser restart. Storage corruption, blocked storage, expired cart, deleted/changed variant and network failure have recoverable states. Quantity changes confirmed by the server; failed optimistic writes are rolled back.                               |
| C04 | Better Auth login/registration merges guest and account carts once; logout/account switch cannot expose the previous customer's cart or addresses. Handle two tabs and concurrent updates without losing or duplicating lines. Preserve `useStoreCart` over plugin `useCart`.                                               |
| C05 | Explicit cart compatibility includes sale kind/window, currency and delivery/payment terms. Compatible multi-line carts work; incompatible combinations are separated or rejected without silently dropping/changing lines. Selection of one line's mode never determines the whole cart incorrectly.                       |
| C06 | Checkout revalidates the entire cart immediately before handoff, including price changes, expired windows, capacity and policy version; user reviews any changed total/terms. Back navigation, double-click and retry do not create accidental duplicate obligations.                                                       |
| C07 | Physical checkout collects recipient, phone, complete delivery address, postal code and optional delivery note; calculates the configured shipping total before payment. Digital checkout does not require shipping, but allows an optional goodies address with a clear purpose.                                           |
| C08 | Purchase snapshots preserve every line's name/SKU/options, quantity, unit/line totals, currency, shipping/tax amounts, purchaser/recipient details, sale window, promised dispatch expectation, and accepted policy version/time. Editing the profile, catalog or policy cannot rewrite them.                               |
| C09 | Same Better Auth user identity works on both domains after authentication, but unrelated apex domains do not share cookies/localStorage automatically. Verify both login/callback origins, guest ownership, safe return URLs and canonical LOST paths without leaking cart/order credentials.                               |
| C10 | All launch customer strings/states/emails/policies exist in en/ko through next-intl; responsive forms, keyboard/focus behavior, readable errors, loading/empty/offline states and mobile card redirects are usable. No broad visual redesign.                                                                               |

#### Card payments, financial correctness and recovery

| ID  | Must work                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P01 | Card checkout is available for each enabled case on desktop and mobile through the approved PortOne V2 channel. Test/live config is explicit; verify merchant/store/channel, callback URLs, CSP and supported currencies. No manual-payment fallback substitutes for this requirement.                                                                                                                                                                                                           |
| P02 | A durable attempt/payment ID is bound to the correct purchase owner, currency, authoritative amount, offer/policy snapshot and cart. Repeat clicks reuse/reconcile the attempt; intentional retry after terminal failure can create a new attempt without double-funding the same purchase. If two distinct payment IDs nevertheless capture for one intended purchase, fulfill once and reconcile/refund the excess charge; lock/idempotency must cover the purchase, not just each payment ID. |
| P03 | Success is established by server-side provider verification, not redirect/query/client status. Browser confirmation and verified webhook use the same idempotent finalizer. Exactly one paid purchase, receipt and benefit/capacity transition results from duplicate or reordered delivery.                                                                                                                                                                                                     |
| P04 | Handle decline, user-aborted window, SDK load failure, timeout, redirect loss, browser closure, response loss after successful charge, missing webhook and provider outage. Show paid/pending/failed truthfully; offer safe refresh/retry; never tell a paid customer to pay again without reconciliation.                                                                                                                                                                                       |
| P05 | Verify webhook signatures against the raw body; deduplicate provider events; validate amount/currency/store/channel/purchase binding; reject forged/replayed or unrelated events without side effects. Handle webhook-before-browser, browser-before-webhook and cancellation-before-late-success. Distinguish received from successfully processed: recording an event before failed settlement must not suppress its retry.                                                                    |
| P06 | Failed local writes after external payment remain visible and recoverable. Record attempt/operation state, retry safely and expose an operator reconciliation queue. No long provider call inside a database lock; no assumption that database rollback reverses an external charge.                                                                                                                                                                                                             |
| P07 | Full and partial card refunds use the current V2 cancellation API, stable operation IDs and provider confirmation. Enforce refund <= captured minus already refunded; reconcile response loss and provider-console cancellations; never mark complete before confirmed. Persist refund reason, line quantities, fees, provider reference and timestamps.                                                                                                                                         |
| P08 | Financial history distinguishes charge failure, pending refund, successful refund, partial refund and dispute/manual review. Refund totals, order totals and receipts reconcile; a refund notification is retriable and cannot create another refund. Merchant-initiated cancellation/non-delivery and disputes have an operator resolution path.                                                                                                                                                |
| P09 | Receipt/payment confirmation and operator lookup work for every case. Store provider IDs and receipt references without card PAN/CVV or billing keys in browser state/logs. Support full reconciliation by purchase reference/payment ID without collecting secrets from the customer.                                                                                                                                                                                                           |
| P10 | Test actual registered HTTP endpoints, not only injected adapter functions. Correct pinned-plugin variant-validation bypass and wrapper inventory-update replay/webhook divergence before enabling sales; with no inventory fields, no stock wrapper should run as a hidden second finalizer.                                                                                                                                                                                                    |

#### Case 1 — limited drops and premade products

| ID  | Must work                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B01 | Owner enters finite sellable quantity per SKU/batch, optional per-order/person cap and sale start/end, then opens/pauses/closes sales. Normal small premade sales can use the same flow without marketing countdowns. No warehouse projection is necessary.                                                                                                                                                                                     |
| B02 | A paid/pending-checkout sales claim cannot exceed the configured limit under concurrent buyers. Claim the complete multi-line quantity atomically or none; repeat initiation does not claim twice. Failed/abandoned attempts release eligibility only under the reconciliation policy.                                                                                                                                                          |
| B03 | Last unit, two tabs, changed quantity, quota reduced while carts exist, and sale paused while payment is in flight resolve deterministically. Late confirmed payment is reconciled/refunded or held for explicit review rather than silently overselling or disappearing.                                                                                                                                                                       |
| B04 | Owner sees paid units, active payment claims and remaining sellable allocation; can correct the sale limit with an audit reason, never below accepted commitments without a visible exception. Refunded shipped/defective units are not automatically advertised for resale; owner decides when resale is valid.                                                                                                                                |
| B05 | Eligible customer cancellation before dispatch and return after receipt follow the order's policy snapshot. Define receipt-date evidence/manual correction for the return-window start; shipment date is not a substitute for receipt. Partial quantities, order-wide shipping charge treatment, return approval/receipt and refund failures are handled. Owner can stop a parcel from entering the packing list once cancellation is accepted. |
| B06 | Defect/missing/wrong-item request can produce an exchange/replacement or required refund; link replacement shipment to the original line, avoid charging twice, record address and dispatch, and keep the customer informed. Lack of replacement stock needs a manual resolution rather than a dead end.                                                                                                                                        |

#### Case 2 — time-window preorders

| ID  | Must work                                                                                                                                                                                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R01 | Owner creates one clearly identified sale window with opening/closing instants, products/options/prices, delivery expectation and accepted terms. Customer sees not-open/open/closed state. Use Asia/Seoul for presentation and timezone-aware server timestamps. Direct API uses the same boundary.               |
| R02 | During the open window, valid card purchases count by net paid line quantities. No minimum commitment threshold; one paid, non-canceled unit is a valid production run. Zero net units results in an empty/closed window, not a fabricated production order.                                                       |
| R03 | Eligible cancellation received before cutoff is recorded under a server-side policy check even if provider refund completes later. Serialize close/payment/cancel decisions; exclude accepted cancellations from production allocation and stop accidental dispatch while refund is pending.                       |
| R04 | An in-flight payment across cutoff follows D5 consistently. Reconcile attempts before finalizing production totals; a payment discovered late is explicitly accepted under the approved grace rule or refunded/reviewed. Never silently add paid units after a supposedly final export.                            |
| R05 | At close, produce an auditable production list by SKU/option/net quantity with a revision/as-of marker, customer fulfillment list and exception queue. A one-order list works. Repeat close/export cannot duplicate orders or alter totals; any later correction creates an explicit revision.                     |
| R06 | Owner manually marks production started, updates expected dispatch date/delay, marks ready and ships. A message saying “in production” is based on an operator action, not a fundraising threshold or timer alone. Delays and inability to supply have a customer communication and remedy path.                   |
| R07 | After close, ordinary discretionary cancellation/return controls follow the approved versioned policy. Defect exchange, wrong goods, non-delivery and mandatory remedies remain available. Reopening/extending/editing a window cannot retroactively change an existing customer's accepted terms.                 |
| R08 | Full upfront card payment is required at ordering (D1 resolved). Prove captured payment before commitment, full total-due display, failure/retry and cancellation/refund outcomes, including cutoff races. Deposits and charge-at-close are deferred. No placeholder “preorder” flag counts as this functionality. |

#### Case 3A — event tickets

| ID  | Must work                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T01 | Ticketing is a mandatory launch gate for the planned December event of 50–70 people. Configure actual capacity/date/time/location, ticket price, sales window and policy; support sale, distribution/resend, attendee management and owner open/pause/close controls. Event updates/cancellation/reschedule notify affected customers under the approved terms. Do not hardcode capacity to 70 for every event. |
| T02 | Card payment buys a durable ticket order; capacity/per-person limits are atomic under concurrency. Pending claims, failed payments and refunds have an explicit capacity-release policy. Prevent bypass by direct ticket creation or tampered price/attendee IDs.                                                                                                                                               |
| T03 | Confirmed payment issues exactly the purchased ticket count with unguessable unique claim/admission credentials. Purchaser and attendee relationships are explicit. Guest purchase, where allowed, has secure claim/account association; membership-like digital access requires an authenticated identity.                                                                                                     |
| T04 | Customer can retrieve/resend tickets without another payment; email loss does not lose the ticket. Staff can search an order/ticket and check in manually or through a minimal online scanner/search screen. Duplicate/simultaneous check-in succeeds once; revoked/expired/refunded tickets cannot admit.                                                                                                      |
| T05 | Cancellation/refund/event cancellation/reschedule is policy-driven and changes the correct tickets/capacity/access once. Partial ticket-order refund revokes only affected tickets; used-ticket cases require the approved policy/manual review. No hardcoded legacy refund schedule is silently retained.                                                                                                      |

#### Case 3B — memberships and benefits

| ID  | Must work                                                                                                                                                                                                                                                                                                                                 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M01 | One-time/fixed-term/lifetime offers show price, access period, benefits, no automatic renewal and cancellation policy accurately. Paid activation links the authenticated Better Auth user to the correct plan and immutable price/period snapshot; failed payment grants nothing.                                                        |
| M02 | Active/expired/canceled/refunded access is enforced server-side on the actual protected resource. Multiple memberships derive the correct remaining entitlement/role; refund/expiry does not remove another valid plan's access or staff privileges. Real expiry processing must run.                                                     |
| M06 | Customer sees current plan, access end, invoices/payment history and allowed cancellation/refund controls. Reject duplicate purchase of an active plan or apply its explicitly approved manual extension rule. Existing purchases cannot be silently repriced, and recurring checkout/payment-method management is unavailable at launch. |
| M07 | Non-points digital access grants link to the customer and source purchase and issue once; expiry/revocation are auditable and preserve other valid grants. Required promotional points follow G01–G08 independently of membership billing or physical cards.                                                                              |
| M08 | Goodies address is optional and separable from digital entitlement; edit it without losing access or modifying old shipment snapshots. If goodies are actually promised, expose a minimal manual shipping record with the same tracking fields; no warehouse workflow.                                                                    |

#### Case 3C — customer points and event redemption

This is a required launch feature. Every customer has an account-owned points
balance, initially zero; a ticket purchase is not required just to have a balance.
The owner can grant early-registration points and staff can redeem them at the
December event. The exact campaign eligibility, amount, reward costs and expiry
are configured decisions under D8, not an automated loyalty program.

| ID  | Must work                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G01 | Resolve a points account from the stable Better Auth customer UUID. Show the customer's current available balance and paginated grant/redemption/reversal history; represent new accounts as zero. Do not use an email, ticket code or physical-card identifier as the owner key.                                                                                                                                                                                                                              |
| G02 | Owner grants points to a selected customer or an explicitly reviewed early-registration list/campaign. Record eligibility evidence/cutoff, amount, reason and actor. Campaign-plus-customer uniqueness prevents a rerun, duplicate registration event or partial batch retry from gifting twice. Show per-customer success/failure and allow safe completion of the same grant batch.                                                                                                                          |
| G03 | Maintain an append-only points journal with positive grants and negative redemptions, stable operation IDs, source/campaign/event references and actor/time/reason. Derive the balance from indexed journal entries initially; do not add a cached projection without measured need. Serialize all balance-changing commands per account; it is not an unrestricted editable number. Reject zero/negative/fractional/overflowed command amounts and reuse of an operation ID with a different customer/amount. |
| G04 | Authorized event staff identify the correct customer through account lookup or a scoped online redemption code, review the configured reward/cost, and confirm redemption against the server. Check customer/event/reward eligibility and available points atomically; duplicate taps, retries or simultaneous staff devices cannot spend the last points twice or take the balance negative. Ticket admission and points spending are independent operations.                                                 |
| G05 | Persist a redemption receipt/result before goods are handed over; include operation reference, cost and resulting balance. If the response is lost, retrieve/retry the same operation to learn whether it committed. Network loss never authorizes an unrecorded spend; pause redemption and resume/reconcile when online, with no offline balance or card fallback at launch.                                                                                                                                 |
| G06 | Correct mistaken grants/redemptions using authorized, reasoned reversal/adjustment entries linked to the original; never delete journal history. Do not reverse more than the unreversed amount or silently force a spent grant below zero. Honor configured expiration/event/cancellation rules; already-spent or disputed grants require an explicit reviewed resolution rather than an automatic debit.                                                                                                     |
| G07 | Customer sees only their balance/history; event staff get the minimum redemption access, not grant/global-edit privileges or unnecessary PII. Owner can inspect campaign totals, event redemptions and exceptions and export a small reconciliation list. Account/ticket association cannot grant points to the wrong purchaser/attendee.                                                                                                                                                                      |
| G08 | Rehearse early-registration grants, customer balance display, ticket admission, event redemption, duplicate requests, insufficient balance, mistaken-spend reversal and day-end reconciliation with the actual staff/customer screens. Redemption reward eligibility, points cost and handling of unspent points are disclosed; paid top-ups, cash-out, peer transfers and points-plus-card split tender are not silently included.                                                                            |

#### Customer service and owner operations

| ID  | Must work                                                                                                                                                                                                                                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| O01 | Customer has paginated history and detail for all purchased domains, with every line, quantities, amount/fees, payment/refund state, sale window, delivery/production state, ticket/access state and action eligibility. Use a read-only aggregation over separate domains, not duplicated purchase rows.                    |
| O02 | Guest lookup uses a strong scoped token or verified-email flow, not order reference alone. Securely associate an eligible guest purchase with an account without granting access on unverified email matching. Other users cannot read or mutate purchases/addresses/tickets/refunds.                                        |
| O03 | Owner's existing Vault exposes actionable queues: new/paid, preparing/production, ready to ship, shipped, service/refund pending and reconciliation errors. Filter by drop/window/event, date and reference; print/export a minimal packing/production list safely. No BI dashboard is needed.                               |
| O04 | Manual dispatch records carrier, tracking number, shipped date and supported tracking link, plus actual line/quantity coverage. Delivered is a distinct manual confirmation; merely entering tracking never means delivered. Editing a typo creates audit history and updates customer display.                              |
| O05 | Owner can correct address before the documented packing/dispatch cutoff, add an internal note, pause fulfillment, approve/reject a service request with reason, record returned goods, ship a replacement and resend notification. Customer-visible and private notes remain distinct.                                       |
| O06 | Every sensitive action is a server-authorized command with current-state checks, idempotency, actor/time/reason and before/after evidence. Concurrent staff tabs cannot ship a canceled order or refund twice. Payment success cannot be fabricated by editing a status dropdown.                                            |
| O07 | Cancellation, refund and delivery have separate states: request/approval/payment refund/physical return are not one flag. Partial line operations preserve unaffected items and a coherent whole-order summary. Invalid transitions fail with an actionable message.                                                         |
| O08 | Essential confirmations, shipping updates, window/production changes, tickets/access and refunds reach email/account history with durable retry/resend. Email failure does not roll back a charge; the owner sees failed notifications. No marketing automation or recurring-renewal messaging at launch.                    |
| O09 | Owner can reconcile “paid at provider, pending locally,” “refund accepted, response lost,” failed issuance/email, delivery correction and mistaken manual updates without shell/SQL edits. No generic unrestricted repair endpoint.                                                                                          |
| O10 | Support contact, applicable merchant disclosures, order receipts and bilingual policy pages agree with actual behavior. Consent evidence and financial history survive policy/catalog updates and account deletion under the defined retention policy; sensitive exports are access-controlled and spreadsheet-formula safe. |

Points policy decisions also specify whether “registration” is account signup,
event registration or paid ticket purchase; whether eligibility is per account,
attendee or ticket; whether admission is required before redemption; and how a
guest ticket is safely associated with a verified account before gifting.
Ticket refund eligibility and settlement remain separate from points reversal:
spent gifted points must not accidentally block an otherwise owed ticket refund.

### Proposed module and data boundaries

Prefer existing locations; final field names/migrations are implementation design,
not permission to revive retired schemas.

| Module                            | Ownership / extension seam                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plugin commerce                   | `src/payload/plugins/ecommerce/`: products/variants/carts/addresses/orders/transactions, collection overrides, validation and supported endpoint wrapping. Do not duplicate vendor collections or UI.                                                                                                                                                                                                                            |
| Sales offers / windows            | Merchandising `product-drops` plus a minimal window/capacity model where existing fields do not fit. A window is not legacy threshold crowdfunding; use plugin SKU identities.                                                                                                                                                                                                                                                   |
| Card gateway and outcomes         | `ecommerce/portone/` plus narrowly shared provider verification/refund utilities in `src/lib/lost-commerce/`. One verified outcome service per purchase domain; browser and webhook invoke the same domain service.                                                                                                                                                                                                              |
| Purchase commands / service cases | Small domain modules for cancel/refund/dispatch/address corrections and capacity claims. Keep policy evaluation separate from provider transport and admin presentation. Persist command IDs/results, audit events and retryable side effects.                                                                                                                                                                                   |
| Memberships                       | Existing Plans/Prices/Subscriptions/Invoices and hooks; one-time purchase/access/expiry services only. The existing collection name does not imply recurring billing.                                                                                                                                                                                                                                                            |
| Ticketing                         | Existing Events/TicketOrders/Tickets, with working registration, migrations and payment/claim/check-in commands. Shared gateway utility is allowed; transactional ownership stays separate.                                                                                                                                                                                                                                      |
| Entitlements                      | Small account-owned access grants keyed to source purchase; grant/revoke interfaces. Promotional points use their own bounded journal/commands; do not combine admission, paid membership state and a points balance into one flag.                                                                                                                                                                                              |
| Points                            | Minimal account-owned journal and grant/redeem/reverse commands in a focused domain module; Payload owner controls, assigned-event staff redemption screen and customer balance/history. At this scale an indexed journal can derive the balance without a separate wallet service or cached projection. Serialize all movements for an account and enforce unique operation/campaign keys. No physical-card fields or adapters. |
| Customer history                  | A paginated read model maps source kind + source ID to a consistent purchase summary/detail. Mutations route back to the owning domain. Account/guest capability boundaries remain enforced.                                                                                                                                                                                                                                     |
| Manual fulfillment                | Shipment/service records owned by the purchase domain; reuse fields/components for goods and promised goodies. Link replacements to original items. No carrier service dependency.                                                                                                                                                                                                                                               |
| Jobs / messages                   | Existing Payload jobs/PostgreSQL with actual registered tasks and a single enabled consumer/scheduler. Durable notifications, reconciliation and applicable access/payment-claim expiry only; no recurring billing or dormant warehouse task.                                                                                                                                                                                    |

Across modules: one stable UUID purchase identity; opaque public reference;
idempotency key plus request fingerprint; immutable amount/address/policy
snapshots; distinct payment/order/delivery/access state; explicit command result;
provider event IDs; UTC timestamps with local display. Historical item snapshots
must survive product deletion. Data edits use defined commands, not two
independent status models fighting each other.

Database writes that must succeed together use short transactions and unique
constraints. Finite drop/event claims lock the relevant allocation consistently;
do not build a full inventory journal. Provider calls and email cannot share a
database transaction: record pending work, make/reconcile the external operation,
then atomically apply the verified result. Query indexes follow actual customer,
status/date, window, payment-ID and due-job lookups. Preserve UUID IDs,
`push: false`, baseline migration directory and idempotent migration guards.

### HTTP, UI, provider and operations wiring

| Surface / boundary   | Required wiring proof                                                                                                                                                                                                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lostinseoul.com`    | Canonical clean storefront routes with internal `/lostinseoul` mapping; legacy redirects preserve query and do not redirect POST server actions. Same existing VPS and TLS.                                                                                                                                      |
| Cart                 | Exact `POST /api/carts` plus `/api/carts/*`; method/query/body survive nginx. Vendor/provider/client session and merge contracts exercised together.                                                                                                                                                             |
| Session / addresses  | Candidate allows exact `/api/users/me` and `/api/addresses` for the pinned vendor client, with descendants and generic API denied. See the active handoff for verified identity/cart behavior and remaining browser gates.                                                                                       |
| Product cards        | `/api/payments/portone/initiate`, `confirm-order`, `webhooks` connect to shared per-domain outcomes and customer return pages. Preserve correct public callback origin.                                                                                                                                          |
| Membership cards     | Restore UI-to-route agreement for existing `/api/checkout/manual`, `/card`, `/card/verify` callers as applicable; manual tender is deferred, so remove/hide unsupported options. Keep `/api/lost/webhooks/portone` for membership.                                                                               |
| Ticket cards/refunds | Register ticket collections and real purchase/refund/check-in endpoints; replace the missing `/api/tickets/refund` contract or implement the exact authorized caller contract. Choose/document webhook dispatch by durable purchase identity, never by client hints.                                             |
| Customer commands    | Protected history/detail, guest claim, cancellation/return/exchange requests, address, membership access and points balance/activity. Final endpoint/action paths must be recorded before release; no orphan controls, arbitrary balance writes or recurring-payment controls.                                   |
| Staff commands       | Vault screens to command handlers to DB/provider and back to customer history; CSRF/origin/role checks apply even to Server Actions. Avoid exposing the admin on LOST.                                                                                                                                           |
| Background work      | A real scheduler/runner consumes each enabled queue; task registration, retries, lease expiry, failure visibility and duplicate-run behavior are tested. No assumption that a task file executes itself.                                                                                                         |
| Event points         | Customer balance/history read path; owner grant/batch/reverse commands; assigned-staff event redemption/result lookup; all wired through server authorization and one points service. Scope staff devices/sessions to the event. Confirmed online result precedes handoff, with no JavaCard or offline endpoint. |
| Email / policy       | Transactional sender, templates, translation keys, receipt links, support address and both policy pages configured for the actual domain/purchase. Resend links are scoped; no secret or PII leakage in URLs/logs.                                                                                               |
| Host isolation       | `/vault/`, generic `/api/` and unrelated host-only routes remain 404 on LOST. Enumerate every added allowed route and its negative tests. Main-site auth/membership/tickets continue to work.                                                                                                                    |

### Scenario coverage matrix

Each row is a **release gate**, not a suggested happy-path smoke test. “DB”
means real PostgreSQL using the current registered schema; “browser” means the
actual frontend/admin plus HTTP stack. Mocks alone cannot close a provider,
database-concurrency or nginx gate.

| ID  | Scenarios that must be demonstrated                                                                                                                                                                                                       | Required proof                                                                                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E01 | Draft/inactive/deleted/mismatched SKU, invalid quantities, tampered price/currency, stale price/terms, invalid mixed cart                                                                                                                 | Unit policy tests + actual initiate/cart HTTP tests; no transaction/charge on rejection.                                                                                                                               |
| E02 | Guest add/edit/remove/reload; login merge twice; logout/account switch; two tabs; stale/corrupt storage; inaccessible cart secret                                                                                                         | Browser + API ownership/integration; no leaked or duplicated lines.                                                                                                                                                    |
| E03 | Drop card purchase with multiple lines/options; preorder card purchase; ticket card purchase; one-time membership card purchase                                                                                                           | Desktop and mobile browser + sandbox provider records + local purchase/receipt/benefit rows.                                                                                                                           |
| E04 | Double click; repeated initiation; two distinct successful payment IDs for one intended purchase; browser/webhook in either order; duplicate/reordered webhook; event received but processing failed; refresh after lost response         | Real endpoint + DB tests; one fulfilled purchase/claim/benefit/receipt intent, retryable event processing and explicit reconciliation/refund of excess captures.                                                       |
| E05 | Decline/abort/SDK failure; timeout after actual success; provider unavailable; webhook delayed/missing; local commit fails                                                                                                                | Browser failure states + integration fault injection + operator recovery; no accidental second charge.                                                                                                                 |
| E06 | Forged webhook, wrong store/channel/amount/currency, wrong owner, replayed secret/token, CSRF, unauthorized staff command                                                                                                                 | Security integration + signed sandbox event checks; zero unauthorized reads/mutations.                                                                                                                                 |
| E07 | Concurrent attempts for final drop unit/event seat; duplicate quantity changes; insufficient one line of a multi-line cart                                                                                                                | DB contention tests (at least 20 simultaneous attempts for one remaining allocation); at most one acceptance, no partial allocation.                                                                                   |
| E08 | Abandoned claim; payment racing expiry; pause/limit reduction during payment; refund of unshipped vs defective returned unit                                                                                                              | DB + reconciliation tests; explicit terminal outcome and correct remaining allocation.                                                                                                                                 |
| E09 | Preorder before/open/at/after cutoff, client-clock skew, in-flight grace, cancellation racing close/payment                                                                                                                               | Fake-clock policy tests + DB race tests + browser; consistent server-authoritative decision.                                                                                                                           |
| E10 | Window with zero/one/many net units, accepted cancel awaiting refund, duplicate close/export, late provider result, correction revision                                                                                                   | DB + owner browser; correct immutable/as-of production report and no threshold activation.                                                                                                                             |
| E11 | Manual preparation/production/delay/dispatch, carrier/tracking entry and correction, explicit delivered state                                                                                                                             | Owner-to-customer browser round trip; accurate history and retriable notice.                                                                                                                                           |
| E12 | Allowed/denied cancellation; partial quantity cancel; full/partial return/refund; refund pending/failure/replay; shipment race                                                                                                            | Unit policy + DB/provider sandbox + browser; amount ceiling, unaffected lines, dispatch inhibition and correct history.                                                                                                |
| E13 | One defective/wrong/missing item in a multi-line order, exchange, replacement dispatch, no replacement available                                                                                                                          | Owner/customer browser + refund integration when needed; no duplicate charge or lost request.                                                                                                                          |
| E14 | Ticket issue once, multiple tickets, guest claim if enabled, purchaser/attendee isolation, lost email/resend                                                                                                                              | DB + browser + email evidence; correct count and scoped recoverable access.                                                                                                                                            |
| E15 | Same ticket checked in twice/concurrently; expired/revoked/partially refunded tickets; event canceled/rescheduled                                                                                                                         | DB contention + staff/customer browser; one admission and policy-consistent revocation/refunds/notices.                                                                                                                |
| E16 | One-time fixed/lifetime activation, expiry, refund, overlapping plans, repeat purchase of an active plan, staff-role preservation, unauthorized content access                                                                            | DB + actual protected-resource HTTP/browser; correct grants and revocation; no unintended duplicate subscription.                                                                                                      |
| E18 | Required points: new account zero balance; duplicate grant; concurrent last-points redemption; insufficient funds; invalid amount; unauthorized grant/redeem; other-customer history; mistaken-spend reversal                             | Real PostgreSQL + protected command API + customer/staff browser; one auditable movement per operation, no negative balance or unauthorized spend, intact reversal history.                                            |
| E19 | Customer history pagination, all lines/refunds/tracking, guest lookup/account association, deleted offer/profile changes                                                                                                                  | Browser + authorization/DB tests; immutable historical facts and no cross-user/domain leakage.                                                                                                                         |
| E20 | Email outage/retry/resend, provider-console refund, pending-payment recovery, expired job lease, worker restart                                                                                                                           | Integration + operator runbook rehearsal; payment remains correct and failures are discoverable.                                                                                                                       |
| E21 | Both domains + www/legacy paths, exact cart POST, login callbacks, mobile return, webhook gate exemption, denied admin/generic API                                                                                                        | Actual nginx + staging browser/HTTP, not proxy source-string assertions alone.                                                                                                                                         |
| E22 | Empty/initialized DB migration, repeat guards, upgrade from deployed schema, backup restore and failed-release recovery                                                                                                                   | Isolated PostgreSQL + staging image/schema rehearsal; preserve orders/IDs and recovery within agreed downtime.                                                                                                         |
| E23 | Production bundle/startup, en/ko, mobile/keyboard, slow network, stale public cache, personalized cache isolation                                                                                                                         | Built-app browser tests and measured performance; correctness survives refresh/restart.                                                                                                                                |
| E24 | Reviewed early-registration campaign, existing/new zero-balance accounts, duplicate candidates, partial grant batch failure/retry, guest/account association and repeated registration                                                    | Real PostgreSQL + owner/customer browser; intended eligible recipients credited once, per-recipient failures recoverable and no unverified-email claim.                                                                |
| E25 | Redemption response lost after commit, same key with altered payload, concurrent grant/spend/reversal, duplicate/partial/excess reversal, wrong customer, expired eligibility/event closure, revoked staff, network outage                | Real PostgreSQL + staff/customer browser; retrieve committed result without another spend, preserve journal and pause safely offline. Ticket refund and points correction remain independently recoverable.            |
| E26 | December event rehearsal with realistic 50–70-attendee data: card sale, ticket distribution/retrieval, admission, account lookup, gifting, multiple staff redeeming, insufficient points, correction, customer history and day-end totals | Built-app staff/customer rehearsal plus sandbox card evidence; capacity and attendee handling work, balances reconcile, admission does not itself debit points, and no physical card or offline mechanism is required. |

Exactly-once assertions refer to durable business records and notification intent.
External email delivery is retriable and may be duplicated after response loss;
it must never duplicate a charge, refund or grant.

For each enabled offer, run its complete purchase → customer history → owner
operation → cancellation/refund/access-end path. Cover every permitted state
transition and reject prohibited ones. Test supported currency/destination/cart
combinations, and prove unsupported combinations are disabled. New critical
commerce modules require at least 80% meaningful coverage; a coverage percentage
cannot substitute for the DB/provider/browser evidence above.

### Build order, deployment and sign-off

| Milestone                          | Deliverables                                                                                                                                                                                          | Exit gate                                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| L0 Scope/policies                  | D1/D2/D3 resolved: full upfront card, recurring deferred, South Korea-only shipping. Resolve D4–D10 as needed; approve boundaries and offer/points rules; reconcile refund/terms copy.                | No ambiguous charge, cancellation, shipping, access or points rule for an enabled offer.                                                  |
| L1 Shared foundation               | Current migrations/tooling; snapshots, ownership/session/history, authoritative line validation, command/audit model and card outcome/refund core.                                                    | C/P requirements and E01–E06 pass; no wrapper-only hidden side effects.                                                                   |
| L2 Manual goods/drop               | Sales caps, service cases, manual shipping and Vault queues/exports.                                                                                                                                  | Case 1 through purchase/dispatch/delivery/partial refund/exchange passes E07–E08/E11–E13.                                                 |
| L3 Preorder                        | Time windows, cutoff decisions, net production export, manual production/delay controls.                                                                                                              | Case 2 including one-order run and boundary races passes E09–E10.                                                                         |
| L4 Tickets, memberships and points | Mandatory December ticket card sales/distribution/attendee management/check-in; one-time membership access/expiry; every-customer points, early-registration grants, staff event redemption/reversal. | E14–E16, E18 and E24–E26 pass; the event path is a required release gate. No recurring work.                                              |
| L5 Integrated operations           | Unified history, transactional email/retry, recovery commands, policy/translation parity and exact route map.                                                                                         | E19–E21 pass with real operator and customer UI.                                                                                          |
| L6 Release rehearsal               | Pinned build images, corrected migration/deploy ordering, sandbox provider/domain/email setup, backup restore, rollback, monitoring and performance checks.                                           | E22–E23 plus all enabled-case E2E evidence attached to one release revision.                                                              |
| L7 Business launch                 | Production one-time card settings, published terms/contact, real offers/finite sale quantities, December event and points rules entered; enable only proved offers.                                   | Separate explicit production-payment authorization remains required; no production card click is performed as part of this planning task. |

Use the existing VPS and build images off-server where possible. A planned short
maintenance window with paused new checkout is acceptable for incompatible
schema changes; do not promise blue-green/zero-downtime behavior that a single
Compose service does not provide. Keep verified webhooks/reconciliation durable
through deployments. Compatible upgrades can migrate before rotation; destructive
changes require their own drained/maintenance/restore procedure.

Pin and align app/migration Node/pnpm/dependency versions; frozen lockfile,
current test paths, actual Next production build/start, scoped type/lint checks
and coverage tooling must work. Replace retired checkout test references and
resolve the existing lint/coverage tool failures. The `typescript.ignoreBuildErrors`
setting is not evidence that changed commerce types passed verification.

Keep production and staging data/secrets separate. Back up before migrations;
rehearse restoring the backup with its matching image. Once real business begins,
purchase/financial data are not wipeable: `migrate:fresh` is for disposable
fixtures, and image rollback alone is not schema/data rollback. Preserve
idempotent guards and test the actual deployed-schema upgrade, not only fresh
bootstrap.

Provide a small operational checklist: app/DB readiness, card failures and
stuck attempts/refunds, webhook/job heartbeat, failed notifications, certificate
expiry and backup age. Alert the owner through an agreed existing channel;
use correlation IDs with masked logs. Set pool/container/timeouts to measured
VPS capacity; no generic Supabase settings, bigint migration, new Redis, or
horizontal cluster requirement. Public health responses contain no secrets.

Performance acceptance focuses on checkout responsiveness and reliability:
server-render public/catalog/history data where appropriate, bound query depth
and pagination, remove observed N+1/waterfall fetches, keep private user data out
of shared caches, invalidate public availability at sale changes and always
revalidate at purchase. Load PortOne only when needed with recoverable loading;
keep heavy hero/admin modules off checkout. Use shared data fetching and narrow
subscriptions to avoid cart/chrome rerenders. Keep Turbopack unless a measured
compatibility issue requires documented webpack use; do not alter rendering or
memoize broadly without evidence. Record mobile LCP/INP/CLS (targets 2.5s/200ms/0.1)
and application latency/error/resource baselines; provider latency is reported
separately. No performance success is claimed from local unit tests.

### Future idea — JavaCard linked to the customer account

The owner may later source standard JavaCards (for example from AliExpress),
prepare them before an event and link them to customer accounts. Record the idea
only: hardware feasibility, card provisioning, readers, applets, keys, linking
screens, NFC integration and card payments/redemption are **not launch work**.

Keep points owned by the customer account and mutations behind the same
grant/redeem/reverse command boundary. A later credential layer could resolve
an authenticated card to that account and invoke those commands. Card loss,
replacement or unlinking should not erase a balance or rewrite the journal.
Do not create a credential registry, hardware adapter or card-specific fields
now; stable account IDs and independent points operations leave the extension
possible without building it.

“Preload” may ultimately mean crediting the linked account before handing over
the card, or value held on the card itself. That choice is unresolved. Online
account lookup and offline card-held value have different security/reconciliation
requirements; the current system makes no promise of offline support or hardware
compatibility. A readable/static card identifier is not, by itself, authorization
to debit an account. Validate any future card authentication/revocation design
when the hardware work is actually scoped.

### Explicitly deferred

- Warehouse ledger, locations/lots/receipts/cycle counts, inventory-reservation
  FK retargeting, automatic production/procurement and fulfillment contracts.
- Carrier API integrations, label purchasing, tracking polling, automated returns
  collection, routing and automated split shipments.
- Recurring subscriptions in full: billing keys, automatic charging, recurring
  consent, retries/dunning, proration, recurring plan upgrades/pauses and renewals.
- JavaCard/NFC hardware integration, provisioning, readers, credential storage,
  card-held value and offline redemption. The future idea above is documentation only.
- Unselected ticket extensions: gifting/transfers, reserved-seat maps and offline
  scanner sync. The December ticket system itself is mandatory.
- Deposits and deferred charging (D1 resolved: full upfront); coupons, gift cards, automated loyalty earning,
  affiliate/referral programs, manual tenders and payment rails other than card.
- International physical shipping, tax/duties and complex shipping engines (D3 resolved: South Korea only); transferable token/wallet/marketplace systems.
- Marketing automation/BI, large-scale infrastructure, unrelated Vault redesign,
  hero/WebGL/CSS polish, framework rewrites and unrelated type-debt cleanup.

If an enabled offer requires one of these, explicitly move that requirement and
its tests into scope first. Do not quietly add it, and do not present a disabled
branch as working.

---

## Implementation reference

The sections below describe the active `codex/ecommerce-phase9` candidate. They
do not claim those changes are merged into the primary checkout or deployed.
Phases 0–8 completed the plugin cutover; operational readiness follows L0–L7
above. Preserve unrelated work when continuing in either checkout.

The installed plugin remains 3.88.0. Replace exactly one registered initiate
and confirm-order handler each, retaining public routes and response contracts.
Duplicate adapter endpoints do not reliably override vendor defaults. The narrow
provider hydration patch and vendor-internal cart matcher import are explicit
version-coupling points; verify both against installed source before upgrading.

## Purchase and authorization rules

- A pending order is an unpaid checkout record, never evidence of payment,
  production allocation or fulfillment. Extend the plugin status field through
  its override and an idempotent migration; do not introduce a second order
  collection. Show this state accurately wherever orders are read.
- Assign the opaque order reference once, independently of provider payment IDs.
  Repeated initiation reuses an unresolved attempt. A changed request fingerprint
  requires a new review and resolution of the old attempt; editing a cart must
  not create a second payable obligation silently. Only a verified terminal
  attempt permits an intentional payment retry against the same purchase.
- Snapshot every line from authoritative catalog data, with names/options,
  quantities, integer prices/currency, addresses, totals and accepted terms.
  Profile/catalog edits must not rewrite it. Undefined shipping or policy
  choices cannot be fabricated as zero fees or implied consent.
- Browser confirmation proves the account owns the purchase, or supplies a
  scoped guest capability bound to it. Matching email or knowing a payment ID
  is insufficient. Check this before the already-settled return as well as
  before writes. Never let a body field select webhook/internal privileges.
  Preserve guest confirmation access through login/cart merge; if the original
  cart credential cannot survive, issue a purchase-scoped capability at authorized
  initiation and store only its digest. Login alone must not claim a guest order.
  Replaying a paid result must never reset refunded/canceled state to succeeded.
- Signed webhooks verify the original raw body, then invoke the same outcome
  service through a separate trusted server entry point. Provider truth is
  fetched outside the DB lock; under the purchase UUID lock, reread bindings
  and apply the verified amount/currency/store/channel outcome atomically.
- Multiple captured attempts for one purchase fulfill once; retain excess
  capture evidence and a reconciliation operation. Event `received` is not
  `processed`: failed settlement must remain retryable after duplicate delivery.
  Reuse reviewed event claim/complete primitives rather than reviving inventory.
- Goods begin unfulfilled. Payment success does not imply a reservation,
  dispatch, delivery, admission or points movement. Ticket/membership outcomes
  keep their own ownership; their required launch work remains L4.

Additional integration invariants:

- Preserve Payload-returned UUIDs; supplied IDs can be ignored by the adapter.
  Guest digests initialize once within order creation. Lost initiation capabilities
  cannot be reconstructed after secret rotation; fail explicitly.
- Cart merge identity binds source, actor, target and secret digest. Authorize
  before claiming; deleted-source replay requires its receipt. Lock source/target
  in stable order and verify vendor deletion because it can swallow failures.
- Parse item request data before cloning, then lock before vendor whole-array reads.
  Preserve purchased-cart/account ownership and request-identity authorization.
- Keep tests/helpers out of the migration directory. Run native PG tests only on
  guarded disposable databases. Schema generation does not prove migration replay.


## Constraints (do not violate)

- Do not run the dormant inventory-reservation expiry task. It is unregistered,
  has no active `quarterHour` consumer and queries inventory tables absent from
  the launch schema. Disabled inventory is not a safe no-op execution mode.
- Do **not** fold membership (`plans` / `prices` / `subscriptions` / invoices)
  or ticketing into the plugin.
- Do **not** enable plugin inventory (`inventory: false` stays).
- Do **not** set `InventoryPlugin({ enabled: true })` and do **not** retarget
  reservation FKs (`product-orders` / `product-variants`) unless asked. Those
  collections are unregistered; the ledger is dormant on purpose.
- Keep storefront UX. Do not import the official ecommerce template UI.
- PortOne is the product payment rail. Do not add Stripe for launch.
- Multi-currency: KRW (default, `decimals: 0`), USD, JPY (`decimals: 0`), EUR.
  Prices live on plugin `priceIn{CODE}` fields, not `unit_amount`.
- Customers are Better Auth `users` (`customers.slug = "users"`).
- Guest carts on. Cart localStorage key: `lostinseoul.plugin-cart`.
- next-intl owns every user-facing string.
- UUID Postgres, `push: false`, `migrationDir` =
  `src/lib/migrations-baseline`. Migrations must be idempotent
  (`readmes/MIGRATIONS.md`). Array-item IDs stay 24-char strings.
- Official plugin owns slug `products`. Never register a second `products`
  collection.

---

## Ownership

| Owner                | Collections                                                                                              | Notes                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Official plugin      | `products`, `variants`, `variantTypes`, `variantOptions`, `carts`, `orders`, `transactions`, `addresses` | `src/payload/plugins/ecommerce/plugin.ts`. Plugin `inventory` is off.                                            |
| Merchandising plugin | `product-category`, `product-sub`, `product-drops`                                                       | `MerchandisingPlugin({ enabled: true })`. Campaigns stay **unregistered** until they point at plugin `products`. |
| Inventory plugin     | `stock-locations`, `inventory-*`                                                                         | Ledger, lots, receipts, cycle counts, reservations. **`enabled: false`**.                                        |
| Membership plugin    | `plans`, `prices`, `subscriptions`, `invoices`, `currency`, `exchange-rate`, `holidays`                  | Digital membership only. Not product checkout.                                                                   |
| Ticketing plugin     | `events`, `ticket-orders`, `tickets`                                                                     | Separate purchase domain; currently unregistered. December ticketing remains mandatory.                                                                                |

Do not register proprietary `products` / `product-variants` / `product-carts` /
`product-orders` / `product-payments`. Those slugs collide with the plugin or
were replaced by `variants` / `carts` / `orders` / `transactions`.

`commerce-products` / `commerce-orders` are retired (Phase 8). Live source must
not mention those slugs except `proxy.ts` (410) and the retirement test.

---

## HTTP

| Path                                                                    | Role                                                                                                           |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `/api/carts`, `/api/carts/*`                                            | Official cart/item endpoints; candidate wraps mutations/merge with ownership checks, locks and durable replay. |
| `/api/users/me`, `/api/addresses`                                       | Exact vendor identity/address endpoints allowed on LOST; descendants and generic API remain denied.            |
| `/api/lost/orders`                                                      | GET account-owned history pagination; POST no-store scoped guest/account detail lookup.                        |
| `/api/orders/:id/fulfillment`                                           | Main-site-only admin commands for prepare/dispatch/confirm_delivery/correct_tracking. The candidate's local fulfillment slice includes protected raw reads, Vault controls and safe customer history; local verification and migration replay passed. **Not** on the LOST nginx allowlist. See [active handoff](ECOMMERCE_HANDOFF.md) for current evidence, runtime state and remaining launch gates. |
| `/api/payments/portone/initiate`                                        | Product checkout initiate (server amounts)                                                                     |
| `/api/payments/portone/confirm-order`                                   | Product checkout confirm                                                                                       |
| `/api/payments/portone/webhooks`                                        | **Product** PortOne webhook. Gate-exempt in `src/proxy.ts`.                                                    |
| `/api/lost/webhooks/portone`                                            | **Membership** PortOne webhook. Keep. `noticeUrls` for plans still point here.                                 |
| `/api/lost/gate`                                                        | Storefront password gate                                                                                       |
| `/api/invoice`, `/api/lost/cart`, `/api/lost/checkout`, `/api/commerce` | Retired. `src/proxy.ts` returns **410**.                                                                       |

The candidate keeps generic `/api/` and `/vault/` closed on LOST. Its exact
allowlist and required history-privacy ingress are documented in `DEPLOY.md`.
Deployment and provider configuration are unverified; consult the active handoff
before treating any historical live observation as current.

---

## Client wiring

- `TransitionReadinessProvider` keeps the initial streamed tree readable but
  inert until the shared client transition wrappers mount. The LOST provider
  passes readiness separately from customer identity; cart preparation and
  hydration start only in that final tree. This is startup readiness, not
  navigation animation state. Keep `TransitionManager` client-gated.

- Layout wraps `LostEcommerceProvider`
  (`src/payload/plugins/ecommerce/client/provider.tsx`): KRW, variants on,
  PortOne method, identity-keyed Better Auth `useSession` preparation and guest
  recovery around the official provider. `CartSession` waits for authoritative
  user/cart/address hydration and quarantines failures with localized reload
  recovery while preserving streamed server children.
- A narrow pnpm patch at `patches/@payloadcms__plugin-ecommerce@3.88.0.patch`
  exposes `initialize`, `isHydrating` and `hydrationError` on the official
  provider. The version remains 3.88.0; its collections, cart state and actions
  remain authoritative. Patch metadata lives in `pnpm-workspace.yaml` and the
  lockfile. Recheck the patch against upstream before any future upgrade.
- `Users.cart` uses `customer-cart-field.ts`: a private virtual Join over
  `carts.customer`, selecting the latest unpurchased cart. The official plugin
  does not add this customer field itself; its provider expects `user.cart.docs`
  from `/api/users/me`. The join adds no physical database column.
- Storefront lines go through `useStoreCart` (`src/lib/lost-commerce/useStoreCart.tsx`),
  an adapter over plugin `useCart`. Do not re-export or shadow `useCart`.
  See `src/lostinseoul/NAMING.md`.
- `CartOperationsProvider` stores only session-scoped operation metadata above
  the drawer. Adapter mutations return a confirmed boolean, retain a synchronous
  lock across drawer closure, and require a fresh matching cart before success.
  Unconfirmed writes offer reload; never retry quantity deltas automatically.
  `isBlocked()` guards checkout navigation/submission in the same event loop turn.
  Add/Buy now show success or navigate only after confirmation. Current source,
  review and browser evidence are recorded separately in the active handoff.
- Identifier names vs plugin/site hooks: `src/lostinseoul/NAMING.md`.
- Storefront chrome (bag/search/entry) is React context in
  `src/lostinseoul/page-status.tsx`, not a CustomEvent bus and not prop drilling.

---

## File map

| Path                                                    | Role                                                                          |
| ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/payload/plugins/ecommerce/plugin.ts`               | Plugin config                                                                 |
| `src/payload/plugins/ecommerce/*-collection.ts`         | Overrides                                                                     |
| `src/payload/plugins/ecommerce/portone/`                | Payment adapter                                                               |
| `src/payload/plugins/ecommerce/client/`                 | Provider, cart line map, PortOne client helpers                               |
| `src/lib/lost-commerce/`                                | Catalog queries, `useStoreCart`, membership PortOne helpers, inventory domain |
| `src/app/(frontend)/(site)/lostinseoul/`                | App Router pages                                                              |
| `src/lostinseoul/`                                      | Storefront UI (chrome, hero, overlay)                                         |
| `src/proxy.ts`                                          | 410 retired prefixes; gate-exempt product + membership webhooks               |
| `nginx/sites-enabled/production.conf`                   | LOST host allowlist — Phase 9 edits here                                      |
| `src/lib/migrations-baseline/` | Active schema, cutover and readiness migrations                                                       |
| `messages/*.json`                                       | Storefront / checkout copy                                                    |

---

## Historical material

Superseded phase narratives, audits and pause checkpoints were consolidated on
2026-09-24. Full previous documents remain in each checkout’s local ignored
`.attic/readmes/archive-2026-09-24/`, mirroring original paths. Consult the active
handoff for resumption; archived dates, failures and tool counts are not current
status. Storefront visual work remains in `readmes/LOSTINSEOUL.md`.
