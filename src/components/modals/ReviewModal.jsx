import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';
import { X, Star, Sparkles, ThumbsUp } from 'lucide-react';

export const ReviewModal = () => {
  const { isReviewModalOpen, setIsReviewModalOpen, reviewListingTarget, submitReview } = useApp();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState(['Taze & Lezzetli', 'Güler Yüzlü']);
  const [saving, setSaving] = useState(false);

  if (!isReviewModalOpen) return null;

  const quickTags = [
    'Taze & Lezzetli',
    'Güler Yüzlü',
    'Hızlı Teslim',
    'Temiz Paketleme',
    'Büyük Porsiyon',
    'Sıfır İsraf Dostu'
  ];

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reviewListingTarget) return;
    setSaving(true);
    const ok = await submitReview(reviewListingTarget, { rating, comment, tags: selectedTags });
    setSaving(false);
    if (!ok) return;
    setRating(5);
    setComment('');
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#F59E0B', '#10B981', '#2D6A4F']
    });
    setIsReviewModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 bg-[#F0FFF4] border-b border-[#A8E7C5]/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#52B788]" />
            <h3 className="font-bold text-sm text-[#0F5238]">Deneyimini Değerlendir</h3>
          </div>
          <button
            onClick={() => setIsReviewModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-gray-500 transition shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="text-center">
            <h4 className="font-bold text-base text-[#0F5238]">
              {reviewListingTarget?.businessName || 'İşletme Değerlendirmesi'}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Kurtardığınız paket nasıldı? Puanınız diğer kurtarıcılara rehber olur.
            </p>

            {/* Star selector */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-amber-600 mt-1 block">
              {rating === 5 && 'Harika! 🌟'}
              {rating === 4 && 'Çok İyi 👍'}
              {rating === 3 && 'Ortalama 😐'}
              {rating <= 2 && 'Geliştirilmeli ⚠️'}
            </span>
          </div>

          {/* Quick Tag pills */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Öne Çıkanlar</label>
            <div className="flex flex-wrap gap-2">
              {quickTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-[#2D6A4F] text-white'
                        : 'bg-[#F0FFF4] text-[#006C48] border border-[#A8E7C5]/50 hover:bg-[#D1FEE5]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment text */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Yorumunuz (Opsiyonel)</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Gıdanın durumu, lezzeti ve teslimat süreci hakkında bir şeyler yazın..."
              className="w-full text-xs p-3 rounded-2xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] outline-none transition resize-none"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-[#0F5238] hover:bg-[#2D6A4F] disabled:opacity-60 text-white font-bold text-xs rounded-2xl shadow-lg shadow-[#0F5238]/20 transition flex items-center justify-center gap-2"
          >
            <ThumbsUp className="w-4 h-4 text-[#95D5B2]" />
            {saving ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}
          </button>
        </form>

      </div>
    </div>
  );
};
