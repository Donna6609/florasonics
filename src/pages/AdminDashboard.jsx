import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, AlertCircle, Music2, ExternalLink, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  // Verify admin access
  useEffect(() => {
    const checkAdmin = async () => {
      const user = await base44.auth.me();
      if (user?.role !== "admin") {
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
      }
    };
    checkAdmin();
  }, []);

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => base44.asServiceRole.entities.Subscription.list(),
    enabled: isAdmin,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.asServiceRole.entities.User.list(),
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <p>Admin access required</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter(s => s.status === "active");
  const tierBreakdown = subscriptions.reduce((acc, s) => {
    acc[s.tier] = (acc[s.tier] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <Button onClick={() => navigate(createPageUrl("Analytics"))} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700">
            <BarChart2 className="w-4 h-4" />
            Analytics
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4" /> Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{users.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Active Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{activeSubscriptions.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Subscription Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {users.length > 0 ? Math.round((activeSubscriptions.length / users.length) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tier Breakdown */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Subscription Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(tierBreakdown).map(([tier, count]) => (
                <div key={tier} className="p-4 bg-slate-700/50 rounded-lg">
                  <div className="text-sm text-slate-400 capitalize">{tier}</div>
                  <div className="text-2xl font-bold text-white">{count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* TikTok Marketing */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Music2 className="w-5 h-5 text-pink-400" /> TikTok Marketing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="https://www.tiktok.com/@florasonics"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-pink-900/20 border border-pink-500/20 rounded-xl hover:bg-pink-900/30 transition-all"
              >
                <div>
                  <p className="text-pink-300 font-medium text-sm">Your TikTok Profile</p>
                  <p className="text-slate-400 text-xs mt-0.5">@florasonics</p>
                </div>
                <ExternalLink className="w-4 h-4 text-pink-400" />
              </a>
              <a
                href="https://www.tiktok.com/upload"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 bg-pink-900/20 border border-pink-500/20 rounded-xl hover:bg-pink-900/30 transition-all"
              >
                <div>
                  <p className="text-pink-300 font-medium text-sm">Upload a Video</p>
                  <p className="text-slate-400 text-xs mt-0.5">Post your soundscape</p>
                </div>
                <ExternalLink className="w-4 h-4 text-pink-400" />
              </a>
              <div className="p-4 bg-slate-700/40 border border-slate-600/40 rounded-xl">
                <p className="text-slate-300 font-medium text-sm mb-2">Suggested Hashtags</p>
                <div className="flex flex-wrap gap-1">
                  {["#FloraSonics", "#StudyWithMe", "#NatureSounds", "#FocusMusic", "#ADHD"].map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300 text-xs border border-pink-500/20">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">All Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Email</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Tier</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Period End</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                      <td className="py-3 px-4 text-slate-300">{sub.created_by}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="capitalize">
                          {sub.tier}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            sub.status === "active"
                              ? "bg-emerald-600 text-white"
                              : "bg-red-600 text-white"
                          }
                        >
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {sub.current_period_end
                          ? format(new Date(sub.current_period_end), "MMM d, yyyy")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}