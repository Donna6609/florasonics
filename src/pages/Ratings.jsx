import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Star } from "lucide-react";
import StarRating from "@/components/ratings/StarRating";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CATEGORIES = [
  { key: "app", label: "App Overall" },
  { key: "sound", label: "Sounds" },
  { key: "preset", label: "Presets" },
];

function RatingSummary({ label, ratings }) {
  if (!ratings.length) return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center text-white/40 text-sm">No ratings yet</div>
  );
  const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
  const counts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: ratings.filter(r => r.rating === star).length,
  }));

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col sm:flex-row gap-6 items-center">
      <div className="text-center shrink-0">
        <p className="text-5xl font-bold text-white">{avg.toFixed(1)}</p>
        <StarRating value={Math.round(avg)} readOnly size={5} />
        <p className="text-white/40 text-sm mt-1">{ratings.length} rating{ratings.length !== 1 ? "s" : ""}</p>
      </div>
      <div className="flex-1 w-full space-y-2">
        {counts.map(({ star, count }) => (
          <div key={star} className="flex items-center gap-3">
            <span className="text-white/50 text-xs w-3">{star}</span>
            <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
            <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: ratings.length ? `${(count / ratings.length) * 100}%` : "0%" }}
              />
            </div>
            <span className="text-white/40 text-xs w-4 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickRater({ category, onRated }) {
  const [selected, setSelected] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selected) return;
    await base44.entities.Review.create({
      review_type: category,
      rating: selected,
      reviewer_name: "Anonymous",
    });
    setSubmitted(true);
    toast.success("Thanks for rating!");
    onRated();
  };

  if (submitted) return (
    <div className="text-center text-emerald-400 text-sm py-2">Thanks for your rating! ✓</div>
  );

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <span className="text-white/50 text-sm">Rate this:</span>
      <StarRating value={selected} onChange={setSelected} size={6} />
      {selected > 0 && (
        <Button size="sm" onClick={handleSubmit} className="bg-amber-500 hover:bg-amber-600 text-white">
          Submit
        </Button>
      )}
    </div>
  );
}

export default function Ratings() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const data = await base44.entities.Review.list("-created_date", 200);
    setRatings(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-10">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
              <Star className="w-7 h-7 text-amber-400 fill-amber-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">Ratings</h1>
          <p className="text-white/50">See how the FloraSonics community rates us</p>
        </div>

        {loading ? (
          <div className="text-center text-white/40 py-20">Loading...</div>
        ) : (
          CATEGORIES.map(({ key, label }) => {
            const cat = ratings.filter(r => r.review_type === key);
            return (
              <div key={key} className="space-y-4">
                <h2 className="text-white font-semibold text-lg">{label}</h2>
                <RatingSummary label={label} ratings={cat} />
                <QuickRater category={key} onRated={load} />
              </div>
            );
          })
        )}

      </div>
    </div>
  );
}