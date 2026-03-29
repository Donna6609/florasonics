import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { TreePine, Leaf, Flower2, Wind, Droplets, Bird, Check, Star, Sparkles, Brain, WifiOff, Heart, Share2, ExternalLink, ArrowRight, Play } from "lucide-react";

const SOUNDS_PREVIEW = [
  { icon: TreePine, color: "#4ade80", label: "Forest" },
  { icon: Droplets, color: "#22d3ee", label: "Stream" },
  { icon: Wind, color: "#a3e635", label: "Wind" },
  { icon: Bird, color: "#fbbf24", label: "Birds" },
  { icon: Flower2, color: "#86efac", label: "Garden" },
  { icon: Leaf, color: "#34d399", label: "Leaves" },
];

const TESTIMONIALS = [
  { name: "Maya T.", role: "Remote worker", text: "FloraSonics turned my apartment into a forest. I focus so much better now.", stars: 5 },
  { name: "Dr. Sarah K.", role: "Botany Teacher", text: "I play FloraSonics during lab sessions. Students are calmer, more focused — and it ties directly into what we're learning about ecosystems.", stars: 5 },
  { name: "James W.", role: "Botanical Garden Curator", text: "We use it in our visitor wellness center. It creates an immersive sensory experience that perfectly complements our living plant exhibits.", stars: 5 },
  { name: "Carlos R.", role: "Designer", text: "The AI soundscape feature is incredible. I type 'misty bamboo forest at dawn' and it nails the atmosphere every time.", stars: 5 },
  { name: "Priya S.", role: "Student", text: "I use FloraSonics every night to wind down. The breathing exercises paired with forest rain are pure magic.", stars: 5 },
  { name: "Dr. Lena M.", role: "Research Scientist", text: "Long lab sessions used to drain me. Now I run biome-accurate soundscapes while I work — focus and calm at the same time.", stars: 5 },
];

const TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    color: "from-green-950 to-slate-900",
    border: "border-green-900/40",
    features: ["5 nature sounds", "Basic mixing", "Nature journal"],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Basic",
    price: "$2.99",
    period: "/ mo",
    color: "from-green-900 to-emerald-900",
    border: "border-green-500/40",
    features: ["All free + 8 more sounds", "Unlimited presets", "Playback history", "Community presets"],
    cta: "Get Basic",
    highlight: false,
  },
  {
    name: "Premium",
    price: "$7.99",
    period: "/ mo",
    color: "from-emerald-900 to-teal-900",
    border: "border-emerald-400/40",
    features: ["All 15 sounds", "AI soundscape generator", "AI guided meditation", "Unlimited downloads", "Advanced audio effects"],
    cta: "Go Premium",
    highlight: true,
  },
  {
    name: "Pro",
    price: "$13.99",
    period: "/ mo",
    color: "from-purple-900 to-indigo-900",
    border: "border-purple-400/40",
    features: ["Everything in Premium", "Team collaboration", "Biometric integration", "Custom effects"],
    cta: "Go Pro",
    highlight: false,
  },
  {
    name: "Family",
    price: "$22.99",
    period: "/ mo",
    color: "from-pink-900 to-rose-900",
    border: "border-pink-400/40",
    features: ["Everything in Pro", "5 family accounts", "Shared libraries", "Family dashboard"],
    cta: "Go Family",
    highlight: false,
  },
];

export default function Landing() {
  const [activeSound, setActiveSound] = useState(null);

  useEffect(() => {
    document.title = "FloraSonics — Nature Sound Mixer for Focus, Sleep & Calm";
    const setMeta = (name, content, prop = false) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "FloraSonics is a free nature sound mixer for focus, sleep, and relaxation. Layer forest rain, birdsong, streams, and 15+ botanical sounds. AI soundscapes and guided meditation. No download needed.");
    setMeta("og:title", "FloraSonics — Nature Sound Mixer for Focus, Sleep & Calm", true);
    setMeta("og:description", "Layer beautiful nature sounds, guided meditations, and breathing exercises to find focus, relaxation, and better sleep.", true);
    setMeta("og:type", "website", true);
    return () => { document.title = "FloraSonics"; };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSound((prev) => {
        const idx = prev === null ? 0 : (SOUNDS_PREVIEW.findIndex((s) => s.label === prev) + 1) % SOUNDS_PREVIEW.length;
        return SOUNDS_PREVIEW[idx].label;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-green-950/50 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-950/40 blur-[140px]" />
        <div className="absolute top-[40%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-teal-950/30 blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-12 py-5 border-b border-green-900/20">
        <div className="flex items-center gap-2 text-2xl font-light tracking-widest text-white/90">
          <Leaf className="w-6 h-6 text-green-400" />
          <span>FloraSonics</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="#pricing" className="hidden sm:block text-sm text-white/40 hover:text-white/70 transition-colors">Pricing</a>
          <Link
            to={createPageUrl("Home")}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-sm font-medium shadow-lg transition-all"
          >
            Start Free →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-20 pb-16 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
          {/* Social proof badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-white/60 text-sm mb-6">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
            </div>
            Loved by 10,000+ users · teachers · researchers
          </div>

          <h1 className="text-5xl sm:text-7xl font-light tracking-tight text-white/90 mb-6 leading-tight">
            Bring the forest<br />
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              to your ears
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-4 font-light leading-relaxed">
            Layer birdsong, rain, and streams with AI-powered soundscapes and guided meditation. Used by individuals, teachers, botanical gardens, and researchers worldwide.
          </p>
          <p className="text-sm text-white/30 mb-10">Free to start. No download. No credit card.</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={createPageUrl("Home")}
              className="flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold text-lg shadow-2xl shadow-green-900/50 transition-all hover:scale-105"
            >
              <Play className="w-5 h-5" />
              Start Listening Free
            </Link>
            <a href="#pricing" className="flex items-center gap-2 px-8 py-4 rounded-full border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 font-medium transition-all">
              See Plans <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </motion.div>

        {/* Sound Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3 }}
          className="mt-16 flex flex-wrap justify-center gap-4"
        >
          {SOUNDS_PREVIEW.map((s) => {
            const Icon = s.icon;
            const isActive = activeSound === s.label;
            return (
              <motion.div
                key={s.label}
                animate={isActive ? { scale: 1.15, y: -6 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300"
                  style={{
                    background: isActive ? `${s.color}22` : "rgba(255,255,255,0.04)",
                    border: isActive ? `1px solid ${s.color}55` : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: isActive ? `0 0 28px ${s.color}40` : "none",
                  }}
                >
                  <Icon className="w-7 h-7" style={{ color: isActive ? s.color : "rgba(255,255,255,0.3)" }} />
                </div>
                <span className="text-xs" style={{ color: isActive ? s.color : "rgba(255,255,255,0.25)" }}>{s.label}</span>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Who it's for */}
      <section className="relative z-10 px-6 py-12 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { emoji: "🧘", label: "Individuals", desc: "Focus, sleep & calm" },
            { emoji: "🏫", label: "Teachers", desc: "Classroom focus & labs" },
            { emoji: "🌸", label: "Botanical Gardens", desc: "Immersive visitor audio" },
            { emoji: "🔬", label: "Researchers", desc: "Deep-focus environments" },
          ].map((item) => (
            <div key={item.label} className="text-center p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <div className="text-3xl mb-2">{item.emoji}</div>
              <p className="text-white/70 text-sm font-medium">{item.label}</p>
              <p className="text-white/30 text-xs mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Soundscapes Spotlight */}
      <section className="relative z-10 px-6 py-12 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl bg-gradient-to-br from-emerald-950/60 to-teal-950/60 border border-emerald-500/20 p-8 sm:p-12 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-[40%] h-full bg-emerald-500/5 blur-[80px] pointer-events-none" />
          <div className="relative z-10 grid sm:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs font-medium mb-5">
                <Sparkles className="w-3 h-3" /> ✨ Most Loved Feature
              </div>
              <h2 className="text-3xl sm:text-4xl font-light text-white/90 mb-4 leading-tight">
                Describe a mood.<br />
                <span className="text-emerald-400">Hear it in seconds.</span>
              </h2>
              <p className="text-white/50 leading-relaxed mb-6">
                Just type things like <span className="text-emerald-300/80 italic">"cozy cabin in the rain"</span> and FloraSonics instantly blends the perfect nature sound mix — no hunting, no guesswork.
              </p>
              <Link to={createPageUrl("Home")} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all text-sm">
                Try AI Mix Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { prompt: "\"rainy bamboo forest at dusk\"", sounds: ["Rain", "Forest", "Wind"], emoji: "🎋" },
                { prompt: "\"warm fireplace on a snowy night\"", sounds: ["Fireplace", "Wind", "Night"], emoji: "🔥" },
                { prompt: "\"busy Tokyo café in the morning\"", sounds: ["Café", "Rain", "Birds"], emoji: "☕" },
              ].map((example, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center gap-4"
                >
                  <span className="text-2xl">{example.emoji}</span>
                  <div>
                    <p className="text-sm text-white/70 italic mb-1">{example.prompt}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {example.sounds.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature pills */}
      <section className="relative z-10 px-6 py-10 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Brain, color: "text-emerald-400 bg-emerald-500/10", title: "AI Soundscapes", desc: "Describe any mood and get an instant nature mix." },
            { icon: WifiOff, color: "text-sky-400 bg-sky-500/10", title: "Offline Mode", desc: "Download mixes as audio files. Listen anywhere." },
            { icon: Heart, color: "text-rose-400 bg-rose-500/10", title: "Wellness Tools", desc: "Breathing, meditation, Pomodoro — all built in." },
            { icon: Leaf, color: "text-green-400 bg-green-500/10", title: "15+ Sounds", desc: "Forest, rain, birds, streams, fire, café and more." },
          ].map((f, idx) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="p-5 rounded-2xl bg-green-950/20 border border-green-900/30"
              >
                <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white/90 mb-1">{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 px-6 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-light text-white/90 mb-2">Loved by nature seekers — and professionals</h2>
          <p className="text-white/30 text-sm">From remote workers and students to teachers, curators, and scientists.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="p-6 rounded-2xl bg-green-950/20 border border-green-900/30 flex flex-col"
            >
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-white/60 leading-relaxed mb-4 italic flex-1">"{t.text}"</p>
              <div>
                <p className="text-white/70 text-sm font-medium">{t.name}</p>
                <p className="text-white/30 text-xs">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Professional Use Cases */}
      <section className="relative z-10 px-6 py-12 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl bg-gradient-to-br from-green-950/60 to-emerald-950/40 border border-green-500/20 p-8 sm:p-12"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-300 text-sm mb-4">
              🌿 For Professionals & Institutions
            </div>
            <h2 className="text-3xl font-light text-white/90 mb-2">Built for the botanical world</h2>
            <p className="text-white/40 max-w-xl mx-auto text-sm">Beyond personal wellness — a powerful tool for educators, researchers, and botanical institutions.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                emoji: "🏫",
                title: "Teachers & Educators",
                accent: "text-yellow-300",
                border: "border-yellow-500/20 bg-yellow-500/5",
                points: ["Focus soundscapes for biology & botany labs", "Calmer classrooms, better learning outcomes", "Immersive audio for nature-themed lessons", "Built-in Pomodoro for structured sessions"],
              },
              {
                emoji: "🌸",
                title: "Botanical Gardens",
                accent: "text-emerald-300",
                border: "border-emerald-500/20 bg-emerald-500/5",
                points: ["Immersive audio for exhibits & greenhouses", "Curated soundscapes matched to plant biomes", "Visitor wellness zones with guided meditation", "Sensory experiences that complement living plants"],
              },
              {
                emoji: "🔬",
                title: "Botany & Research",
                accent: "text-teal-300",
                border: "border-teal-500/20 bg-teal-500/5",
                points: ["Deep-focus audio for long lab sessions", "Biome-accurate ambient environments", "AI soundscapes by ecosystem type", "Stress reduction during intensive fieldwork"],
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.12 }}
                className={`p-6 rounded-2xl border ${item.border}`}
              >
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className={`text-base font-semibold mb-4 ${item.accent}`}>{item.title}</h3>
                <ul className="space-y-2">
                  {item.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/55">
                      <Check className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to={createPageUrl("CorporateWellness")}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium transition-all shadow-lg"
            >
              Explore Team Plans <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Use Cases */}
      <section className="relative z-10 px-6 py-12 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-light text-white/90 mb-2">Rooted in what you need</h2>
          <p className="text-white/40 text-sm">Whether you seek focus, sleep, or a moment of stillness.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { emoji: "🌿", title: "Focus & ADHD", desc: "Consistent nature sounds mask distractions and keep you in flow. Forest rain and birdsong are favorites in the focus community." },
            { emoji: "🌙", title: "Better Sleep", desc: "Layer night crickets, gentle rain, and a soft stream. Fall asleep faster, wake up refreshed." },
            { emoji: "🌱", title: "Deep Work & Study", desc: "Pomodoro timer + nature audio = serious focus. Used by students, writers, and remote workers worldwide." },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 rounded-2xl bg-green-950/20 border border-green-900/30 text-center"
            >
              <div className="text-4xl mb-3">{item.emoji}</div>
              <h3 className="text-base font-semibold text-white/90 mb-2">{item.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 px-6 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-light text-white/90 mb-3">Simple, transparent pricing</h2>
          <p className="text-white/40">Plant your roots for free. Grow when you're ready.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 items-start">
          {TIERS.map((tier, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className={`relative p-4 rounded-2xl bg-gradient-to-b ${tier.color} border ${tier.border} ${tier.highlight ? "ring-1 ring-emerald-400/40 shadow-2xl shadow-emerald-900/30" : ""}`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full text-xs font-medium text-white whitespace-nowrap">
                  Best Value
                </div>
              )}
              <div className="mb-5">
                <h3 className="text-base font-semibold text-white/90 mb-1">{tier.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-light text-white">{tier.price}</span>
                  <span className="text-white/40 text-xs">{tier.period}</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-white/60">
                    <Check className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to={createPageUrl("Home")}
                className={`block text-center px-4 py-2.5 rounded-xl font-medium transition-all text-sm ${
                  tier.highlight
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg"
                    : "bg-white/10 hover:bg-green-900/30 text-white/70 hover:text-white border border-green-900/30"
                }`}
              >
                {tier.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 py-24 text-center max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-5xl mb-6">🌿</div>
          <h2 className="text-4xl font-light text-white/90 mb-3">Ready to grow into calm?</h2>
          <p className="text-white/35 mb-8">No downloads. No sign-up required. Just press play and let nature in.</p>
          <Link
            to={createPageUrl("Home")}
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold text-lg shadow-2xl shadow-green-900/50 transition-all hover:scale-105"
          >
            <Play className="w-5 h-5" />
            Start Listening Free
          </Link>
          <p className="text-white/20 text-xs mt-4">Free forever. Upgrade anytime.</p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-green-900/20 px-6 py-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Leaf className="w-5 h-5 text-green-400" />
          <span className="text-white/60 font-light tracking-widest">FloraSonics</span>
        </div>
        <p className="text-white/20 text-sm">© 2026 FloraSonics. Bringing nature to your ears.</p>
      </footer>
    </div>
  );
}