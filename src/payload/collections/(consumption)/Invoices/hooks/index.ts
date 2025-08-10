import {Invoice} from "@/payload-types";
import {getExchangeRate} from "@/utilities/getExchangeRate";
import {DateTime} from "luxon";
import {CollectionAfterChangeHook, CollectionBeforeChangeHook} from "payload";

// hooks/invoiceHooks.ts
export const advanceSubscriptionOnPaid: CollectionAfterChangeHook = async ({
	req,
	previousDoc,
	doc,
}) => {
	// Only act when status changes to 'paid' and was not 'paid' before
	if (doc.status !== "paid" || previousDoc.status === "paid") return;

	// Fetch Subscription
	const subscription = await req.payload.findByID({
		collection: "subscriptions",
		id: doc.subscription,
	});

	if (subscription.subscription_status !== "active") {
		console.log(
			`Skipping subscription advance — subscription ${subscription.id} status is ${subscription.subscription_status}`,
		);
		return;
	}

	const plan = await req.payload.findByID({
		collection: "plans",
		id: subscription.plan as unknown as string,
	});

	if (plan?.type !== "recurring") return;

	const lastCycle = subscription.subscription_cycles?.slice(-1)?.[0];
	if (!lastCycle) return;

	// Check that the Invoice matches last cycle → only advance if correct Invoice paid
	if (lastCycle.invoice !== doc.id) {
		console.log(
			`Skipping subscription advance — Invoice ${doc.id} does not match last cycle Invoice`,
		);
		return;
	}

	const intervalMonths = plan?.recurring?.interval || 1;

	const newCycleStart = new Date(lastCycle.cycle_end);
	const newCycleEnd = new Date(newCycleStart);
	newCycleEnd.setMonth(newCycleEnd.getMonth() + intervalMonths);

	// Push new cycle → Invoice hook (above) will auto-create new Invoice
	await req.payload.update({
		collection: "subscriptions",
		id: subscription.id,
		data: {
			subscription_cycles: [
				...(subscription.subscription_cycles || []),
				{
					cycle_start: newCycleStart.toISOString(),
					cycle_end: newCycleEnd.toISOString(),
				},
			],
			is_due: false,
			last_due_check: new Date().toISOString(),
		},
	});

	console.log(`Advanced subscription ${subscription.id} to new cycle`);
};
export const paymentProcessing: CollectionBeforeChangeHook<Invoice> = async ({
	data,
	operation,
}) => {
	const paymentMethod = data?.payment_method;
	const invoiceAmount = data?.amount;
	const status = data?.status;
	const paid_at = data?.paid_at;

	//@todo better validation of payment
	const isGood = status === "paid" && paid_at;
	if (isGood) {
		if (invoiceAmount && paymentMethod && paymentMethod.length > 0) {
			const payments: {
				converted_amount: number;
				original_amount: number;
				currency: string;
			}[] = [];
			for (const payment of paymentMethod) {
				const amount = payment.amount;
				const currency = payment.currency;
				const exchangeRate = await getExchangeRate(
					payment.payment_date,
					currency,
				).catch((err) => {
					console.error(err);
					return "-2120";
				});
				if (exchangeRate !== "-2120") {
					const rate = parseFloat(exchangeRate);
					const convertedAmount = amount * rate;
					payments.push({
						converted_amount: convertedAmount,
						original_amount: amount,
						currency: currency,
					});
				}
			}

			const totalConvertedAmount = payments.reduce((acc, payment) => {
				return acc + payment.converted_amount;
			}, 0);
			if (totalConvertedAmount >= invoiceAmount) {
				data.status = "paid";
			}
		} else {
			data.status = "pending";
			data.last_due_check = DateTime.now().toISO();
			data.paid_at = null;

			data.payment_method = data.payment_method || [];
		}
		return data;
	}
	if (!invoiceAmount) {
		return data;
	}
	const payments: {
		converted_amount: number;
		original_amount: number;
		currency: string;
	}[] = [];
	if (paymentMethod && paymentMethod.length > 0) {
		for (const payment of paymentMethod) {
			const amount = payment.amount;
			const currency = payment.currency;
			const exchangeRate = await getExchangeRate(
				payment.payment_date,
				currency,
			).catch((err) => {
				console.error(err);
				return "-2120";
			});
			if (exchangeRate !== "-2120") {
				const rate = parseFloat(exchangeRate);
				const convertedAmount = amount * rate;
				payments.push({
					converted_amount: convertedAmount,
					original_amount: amount,
					currency: currency,
				});
			}
		}
	}
	data.status = "pending";
	if (payments.length > 0) {
		const totalConvertedAmount = payments.reduce((acc, payment) => {
			return acc + payment.converted_amount;
		}, 0);
		if (totalConvertedAmount >= invoiceAmount) {
			data.status = "paid";
			data.paid_at = DateTime.now().toISO();
			data.last_due_check = DateTime.now().toISO();
		}
	}
	return data;
};
