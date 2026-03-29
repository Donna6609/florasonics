import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, CheckCheck, ChevronDown, ChevronUp } from "lucide-react";

const POSTS = [
  {
    subreddit: "r/ADHD",
    title: "Found a free browser tool that actually helps me focus — no downloads needed",
    body: `Hey everyone,

I know we all struggle with background noise and focus. I've been using this ambient sound mixer called **FloraSonics** and it's genuinely helped me.

What makes it different for ADHD brains:
- You can layer sounds (rain + café noise + fan = chef's kiss for focus)
- Built-in Pomodoro timer so you stay on task
- AI generates a custom soundscape just from a description like "cozy library during a storm"
- No app download, runs straight in your browser

It has a free tier with enough sounds to get started. Honestly the Pomodoro + rain combo changed my WFH life.

Link: https://floratsonics.base44.app

Anyone else have sound combos that work for them? Would love to hear what works for your brain 🧠`,
  },
  {
    subreddit: "r/sleep",
    title: "This ambient sound mixer helped me finally fall asleep consistently (free)",
    body: `Hey r/sleep,

Long-time lurker, first time posting. I struggled with sleep onset for years and tried everything. What actually worked for me was layering specific ambient sounds.

I use **FloraSonics** — it's a free browser app that lets you mix sounds like ocean, rain, night crickets, and fan noise simultaneously, with individual volume controls.

My current sleep combo: Ocean (60%) + Fan (40%) + Night (30%)

It also has:
- Breathing exercises for pre-sleep wind-down
- Guided meditation to quiet racing thoughts
- You can save and download your custom mixes

No account needed to start, totally free for the basics.

Link: https://floraonics.base44.app

What sound combos do you use for sleep? Always looking to experiment 🌙`,
  },
  {
    subreddit: "r/productivity",
    title: "I built a free nature sound mixer with AI + Pomodoro — would love your feedback",
    body: `Hey r/productivity,

I've been building **FloraSonics**, a web app for nature-inspired ambient soundscapes designed to improve focus and relaxation.

Key features:
- Mix 15+ nature sounds (rain, forest, ocean, birdsong, fire, etc.)
- AI soundscape generator — describe an atmosphere, it mixes it for you
- Built-in Pomodoro timer, breathing exercises, and guided meditation
- Save and download your mixes as audio files
- Works in browser, no install needed

Free tier is genuinely useful. Premium adds AI features and more sounds.

I'd love feedback from this community — what would make a focus tool like this actually useful for your workflow?

Link: https://floratsonics.base44.app`,
  },
  {
    subreddit: "r/weddingplanning",
    title: "Used a nature sound mixer for our ceremony background ambience — worked perfectly",
    body: `Hey everyone!

Our outdoor ceremony had some unexpected wind noise so I used **FloraSonics** to add a subtle ambient layer — gentle forest sounds and birdsong playing quietly in the background. Guests kept asking what it was!

It's a free browser app, no download needed. You can layer multiple nature sounds and control the volume of each one.

Super useful for events, studying, or just relaxing at home.

Link: https://floratonics.base44.app`,
  },
  {
    subreddit: "r/meditation",
    title: "This free app pairs nature sounds with guided breathing — it's become part of my daily practice",
    body: `Hey r/meditation,

Wanted to share something I've been using daily for the past few months: **FloraSonics**.

It combines:
- Layered nature sounds (forest rain, birdsong, streams, wind)
- Built-in breathing exercises with visual guides
- AI-generated soundscapes — you describe a mood and it builds the atmosphere
- Guided meditation sessions

It's free to start and runs entirely in the browser. The combination of sound layering + guided breathing has really deepened my practice.

Link: https://floratonics.base44.app

Anyone else use ambient sounds during meditation? What combinations work for you? 🌿`,
  },
];

export default function RedditTemplates() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(null);

  const handleCopy = (idx, text) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section className="relative z-10 px-6 py-20 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300 text-sm mb-4">
          🚀 Free Marketing Templates
        </div>
        <h2 className="text-3xl sm:text-4xl font-light text-white/90 mb-3">Ready-to-post Reddit templates</h2>
        <p className="text-white/40 text-base max-w-xl mx-auto">
          Copy these posts to r/ADHD, r/sleep, and r/productivity to drive your first wave of users. Just replace the link with your app URL.
        </p>
        <button
          onClick={() => setOpen(!open)}
          className="mt-6 flex items-center gap-2 mx-auto px-6 py-3 rounded-full bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-300 text-sm font-medium transition-all"
        >
          {open ? "Hide Templates" : "Show Reddit Templates"}
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6 overflow-hidden"
          >
            {POSTS.map((post, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <span className="text-orange-400 font-medium text-sm">{post.subreddit}</span>
                  <button
                    onClick={() => handleCopy(idx, `Title: ${post.title}\n\n${post.body}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white/60 hover:text-white text-xs transition-all border border-white/[0.07]"
                  >
                    {copied === idx ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === idx ? "Copied!" : "Copy Post"}
                  </button>
                </div>
                <p className="text-white/80 text-sm font-medium mb-3">📌 {post.title}</p>
                <pre className="text-white/40 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                  {post.body}
                </pre>
              </div>
            ))}

            <div className="p-5 rounded-2xl bg-blue-950/30 border border-blue-500/20 text-sm text-blue-300/80">
              <p className="font-medium text-blue-300 mb-1">💡 Tips for posting</p>
              <ul className="space-y-1 text-blue-300/60 list-disc list-inside">
                <li>Replace the URL placeholder with your actual FloraSonics URL before posting</li>
                <li>Wait a few days between posts so they don't look spammy</li>
                <li>Engage genuinely in the comments — it builds trust</li>
                <li>Post on weekdays between 9am–12pm for best visibility</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}