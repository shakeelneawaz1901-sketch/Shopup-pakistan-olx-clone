import { useState } from 'react';
import { ArrowLeft, Mail, Phone, MapPin, Loader2, Send, CheckCircle } from 'lucide-react';
import { supabase } from '../supabaseClient.js';

type Props = { onBack: () => void };

export default function ContactUs({ onBack }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setSending(true);
    try {
      const { error: insErr } = await supabase.from('contact_messages').insert({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
      if (insErr) throw new Error(insErr.message);
      setSent(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center gap-3">
          <button onClick={onBack} className="text-gray-600 hover:text-emerald-600 p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Contact Us</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Contact info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">Get in Touch</h2>
          <div className="space-y-4">
            <ContactRow
              icon={<Mail className="w-5 h-5 text-emerald-600" />}
              label="Email"
              value="support@shopup.pk"
              href="mailto:support@shopup.pk"
            />
            <ContactRow
              icon={<Phone className="w-5 h-5 text-emerald-600" />}
              label="Phone"
              value="+92 300 1234567"
              href="tel:+923001234567"
            />
            <ContactRow
              icon={<MapPin className="w-5 h-5 text-emerald-600" />}
              label="Address"
              value="Kasur, Punjab, Pakistan"
            />
          </div>
        </div>

        {/* Contact form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Send us a Message</h2>

          {sent && (
            <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5 shrink-0" />
              Your message has been sent! We will get back to you soon.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="How can we help you?"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl disabled:opacity-60 transition-colors"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Message
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Made with <span className="text-red-400">&#10084;</span> in Pakistan
        </p>
      </div>
    </div>
  );
}

function ContactRow({
  icon, label, value, href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-3">
      <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
  if (href) {
    return <a href={href} className="block hover:opacity-80 transition-opacity">{content}</a>;
  }
  return content;
}
