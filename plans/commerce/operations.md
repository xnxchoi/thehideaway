# Commerce operations

Last external verification: 2026-07-30

## Current operating state

| Capability                                                                | Status    | Operating rule                                                            |
| ------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------- |
| Physical inventory movements and reconstruction                           | Committed | Use guarded inventory commands; never edit balances directly              |
| Receipts, lots, quarantine, adjustments, cycle counts                     | Committed | Operate through the PR 5 command surface with reason and evidence         |
| Reservation creation, consumption, cancellation release, automated expiry | Committed | Domain services and scheduled job share transaction and lock rules        |
| Reservation inspection and manual remediation                             | Committed | Admin-only queues and guarded commands; mutations are disabled by default |
| Address, shipping, fulfillment, tracking, returns, finance                | Planned   | No current operational claim; direct field edits are prohibited           |

## Feature gates

- `PORTONE_CARD_CHECKOUT_LIVE` — committed master gate. Card options remain
  hidden and card-intent routes reject unless the value is exactly `true` and
  required provider configuration is present. Verification remains available
  to finish a payment that already started.
- `PORTONE_WEBHOOK_REQUIRE_SIGNATURE` — committed signature enforcement
  control. Production/live mode requires Standard-Webhooks signatures;
  unsigned compatibility is sandbox-only and must be explicitly enabled.
- `LOST_INVENTORY_RESERVATION_OPERATOR_MUTATIONS_LIVE` — PR 6A mutation gate.
  Only the exact value `true` enables admin-only commands. Read-only queues,
  evidence, and automated PR 6 behavior remain available when disabled.

Provider credentials and secrets stay in environment or secret storage. Do not
copy them into plans, Payload records, logs, or evidence captures.

## PortOne review requirements

Source: [PortOne service requirements](https://help.portone.io/content/requirements),
verified 2026-07-30. Revalidate before submitting a PG or card-company review.

| Requirement                                                              | Repository status                                                                      | External or live status                                                           |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Product/service details and fixed selectable price                       | Implemented surfaces; server rejects nonpositive card amounts                          | Confirm the live catalog and prices before review                                 |
| At least three physical products for physical-goods review               | Seed/catalog support exists                                                            | Unknown until the production catalog is inspected                                 |
| Refund information plus delivery/exchange information for physical goods | Product and legal surfaces exist                                                       | Confirm live visibility and accuracy                                              |
| Terms and privacy policy                                                 | LOSTINSEOUL routes exist in both locales                                               | Confirm live links                                                                |
| Business identity matching registration                                  | Registration number and identity fields exist                                          | Owner must confirm production values match official records                       |
| Landline telephone; mobile number is not accepted                        | Field exists with no fake fallback                                                     | Owner-controlled and currently missing                                            |
| Mail-order registration number where required                            | Not configured                                                                         | Owner-controlled and currently missing                                            |
| Business information visible through the payment page                    | Checkout and payment-status colophon exists                                            | Confirm live rendering in both locales                                            |
| PG payment module invoked from the payment page                          | PortOne V2 integration exists behind the master gate                                   | Not reviewer-ready until a controlled live/reviewer flow is enabled and verified  |
| Review URL                                                               | Production URL is suitable; controlled reviewer login or a named subdomain may be used | Avoid URLs containing `test`, `dev`, or `staging`; confirm the chosen PG's policy |
| No `TEST` products or zero-price review products                         | Guards and seed discipline exist                                                       | Confirm the live catalog                                                          |

PortOne states that reviewer access may use a dedicated account or a subdomain.
Some reviewers may reject development-labeled URLs, and changing the reviewed
URL later may trigger re-review. Use the intended public domain or a neutral
named subdomain.

## Card launch gate

1. Owner supplies and verifies the PortOne store, channel, API secret, webhook
   secret, and production environment configuration.
2. Keep `PORTONE_CARD_CHECKOUT_LIVE` unset or false while validating.
3. Run one complete sandbox payment through intent, browser SDK, return,
   server verification, webhook reconciliation, order/payment state, and
   inventory reservation consumption or review.
4. Confirm the V2 response contract against a real response: `status`,
   `amount.total`, `amount.paid`, `currency`, and `channel.type`. These field
   paths are guarded in code but have not been established by a retained live
   sandbox artifact. A mismatch must fail closed.
5. Confirm signed webhook delivery and replay behavior. Production must not
   rely on the unsigned compatibility path.
6. Confirm the live products, prices, legal pages, refund/delivery information,
   business identity, landline, and mail-order registration.
7. Enable card only for the reviewed environment and intended products.
8. Run the controlled reviewer journey on the exact submitted URL.
9. Keep the gate available for immediate rollback. Disabling new intents must
   not disable verification or reconciliation of already-started payments.

Card being safely dark is not the same as being ready for provider review.

### Shared membership checkout

The Hideaway membership checkout shares the PortOne V2 configuration, master
gate, verification, and webhook path. It is a one-time card flow; recurring
billing keys and renewal charging are outside this plan.

- The selected plan must explicitly include `card` in `payment_methods`.
- The verify route remains available after the master gate is disabled so an
  already-started payment can finish reconciliation.
- If membership products are included in the provider review, run their own
  intent, browser return, verification, webhook, ownership, amount, currency,
  and replay journey. A LOSTINSEOUL product payment does not prove that branch.
- Do not carry forward historical trial, recurring-payment, or accepted-race
  claims without current scenario evidence.

## Owner tasks

- Provide the final landline and mail-order registration number.
- Confirm legal business identity and address against current documents.
- Reconcile the reviewer-visible service hours in both locale catalogs and
  confirm that the published hours are operationally correct.
- Select the PG/channel and confirm supported payment methods.
- Configure store, channel, secrets, webhook, and reviewer access.
- Assign payment reconciliation and PortOne settlement ownership.
- Supply the commercial and operating decisions listed in
  [system.md](system.md) before their dependent packages begin.

## Manual and automated operation

- Reservation operators inspect queues through
  `/api/lost/inventory/reservations` and submit guarded `release`, `expire`,
  `reconcile`, or `run_expiry` commands through
  `/api/lost/inventory/reservations/commands` with a reason code, evidence
  reference, idempotency key, and expected state hash.
- Manual actions use the same domain commands as jobs and provider adapters.
- A manual record may acquire a provider reference and continue automatically
  without recreation or history replacement.
- Provider outage never authorizes direct state edits. Continue through the
  manual command when allowed or place the record in an operator queue.
- Unknown provider outcomes remain unknown until authoritative evidence or an
  audited operator decision resolves them.
- Disable one provider capability independently; manual operation and unrelated
  capabilities remain available.

## Rollback

- Card: disable new intents with `PORTONE_CARD_CHECKOUT_LIVE=false`; preserve
  verification, webhook reconciliation, payments, commands, and evidence.
- Reservation operator PR 6A: disable mutations; preserve read-only queues,
  reservations, events, and automated PR 6 behavior.
- Provider automation: set the capability to disabled, stop workers, retain
  observations/checkpoints/conflicts, and continue manually where permitted.
- Never roll back by deleting payments, provider evidence, inventory history,
  reservations, shipments, refunds, or audit records.
