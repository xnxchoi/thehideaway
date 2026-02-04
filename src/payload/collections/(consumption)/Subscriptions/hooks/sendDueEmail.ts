import config from "@payload-config";
import {getPayload} from "payload";

export const sendDueEmail = async (subscription) => {
	const payload = await getPayload({config})
	const user = await payload.findByID({
		collection: "users",
		id: subscription.user,
	});

	if (!user?.email) {
		throw new Error("User has no email");
	}

	await payload.sendEmail({
		to: user.email,
		from: "your@email.com",
		subject: "Your Subscription is Due",
		html: `
      <p>Hello ${user?.name || "subscriber"},</p>
      <p>Your subscription is due. Please complete your payment to continue enjoying your benefits.</p>
      <p>Thank you!</p>
    `,
	});
};
