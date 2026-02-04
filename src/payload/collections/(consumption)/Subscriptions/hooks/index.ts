import config from "@payload-config"
import {FieldHook, getPayload} from "payload";
import {sendDueEmail} from "./sendDueEmail"; // separate util file
export const ensureFirstCycle: FieldHook = async ({
	value,
	siblingData,
	req,
	originalDoc,
}) => {
	// Skip if cycles already present
	if (originalDoc?.subscription_cycles?.length > 0) return value;

	const planId = siblingData?.plan;

	// Fetch the Plan to get its type
	const plan = await req.payload.findByID({
		collection: "plans",
		id: planId,
	});

	if (plan?.type === "recurring") {
		const now = new Date();
		const intervalMonths = plan?.recurring?.interval || 1;

		const cycleStart = now;
		const cycleEnd = new Date();
		cycleEnd.setMonth(cycleEnd.getMonth() + intervalMonths);

		return [
			{
				cycle_start: cycleStart.toISOString(),
				cycle_end: cycleEnd.toISOString(),
			},
		];
	}

	return value;
};

export const checkSubscriptionsDue = async ({dryRun = false} = {}) => {
	console.log(
		"Running Subscription Validity Check...",
		dryRun ? "[DRY RUN]" : "",
	);
	const payload = await getPayload({config})
	const subscriptions = await payload.find({
		collection: "subscriptions",
		limit: 10000,
		where: {
			subscription_status: {
				equals: "active",
			},
		},
	});

	const today = new Date();

	const updates = subscriptions.docs.map(async (sub) => {
		const lastCycle = sub.subscription_cycles?.slice(-1)?.[0];
		if (!lastCycle) return;

		const cycleEndDate = new Date(lastCycle.cycle_end);

		const shouldBeDue = cycleEndDate < today;

		if (shouldBeDue && !sub.is_due) {
			console.log(
				`Subscription ${sub.id} would be marked due (Cycle ended: ${cycleEndDate.toISOString()})`,
			);

			if (!dryRun) {
				await payload.update({
					collection: "subscriptions",
					id: sub.id,
					data: {
						is_due: true,
						paid: false,
						last_due_check: new Date().toISOString(),
					},
				});

				try {
					await sendDueEmail(sub);
					console.log(`Sent due email for subscription ${sub.id}`);
				} catch (err) {
					console.error(`Error sending email for subscription ${sub.id}:`, err);
				}
			}
		}
	});

	await Promise.all(updates);

	console.log("Subscription Validity Check Completed");
};
