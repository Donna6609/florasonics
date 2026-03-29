import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/LanguageContext";

const getMoods = (t) => [
  {
    id: "rainy_day",
    nameKey: "moodRainyDay",
    descKey: "moodRainyDayDesc",
    gradient: "from-blue-600/20 to-cyan-600/20",
    borderColor: "border-blue-500/30",
    soundConfigs: [
      { id: "rain", volume: 85 },
      { id: "thunder", volume: 25 },
      { id: "wind", volume: 15 },
    ],
  },
  {
    id: "cozy_cabin",
    nameKey: "moodCozyCabin",
    descKey: "moodCozyCabinDesc",
    gradient: "from-orange-600/20 to-amber-600/20",
    borderColor: "border-orange-500/30",
    soundConfigs: [
      { id: "fire", volume: 80 },
      { id: "wind", volume: 30 },
      { id: "night", volume: 20 },
    ],
  },
  {
    id: "forest_hike",
    nameKey: "moodForestHike",
    descKey: "moodForestHikeDesc",
    gradient: "from-green-600/20 to-emerald-600/20",
    borderColor: "border-green-500/30",
    soundConfigs: [
      { id: "birds", volume: 75 },
      { id: "forest", volume: 60 },
      { id: "stream", volume: 40 },
    ],
  },
  {
    id: "ocean_breeze",
    nameKey: "moodOceanBreeze",
    descKey: "moodOceanBreezeDesc",
    gradient: "from-cyan-600/20 to-blue-600/20",
    borderColor: "border-cyan-500/30",
    soundConfigs: [
      { id: "ocean", volume: 90 },
      { id: "wind", volume: 25 },
    ],
  },
  {
    id: "urban_cafe",
    nameKey: "moodUrbanCafe",
    descKey: "moodUrbanCafeDesc",
    gradient: "from-pink-600/20 to-rose-600/20",
    borderColor: "border-pink-500/30",
    soundConfigs: [
      { id: "cafe", volume: 85 },
    ],
  },
  {
    id: "thunderstorm",
    nameKey: "moodThunderstorm",
    descKey: "moodThunderstormDesc",
    gradient: "from-purple-600/20 to-violet-600/20",
    borderColor: "border-purple-500/30",
    soundConfigs: [
      { id: "rain", volume: 90 },
      { id: "thunder", volume: 70 },
      { id: "wind", volume: 45 },
    ],
  },
  {
    id: "bedtime",
    nameKey: "moodBedtime",
    descKey: "moodBedtimeDesc",
    gradient: "from-indigo-600/20 to-blue-600/20",
    borderColor: "border-indigo-500/30",
    soundConfigs: [
      { id: "rain", volume: 50 },
      { id: "ocean", volume: 40 },
      { id: "night", volume: 60 },
    ],
  },
  {
    id: "train_journey",
    nameKey: "moodTrainJourney",
    descKey: "moodTrainJourneyDesc",
    gradient: "from-slate-600/20 to-gray-600/20",
    borderColor: "border-slate-500/30",
    soundConfigs: [
      { id: "train", volume: 80 },
      { id: "rain", volume: 30 },
    ],
  },
];

export default function MoodSelector({ onSelectMood }) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const moods = getMoods(t);

  const handleSelectMood = (mood) => {
    onSelectMood({ ...mood, name: t(mood.nameKey) });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium bg-gradient-to-r from-violet-600/10 to-purple-600/10 border-violet-500/20 text-violet-300 hover:bg-violet-600/20"
      >
        <Sparkles className="w-4 h-4" />
        <span>{t("moods")}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute bottom-full mb-3 right-0 w-80 max-h-96 overflow-y-auto rounded-2xl bg-slate-900/95 border border-white/[0.08] backdrop-blur-xl shadow-2xl z-50"
            >
              <div className="p-3">
                <div className="flex items-center gap-2 mb-3 px-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-medium text-white/90">{t("selectMood")}</h3>
                </div>
                <div className="space-y-2">
                  {moods.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => handleSelectMood(mood)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl transition-all duration-300 border group",
                        `bg-gradient-to-r ${mood.gradient}`,
                        mood.borderColor,
                        "hover:scale-[1.02]"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/90 mb-1">
                            {t(mood.nameKey)}
                          </p>
                          <p className="text-xs text-white/50">
                            {t(mood.descKey)}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {mood.soundConfigs.map((config) => (
                              <span
                                key={config.id}
                                className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/60 uppercase"
                              >
                                {t(config.id)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}