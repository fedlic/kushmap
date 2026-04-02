import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — KUSHMAP",
  description: "Privacy policy for KUSHMAP, the Thailand cannabis dispensary directory.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-green-600 font-bold text-lg">KUSHMAP</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 text-sm">Privacy Policy</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: April 2, 2026</p>

        <section className="space-y-8 text-gray-700 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p>
              KUSHMAP (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), operated by FEDLIC TOKYO LLC,
              provides a cannabis dispensary directory for Thailand at kushmap.vercel.app.
              This Privacy Policy explains how we collect, use, and protect your personal information.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              KUSHMAP（以下「当社」）は、合同会社FEDLIC TOKYOが運営するタイのディスペンサリーディレクトリです。本ポリシーは個人情報の取り扱いについて説明します。
            </p>
            <p className="mt-1 text-sm text-gray-500">
              KUSHMAP (&quot;เรา&quot;) ดำเนินการโดย FEDLIC TOKYO LLC ให้บริการไดเรกทอรีร้านกัญชาในประเทศไทย
              นโยบายความเป็นส่วนตัวนี้อธิบายวิธีการเก็บรวบรวม ใช้ และปกป้องข้อมูลส่วนบุคคลของคุณ
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Account information (email address) when you sign in via Google or email</li>
              <li>Reviews, ratings, and bookmarks you submit</li>
              <li>Location data when you use the &quot;Near Me&quot; feature (with your permission)</li>
              <li>Usage data collected automatically (pages visited, device type, browser, IP address)</li>
            </ul>
            <p className="mt-2 text-sm text-gray-500">
              収集する情報：メールアドレス（ログイン時）、レビュー・評価・ブックマーク、位置情報（許可時）、利用データ。
            </p>
            <p className="mt-1 text-sm text-gray-500">
              ข้อมูลที่เราเก็บรวบรวม: ที่อยู่อีเมล (เมื่อเข้าสู่ระบบ), รีวิวและการให้คะแนน, ข้อมูลตำแหน่ง (เมื่อได้รับอนุญาต), ข้อมูลการใช้งาน
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide and improve our dispensary finder service</li>
              <li>To display shops near your location</li>
              <li>To display your reviews and ratings on shop pages</li>
              <li>To manage your bookmarks and preferences</li>
              <li>To analyze usage patterns and improve the user experience</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Advertising (Google AdSense)</h2>
            <p>
              We use Google AdSense to display advertisements on our website.
              Google may use cookies and web beacons to serve ads based on your
              prior visits to our website and other websites on the internet.
              You can opt out of personalized advertising by visiting{" "}
              <a href="https://www.google.com/settings/ads" className="text-green-600 underline" target="_blank" rel="noopener noreferrer">
                Google Ads Settings
              </a>.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              当社はGoogle AdSenseを使用して広告を表示しています。Googleはパーソナライズド広告のためにCookieを使用する場合があります。
            </p>
            <p className="mt-1 text-sm text-gray-500">
              เราใช้ Google AdSense เพื่อแสดงโฆษณาบนเว็บไซต์ Google อาจใช้คุกกี้เพื่อแสดงโฆษณาตามการเข้าชมก่อนหน้า
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Analytics</h2>
            <p>
              We use Google Analytics and Vercel Analytics to understand how visitors
              interact with our website. These services collect information such as
              how often users visit, what pages they view, and what other sites they
              used prior to coming to our site. We use this information solely to
              improve our service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies</h2>
            <p>
              We use cookies and similar technologies for the following purposes:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Authentication and session management</li>
              <li>Storing your preferences (e.g., age verification status)</li>
              <li>Serving advertisements via Google AdSense</li>
              <li>Analytics and usage tracking via Google Analytics</li>
            </ul>
            <p className="mt-2">
              You can manage cookie preferences through your browser settings.
              Disabling cookies may affect the functionality of our service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Third-Party Services</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Google AdSense — advertising</li>
              <li>Google Analytics — usage analytics</li>
              <li>Vercel Analytics — performance monitoring</li>
              <li>Google Maps API — map and location services</li>
              <li>Supabase — authentication and data storage</li>
              <li>Google OAuth — user authentication</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Data Retention & Your Rights</h2>
            <p>
              We retain your personal data for as long as your account is active.
              You have the right to access, correct, or delete your personal data,
              opt out of personalized advertising, and withdraw consent for location
              tracking at any time.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Children&apos;s Privacy</h2>
            <p>
              Our service is intended for users of legal age in their respective
              jurisdictions. We do not knowingly collect personal information from
              minors. An age verification gate is displayed before accessing the service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be
              posted on this page with an updated revision date. Continued use of
              the service constitutes acceptance of the updated policy.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us:
            </p>
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
