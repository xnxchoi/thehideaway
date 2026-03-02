import { RPage } from "@/components/UX/Transition";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Terms of Service — The Hideaway",
	description: "Terms and conditions for using The Hideaway platform."
};

export default function TermsPage() {
	return (
		<RPage type="pages" slug={["terms"]}>
			<div className="relative mx-auto w-full max-w-[52em] px-[1.25em] pt-[10em] pb-[6em] sm:px-[2em] sm:pt-[15em]">
				<div className="mb-[3em]">
					<p className="mb-[.5em] text-[.75em] font-normal uppercase leading-[1] opacity-60">
						Legal
					</p>
					<h1 className="my-0 text-[2.5em] leading-[1.1] font-medium">
						Terms of Service
					</h1>
					<p className="mt-[1em] opacity-60 text-[.9em]">
						Last updated: [PLACEHOLDER: Insert effective date]
					</p>
				</div>

				<div className="prose prose-neutral dark:prose-invert max-w-none space-y-[2em] leading-[1.7] opacity-90">

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">1. Acceptance of Terms</h2>
						<p>
							By accessing or using The Hideaway platform (&ldquo;Service&rdquo;) operated by{" "}
							<strong>[PLACEHOLDER: Legal entity name]</strong>, you agree to be bound by these
							Terms of Service. If you do not agree, do not use the Service.
						</p>
					</section>

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">2. Eligibility</h2>
						<p>
							You must be at least <strong>[PLACEHOLDER: 13 / 16 / 18]</strong> years old to use
							the Service. By using the Service, you represent that you meet this age requirement.
							If you are accessing the Service on behalf of a company or organization, you represent
							that you have authority to bind that entity to these Terms.
						</p>
					</section>

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">3. Your Account</h2>
						<p>
							You are responsible for maintaining the confidentiality of your account credentials
							and for all activity that occurs under your account. You agree to notify us immediately
							of any unauthorized use of your account. We recommend enabling two-factor authentication
							for added security.
						</p>
						<p className="mt-[.75em]">
							You may not create accounts using automated means, create multiple accounts for
							abusive purposes, or impersonate any person or entity.
						</p>
					</section>

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">4. Acceptable Use</h2>
						<p>You agree not to use the Service to:</p>
						<ul className="list-disc pl-[1.5em] space-y-[.4em]">
							<li>Post or transmit content that is unlawful, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable.</li>
							<li>Infringe the intellectual property rights of others.</li>
							<li>Distribute spam, malware, or other malicious content.</li>
							<li>Interfere with or disrupt the integrity or performance of the Service.</li>
							<li>Attempt to gain unauthorized access to the Service or its related systems.</li>
							<li>Collect or harvest other users&rsquo; personal information without their consent.</li>
							<li>Use the Service for any commercial purpose without our express written permission.</li>
						</ul>
					</section>

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">5. Content</h2>
						<p>
							You retain ownership of content you submit to the Service. By posting content, you
							grant us a non-exclusive, worldwide, royalty-free license to display, distribute,
							and use that content in connection with operating the Service.
						</p>
						<p className="mt-[.75em]">
							We reserve the right to remove any content that violates these Terms or that we
							deem inappropriate, without prior notice.
						</p>
					</section>

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">6. Third-Party Sign-In Services</h2>
						<p>
							The Service offers sign-in via Google and Naver OAuth. Your use of these services
							is subject to their respective terms of service and privacy policies. We are not
							responsible for the practices of these third-party providers.
						</p>
					</section>

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">7. Account Termination</h2>
						<p>
							You may delete your account at any time from your account settings. We reserve the
							right to suspend or terminate accounts that violate these Terms, with or without
							notice. Upon termination, your right to use the Service ceases immediately.
						</p>
					</section>

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">8. Disclaimer of Warranties</h2>
						<p>
							THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT
							WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES
							OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO
							NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES.
						</p>
					</section>

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">9. Limitation of Liability</h2>
						<p>
							TO THE MAXIMUM EXTENT PERMITTED BY LAW, <strong>[PLACEHOLDER: Legal entity name]</strong>{" "}
							SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
							DAMAGES ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED
							THE AMOUNT YOU PAID US IN THE PAST TWELVE MONTHS, OR{" "}
							<strong>[PLACEHOLDER: e.g. USD $100]</strong>, WHICHEVER IS GREATER.
						</p>
					</section>

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">10. Governing Law</h2>
						<p>
							These Terms are governed by the laws of{" "}
							<strong>[PLACEHOLDER: Jurisdiction, e.g. the Republic of Korea]</strong>, without
							regard to its conflict of law provisions. Any disputes arising from these Terms
							shall be resolved in the courts of{" "}
							<strong>[PLACEHOLDER: e.g. Seoul, South Korea]</strong>.
						</p>
					</section>

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">11. Changes to These Terms</h2>
						<p>
							We may update these Terms from time to time. We will notify you of material changes
							by email or by posting a prominent notice in the Service. Continued use of the Service
							after changes take effect constitutes acceptance of the revised Terms.
						</p>
					</section>

					<section>
						<h2 className="text-[1.4em] font-medium mb-[.75em]">12. Contact</h2>
						<p>
							For questions about these Terms, contact us at:<br />
							<strong>[PLACEHOLDER: Legal entity name]</strong><br />
							<strong>[PLACEHOLDER: Address]</strong><br />
							Email: <strong>[PLACEHOLDER: legal@yourdomain.com]</strong>
						</p>
					</section>

				</div>
			</div>
		</RPage>
	);
}
