import React, { useState } from "react";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";

export default function ConfigTab({
  workingHours, setWorkingHours,
  slotDuration, setSlotDuration,
  handleUpdateConfig,
  newClosedDate, setNewClosedDate, handleAddClosedDate,
  config, handleRemoveClosedDate,
  blockForm, setBlockForm, handleBlockSlot, handleUnblockSlot
}) {
  const [calendarDate, setCalendarDate] = useState(new Date());

  const getDaysInMonth = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); 
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { firstDayIndex, totalDays };
  };

  const changeMonth = (offset) => {
    const d = new Date(calendarDate);
    d.setMonth(d.getMonth() + offset);
    setCalendarDate(d);
  };

  const handleDateToggle = (dateStr) => {
    if (config?.closed_dates?.includes(dateStr)) {
      handleRemoveClosedDate(dateStr);
    } else {
      handleAddClosedDate(dateStr);
    }
  };

  const renderCalendar = () => {
    const { firstDayIndex, totalDays } = getDaysInMonth(calendarDate);
    const cells = [];
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="min-h-[40px] opacity-20" />);
    }
    
    const year = calendarDate.getFullYear();
    const month = String(calendarDate.getMonth() + 1).padStart(2, "0");
    
    for (let day = 1; day <= totalDays; day++) {
      const dayStr = String(day).padStart(2, "0");
      const dateStr = `${year}-${month}-${dayStr}`;
      const isClosed = config?.closed_dates?.includes(dateStr);
      
      cells.push(
        <button
          type="button"
          key={dateStr}
          onClick={() => handleDateToggle(dateStr)}
          className={`h-10 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
            isClosed 
              ? "bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]" 
              : "bg-charcoal-deep/50 text-gray-400 border border-white/5 hover:border-gold/30 hover:text-gold"
          }`}
        >
          {day}
        </button>
      );
    }
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-charcoal-deep/60 border border-white/5 px-4 py-3 rounded-2xl">
          <button type="button" onClick={() => changeMonth(-1)} className="p-1.5 hover:text-gold text-gray-400 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <span className="font-bold text-xs text-gold uppercase tracking-widest">{calendarDate.toLocaleString("en-US", { month: "long", year: "numeric" })}</span>
          <button type="button" onClick={() => changeMonth(1)} className="p-1.5 hover:text-gold text-gray-400 transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 p-2 bg-charcoal-deep/30 rounded-2xl border border-white/5">
          {weekdays.map(d => <div key={d} className="text-center text-[9px] text-gray-500 uppercase font-bold py-1">{d}</div>)}
          {cells}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Base Config & Closed Days */}
      <div className="bg-charcoal-light/30 border border-white/5 backdrop-blur-sm rounded-3xl p-6 space-y-6 shadow-soft font-sans">
        <h3 className="font-serif font-bold text-xl text-gray-100 tracking-tight">General Salon Settings</h3>
        
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 uppercase font-semibold tracking-widest">Opening hours</label>
              <input
                type="text"
                placeholder="10:00"
                value={workingHours.start}
                onChange={(e) => setWorkingHours({ ...workingHours, start: e.target.value })}
                className="w-full bg-charcoal-deep/80 border border-white/10 rounded-xl py-3 px-4 text-sm text-gray-100 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 uppercase font-semibold tracking-widest">Closing hours</label>
              <input
                type="text"
                placeholder="22:00"
                value={workingHours.end}
                onChange={(e) => setWorkingHours({ ...workingHours, end: e.target.value })}
                className="w-full bg-charcoal-deep/80 border border-white/10 rounded-xl py-3 px-4 text-sm text-gray-100 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 uppercase font-semibold tracking-widest">Default Slot duration (Mins)</label>
            <input
              type="number"
              value={slotDuration}
              onChange={(e) => setSlotDuration(parseInt(e.target.value))}
              className="w-full bg-charcoal-deep/80 border border-white/10 rounded-xl py-3 px-4 text-sm text-gray-100 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
            />
          </div>

          <button 
            onClick={handleUpdateConfig}
            className="btn-gold py-2.5 px-4 text-xs font-semibold rounded-xl w-full sm:w-auto mt-2"
          >
            Save Configurations
          </button>
        </div>

        {/* Holiday Management with Interactive Calendar */}
        <div className="border-t border-white/5 pt-6 space-y-4">
          <div className="flex justify-between items-end">
            <h4 className="font-bold text-sm text-gray-300 uppercase tracking-widest">Holiday Calendar</h4>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest">Click a date to toggle closure</p>
          </div>
          
          {renderCalendar()}

          {config && config.closed_dates?.length > 0 && (
            <div className="pt-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 font-semibold">Active Holidays</p>
              <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-1">
                {config.closed_dates.map(d => (
                  <span key={d} className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm">
                    {d}
                    <Trash2 
                      className="w-3.5 h-3.5 cursor-pointer hover:text-red-300 transition-colors" 
                      onClick={() => handleRemoveClosedDate(d)}
                    />
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Blocked Slots */}
      <div className="bg-charcoal-light/30 border border-white/5 backdrop-blur-sm rounded-3xl p-6 space-y-6 shadow-soft font-sans">
        <h3 className="font-serif font-bold text-xl text-gray-100 tracking-tight">Manual Schedule Blocking</h3>
        
        <form onSubmit={handleBlockSlot} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 uppercase font-semibold tracking-widest">Blocked Date</label>
              <input
                type="date"
                required
                value={blockForm.date}
                onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
                className="w-full bg-charcoal-deep/80 border border-white/10 rounded-xl py-3 px-4 text-xs text-gray-100 focus:outline-none focus:border-gold/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 uppercase font-semibold tracking-widest">Start Time (HH:MM)</label>
              <input
                type="text"
                required
                placeholder="14:00"
                value={blockForm.time}
                onChange={(e) => setBlockForm({ ...blockForm, time: e.target.value })}
                className="w-full bg-charcoal-deep/80 border border-white/10 rounded-xl py-3 px-4 text-xs text-gray-100 focus:outline-none focus:border-gold/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 uppercase font-semibold tracking-widest">Block Reason</label>
            <input
              type="text"
              placeholder="Staff lunch break, maintenance, etc."
              value={blockForm.reason}
              onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
              className="w-full bg-charcoal-deep/80 border border-white/10 rounded-xl py-3 px-4 text-xs text-gray-100 focus:outline-none focus:border-gold/50 transition-all"
            />
          </div>

          <button 
            type="submit"
            className="btn-gold py-2.5 px-4 text-xs font-semibold rounded-xl w-full sm:w-auto mt-2"
          >
            Block Target Slot
          </button>
        </form>

        {config && config.blocked_slots?.length > 0 && (
          <div className="border-t border-white/5 pt-6 space-y-3">
            <h4 className="font-bold text-sm text-gray-300 uppercase tracking-widest">Blocked Slots Directory</h4>
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {config.blocked_slots.map((block, idx) => (
                <div key={idx} className="bg-charcoal-deep/50 border border-white/10 rounded-xl p-3.5 flex justify-between items-center text-xs text-gray-300 transition-all hover:border-white/20">
                  <div>
                    <span className="font-semibold text-gray-100">{block.date} at {block.time}</span>
                    {block.reason && <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Reason: {block.reason}</p>}
                  </div>
                  <button 
                    onClick={() => handleUnblockSlot(block)}
                    className="text-red-400 hover:text-red-300 p-1.5 border border-red-500/20 hover:border-red-500/40 bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
