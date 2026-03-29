import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Watch, X, Link, Unlink, RefreshCw, Activity, Heart, Moon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const WEARABLE_TYPES = [
  { 
    id: "apple_watch", 
    name: "Apple Watch", 
    icon: "⌚", 
    color: "text-gray-400",
    permissions: ["heart_rate", "sleep", "activity", "hrv"]
  },
  { 
    id: "fitbit", 
    name: "Fitbit", 
    icon: "📊", 
    color: "text-teal-400",
    permissions: ["heart_rate", "sleep", "activity", "stress"]
  },
  { 
    id: "garmin", 
    name: "Garmin", 
    icon: "🏃", 
    color: "text-blue-400",
    permissions: ["heart_rate", "sleep", "activity", "hrv", "stress"]
  },
];

export default function WearableConnections() {
  const [isOpen, setIsOpen] = useState(false);
  const [showConnectFlow, setShowConnectFlow] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const queryClient = useQueryClient();

  const { data: connections = [] } = useQuery({
    queryKey: ["wearableConnections"],
    queryFn: () => base44.entities.WearableConnection.list("-created_date"),
    initialData: [],
  });

  const { data: biometricData = [] } = useQuery({
    queryKey: ["biometricData"],
    queryFn: () => base44.entities.BiometricData.list("-created_date", 100),
    initialData: [],
  });

  const connectDeviceMutation = useMutation({
    mutationFn: (data) => base44.entities.WearableConnection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wearableConnections"] });
      toast.success("Device connected successfully");
      setShowConnectFlow(false);
      setSelectedDevice(null);
    },
  });

  const disconnectDeviceMutation = useMutation({
    mutationFn: (id) => base44.entities.WearableConnection.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wearableConnections"] });
      toast.success("Device disconnected");
    },
  });

  const syncDeviceMutation = useMutation({
    mutationFn: async (connection) => {
      // Simulate syncing - in production this would call backend API
      await new Promise(resolve => setTimeout(resolve, 1500));
      return base44.entities.WearableConnection.update(connection.id, {
        ...connection,
        last_sync: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wearableConnections"] });
      toast.success("Data synced successfully");
    },
  });

  const handleConnect = () => {
    if (!selectedDevice) return;

    const deviceType = WEARABLE_TYPES.find(d => d.id === selectedDevice);
    
    // In production, this would initiate OAuth flow
    // For now, we'll simulate the connection
    connectDeviceMutation.mutate({
      device_type: selectedDevice,
      device_name: deviceType.name,
      connection_status: "connected",
      last_sync: new Date().toISOString(),
      permissions: deviceType.permissions,
    });
  };

  const getLatestMetric = (type) => {
    const data = biometricData.filter(d => d.data_type === type);
    return data.length > 0 ? data[0] : null;
  };

  const latestHeartRate = getLatestMetric("heart_rate");
  const latestSleep = getLatestMetric("sleep");
  const latestActivity = getLatestMetric("activity");

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 border backdrop-blur-xl text-sm font-medium",
          connections.length > 0
            ? "bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border-blue-500/20 text-blue-300 hover:bg-blue-600/20"
            : "bg-white/[0.06] border-white/[0.08] text-white/50 hover:text-white/70 hover:bg-white/[0.1]"
        )}
      >
        <Watch className="w-4 h-4" />
        <span>Wearables</span>
        {connections.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-xs text-blue-300">
            {connections.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-slate-900/95 border border-white/[0.08] rounded-3xl p-8 backdrop-blur-xl max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] transition-all"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Watch className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-light text-white/90">Wearable Devices</h2>
                  <p className="text-sm text-white/50">Connect your health devices</p>
                </div>
              </div>

              {/* Health Metrics Summary */}
              {connections.length > 0 && biometricData.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500/10 to-pink-500/10 border border-red-500/20">
                    <Heart className="w-5 h-5 text-red-400 mb-2" />
                    <p className="text-xs text-white/50">Heart Rate</p>
                    <p className="text-2xl font-light text-white/90">
                      {latestHeartRate?.value || "--"}
                    </p>
                    {latestHeartRate && <p className="text-xs text-white/40">bpm</p>}
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                    <Moon className="w-5 h-5 text-indigo-400 mb-2" />
                    <p className="text-xs text-white/50">Sleep</p>
                    <p className="text-2xl font-light text-white/90">
                      {latestSleep?.value || "--"}
                    </p>
                    {latestSleep && <p className="text-xs text-white/40">hours</p>}
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    <Activity className="w-5 h-5 text-green-400 mb-2" />
                    <p className="text-xs text-white/50">Activity</p>
                    <p className="text-2xl font-light text-white/90">
                      {latestActivity?.value || "--"}
                    </p>
                    {latestActivity && <p className="text-xs text-white/40">steps</p>}
                  </div>
                </div>
              )}

              {!showConnectFlow ? (
                <>
                  {/* Connected Devices */}
                  {connections.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm text-white/50 mb-3">Connected Devices</h3>
                      <div className="space-y-3">
                        {connections.map((connection) => {
                          const deviceType = WEARABLE_TYPES.find(d => d.id === connection.device_type);
                          return (
                            <div
                              key={connection.id}
                              className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{deviceType?.icon}</span>
                                <div>
                                  <p className="text-white/90 font-medium">{connection.device_name}</p>
                                  <p className="text-xs text-white/50">
                                    Last synced: {new Date(connection.last_sync).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => syncDeviceMutation.mutate(connection)}
                                  disabled={syncDeviceMutation.isPending}
                                  className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition-all disabled:opacity-50"
                                >
                                  <RefreshCw className={cn(
                                    "w-4 h-4",
                                    syncDeviceMutation.isPending && "animate-spin"
                                  )} />
                                </button>
                                <button
                                  onClick={() => disconnectDeviceMutation.mutate(connection.id)}
                                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-all"
                                >
                                  <Unlink className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setShowConnectFlow(true)}
                    className="w-full px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Link className="w-4 h-4" />
                    Connect New Device
                  </button>

                  {connections.length === 0 && (
                    <p className="text-center text-xs text-white/40 mt-4">
                      Note: Backend functions required for OAuth integration
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-sm text-white/70 mb-3">Choose a device</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {WEARABLE_TYPES.map((device) => (
                        <button
                          key={device.id}
                          onClick={() => setSelectedDevice(device.id)}
                          className={cn(
                            "text-left p-4 rounded-2xl border transition-all",
                            selectedDevice === device.id
                              ? "bg-blue-500/20 border-blue-500/30"
                              : "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08]"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{device.icon}</span>
                            <div className="flex-1">
                              <p className={cn(
                                "font-medium mb-1",
                                selectedDevice === device.id ? "text-white/90" : "text-white/60"
                              )}>
                                {device.name}
                              </p>
                              <p className="text-xs text-white/40">
                                {device.permissions.join(", ")}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowConnectFlow(false);
                        setSelectedDevice(null);
                      }}
                      className="flex-1 px-4 py-3 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConnect}
                      disabled={!selectedDevice || connectDeviceMutation.isPending}
                      className="flex-1 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {connectDeviceMutation.isPending ? "Connecting..." : "Connect Device"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}