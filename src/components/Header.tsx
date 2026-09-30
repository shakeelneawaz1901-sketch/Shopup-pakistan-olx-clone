import {
  Search, MapPin, Plus, LocateFixed, Loader2, ShoppingCart, User, Navigation,
} from 'lucide-react';
import { CITIES, CATEGORIES } from '../types';
import type { Coords } from '../types';

type Props = {
  search: string;
  setSearch: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  onSell: () => void;
  onUseLocation: () => void;
  locating: boolean;
  userCoords: Coords | null;
  onAccount: () => void;
  loggedIn: boolean;
};

export default function Header({
  search, setSearch, city, setCity, category, setCategory,
  onSell, onUseLocation, locating, userCoords, onAccount, loggedIn,
}: Props) {
  return (
    <header className="sticky top-0 z-30 bg-emerald-600 text-white shadow-md">
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="flex items-center gap-3 py-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-white rounded-lg p-1.5">
              <ShoppingCart className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="leading-tight">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">ShopUp Pakistan</h1>
              <p className="text-[10px] sm:text-xs text-emerald-100 -mt-0.5">Buy & Sell near you</p>
            </div>
          </div>

          {/* Search bar - desktop */}
          <div className="hidden md:flex flex-1 items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find cars, mobiles, jobs, services..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-lg py-2.5 px-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg py-2.5 px-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Use my location button */}
          <button
            onClick={onUseLocation}
            disabled={locating}
            title="Use my location"
            className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-500/40 hover:bg-emerald-500/60 disabled:opacity-60 text-white font-medium text-xs px-2.5 py-2.5 rounded-lg transition-colors"
          >
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            <span className="hidden lg:inline">{userCoords ? 'Located' : 'Near Me'}</span>
          </button>

          {/* Account icon */}
          <button
            onClick={onAccount}
            title="Account"
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/40 hover:bg-emerald-500/60 transition-colors"
          >
            <User className="w-5 h-5" />
            {loggedIn && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-green-300 rounded-full ring-2 ring-emerald-600" />}
          </button>

          <button
            onClick={onSell}
            className="inline-flex items-center gap-1.5 bg-white text-emerald-700 font-semibold text-sm px-3 sm:px-4 py-2.5 rounded-lg hover:bg-emerald-50 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">SELL</span>
          </button>
        </div>

        {/* Search bar - mobile */}
        <div className="md:hidden pb-3 flex flex-col gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ads..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="flex-1 rounded-lg py-2.5 px-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 rounded-lg py-2.5 px-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button
              onClick={onUseLocation}
              disabled={locating}
              title="Use my location"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500/40 px-3 disabled:opacity-60"
            >
              {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
