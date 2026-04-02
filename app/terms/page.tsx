import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — KUSHMAP",
  description: "Terms of service for KUSHMAP, the Thailand cannabis dispensary directory.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-green-600 font-bold text-lg">KUSHMAP</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 text-sm">Terms of Service</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: April 2, 2026</p>

        <section className="space-y-8 text-gray-700 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using KUSHMAP (&quot;the Service&quot;), operated by FEDLIC TOKYO LLC,
              you agree to be bound by these Terms of Service. If you do not agree to these
              terms, please do not use the Service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
            <p>
              KUSHMAP is a web-based directory that helps users find cannabis dispensaries
              across Thailand. We provide shop locations, operating hours, product menus,
              reviews, and amenity information. The Service is provided &quot;as is&quot; and is
              intended for informational purposes only.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Age Requirement</h2>
            <p>
              You must be of legal age in your jurisdiction to access this Service.
              By using KUSHMAP, you confirm that you meet the minimum age requirement
              for cannabis-related content in your location. An age verification gate
              is displayed upon first access to the Service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Cannabis Laws and Compliance</h2>
            <p>
              Cannabis laws vary by country, region, and jurisdiction. KUSHMAP is a
              directory service for dispensaries operating within Thailand, where cannabis
              has been decriminalized for certain uses under Thai law.
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Users are solely responsible for understanding and complying with
                the cannabis laws applicable in their own jurisdiction.</li>
              <li>KUSHMAP does not sell, distribute, or facilitate the sale of cannabis
                or any controlled substances.</li>
              <li>Listing a dispensary on KUSHMAP does not constitute an endorsement
                of its products or legal compliance.</li>
              <li>Cannabis regulations in Thailand may change. Users should verify
                current laws before purchasing or consuming cannabis products.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. User Accounts</h2>
            <p>
              You may create an account using Google OAuth or email to access features
              such as submitting reviews and saving bookmarks. You are responsible for
              maintaining the security of your account and for all activities that
              occur under your account.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. User Content</h2>
            <p>
              When you submit reviews, ratings, or other content, you grant us a
              non-exclusive, worldwide, royalty-free license to use, display, and
              distribute that content on the Service. You agree not to submit content that is:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>False, misleading, or fraudulent</li>
              <li>Defamatory, abusive, threatening, or harassing</li>
              <li>Promoting illegal activities beyond the scope of applicable law</li>
              <li>Infringing on third-party intellectual property rights</li>
              <li>Containing spam, malware, or unauthorized advertising</li>
              <li>Containing personally identifiable information of others without consent</li>
            </ul>
            <p className="mt-2">
              We reserve the right to remove any content that violates these terms
              and to ban users who repeatedly violate them.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Scrape, crawl, or use automated means to access the Service without permission</li>
              <li>Attempt to gain unauthorized access to our systems or user accounts</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>Impersonate another person or entity</li>
              <li>Use the Service to facilitate illegal drug transactions</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Accuracy of Information</h2>
            <p>
              While we strive to keep dispensary information accurate and up-to-date,
              we do not guarantee the accuracy, completeness, or timeliness of any
              information on the Service. Shop hours, product availability, prices,
              and other details may change without notice. Please verify information
              directly with dispensaries before visiting.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Advertisements</h2>
            <p>
              The Service displays third-party advertisements, including those served
              by Google AdSense. We are not responsible for the content, accuracy, or
              claims made in third-party advertisements. Your interactions with
              advertisers are solely between you and the advertiser.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES
              OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
              IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
              AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
              UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Limitation of Liability</h2>
            <p>
              TO THE FULLEST EXTENT PERMITTED BY LAW, FEDLIC TOKYO LLC AND ITS
              AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE,
              INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, DATA, OR
              OTHER INTANGIBLE LOSSES.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Service Changes and Termination</h2>
            <p>
              We reserve the right to modify, suspend, or discontinue the Service
              (or any part of it) at any time, with or without notice. We may also
              suspend or terminate your access to the Service at any time for conduct
              that we believe violates these Terms or is harmful to other users,
              dispensaries listed on the Service, or the Service itself.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Intellectual Property</h2>
            <p>
              The Service and its original content (excluding user-submitted content)
              are the property of FEDLIC TOKYO LLC and are protected by copyright
              and other intellectual property laws.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the
              laws of Japan. Any disputes arising from these Terms shall be subject
              to the exclusive jurisdiction of the Tokyo District Court.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">15. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Changes will be posted on
              this page with an updated revision date. Continued use of the Service
              after changes constitutes acceptance of the new Terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">16. Contact Us</h2>
            <p>For questions about these Terms, please contact us:</p>
            <div className="mt-3 bg-white border border-gray-200 rounded-lg p-4 text-sm">
              <p className="font-medium text-gray-900">FEDLIC TOKYO LLC</p>
              <p>Email:{" "}
                <a href="mailto:info@fedlic.tokyo" className="text-green-600 underline">info@fedlic.tokyo</a>
              </p>
              <p>Website:{" "}
                <a href="https://fedlic.tokyo" className="text-green-600 underline" target="_blank" rel="noopener noreferrer">fedlic.tokyo</a>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
