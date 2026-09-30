import { Home, Plus, Package, User, MessageCircle } from 'lucide-react';
import type { Tab } from '../types';

type Props = {
  active: Tab;
  onTab: (tab: Tab) => void;
  onSell: () => void;
  unreadCount?: number;
};

export default function BottomNav({ active, onTab, onSell, unreadCount }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <div className="mx-auto max-w-2xl flex items-end justify-around px-2 py-1 relative">
        <NavButton tab={{ id: 'home', label: 'Home', icon: Home }} active={active === 'home'} onClick={() => onTab('home')} />
        <ChatButton active={active === 'chat'} onClick={() => onTab('chat')} unread={unreadCount ?? 0} />

        {/* Center sell button */}
        <button
          onClick={onSell}
          className="relative -mt-6 flex flex-col items-center justify-center w-14 h-14 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition-colors ring-4 ring-white"
          aria-label="Sell"
        >
          <Plus className="w-7 h-7" />
          <span className="absolute -bottom-5 text-[10px] font-semibold text-emerald-700">SELL</span>
        </button>

        <NavButton tab={{ id: 'myads', label: 'My Ads', icon: Package }} active={active === 'myads'} onClick={() => onTab('myads')} />
        <NavButton tab={{ id: 'account', label: 'Account', icon: User }} active={active === 'account'} onClick={() => onTab('account')} />
      </div>
    </nav>
  );
}

function ChatButton({ active, onClick, unread }: { active: boolean; onClick: () => void; unread: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 min-w-[60px] relative transition-colors ${
        active ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <div className="relative">
        <MessageCircle className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium">Chats</span>
    </button>
  );
}

function NavButton({
  tab, active, onClick,
}: {
  tab: { id: Tab; label: string; icon: typeof Home };
  active: boolean;
  onClick: () => void;
}) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 min-w-[60px] transition-colors ${
        active ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
      <span className="text-[10px] font-medium">{tab.label}</span>
    </button>
  );
}
