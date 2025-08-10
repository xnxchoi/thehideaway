import {getPayload} from "@/lib/payload";

export const checkInvoicesDue = async ({dryRun = false} = {}) => {
	console.log("Running Invoice Overdue Check...", dryRun ? "[DRY RUN]" : "");

	const today = new Date();

	const payload = await getPayload();

	const invoices = await payload.find({
		collection: "invoices",
		limit: 10000,
		where: {
			status: {
				equals: "pending",
			},
		},
	});

	const updates = invoices.docs.map(async (invoice) => {
		const cycleEndDate = new Date(invoice.cycle_end);
		const shouldBeOverdue = cycleEndDate < today;

		if (shouldBeOverdue) {
			console.log(
				`Invoice ${invoice.id} would be marked overdue (Cycle ended: ${cycleEndDate.toISOString()})`,
			);

			if (!dryRun) {
				await payload.update({
					collection: "invoices",
					id: invoice.id,
					data: {
						status: "overdue",
						last_due_check: new Date().toISOString(),
					},
				});

				console.log(`Invoice ${invoice.id} marked overdue`);
			}
		}
	});

	await Promise.all(updates);

	console.log("Invoice Overdue Check Completed");
};
