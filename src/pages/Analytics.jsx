import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePullToRefresh } from "@/components/usePullToRefresh";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, Users, Music, Clock, Radio, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { createPageUrl } from "@/utils";

const COLORS = ["#60a5fa", "#a78bfa", "#fb923c", "#34d399", "#f472b6", "#fbbf24"];

export default function Analytics() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [allActivities, setAllActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [excludeAdmin, setExcludeAdmin] = useState(true);

  useEffect(() => {
    base44.auth.me().then((user) => {
      if (user?.role !== "admin") {
        navigate(createPageUrl("Home"));
      } else {
        setCurrentUser(user);
      }
    }).catch(() => navigate(createPageUrl("Home")));
  }, [navigate]);

  // Load initial data + subscribe to real-time updates
  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") return;

    base44.asServiceRole.entities.ActivityTracking.list("-created_date", 10000)
      .then((data) => { setAllActivities(data); setIsLoading(false); });

    const unsubscribe = base44.asServiceRole.entities.ActivityTracking.subscribe((event) => {
      if (event.type === "create") {
        setAllActivities((prev) => [event.data, ...prev]);
      } else if (event.type === "update") {
        setAllActivities((prev) => prev.map((a) => a.id === event.id ? event.data : a));
      } else if (event.type === "delete") {
        setAllActivities((prev) => prev.filter((a) => a.id !== event.id));
      }
    });

    return unsubscribe;
  }, [currentUser]);

  const activities = excludeAdmin
    ? allActivities.filter((a) => a.created_by !== currentUser?.email)
    : allActivities;

  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => base44.asServiceRole.entities.User.list(),
    initialData: [],
    enabled: currentUser?.role === "admin",
  });

  const refreshAll = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["all-users"] }),
      base44.asServiceRole.entities.ActivityTracking.list("-created_date", 10000).then(setAllActivities),
    ]);
  }, [queryClient]);

  const { PullIndicator, handlers: pullHandlers } = usePullToRefresh(refreshAll);

  if (!currentUser || currentUser.role !== "admin") {
    return null;
  }

  // Live visitors: unique session_ids with a heartbeat in the last 2 minutes (heartbeat fires every 30s)
  const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
  const liveVisitors = new Set(
    activities
      .filter((a) => {
        if (a.event_type !== "heartbeat") return false;
        const ts = a.event_data?.timestamp || a.created_date;
        return ts && new Date(ts).getTime() > twoMinutesAgo;
      })
      .map((a) => a.session_id)
  ).size;

  // Calculate metrics
  const soundPlayEvents = activities.filter((a) => a.event_type === "sound_played");
  const presetSavedEvents = activities.filter((a) => a.event_type === "preset_saved");
  const meditationSessions = activities.filter((a) => a.event_type === "meditation_session");
  const breathingSessions = activities.filter((a) => a.event_type === "breathing_session");
  const pomodoroSessions = activities.filter((a) => a.event_type === "pomodoro_session");
  const sessionStarts = activities.filter((a) => a.event_type === "session_start");

  // Most played sounds
  const soundFrequency = {};
  soundPlayEvents.forEach((event) => {
    const soundName = event.event_data?.sound_name || "Unknown";
    soundFrequency[soundName] = (soundFrequency[soundName] || 0) + 1;
  });

  const topSounds = Object.entries(soundFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // Average session duration
  const sessionEndEvents = activities.filter((a) => a.event_type === "session_end");
  const avgSessionDuration = sessionEndEvents.length > 0
    ? Math.floor(sessionEndEvents.reduce((sum, e) => sum + (e.duration_seconds || 0), 0) / sessionEndEvents.length / 60)
    : 0;

  // Total listening time
  const totalListeningTime = Math.floor(
    soundPlayEvents.reduce((sum, e) => sum + (e.duration_seconds || 0), 0) / 3600
  );

  // Feature usage breakdown
  const featureUsage = [
    { name: "Meditation", value: meditationSessions.length },
    { name: "Breathing", value: breathingSessions.length },
    { name: "Pomodoro", value: pomodoroSessions.length },
    { name: "Sound Mixing", value: soundPlayEvents.length },
    { name: "Presets", value: presetSavedEvents.length },
  ].filter((f) => f.value > 0);

  // Activity over time (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split("T")[0];
  });

  const activityByDay = last7Days.map((date) => {
    const dayActivities = activities.filter((a) => a.created_date?.startsWith(date));
    return {
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      activities: dayActivities.length,
    };
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-white/40">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6" {...pullHandlers}>
      <PullIndicator />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Home"))}
            className="text-white/70 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-light tracking-tight text-white/90">Analytics Dashboard</h1>
            <p className="text-white/40 text-sm">Track user engagement and app usage</p>
          </div>
          <button
            onClick={() => setExcludeAdmin((v) => !v)}
            aria-label={excludeAdmin ? "Currently excluding your activity — click to include" : "Currently including your activity — click to exclude"}
            aria-pressed={excludeAdmin}
            className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all min-h-[44px] ${
              excludeAdmin
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                : "bg-white/[0.06] border-white/[0.08] text-white/50"
            }`}
          >
            <EyeOff className="w-4 h-4" />
            {excludeAdmin ? "Excluding your activity" : "Including your activity"}
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className="bg-emerald-500/10 border-emerald-500/30 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-emerald-300">Live Visitors</CardTitle>
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-400">{liveVisitors}</div>
                <p className="text-xs text-white/40 mt-1">Active in last 2 min</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/[0.04] border-white/[0.08] backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Total Users</CardTitle>
                <Users className="w-4 h-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{users.length}</div>
                <p className="text-xs text-white/40 mt-1">Registered accounts</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/[0.04] border-white/[0.08] backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Active Sessions</CardTitle>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{sessionStarts.length}</div>
                <p className="text-xs text-white/40 mt-1">Total sessions started</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/[0.04] border-white/[0.08] backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Avg Session</CardTitle>
                <Clock className="w-4 h-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{avgSessionDuration}m</div>
                <p className="text-xs text-white/40 mt-1">Average duration</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white/[0.04] border-white/[0.08] backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Listening Time</CardTitle>
                <Music className="w-4 h-4 text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{totalListeningTime}h</div>
                <p className="text-xs text-white/40 mt-1">Total hours</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Played Sounds */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-white/[0.04] border-white/[0.08] backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white/90">Most Played Sounds</CardTitle>
                <CardDescription className="text-white/40">Top sounds by play count</CardDescription>
              </CardHeader>
              <CardContent>
                {topSounds.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topSounds}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" />
                      <YAxis stroke="rgba(255,255,255,0.4)" />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(15, 23, 42, 0.95)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          color: "white",
                        }}
                      />
                      <Bar dataKey="count" fill="#60a5fa" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-white/40">
                    No sound play data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Feature Usage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-white/[0.04] border-white/[0.08] backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white/90">Feature Usage</CardTitle>
                <CardDescription className="text-white/40">Distribution of app features used</CardDescription>
              </CardHeader>
              <CardContent>
                {featureUsage.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={featureUsage}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {featureUsage.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "rgba(15, 23, 42, 0.95)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "8px",
                          color: "white",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-white/40">
                    No feature usage data yet
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Over Time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white/[0.04] border-white/[0.08] backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white/90">Activity Over Time</CardTitle>
                <CardDescription className="text-white/40">Last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={activityByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" />
                    <YAxis stroke="rgba(255,255,255,0.4)" />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15, 23, 42, 0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        color: "white",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="activities"
                      stroke="#a78bfa"
                      strokeWidth={2}
                      dot={{ fill: "#a78bfa", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white/[0.04] border-white/[0.08] backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white/90">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{meditationSessions.length}</div>
                    <div className="text-xs text-white/60 mt-1">Meditation Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{breathingSessions.length}</div>
                    <div className="text-xs text-white/60 mt-1">Breathing Exercises</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">{pomodoroSessions.length}</div>
                    <div className="text-xs text-white/60 mt-1">Pomodoro Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-400">{presetSavedEvents.length}</div>
                    <div className="text-xs text-white/60 mt-1">Presets Saved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-400">{soundPlayEvents.length}</div>
                    <div className="text-xs text-white/60 mt-1">Sound Plays</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}