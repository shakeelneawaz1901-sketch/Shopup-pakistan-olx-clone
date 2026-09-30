import { useState, useRef } from 'react';
import {
  X, Camera, ImagePlus, LocateFixed, Loader2, Trash2,
} from 'lucide-react';
import { supabase } from '../supabaseClient.js';
import { CITIES, CATEGORIES, SUBCATEGORIES, emptyForm, MAX_IMAGES } from '../types';
import type { AdForm, Coords } from '../types';

type Props = {
  onClose: () => void;
  onPosted: () => void;
};

export default function PostAdModal({ onClose, onPosted }: Props) {
  const [form, setForm] = useState<AdForm>(emptyForm);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setSubmitError(null);
    const remaining = MAX_IMAGES - imageFiles.length;
    if (remaining <= 0) {
      setSubmitError(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }
    const toAdd: File[] = [];
    const previews: string[] = [];
    for (const file of Array.from(files)) {
      if (toAdd.length >= remaining) break;
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError(`${file.name} is over 5 MB and was skipped.`);
        continue;
      }
      toAdd.push(file);
      previews.push(URL.createObjectURL(file));
    }
    setImageFiles((prev) => [...prev, ...toAdd]);
    setImagePreviews((prev) => [...prev, ...previews]);
  };

  const removeImage = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => {
      const url = prev[idx];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setSubmitError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setSubmitError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setSubmitError('Could not get your location. Please allow location access.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!form.title.trim() || !form.price.trim() || !form.phone.trim()) {
      setSubmitError('Please fill in title, price, and phone.');
      return;
    }
    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setSubmitError('Please enter a valid price.');
      return;
    }

    setSubmitting(true);

    try {
      const imageUrls: string[] = [];
      for (const file of imageFiles) {
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('ad-images')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });
        if (upErr) throw new Error(upErr.message);
        const { data: pub } = supabase.storage.from('ad-images').getPublicUrl(fileName);
        imageUrls.push(pub.publicUrl);
      }

      const { error: insErr } = await supabase.from('ads').insert({
        title: form.title.trim(),
        price: priceNum,
        city: form.city,
        category: form.category,
        subcategory: form.subcategory || null,
        phone: form.phone.trim(),
        description: form.description.trim(),
        image_url: imageUrls[0] ?? null,
        images: imageUrls.length > 0 ? imageUrls : null,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      });
      if (insErr) throw new Error(insErr.message);

      onPosted();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Post a New Ad</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {submitError && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
              {submitError}
            </div>
          )}

          {/* Image picker — Camera + Gallery buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Photos ({imageFiles.length}/{MAX_IMAGES})
            </label>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => { addFiles(e.target.files); if (cameraRef.current) cameraRef.current.value = ''; }}
              className="hidden"
            />
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => { addFiles(e.target.files); if (galleryRef.current) galleryRef.current.value = ''; }}
              className="hidden"
            />
            {imageFiles.length < MAX_IMAGES && (
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border-2 border-emerald-300 bg-emerald-50 text-emerald-700 py-3 text-sm font-medium hover:bg-emerald-100 transition-colors"
                >
                  <Camera className="w-5 h-5" /> Take Photo
                </button>
                <button
                  type="button"
                  onClick={() => galleryRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border-2 border-gray-300 bg-gray-50 text-gray-700 py-3 text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  <ImagePlus className="w-5 h-5" /> Gallery
                </button>
              </div>
            )}

            {/* Preview grid */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img src={src} alt={`preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full hover:bg-black/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. iPhone 13 Pro Max 256GB"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (Rs) *</label>
              <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="50000" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone *</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03XX-XXXXXXX" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 bg-white">
                {CITIES.filter((c) => c !== 'All Cities').map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, subcategory: '' })} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 bg-white">
                {CATEGORIES.filter((c) => c !== 'All Categories').map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {(SUBCATEGORIES[form.category] ?? []).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sub-Category</label>
              <select
                value={form.subcategory}
                onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 bg-white"
              >
                <option value="">Select sub-category</option>
                {(SUBCATEGORIES[form.category] ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe your item..." className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
            <button type="button" onClick={handleLocate} disabled={locating} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-60 transition-colors">
              {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
              {coords ? `Located: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Get current location'}
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</> : 'Post Ad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
