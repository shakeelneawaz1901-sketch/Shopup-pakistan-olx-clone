import { ArrowLeft } from 'lucide-react';

type Props = { onBack: () => void };

export default function PrivacyPolicy({ onBack }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center gap-3">
          <button onClick={onBack} className="text-gray-600 hover:text-emerald-600 p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Privacy Policy</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs text-gray-400 mb-6">Last updated: September 2026</p>

          <Section title="1. Introduction">
            ShopUp.pk ("we", "us", or "our") is a free classified ads platform operating in Pakistan.
            This Privacy Policy explains how we collect, use, and protect your personal information
            when you use our website and mobile application. By using ShopUp, you agree to the practices
            described in this policy.
          </Section>

          <Section title="2. Information We Collect">
            We collect the following types of information when you create an account or post an ad:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Name:</strong> Your full name, used to identify you as a seller or buyer.</li>
              <li><strong>Email:</strong> Your email address, used for account login and communication.</li>
              <li><strong>Phone Number:</strong> Your contact number, displayed on your ads so buyers can reach you (you can hide this in your profile settings).</li>
              <li><strong>Profile Photo:</strong> An optional avatar image you upload.</li>
              <li><strong>Ad Content:</strong> Titles, descriptions, prices, images, and location data you submit when posting ads.</li>
            </ul>
          </Section>

          <Section title="3. Data Storage & Security">
            We use <strong>Supabase</strong>, a secure cloud-based platform, to store all user data.
            Supabase employs industry-standard encryption and row-level security policies to ensure
            that your data is protected against unauthorized access. Your password is hashed and
            cannot be read by anyone, including our team.
          </Section>

          <Section title="4. How We Use Your Information">
            Your information is used solely for the following purposes:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>To create and manage your account.</li>
              <li>To display your contact details on ads you post.</li>
              <li>To provide location-based search and filtering.</li>
              <li>To send important account-related notifications.</li>
              <li>To improve our services and user experience.</li>
            </ul>
          </Section>

          <Section title="5. We Do Not Sell Your Data">
            We do <strong>not</strong> sell, trade, or rent your personal information to any third party.
            Your data is never shared with advertisers or marketing companies. We are committed to
            protecting your privacy.
          </Section>

          <Section title="6. Cookies">
            We use cookies and similar technologies to enhance your browsing experience, remember your
            login session, and analyze how our platform is used. You can disable cookies in your browser
            settings, but some features may not function properly.
          </Section>

          <Section title="7. Third-Party Services">
            We use Google OAuth for optional sign-in, and Supabase for data storage. These services
            have their own privacy policies. We do not share your personal data with them beyond what
            is necessary for authentication and storage.
          </Section>

          <Section title="8. Your Rights & Account Deletion">
            You have the right to:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Access and update your personal information at any time.</li>
              <li>Toggle the visibility of your phone number on your ads.</li>
              <li>Delete your account and all associated data by contacting us.</li>
            </ul>
            To request account deletion, email us at <strong>support@shopup.pk</strong>.
          </Section>

          <Section title="9. Children's Privacy">
            ShopUp is not intended for individuals under the age of 16. We do not knowingly collect
            personal information from children. If you believe a child has provided us with personal
            data, please contact us so we can remove it.
          </Section>

          <Section title="10. Changes to This Policy">
            We may update this Privacy Policy from time to time. Any changes will be posted on this
            page with an updated revision date. We encourage you to review this policy periodically.
          </Section>

          <Section title="11. Contact Us">
            If you have any questions or concerns about this Privacy Policy or your personal data,
            please contact us at: <strong>support@shopup.pk</strong>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <h2 className="text-sm font-bold text-gray-900 mb-1.5">{title}</h2>
      <p className="text-sm text-gray-600 leading-relaxed">{children}</p>
    </div>
  );
}
