import { useState } from 'react';
import {
  X, MapPin, Tag, MapPinned, Phone, Trash2, Image as ImageIcon, Navigation,
  Heart, MessageCircle,
} from 'lucide-react';
import type { Ad, Coords } from '../types';
import { formatPrice, timeAgo, adDistance, formatDistance } from '../utils';

type Props = {
  ad: Ad;
  userCoords: Coords | null;
  isFavourite: boolean;
  canDelete: boolean;
  onToggleFavourite: (adId: string) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  onChat?: (ad: Ad) => void;
  loggedIn: boolean;
  onLoginPrompt?: () => void;
};

export default function AdDetailModal({
  ad, userCoords, isFavourite, canDelete, onToggleFavourite, onClose, onDelete, onChat, loggedIn, onLoginPrompt,
}: Props) {
  const dist = adDistance(ad, userCoords);
  const allImages = ad.images && ad.images.length > 0 ? ad.images : (ad.image_url ? [ad.image_url] : []);
  const [activeIdx, setActiveIdx] = useState(0);

  const handleWhatsapp = () => {
    const text = `Check out this ad on ShopUp Pakistan: ${ad.title} - ${formatPrice(Number(ad.price))} in ${ad.city}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleFav = () => onToggleFavourite(ad.id);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="relative">
          {allImages.length > 0 ? (
            <img src={allImages[activeIdx]} alt={ad.title} className="w-full h-64 sm:h-80 object-cover sm:rounded-t-2xl" />
          ) : (
            <div className="w-full h-64 sm:h-80 bg-gray-100 flex items-center justify-center text-gray-300 sm:rounded-t-2xl">
              <ImageIcon className="w-16 h-16" />
            </div>
          )}
          <button onClick={onClose} className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-black/80">
            <X className="w-5 h-5" />
          </button>
          <span className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            {ad.category}
          </span>
          <button
            onClick={handleFav}
            className={`absolute bottom-3 right-3 p-2.5 rounded-full backdrop-blur transition-colors ${
              isFavourite ? 'bg-rose-500 text-white' : 'bg-white/80 text-gray-600 hover:text-rose-500'
            }`}
            aria-label="Favourite"
          >
            <Heart className={`w-5 h-5 ${isFavourite ? 'fill-current' : ''}`} />
          </button>
          {/* Thumbnail dots for multiple images */}
          {allImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${idx === activeIdx ? 'bg-white w-5' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="p-4 sm:p-6 space-y-3">
          <h2 className="text-xl font-bold text-gray-900">{ad.title}</h2>
          <p className="text-2xl font-bold text-emerald-700">{formatPrice(Number(ad.price))}</p>
          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" /> {ad.city}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-emerald-600" /> {ad.category}
            </span>
            {dist != null && (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                <Navigation className="w-4 h-4" /> {formatDistance(dist)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <MapPinned className="w-4 h-4 text-emerald-600" />
              {ad.latitude && ad.longitude
                ? `${ad.latitude.toFixed(4)}, ${ad.longitude.toFixed(4)}`
                : 'Location not provided'}
            </span>
          </div>

          {ad.description && (
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{ad.description}</p>
            </div>
          )}

          <div className="pt-3 border-t mt-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Seller details</h3>
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${ad.phone}`} className="inline-flex items-center gap-2 bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-emerald-700 text-sm">
                <Phone className="w-4 h-4" /> Call {ad.phone}
              </a>
              {onChat && (
                <button
                  onClick={() => {
                    if (!loggedIn) { onLoginPrompt?.(); return; }
                    if (ad.user_id) onChat(ad);
                  }}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-blue-700 text-sm"
                >
                  <MessageCircle className="w-4 h-4" /> Chat
                </button>
              )}
              <button onClick={handleWhatsapp} className="inline-flex items-center gap-2 bg-green-500 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-green-600 text-sm">
                <MessageCircle className="w-4 h-4" /> WhatsApp Share
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-xs text-gray-400">Posted {timeAgo(ad.created_at)}</span>
            {canDelete && (
              <button onClick={() => onDelete(ad.id)} className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 text-sm font-medium">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
