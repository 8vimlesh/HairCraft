import React from "react";
import { List, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Check, User, X, Loader2 } from "lucide-react";

export default function AppointmentsTab({
  loading,
  viewMode,
  setViewMode,
  calendarDate,
  changeMonth,
  calendarData,
  selectedCalendarDateStr,
  setSelectedCalendarDateStr,
  filteredBookingsList,
  services,
  handleUpdateStatus,
  handleOpenReschedule
}) {
  return (
    <div className="bg-charcoal-light/30 border border-white/5 backdrop-blur-sm rounded-3xl p-6 space-y-6">
      {/* View Mode Toggle & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h3 className="font-serif font-bold text-xl text-gray-100 tracking-tight">Appointments Log</h3>
          <p className="text-xs text-gray-400 font-sans">
            {selectedCalendarDateStr 
              ? `Showing bookings for date: ${selectedCalendarDateStr}` 
              : "Showing all salon bookings"}
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-charcoal-deep/80 border border-white/5 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 font-sans w-1/2 sm:w-auto ${
              viewMode === "list"
                ? "bg-gold text-white shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                : "text-gray-400 hover:text-gold"
            }`}
          >
            <List className="w-3.5 h-3.5" /> List View
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 font-sans w-1/2 sm:w-auto ${
              viewMode === "calendar"
                ? "bg-gold text-white shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                : "text-gray-400 hover:text-gold"
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" /> Calendar View
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
          <span className="text-gray-400 text-sm font-medium font-sans">Fetching salon schedule...</span>
        </div>
      ) : (
        <>
          {/* Calendar View */}
          {viewMode === "calendar" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-charcoal-deep/60 border border-white/5 px-4 py-3 rounded-2xl">
                <button 
                  onClick={() => changeMonth(-1)}
                  className="p-1.5 border border-white/10 hover:border-gold/30 rounded-xl hover:text-gold text-gray-300 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h4 className="font-bold text-sm uppercase tracking-widest text-gold font-sans">
                  {calendarDate.toLocaleString("en-US", { month: "long", year: "numeric" })}
                </h4>
                <button 
                  onClick={() => changeMonth(1)}
                  className="p-1.5 border border-white/10 hover:border-gold/30 rounded-xl hover:text-gold text-gray-300 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 border border-white/5 p-1 rounded-2xl overflow-hidden bg-charcoal-deep/40">
                {calendarData.weekdays.map(d => (
                  <div key={d} className="text-center py-2 text-[10px] uppercase font-bold text-gray-500 border-b border-white/5 bg-charcoal-deep/60 font-sans">
                    {d}
                  </div>
                ))}
                {calendarData.cells}
              </div>
              
              {selectedCalendarDateStr && (
                <div className="flex justify-between items-center bg-gold/10 border border-gold/20 px-4 py-3 rounded-xl text-xs font-sans">
                  <span className="text-gray-300">Filtering calendar: <strong className="text-white">{selectedCalendarDateStr}</strong></span>
                  <button 
                    onClick={() => setSelectedCalendarDateStr("")}
                    className="text-gold font-bold hover:underline"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>
          )}

          {/* List View */}
          {filteredBookingsList.length === 0 ? (
            <div className="text-center py-16 text-gray-500 border border-dashed border-white/10 rounded-2xl font-sans">
              No appointments recorded for this schedule layout.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/5 bg-charcoal-deep/30">
              <table className="w-full text-left border-collapse min-w-[700px] font-sans">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-[10px] font-semibold uppercase tracking-widest bg-charcoal-deep/50">
                    <th className="py-4 px-5">Schedule</th>
                    <th className="py-4 px-5">Client Details</th>
                    <th className="py-4 px-5">Reserved Slots</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredBookingsList.map((booking) => {
                    const service = services.find(s => s._id === booking.service_id);
                    return (
                      <tr key={booking._id} className="hover:bg-white/5 transition-colors text-sm text-gray-300">
                        <td className="py-4 px-5">
                          <span className="font-semibold text-gray-100 block">{booking.date}</span>
                          <span className="text-xs text-gold font-medium mt-1 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> {booking.time_slot}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="font-semibold text-gray-100 block">{booking.customer_name}</span>
                          <span className="text-xs text-gray-400 font-medium block mt-0.5 tracking-wide">{booking.mobile_number}</span>
                          {booking.notes && <span className="text-[11px] text-gray-500 italic block mt-1">Notes: "{booking.notes}"</span>}
                        </td>
                        <td className="py-4 px-5 font-mono text-xs">
                          <p className="font-medium text-gray-200">{service?.name || "Service"}</p>
                          <span className="text-gray-500 text-[10px]">({booking.slots_reserved?.join(", ")})</span>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] uppercase font-bold tracking-widest ${
                            booking.status === "confirmed" 
                              ? "bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                              : booking.status === "rescheduled"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : booking.status === "completed"
                                  ? "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                                  : booking.status === "no_show"
                                    ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            {booking.status === "no_show" ? "No Show" : booking.status}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex gap-2 justify-end">
                            {booking.status !== "cancelled" && booking.status !== "completed" && booking.status !== "no_show" && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(booking._id, "completed")}
                                  className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-all"
                                  title="Complete Appointment"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenReschedule(booking)}
                                  className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all text-xs font-semibold"
                                >
                                  Reschedule
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(booking._id, "no_show")}
                                  className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20 transition-all"
                                  title="Mark No Show"
                                >
                                  <User className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(booking._id, "cancelled")}
                                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
                                  title="Cancel Appointment"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
