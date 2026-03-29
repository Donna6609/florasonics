import React from "react";
import {
  CloudRain, Waves, Wind, TreePine, Flame, Bird, Zap, Coffee,
  Moon, Train, Droplets, Fan, Heart, CloudSun, Mountain, Leaf,
  Music2, Sunset, Snowflake, Fish, Bug, Tent, Drum, BookOpen,
  Sparkles, Home,
} from "lucide-react";

export const SOUNDS = [
  // Nature - Water
  { id: "rain", label: "Rain", icon: CloudRain, color: "#7aa8c4", category: "water", tier: "free", image: "https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=400&q=80" },
  { id: "ocean", label: "Ocean", icon: Waves, color: "#1e7a9e", category: "water", tier: "free", image: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&q=80" },
  { id: "stream", label: "Stream", icon: Droplets, color: "#3ab5c0", category: "water", tier: "basic", image: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400&q=80" },
  { id: "waterfall", label: "Water Drips", icon: Mountain, color: "#5ba8c4", category: "water", tier: "basic", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },
  { id: "thunder", label: "Thunder", icon: Zap, color: "#4a4a72", category: "water", tier: "premium", image: "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=400&q=80" },

  // Nature - Earth
  { id: "forest", label: "Forest", icon: TreePine, color: "#2d7d46", category: "earth", tier: "basic", image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80" },
  { id: "wind", label: "Wind", icon: Wind, color: "#c8d8e8", category: "earth", tier: "free", image: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=400&q=80" },
  { id: "birds", label: "Birds", icon: Bird, color: "#d4a017", category: "earth", tier: "basic", image: "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=400&q=80" },
  { id: "leaves", label: "Leaves", icon: Leaf, color: "#6aad4a", category: "earth", tier: "basic", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },
  { id: "crickets", label: "Crickets", icon: Bug, color: "#8a9e4a", category: "earth", tier: "basic", image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80" },
  { id: "campfire", label: "Campfire", icon: Tent, color: "#c05c20", category: "earth", tier: "premium", image: "https://images.unsplash.com/photo-1574267432644-f610fd5e7e1c?w=400&q=80" },
  { id: "embers", label: "Ice Cycles", icon: Snowflake, color: "#7dd3fc", category: "earth", tier: "basic", image: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=400&q=80" },
  { id: "hearth", label: "Hearth", icon: Home, color: "#d4501a", category: "ambient", tier: "basic", image: "https://images.unsplash.com/photo-1574267432644-f610fd5e7e1c?w=400&q=80" },
  { id: "plant_bass", label: "Plant Bass", icon: Music2, color: "#4a9e5c", category: "wellness", tier: "basic", image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80" },

  // Ambient
  { id: "fire", label: "Fireplace", icon: Flame, color: "#e05c1a", category: "ambient", tier: "basic", image: "https://images.unsplash.com/photo-1574267432644-f610fd5e7e1c?w=400&q=80" },
  { id: "cafe", label: "Café", icon: Coffee, color: "#8b5e3c", category: "ambient", tier: "premium", image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&q=80" },
  { id: "train", label: "Train", icon: Train, color: "#6b7280", category: "ambient", tier: "basic", image: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&q=80" },
  { id: "fan", label: "Fan", icon: Fan, color: "#9db4c0", category: "ambient", tier: "free", image: "https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=400&q=80" },
  { id: "library", label: "Library", icon: BookOpen, color: "#b0956a", category: "ambient", tier: "premium", image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80" },

  // Focus & Wellness
  { id: "calm", label: "Calm", icon: CloudSun, color: "#f0c060", category: "wellness", tier: "free", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },
  { id: "night", label: "Night", icon: Moon, color: "#2e3a5c", category: "wellness", tier: "premium", image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80" },
  { id: "faith", label: "Faith", icon: Heart, color: "#c2445c", category: "wellness", tier: "basic", image: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400&q=80" },
  { id: "binaural", label: "Binaural", icon: Music2, color: "#8b5cf6", category: "wellness", tier: "premium", image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80" },
  { id: "bowl", label: "Singing Bowl", icon: Drum, color: "#d4a017", category: "wellness", tier: "premium", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },
  { id: "snow", label: "Snow", icon: Snowflake, color: "#b0d4e8", category: "earth", tier: "basic", image: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=400&q=80" },
  { id: "neuroharmony", label: "Neuro Harmony (ADHD/Autism)", icon: Sparkles, color: "#7c6ba8", category: "wellness", tier: "basic", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },
  ];

export const SOUND_CATEGORIES = [
  { id: "all", label: "All Sounds" },
  { id: "water", label: "Water" },
  { id: "earth", label: "Earth" },
  { id: "ambient", label: "Ambient" },
  { id: "wellness", label: "Wellness" },
];

export default function SoundMixer({ activeSounds, onToggleSound, onVolumeChange, favorites, onToggleFavorite, userTier, onUpgrade, onEffectChange }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
      {SOUNDS.map((sound) => {
        const activeSound = activeSounds.find((s) => s.id === sound.id);
        const isFavorite = favorites.some((f) => f.type === "sound" && f.item_id === sound.id);
        return null; // This component is superseded by GardenMixer
      })}
    </div>
  );
}