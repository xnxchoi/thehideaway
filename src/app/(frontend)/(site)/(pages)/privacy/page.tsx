import { RPage } from "@/components/UX/Transition";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Privacy Policy — The Hideaway",
	description: "How The Hideaway collects, uses, and protects your personal information."
};

export default function PrivacyPage() {
	return (
		<RPage type="pages" slug={["privacy"]}>
			<div className="relative mx-auto w-full max-w-[52em] px-[1.25em] pt-[10em] pb-[6em] sm:px-[2em] sm:pt-[15em]">
				<div className="mb-[3em]">
					<p className="mb-[.5em] text-[.75em] font-normal uppercase leading-[1] opacity-60">
						Legal
					</p>
					<h1 className="my-0 text-[2.5em] leading-[1.1] font-medium">
						Privacy Policy
					</h1>
					<p className="mt-[1em] opacity-60 text-[.9em]">
						Last updated: [PLACEHOLDER: Insert effective date]
					</p>
				</div>

				<div className="prose prose-neutral dark:prose-invert max-w-none space-y-[2em] leading-[1.7] opacity-90">

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">1. Who We Are</h2>
						<p>
							The Hideaway (<strong>[PLACEHOLDER: Legal entity name]</strong>, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;)
							operates the website and platform located at{" "}
							<strong>[PLACEHOLDER: your domain, e.g. hideawayseoul.com]</strong>.
							This Privacy Policy explains how we collect, use, and protect your
							personal information when you use our services.
						</p>
						<p>
							For questions about this policy, contact us at{" "}
							<strong>[PLACEHOLDER: privacy@yourdomain.com]</strong>.
						</p>
					</section>

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">2. Information We Collect</h2>
						<h3 className="text-[1.1em] font-medium mb-[.5em] mt-[1.2em]">Information you provide directly</h3>
						<ul className="list-disc pl-[1.5em] space-y-[.4em]">
							<li>
								<strong>Account registration:</strong> Name, email address, username,
								and optional profile information (bio, location, website link, profile photo).
							</li>
							<li>
								<strong>Profile content:</strong> Any content you post, upload, or submit to
								the platform.
							</li>
						</ul>

						<h3 className="text-[1.1em] font-medium mb-[.5em] mt-[1.2em]">Information from third-party sign-in (Google)</h3>
						<p>
							When you sign in with Google, we receive the following data from Google&rsquo;s
							OAuth service: your email address, full name, first and last name, and profile
							picture. We use this data solely to create and populate your account. We do not
							receive your Google password or access to your Google account beyond what is
							necessary for sign-in.
						</p>

						<h3 className="text-[1.1em] font-medium mb-[.5em] mt-[1.2em]">Information from Naver Sign-In</h3>
						<p>
							When you sign in with Naver, we receive your email address, name, nickname, and
							profile image from Naver. This data is used only to create and populate your account.
						</p>

						<h3 className="text-[1.1em] font-medium mb-[.5em] mt-[1.2em]">Automatically collected information</h3>
						<ul className="list-disc pl-[1.5em] space-y-[.4em]">
							<li>Session tokens stored in HTTP-only cookies for authentication.</li>
							<li>
								Standard server logs (IP address, browser type, pages visited) for security
								and performance monitoring.
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">3. How We Use Your Information</h2>
						<ul className="list-disc pl-[1.5em] space-y-[.4em]">
							<li>To create and manage your account.</li>
							<li>To authenticate you when you sign in.</li>
							<li>To send authentication emails (verification codes, password resets, magic links, two-factor codes) via Brevo email service.</li>
							<li>To display your profile and content to other users.</li>
							<li>To send platform notifications you have opted into.</li>
							<li>To investigate security incidents and prevent abuse.</li>
						</ul>
					</section>

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">4. Third-Party Services</h2>
						<p>We use the following third-party services that may process your data:</p>
						<ul className="list-disc pl-[1.5em] space-y-[.4em]">
							<li>
								<strong>Google OAuth</strong> — for sign-in authentication. Subject to{" "}
								<a href="https://policies.google.com/privacy" className="underline opacity-70 hover:opacity-100" target="_blank" rel="noopener noreferrer">
									Google&rsquo;s Privacy Policy
								</a>.
							</li>
							<li>
								<strong>Naver</strong> — for sign-in authentication (Korean users). Subject to{" "}
								<a href="https://policy.naver.com/policy/privacy_en.html" className="underline opacity-70 hover:opacity-100" target="_blank" rel="noopener noreferrer">
									Naver&rsquo;s Privacy Policy
								</a>.
							</li>
							<li>
								<strong>Brevo (Sendinblue)</strong> — for transactional email delivery. Your email
								address is shared with Brevo solely to deliver authentication and notification emails.
							</li>
							<li>
								<strong>[PLACEHOLDER: Hosting provider, e.g. Vercel / AWS]</strong> — for platform
								hosting and database storage.
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">5. Data Retention</h2>
						<p>
							Your account data is retained for as long as your account is active. You may
							delete your account at any time from your account settings, which will permanently
							remove your profile data. Backup and log data may be retained for up to{" "}
							<strong>[PLACEHOLDER: e.g. 30 days]</strong> after deletion.
						</p>
					</section>

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">6. Your Rights</h2>
						<p>Depending on your location, you may have the right to:</p>
						<ul className="list-disc pl-[1.5em] space-y-[.4em]">
							<li>Access the personal data we hold about you.</li>
							<li>Request correction of inaccurate data.</li>
							<li>Request deletion of your data (&ldquo;right to be forgotten&rdquo;).</li>
							<li>Object to or restrict certain processing of your data.</li>
							<li>Receive a copy of your data in a portable format.</li>
						</ul>
						<p className="mt-[.75em]">
							To exercise any of these rights, contact us at{" "}
							<strong>[PLACEHOLDER: privacy@yourdomain.com]</strong>.
						</p>
					</section>

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">7. Cookies</h2>
						<p>
							We use HTTP-only session cookies for authentication purposes. These cookies are
							necessary for the service to function and cannot be disabled. We do not use
							tracking or advertising cookies.
						</p>
					</section>

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">8. Security</h2>
						<p>
							We use industry-standard security measures including encrypted session tokens,
							email verification, optional two-factor authentication, and HTTPS for all
							communications. No method of transmission over the Internet is 100% secure,
							and we cannot guarantee absolute security.
						</p>
					</section>

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">9. Children&rsquo;s Privacy</h2>
						<p>
							Our services are not directed to children under the age of{" "}
							<strong>[PLACEHOLDER: 13 / 16]</strong>. We do not knowingly collect personal
							information from children. If you believe a child has provided us with personal
							information, please contact us.
						</p>
					</section>

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">10. Changes to This Policy</h2>
						<p>
							We may update this Privacy Policy from time to time. We will notify you of
							significant changes by email or by posting a notice on the platform. Continued
							use of the service after changes constitutes acceptance of the updated policy.
						</p>
					</section>

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">11. Contact</h2>
						<p>
							<strong>[PLACEHOLDER: Legal entity name]</strong><br />
							<strong>[PLACEHOLDER: Address]</strong><br />
							Email: <strong>[PLACEHOLDER: privacy@yourdomain.com]</strong>
						</p>
					</section>

				</div>
			</div>
		</RPage>
	);
}
