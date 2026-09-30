import { MapPin, Image as ImageIcon, Navigation, Heart, MessageCircle } from 'lucide-react';
import type { Ad, Coords } from '../types';
import { formatPrice, timeAgo, adDistance, formatDistance } from '../utils';

type Props = {
  ad: Ad;
  userCoords: Coords | null;
  isFavourite: boolean;
  onToggleFavourite: (adId: string) => void;
  onClick: () => void;
};

export default function AdCard({ ad, userCoords, isFavourite, onToggleFavourite, onClick }: Props) {
  const dist = adDistance(ad, userCoords);
  const thumb = ad.images?.[0] ?? ad.image_url;

  const handleWhatsapp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Check out this ad on ShopUp Pakistan: ${ad.title} - ${formatPrice(Number(ad.price))} in ${ad.city}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavourite(ad.id);
  };

  return (
    <article
      onClick={onClick}
      className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col"
    >
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {thumb ? (
          <img
            src={thumb}
            alt={ad.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ImageIcon className="w-10 h-10" />
          </div>
        )}
        <span className="absolute top-2 left-2 bg-white/90 backdrop-blur text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
          {ad.category}
        </span>
        {ad.images && ad.images.length > 1 && (
          <span className="absolute top-2 right-10 bg-black/50 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
            {ad.images.length} photos
          </span>
        )}
        <button
          onClick={handleFav}
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur transition-colors ${
            isFavourite ? 'bg-rose-500 text-white' : 'bg-white/80 text-gray-400 hover:text-rose-500'
          }`}
          aria-label="Favourite"
        >
          <Heart className={`w-4 h-4 ${isFavourite ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="p-2.5 sm:p-3 flex flex-col flex-1">
        <p className="text-emerald-700 font-bold text-sm sm:text-base">
          {formatPrice(Number(ad.price))}
        </p>
        <h3 className="text-xs sm:text-sm text-gray-800 font-medium line-clamp-2 mt-1 leading-snug">
          {ad.title}
        </h3>
        <div className="mt-auto pt-2 flex flex-col gap-0.5 text-[10px] sm:text-xs text-gray-400">
          <span className="inline-flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 shrink-0" /> {ad.city}
          </span>
          <div className="flex items-center justify-between">
            {dist != null ? (
              <span className="inline-flex items-center gap-0.5 text-emerald-600 font-medium">
                <Navigation className="w-2.5 h-2.5" /> {formatDistance(dist)}
              </span>
            ) : (
              <button onClick={handleWhatsapp} className="inline-flex items-center gap-0.5 text-green-600 hover:text-green-700 font-medium">
                <MessageCircle className="w-3 h-3" /> Share
              </button>
            )}
            <span>{timeAgo(ad.created_at)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
