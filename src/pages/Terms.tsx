import { ArrowLeft } from 'lucide-react';

type Props = { onBack: () => void };

export default function Terms({ onBack }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center gap-3">
          <button onClick={onBack} className="text-gray-600 hover:text-emerald-600 p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Terms &amp; Conditions</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs text-gray-400 mb-6">Last updated: September 2026</p>

          <Section title="1. Acceptance of Terms">
            By using ShopUp.pk ("the Platform"), you agree to be bound by these Terms and Conditions.
            If you do not agree with any part of these terms, please do not use our services.
            ShopUp is a free classified ads platform that connects buyers and sellers across Pakistan.
          </Section>

          <Section title="2. User Responsibilities">
            As a user of ShopUp, you are solely responsible for:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>The accuracy and truthfulness of the ads you post.</li>
              <li>The legality of the items or services you list.</li>
              <li>Any transactions or communications that result from your ads.</li>
              <li>Maintaining the security of your account credentials.</li>
            </ul>
          </Section>

          <Section title="3. Prohibited Items & Content">
            The following are strictly prohibited on ShopUp:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Illegal items, stolen goods, or counterfeit products.</li>
              <li>Weapons, explosives, or dangerous materials.</li>
              <li>Drugs, narcotics, or controlled substances.</li>
              <li>Adult content or explicit material.</li>
              <li>Fraudulent or deceptive listings.</li>
              <li>Hate speech, harassment, or discriminatory content.</li>
            </ul>
            Any ad found violating these rules will be removed immediately.
          </Section>

          <Section title="4. Ad Removal & Moderation">
            ShopUp reserves the right to remove any ad at any time, without prior notice, if we believe
            it violates these Terms or is otherwise inappropriate. We may also suspend or terminate
            accounts that repeatedly post prohibited content.
          </Section>

          <Section title="5. No Warranty">
            ShopUp is provided "as is" without any warranties of any kind. We do not guarantee the
            accuracy, reliability, or quality of any ads posted on the Platform. Users transact at
            their own risk, and ShopUp is not responsible for any losses or disputes arising from
            transactions between users.
          </Section>

          <Section title="6. Limitation of Liability">
            ShopUp shall not be liable for any direct, indirect, incidental, or consequential damages
            arising from the use of our Platform. We are not a party to any transaction between buyers
            and sellers and bear no responsibility for the outcome.
          </Section>

          <Section title="7. Account Termination">
            You may delete your account at any time by contacting support@shopup.pk. We may also
            terminate your account if you violate these Terms or engage in fraudulent activity.
          </Section>

          <Section title="8. Changes to Terms">
            We may update these Terms and Conditions at any time. Continued use of the Platform after
            changes are posted constitutes acceptance of the new terms.
          </Section>

          <Section title="9. Contact">
            For any questions regarding these Terms, please contact us at: <strong>support@shopup.pk</strong>
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
