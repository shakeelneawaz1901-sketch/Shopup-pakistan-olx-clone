import { ArrowLeft, ShoppingCart, ShieldCheck, Zap, Heart, Users } from 'lucide-react';

type Props = { onBack: () => void };

export default function AboutUs({ onBack }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <PageHeader title="About Us" onBack={onBack} />

      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Hero */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 flex items-center justify-center mb-3">
            <ShoppingCart className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">About ShopUp</h1>
          <p className="text-sm text-emerald-600 font-medium mt-0.5">Pakistan's Trusted Marketplace</p>
          <p className="text-sm text-gray-600 mt-4 leading-relaxed">
            ShopUp is a free classified ads platform where you can buy and sell anything across Pakistan.
            Our mission is to make online buying and selling safe, fast and easy.
            Made with <span className="text-red-400">&#10084;</span> in Pakistan.
          </p>
        </div>

        {/* What we do */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
          <h2 className="text-base font-bold text-gray-900 mb-3">What We Do</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            ShopUp connects buyers and sellers across Pakistan in a single, easy-to-use marketplace.
            Whether you are selling a used mobile phone, a car, furniture, or offering a service,
            ShopUp lets you post an ad in seconds and reach thousands of potential buyers nearby.
            Our platform supports location-based browsing, multi-image ads, and direct phone contact,
            so you can find the best deals close to home.
          </p>
        </div>

        {/* Why choose us */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Why Choose Us</h2>
          <div className="space-y-4">
            <FeatureRow
              icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
              title="Safe & Secure"
              text="Your data is protected with industry-standard security. We use Supabase for secure, encrypted data storage."
            />
            <FeatureRow
              icon={<Zap className="w-5 h-5 text-emerald-600" />}
              title="Fast & Easy"
              text="Post an ad in under a minute. Browse thousands of listings with smart search and location filters."
            />
            <FeatureRow
              icon={<Users className="w-5 h-5 text-emerald-600" />}
              title="Built for Pakistan"
              text="Designed specifically for the Pakistani market, with local cities, categories, and PKR pricing."
            />
            <FeatureRow
              icon={<Heart className="w-5 h-5 text-emerald-600" />}
              title="100% Free"
              text="Posting ads and browsing listings is completely free. No hidden charges, no commissions."
            />
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Made with <span className="text-red-400">&#10084;</span> in Pakistan
        </p>
      </div>
    </div>
  );
}

function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100">
      <div className="mx-auto max-w-2xl px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="text-gray-600 hover:text-emerald-600 p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
      </div>
    </header>
  );
}

function FeatureRow({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
