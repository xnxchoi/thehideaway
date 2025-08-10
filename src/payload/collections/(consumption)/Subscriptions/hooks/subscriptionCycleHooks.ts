// hooks/subscriptionCycleHooks.ts

import {FieldHook} from "payload";

export const createInvoiceForCycle: FieldHook = async ({
	value,
	siblingData,
	req,
	originalDoc,
}) => {
	const planId = siblingData?.plan;
	if (!planId) return value;

	const plan = await req.payload.findByID({
		collection: "plans",
		id: planId,
	});

	if (!plan) return value;

	// Assume you are using plan.price to look up Price
	const price = await req.payload.findByID({
		collection: "prices",
		id: plan.price,
	});

	const currencies =
		price?.currencies?.krw || price?.currencies?.usd || price?.currencies?.eur;
	const amount = currencies?.amount;
	const currency = currencies?.currency_code as "KRW" | "USD" | "EUR";

	// Check if a new cycle is being pushed
	const oldCycles = originalDoc?.subscription_cycles || [];
	const newCycles = value || [];

	if (newCycles.length <= oldCycles.length) return value; // No new cycle pushed → skip

	const newCycle = newCycles[newCycles.length - 1];

	// Create Invoice
	const invoice = await req.payload.create({
		collection: "invoices",
		data: {
			subscription: originalDoc.id,
			cycle_start: newCycle.cycle_start,
			cycle_end: newCycle.cycle_end,
			amount,
			currency,
			status: "pending",
		},
	});

	console.log(`Created Invoice ${invoice.id} for new cycle`);

	// Link Invoice ID into the new cycle
	newCycle.invoice = invoice.id;

	return [...oldCycles, newCycle];
};
