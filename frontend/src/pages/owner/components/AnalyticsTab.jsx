import React from "react";
import { Loader2 } from "lucide-react";

export default function AnalyticsTab({ loading, analyticsData }) {
  return (
    <div className="bg-charcoal-light/30 border border-white/5 backdrop-blur-sm rounded-3xl p-6 space-y-6 shadow-soft font-sans">
      <div className="space-y-1">
        <h3 className="font-serif font-bold text-xl text-gray-100 tracking-tight">Business Analytics & Metrics</h3>
        <p className="text-xs text-gray-400">Real-time indicators of salon performance and booking statistics</p>
      </div>

      {loading || !analyticsData ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
          <span className="text-gray-400 text-sm font-medium">Computing analytics reports...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-charcoal-deep/60 border border-white/5 p-5 rounded-2xl space-y-1 shadow-inner">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Total Bookings</span>
              <p className="text-2xl font-bold text-gray-100">{analyticsData.total_bookings}</p>
            </div>
            <div className="bg-charcoal-deep/60 border border-gold/10 p-5 rounded-2xl space-y-1 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gold/5 rounded-bl-full" />
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Total Revenue</span>
              <p className="text-2xl font-bold text-gold">₹{analyticsData.total_revenue}</p>
            </div>
            <div className="bg-charcoal-deep/60 border border-white/5 p-5 rounded-2xl space-y-1 shadow-inner">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">No-Show Rate</span>
              <p className="text-2xl font-bold text-yellow-400">{analyticsData.no_show_rate}%</p>
            </div>
            <div className="bg-charcoal-deep/60 border border-white/5 p-5 rounded-2xl space-y-1 shadow-inner">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Avg Checkout Time</span>
              <p className="text-2xl font-bold text-blue-400">
                {analyticsData.average_completion_time_seconds > 0 
                  ? `${analyticsData.average_completion_time_seconds}s` 
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Status and Category Split Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Appointment Status Splits */}
            <div className="bg-charcoal-deep/60 border border-white/5 p-6 rounded-2xl space-y-5">
              <h4 className="font-semibold text-sm text-gray-100 border-b border-white/10 pb-3 uppercase tracking-wider">Status Breakdown</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>Completed</span>
                    <span className="font-bold text-gray-200">{analyticsData.completed_bookings}</span>
                  </div>
                  <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="bg-green-500 h-full rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" 
                      style={{ width: `${analyticsData.total_bookings > 0 ? (analyticsData.completed_bookings / analyticsData.total_bookings) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>Cancelled</span>
                    <span className="font-bold text-gray-200">{analyticsData.cancelled_bookings}</span>
                  </div>
                  <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="bg-red-500 h-full rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
                      style={{ width: `${analyticsData.total_bookings > 0 ? (analyticsData.cancelled_bookings / analyticsData.total_bookings) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>No-Shows</span>
                    <span className="font-bold text-gray-200">{analyticsData.no_shows}</span>
                  </div>
                  <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="bg-yellow-500 h-full rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]" 
                      style={{ width: `${analyticsData.total_bookings > 0 ? (analyticsData.no_shows / analyticsData.total_bookings) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Gender Category Split */}
            <div className="bg-charcoal-deep/60 border border-white/5 p-6 rounded-2xl space-y-5">
              <h4 className="font-semibold text-sm text-gray-100 border-b border-white/10 pb-3 uppercase tracking-wider">Category Split (Men vs Women)</h4>
              
              {analyticsData.category_split && (
                <div className="space-y-5 flex flex-col justify-center h-full">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500 block shadow-[0_0_8px_rgba(59,130,246,0.6)]" /> Men's ({analyticsData.category_split.male})</span>
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-pink-500 block shadow-[0_0_8px_rgba(236,72,153,0.6)]" /> Women's ({analyticsData.category_split.female})</span>
                  </div>
                  <div className="w-full bg-white/5 h-5 rounded-full overflow-hidden flex shadow-inner">
                    <div 
                      className="bg-blue-500 h-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                      style={{ 
                        width: `${
                          (analyticsData.category_split.male + analyticsData.category_split.female) > 0 
                            ? (analyticsData.category_split.male / (analyticsData.category_split.male + analyticsData.category_split.female)) * 100 
                            : 50
                        }%` 
                      }} 
                    />
                    <div 
                      className="bg-pink-500 h-full shadow-[0_0_10px_rgba(236,72,153,0.5)]" 
                      style={{ 
                        width: `${
                          (analyticsData.category_split.male + analyticsData.category_split.female) > 0 
                            ? (analyticsData.category_split.female / (analyticsData.category_split.male + analyticsData.category_split.female)) * 100 
                            : 50
                        }%` 
                      }} 
                    />
                  </div>
                  <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest font-semibold">Based on category tags of booked services</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
