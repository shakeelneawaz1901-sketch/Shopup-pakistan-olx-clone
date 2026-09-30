import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, Plus, Loader2, Package, Navigation, LogIn, X, MessageCircle,
} from 'lucide-react';
import { supabase } from './supabaseClient.js';
import { CITIES, CATEGORIES, SUBCATEGORIES } from './types';
import type { Ad, Coords, Tab, SortBy, Session, Favourite } from './types';
import { adDistance } from './utils';
import Header from './components/Header';
import AdCard from './components/AdCard';
import PostAdModal from './components/PostAdModal';
import AdDetailModal from './components/AdDetailModal';
import BottomNav from './components/BottomNav';
import AccountView from './components/AccountView';
import AdBanner from './components/AdBanner';
import ChatView from './components/ChatView';
import AboutUs from './pages/AboutUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import ContactUs from './pages/ContactUs';

type InfoPage = 'about' | 'privacy' | 'terms' | 'contact';

export default function App() {
  // Ad data
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('All Cities');
  const [category, setCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState<SortBy>('newest');

  // Location
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);
  const [nearMe, setNearMe] = useState(false);

  // Auth
  const [session, setSession] = useState<Session | null>(null);

  // Favourites
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [favAds, setFavAds] = useState<Ad[]>([]);

  // Tabs / modals
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [modalOpen, setModalOpen] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [detailAd, setDetailAd] = useState<Ad | null>(null);
  const [infoPage, setInfoPage] = useState<InfoPage | null>(null);
  const [initialChat, setInitialChat] = useState<{ adId: string; receiverId: string; adTitle: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSubcats, setShowSubcats] = useState<string | null>(null);

  // ── Auth: bootstrap session + listen for changes ────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // ── Fetch ads ───────────────────────────────────────────────────────────
  const fetchAds = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('ads')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
      setAds([]);
    } else {
      setAds((data as Ad[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // ── Fetch favourites when session changes ───────────────────────────────
  const fetchFavourites = useCallback(async () => {
    if (!session) {
      setFavourites(new Set());
      setFavAds([]);
      return;
    }
    const { data, error: err } = await supabase
      .from('favourites')
      .select('ad_id')
      .eq('user_id', session.user.id);
    if (!err && data) {
      setFavourites(new Set((data as Favourite[]).map((f) => f.ad_id)));
    }
  }, [session]);

  useEffect(() => {
    fetchFavourites();
  }, [fetchFavourites]);

  // Fetch full ad data for favourited ads
  useEffect(() => {
    if (favourites.size === 0) {
      setFavAds([]);
      return;
    }
    const favIds = Array.from(favourites);
    const matched = ads.filter((a) => favIds.includes(a.id));
    setFavAds(matched);
  }, [favourites, ads]);

  // ── Filtered + sorted list ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = ads.filter((a) => {
      const matchCity = city === 'All Cities' || a.city === city;
      const matchCat = category === 'All Categories' || a.category === category;
      let q = search.trim().toLowerCase();
      let matchSubcat = true;
      if (q.includes(':')) {
        const [catPart, subPart] = q.split(':', 2);
        matchSubcat = a.subcategory?.toLowerCase() === subPart.trim();
        q = catPart.trim();
      }
      const matchSearch = !q || a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) || a.city.toLowerCase().includes(q) ||
        (a.subcategory?.toLowerCase().includes(q) ?? false);
      const matchNear = !nearMe || (a.latitude != null && a.longitude != null && userCoords);
      return matchCity && matchCat && matchSearch && matchSubcat && matchNear;
    });

    if (sortBy === 'low') list = [...list].sort((a, b) => a.price - b.price);
    else if (sortBy === 'high') list = [...list].sort((a, b) => b.price - a.price);
    else if (sortBy === 'near') {
      list = [...list].sort((a, b) => {
        const da = adDistance(a, userCoords) ?? Infinity;
        const db = adDistance(b, userCoords) ?? Infinity;
        return da - db;
      });
    }
    return list;
  }, [ads, city, category, search, sortBy, nearMe, userCoords]);

  const myAds = useMemo(
    () => (session ? ads.filter((a) => a.user_id === session.user.id) : []),
    [ads, session],
  );

  // ── Location handlers ───────────────────────────────────────────────────
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError('Could not get your location. Please allow location access.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const handleUseLocation = () => {
    if (!userCoords) {
      requestLocation();
    } else {
      setNearMe((v) => !v);
    }
  };

  // ── Favourite toggle ────────────────────────────────────────────────────
  const toggleFavourite = useCallback(async (adId: string) => {
    if (!session) {
      setLoginPromptOpen(true);
      return;
    }
    const isFav = favourites.has(adId);
    setFavourites((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(adId);
      else next.add(adId);
      return next;
    });

    if (isFav) {
      await supabase.from('favourites').delete().eq('user_id', session.user.id).eq('ad_id', adId);
    } else {
      await supabase.from('favourites').insert({ user_id: session.user.id, ad_id: adId });
    }
  }, [session, favourites]);

  // ── Posting flow (login gated) ──────────────────────────────────────────
  const openSell = () => {
    if (!session) {
      setLoginPromptOpen(true);
      return;
    }
    setModalOpen(true);
  };

  const handlePosted = async () => {
    setModalOpen(false);
    await fetchAds();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this ad permanently?')) return;
    const { error: delErr } = await supabase.from('ads').delete().eq('id', id);
    if (delErr) {
      setError(delErr.message);
    } else {
      setAds((prev) => prev.filter((a) => a.id !== id));
      setDetailAd(null);
    }
  };

  // ── Sort dropdown options ───────────────────────────────────────────────
  const sortOptions: { value: SortBy; label: string }[] = [
    { value: 'newest', label: 'Newest first' },
    { value: 'low', label: 'Price: Low to High' },
    { value: 'high', label: 'Price: High to Low' },
  ];
  if (userCoords) sortOptions.push({ value: 'near', label: 'Nearest first' });

  // ── Grid with ad banners after every 4 ads ──────────────────────────────
  const renderGridWithBanners = (list: Ad[]) => {
    const items: React.ReactNode[] = [];
    list.forEach((ad, idx) => {
      items.push(
        <AdCard
          key={ad.id}
          ad={ad}
          userCoords={userCoords}
          isFavourite={favourites.has(ad.id)}
          onToggleFavourite={toggleFavourite}
          onClick={() => setDetailAd(ad)}
        />,
      );
      if ((idx + 1) % 4 === 0 && idx < list.length - 1) {
        items.push(<AdBanner key={`banner-${idx}`} />);
      }
    });
    return items;
  };

  const refreshAuth = () => supabase.auth.getSession().then(({ data }) => setSession(data.session));

  // ── Unread message count ───────────────────────────────────────────────
  useEffect(() => {
    if (!session) { setUnreadCount(0); return; }
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', session.user.id)
        .is('read_at', null);
      setUnreadCount(count ?? 0);
    };
    fetchUnread();
    const channel = supabase
      .channel('unread-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${session.user.id}` }, fetchUnread)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session]);

  // ── Start chat from ad detail ──────────────────────────────────────────
  const handleStartChat = (ad: Ad) => {
    if (!session) { setLoginPromptOpen(true); return; }
    if (!ad.user_id || ad.user_id === session.user.id) return;
    setInitialChat({ adId: ad.id, receiverId: ad.user_id, adTitle: ad.title });
    setDetailAd(null);
    setActiveTab('chat');
  };

  if (infoPage === 'about') return <AboutUs onBack={() => setInfoPage(null)} />;
  if (infoPage === 'privacy') return <PrivacyPolicy onBack={() => setInfoPage(null)} />;
  if (infoPage === 'terms') return <Terms onBack={() => setInfoPage(null)} />;
  if (infoPage === 'contact') return <ContactUs onBack={() => setInfoPage(null)} />;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      {activeTab !== 'account' && activeTab !== 'chat' && (
        <Header
          search={search}
          setSearch={setSearch}
          city={city}
          setCity={setCity}
          category={category}
          setCategory={setCategory}
          onSell={openSell}
          onUseLocation={handleUseLocation}
          locating={locating}
          userCoords={userCoords}
          onAccount={() => setActiveTab('account')}
          loggedIn={!!session}
        />
      )}

      {activeTab === 'account' && (
        <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100">
          <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-center">
            <h1 className="text-lg font-bold text-gray-900">My Account</h1>
          </div>
        </header>
      )}

      {/* Category chips (home + search tabs) */}
      {(activeTab === 'home' || activeTab === 'search') && (
        <div className={`sticky top-0 z-20 border-b bg-white shadow-sm ${nearMe ? 'ring-1 ring-emerald-200' : ''}`}>
          <div className="mx-auto max-w-7xl px-3 sm:px-4 py-2.5 flex flex-wrap gap-2 max-h-[104px] overflow-hidden">
            {CATEGORIES.map((c) => {
              const active = category === c;
              const hasSubs = !!(SUBCATEGORIES[c] ?? []).length;
              return (
                <button
                  key={c}
                  onClick={() => {
                    setCategory(c);
                    if (c === 'All Categories') { setShowSubcats(null); setSearch(''); }
                    else setShowSubcats(hasSubs && showSubcats === c ? null : (hasSubs ? c : null));
                  }}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400 hover:text-emerald-700'
                  }`}
                >
                  {c}
                </button>
              );
            })}
            {userCoords && (
              <button
                onClick={() => setNearMe((v) => !v)}
                className={`shrink-0 ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  nearMe
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-emerald-700 border-emerald-300 hover:border-emerald-500'
                }`}
              >
                <Navigation className="w-3 h-3" /> Near Me
              </button>
            )}
          </div>
          {/* Sub-category chips */}
          {showSubcats && (SUBCATEGORIES[showSubcats] ?? []).length > 0 && (
            <div className="border-t border-gray-100 bg-gray-50">
              <div className="mx-auto max-w-7xl px-3 sm:px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => { setCategory(showSubcats); setSearch(''); setShowSubcats(null); }}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                    !search.includes(':')
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400'
                  }`}
                >
                  All {showSubcats}
                </button>
                {(SUBCATEGORIES[showSubcats] ?? []).map((s) => {
                  const subActive = search.trim() === `${showSubcats}:${s}`;
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        setCategory(showSubcats);
                        setSearch(`${showSubcats}:${s}`);
                        setShowSubcats(null);
                      }}
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                        subActive
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-700'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <main className="mx-auto max-w-7xl px-3 sm:px-4 py-5">
        {/* HOME / SEARCH ─────────────────────────────────────────────── */}
        {(activeTab === 'home' || activeTab === 'search') && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                {loading ? 'Loading ads...' : `${filtered.length} ad${filtered.length !== 1 ? 's' : ''} found`}
                {!loading && city !== 'All Cities' && <span className="text-gray-500 font-normal"> in {city}</span>}
                {!loading && nearMe && <span className="text-emerald-600 font-normal"> near you</span>}
              </h2>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="rounded-lg py-2 px-2 text-xs sm:text-sm text-gray-700 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Package className="w-12 h-12 mb-3" />
                <p className="text-sm">No ads match your search.</p>
                <button
                  onClick={openSell}
                  className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4" /> Post the first ad
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {renderGridWithBanners(filtered)}
              </div>
            )}
          </>
        )}

        {/* SEARCH TAB (enhanced search panel above the grid) ──────────── */}
        {activeTab === 'search' && (
          <div className="mb-5 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, description, or city..."
                className="w-full pl-9 pr-3 py-3 rounded-lg text-sm text-gray-900 bg-gray-50 border border-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-lg py-2.5 px-3 text-sm text-gray-900 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg py-2.5 px-3 text-sm text-gray-900 bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {userCoords && (
              <button
                onClick={() => setNearMe((v) => !v)}
                className={`mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  nearMe
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <Navigation className="w-4 h-4" /> {nearMe ? 'Showing ads near you' : 'Show only ads near me'}
              </button>
            )}
          </div>
        )}

        {/* CHAT TAB ───────────────────────────────────────────────────── */}
        {activeTab === 'chat' && (
          <div className="mx-auto max-w-2xl">
            {session ? (
              <ChatView
                session={session}
                initialChat={initialChat}
                onClearInitialChat={() => setInitialChat(null)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <MessageCircle className="w-12 h-12 mb-3" />
                <p className="text-sm">Sign in to start chatting with buyers and sellers.</p>
                <button
                  onClick={() => setActiveTab('account')}
                  className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700"
                >
                  <LogIn className="w-4 h-4" /> Go to Sign In
                </button>
              </div>
            )}
          </div>
        )}

        {/* MY ADS TAB ────────────────────────────────────────────────── */}
        {activeTab === 'myads' && (
          <MyAdsView
            session={session}
            myAds={myAds}
            userCoords={userCoords}
            favourites={favourites}
            onToggleFavourite={toggleFavourite}
            onOpen={(ad) => setDetailAd(ad)}
            onPostAd={openSell}
            onGoAccount={() => setActiveTab('account')}
          />
        )}

        {/* ACCOUNT TAB ───────────────────────────────────────────────── */}
        {activeTab === 'account' && (
          <AccountView
            session={session}
            onAuthChange={refreshAuth}
            onGoMyAds={() => setActiveTab('myads')}
            onGoFavourites={() => setActiveTab('myads')}
            adCount={myAds.length}
            favCount={favourites.size}
            onNavigate={setInfoPage}
          />
        )}
      </main>

      {activeTab !== 'account' && activeTab !== 'chat' && (
        <footer className="border-t bg-white mt-8">
          <div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-gray-400">
            ShopUp Pakistan &copy; {new Date().getFullYear()} &middot; Buy and sell anything, anywhere in Pakistan.
          </div>
        </footer>
      )}

      <BottomNav active={activeTab} onTab={setActiveTab} onSell={openSell} unreadCount={unreadCount} />

      {/* Post Ad Modal */}
      {modalOpen && (
        <PostAdModal onClose={() => setModalOpen(false)} onPosted={handlePosted} />
      )}

      {/* Login prompt when trying to post without auth */}
      {loginPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl relative">
            <button
              onClick={() => setLoginPromptOpen(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <LogIn className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Sign in to continue</h3>
            <p className="text-sm text-gray-500 mt-2 mb-5">
              You can browse all ads without an account, but you need to sign in to post ads, save favourites, and chat on ShopUp Pakistan.
            </p>
            <button
              onClick={() => { setLoginPromptOpen(false); setActiveTab('account'); }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Go to Sign In
            </button>
            <button
              onClick={() => setLoginPromptOpen(false)}
              className="mt-2 w-full text-gray-500 hover:text-gray-700 font-medium py-2 text-sm"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailAd && (
        <AdDetailModal
          ad={detailAd}
          userCoords={userCoords}
          isFavourite={favourites.has(detailAd.id)}
          canDelete={!!session && detailAd.user_id === session.user.id}
          onToggleFavourite={toggleFavourite}
          onClose={() => setDetailAd(null)}
          onDelete={handleDelete}
          onChat={handleStartChat}
          loggedIn={!!session}
          onLoginPrompt={() => setLoginPromptOpen(true)}
        />
      )}
    </div>
  );
}

// ── My Ads view (inline, small) ────────────────────────────────────────────
function MyAdsView({
  session, myAds, userCoords, favourites, onToggleFavourite, onOpen, onPostAd, onGoAccount,
}: {
  session: Session | null;
  myAds: Ad[];
  userCoords: Coords | null;
  favourites: Set<string>;
  onToggleFavourite: (adId: string) => void;
  onOpen: (ad: Ad) => void;
  onPostAd: () => void;
  onGoAccount: () => void;
}) {
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Package className="w-12 h-12 mb-3" />
        <p className="text-sm">Sign in to see your ads.</p>
        <button
          onClick={onGoAccount}
          className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700"
        >
          <LogIn className="w-4 h-4" /> Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800">
          My Ads ({myAds.length})
        </h2>
        <button
          onClick={onPostAd}
          className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-sm font-semibold px-3 py-2 rounded-lg hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" /> Post new
        </button>
      </div>

      {myAds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Package className="w-12 h-12 mb-3" />
          <p className="text-sm">You haven't posted any ads yet.</p>
          <button
            onClick={onPostAd}
            className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" /> Post your first ad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {myAds.map((ad) => (
            <AdCard
              key={ad.id}
              ad={ad}
              userCoords={userCoords}
              isFavourite={favourites.has(ad.id)}
              onToggleFavourite={onToggleFavourite}
              onClick={() => onOpen(ad)}
            />
          ))}
        </div>
      )}
    </>
  );
}
