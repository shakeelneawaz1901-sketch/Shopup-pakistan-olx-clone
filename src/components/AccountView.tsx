import { useState, useEffect, useRef } from 'react';
import {
  LogIn, Mail, Lock, User, Phone, Loader2, UserCircle, Package,
  Heart, Camera, Save, X, ChevronRight, MessageCircle, Info, Shield,
  FileText, LogOut, Edit3, Calendar,
} from 'lucide-react';
import { supabase } from '../supabaseClient.js';
import type { Session, Profile } from '../types';

type Props = {
  session: Session | null;
  onAuthChange: () => void;
  onGoMyAds: () => void;
  onGoFavourites: () => void;
  adCount: number;
  favCount: number;
  onNavigate: (page: 'about' | 'privacy' | 'terms' | 'contact') => void;
};

export default function AccountView({ session, onAuthChange, onGoMyAds, onGoFavourites, adCount, favCount, onNavigate }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNum, setPhoneNum] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editShowPhone, setEditShowPhone] = useState(true);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) {
          setProfile(data as Profile);
        } else if (!error && !data) {
          const meta = session.user.user_metadata;
          const fallbackName = meta?.full_name || meta?.name || session.user.email?.split('@')[0] || '';
          const fallbackAvatar = meta?.avatar_url || meta?.picture || null;
          supabase
            .from('profiles')
            .insert({ id: session.user.id, full_name: fallbackName, phone: '', avatar_url: fallbackAvatar, show_phone: true })
            .then(() => {
              setProfile({ id: session.user.id, full_name: fallbackName, phone: '', avatar_url: fallbackAvatar, show_phone: true });
            });
        }
        setProfileLoading(false);
      });
  }, [session]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!email.trim() || !password) {
      setAuthError('Please enter email and password.');
      return;
    }
    if (mode === 'signup' && !fullName.trim()) {
      setAuthError('Please enter your full name.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        if (data.user) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: fullName.trim(),
            phone: phoneNum.trim(),
            show_phone: true,
          });
        }
      }
      onAuthChange();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google sign-in failed.');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onAuthChange();
  };

  const startEdit = () => {
    setEditName(profile?.full_name ?? '');
    setEditPhone(profile?.phone ?? '');
    setEditShowPhone(profile?.show_phone ?? true);
    setAvatarPreview(profile?.avatar_url ?? null);
    setAvatarFile(null);
    setEditError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setAvatarFile(null);
    setAvatarPreview(profile?.avatar_url ?? null);
    setEditError(null);
  };

  const pickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setEditError('Avatar must be under 3 MB.');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    if (!session || !profile) return;
    setEditSaving(true);
    setEditError(null);
    try {
      let avatarUrl = profile.avatar_url;
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() || 'jpg';
        const fileName = `${session.user.id}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { cacheControl: '3600', upsert: true });
        if (upErr) throw new Error(upErr.message);
        const { data: pub } = supabase.storage.from('avatars').getPublicUrl(fileName);
        avatarUrl = pub.publicUrl;
      }
      const updates = {
        full_name: editName.trim(),
        phone: editPhone.trim(),
        avatar_url: avatarUrl,
        show_phone: editShowPhone,
      };
      const { error: upErr } = await supabase.from('profiles').update(updates).eq('id', session.user.id);
      if (upErr) throw new Error(upErr.message);
      setProfile({ ...profile, ...updates });
      setEditing(false);
      setAvatarFile(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setEditSaving(false);
    }
  };

  // ── Logged-in: Edit Profile view ─────────────────────────────────────────
  if (session && editing) {
    const avatarUrl = avatarPreview;
    return (
      <div className="mx-auto max-w-md px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Edit Profile</h2>
            <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-700 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {editError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">{editError}</div>
          )}

          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div className="relative w-24 h-24">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-emerald-100" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center border-4 border-emerald-100">
                  <User className="w-10 h-10 text-emerald-600" />
                </div>
              )}
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-emerald-600 text-white p-2 rounded-full shadow-md hover:bg-emerald-700"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" onChange={pickAvatar} className="hidden" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your name" className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="03XX-XXXXXXX" className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
              </div>
            </div>

            {/* Show phone toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-700">Show my phone number on my ads</p>
                <p className="text-xs text-gray-400 mt-0.5">When enabled, buyers can see your phone number</p>
              </div>
              <ToggleSwitch checked={editShowPhone} onChange={setEditShowPhone} />
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={cancelEdit} className="flex-1 inline-flex items-center justify-center gap-1.5 border border-gray-300 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <X className="w-4 h-4" /> Cancel
              </button>
              <button onClick={saveProfile} disabled={editSaving} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
                {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Logged-in: Main account list view ────────────────────────────────────
  if (session) {
    const displayName = profile?.full_name || session.user.email?.split('@')[0] || 'User';
    const initial = displayName.charAt(0).toUpperCase();
    const avatarUrl = profile?.avatar_url ?? null;
    const memberSince = profile?.created_at
      ? new Date(profile.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })
      : '';

    return (
      <div className="mx-auto max-w-md px-4 py-6">
        {profileLoading && (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}

        {!profileLoading && (
          <>
            {/* Top profile card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center mb-5">
              <div className="relative w-24 h-24 mx-auto mb-3 group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-24 h-24 rounded-full object-cover border-4 border-emerald-100" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center border-4 border-emerald-100">
                    <span className="text-3xl font-bold text-emerald-700">{initial}</span>
                  </div>
                )}
                <button
                  onClick={startEdit}
                  className="absolute bottom-0 right-0 bg-white border-2 border-emerald-100 text-emerald-600 p-1.5 rounded-full shadow-sm hover:bg-emerald-50"
                  aria-label="Edit profile"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              <h2 className="text-lg font-bold text-gray-900">{displayName}</h2>
              {session.user.email && (
                <p className="text-sm text-gray-500 mt-0.5 break-all">{session.user.email}</p>
              )}
              {profile?.phone && (
                <p className="text-sm text-gray-500 mt-0.5">{profile.phone}</p>
              )}
              {memberSince && (
                <p className="text-xs text-gray-400 mt-1 inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Member since {memberSince}
                </p>
              )}
            </div>

            {/* My Activity section */}
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-2">My Activity</h3>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                <ListRow
                  icon={<Package className="w-5 h-5 text-emerald-600" />}
                  label="My Ads"
                  badge={adCount}
                  onClick={onGoMyAds}
                />
                <ListRow
                  icon={<Heart className="w-5 h-5 text-emerald-600" />}
                  label="Favorites"
                  badge={favCount}
                  onClick={onGoFavourites}
                />
                <ListRow
                  icon={<MessageCircle className="w-5 h-5 text-emerald-600" />}
                  label="Chats / Inbox"
                  onClick={() => {}}
                />
              </div>
            </div>

            {/* More section */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-2">More</h3>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                <ListRow icon={<Info className="w-5 h-5 text-emerald-600" />} label="About Us" onClick={() => onNavigate('about')} />
                <ListRow icon={<Shield className="w-5 h-5 text-emerald-600" />} label="Privacy Policy" onClick={() => onNavigate('privacy')} />
                <ListRow icon={<Phone className="w-5 h-5 text-emerald-600" />} label="Contact Us" onClick={() => onNavigate('contact')} />
                <ListRow icon={<FileText className="w-5 h-5 text-emerald-600" />} label="Terms" onClick={() => onNavigate('terms')} />
                <ListRow
                  icon={<LogOut className="w-5 h-5 text-red-500" />}
                  label="Logout"
                  onClick={handleSignOut}
                  danger
                />
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-gray-400 pb-2">
              Made with <span className="text-red-400">&#10084;</span> in Pakistan
            </p>
          </>
        )}
      </div>
    );
  }

  // ── Login / Signup view ──────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-3">
            <UserCircle className="w-9 h-9 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {mode === 'login' ? 'Sign in to post and manage your ads' : 'Sign up to start selling on ShopUp'}
          </p>
        </div>

        {authError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">{authError}</div>
        )}

        <form onSubmit={handleAuth} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400" />
              </div>
            </div>
          )}
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={phoneNum} onChange={(e) => setPhoneNum(e.target.value)} placeholder="03XX-XXXXXXX" className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl disabled:opacity-60 transition-colors">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            {mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl disabled:opacity-60 transition-colors"
        >
          <GoogleIcon /> Continue with Google
        </button>

        <div className="mt-5 text-center text-sm text-gray-500">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setAuthError(null); }} className="text-emerald-600 font-semibold hover:underline">
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── List row component ─────────────────────────────────────────────────────
function ListRow({
  icon, label, badge, onClick, danger,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
    >
      <div className="shrink-0 w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
        {icon}
      </div>
      <span className={`flex-1 text-sm font-medium ${danger ? 'text-red-500' : 'text-gray-800'}`}>{label}</span>
      {badge != null && (
        <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{badge}</span>
      )}
      <ChevronRight className={`w-4 h-4 ${danger ? 'text-red-300' : 'text-gray-300'}`} />
    </button>
  );
}

// ── Toggle switch component ────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-emerald-600' : 'bg-gray-300'}`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-5' : ''}`}
      />
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}
