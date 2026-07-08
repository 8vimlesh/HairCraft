import React, { useState, useEffect } from "react";
import { LogOut, List, Sparkles, Settings, BarChart2 } from "lucide-react";
import { api, setAuthToken } from "../../services/api";
import { sendOwnerOtp } from "../../services/firebase";

// Sub-components
import OwnerLogin from "./components/OwnerLogin";
import AppointmentsTab from "./components/AppointmentsTab";
import ServicesTab from "./components/ServicesTab";
import ConfigTab from "./components/ConfigTab";
import AnalyticsTab from "./components/AnalyticsTab";

export default function OwnerDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("bookings");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Login State
  const [loginPhone, setLoginPhone] = useState("+919999999999");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Data State
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [config, setConfig] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  
  // View mode inside bookings
  const [viewMode, setViewMode] = useState("list");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDateStr, setSelectedCalendarDateStr] = useState("");

  // Form States
  const [serviceForm, setServiceForm] = useState({
    _id: null, name: "", category: "male", duration_minutes: 30, price: 300, active: true
  });
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  
  // Reschedule Dialog State
  const [reschedulingBooking, setReschedulingBooking] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [availableRescheduleSlots, setAvailableRescheduleSlots] = useState([]);
  
  // Slots Configuration Form
  const [workingHours, setWorkingHours] = useState({ start: "10:00", end: "22:00" });
  const [slotDuration, setSlotDuration] = useState(30);
  const [newClosedDate, setNewClosedDate] = useState("");
  const [blockForm, setBlockForm] = useState({ date: "", time: "", reason: "" });

  // Auto Login Check
  useEffect(() => {
    const savedToken = localStorage.getItem("owner_token");
    if (savedToken) {
      setIsAuthenticated(true);
      loadDashboardData();
    }
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [bookingsData, servicesData, configData, analyticsDataRes] = await Promise.all([
        api.getBookings(),
        api.getAllServices(),
        api.getConfig(),
        api.getAnalytics()
      ]);
      setBookings(bookingsData);
      setServices(servicesData);
      setConfig(configData);
      setWorkingHours(configData.working_hours);
      setSlotDuration(configData.slot_duration_minutes);
      setAnalyticsData(analyticsDataRes);
    } catch (err) {
      setError("Failed to load dashboard data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginPhone) return;
    
    setLoginLoading(true);
    setError("");
    try {
      const result = await sendOwnerOtp(loginPhone.trim(), "recaptcha-owner-container");
      setConfirmationResult(result);
      setOtpSent(true);
    } catch (err) {
      setError("Failed to send OTP to owner: " + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) return;
    
    setLoginLoading(true);
    setError("");
    try {
      const credentials = await confirmationResult.confirm(otpCode);
      const idToken = await credentials.user.getIdToken();
      
      const response = await api.ownerLogin(idToken);
      setAuthToken(response.token);
      setIsAuthenticated(true);
      setOtpSent(false);
      loadDashboardData();
    } catch (err) {
      setError("Owner verification failed: " + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setIsAuthenticated(false);
    setBookings([]);
    setServices([]);
    setConfig(null);
  };

  // Booking Actions
  const handleUpdateStatus = async (id, status) => {
    try {
      await api.updateBookingStatus(id, status);
      await loadDashboardData();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleOpenReschedule = async (booking) => {
    setReschedulingBooking(booking);
    setRescheduleDate(booking.date);
    setRescheduleTime(booking.time_slot);
    setAvailableRescheduleSlots([]);
    
    try {
      const slotsData = await api.getAvailability(booking.date, booking.service_id);
      setAvailableRescheduleSlots(slotsData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (reschedulingBooking && rescheduleDate) {
      api.getAvailability(rescheduleDate, reschedulingBooking.service_id)
        .then(setAvailableRescheduleSlots)
        .catch(console.error);
    }
  }, [rescheduleDate]);

  const handleRescheduleSubmit = async () => {
    if (!reschedulingBooking || !rescheduleDate || !rescheduleTime) return;
    try {
      await api.rescheduleBooking(reschedulingBooking._id, rescheduleDate, rescheduleTime);
      setReschedulingBooking(null);
      await loadDashboardData();
    } catch (err) {
      alert("Rescheduling failed: " + err.message);
    }
  };

  // Service CRUD Actions
  const handleSaveService = async (e) => {
    e.preventDefault();
    try {
      if (editingServiceId) {
        await api.updateService(editingServiceId, serviceForm);
      } else {
        await api.createService(serviceForm);
      }
      setIsServiceModalOpen(false);
      setServiceForm({ _id: null, name: "", category: "male", duration_minutes: 30, price: 300, active: true });
      setEditingServiceId(null);
      await loadDashboardData();
    } catch (err) {
      alert("Failed to save service: " + err.message);
    }
  };

  const handleEditService = (service) => {
    setServiceForm(service);
    setEditingServiceId(service._id);
    setIsServiceModalOpen(true);
  };

  const handleDeactivateService = async (id) => {
    if (!confirm("Are you sure you want to deactivate this service?")) return;
    try {
      await api.deactivateService(id);
      await loadDashboardData();
    } catch (err) {
      alert("Deactivation failed: " + err.message);
    }
  };

  // Config Actions
  const handleUpdateConfig = async () => {
    try {
      const payload = {
        ...config,
        working_hours: workingHours,
        slot_duration_minutes: slotDuration
      };
      await api.updateConfig(payload);
      alert("Configurations saved!");
      await loadDashboardData();
    } catch (err) {
      alert("Failed to update config: " + err.message);
    }
  };

  const handleAddClosedDate = async (targetDate) => {
    const dateToAdd = typeof targetDate === "string" ? targetDate : newClosedDate;
    if (!dateToAdd) return;
    try {
      const payload = {
        ...config,
        closed_dates: [...(config?.closed_dates || []), dateToAdd]
      };
      await api.updateConfig(payload);
      if (dateToAdd === newClosedDate) setNewClosedDate("");
      await loadDashboardData();
    } catch (err) {
      alert("Failed to add holiday date: " + err.message);
    }
  };

  const handleRemoveClosedDate = async (dateToRemove) => {
    try {
      const payload = {
        ...config,
        closed_dates: config.closed_dates.filter(d => d !== dateToRemove)
      };
      await api.updateConfig(payload);
      await loadDashboardData();
    } catch (err) {
      alert("Failed to remove holiday date: " + err.message);
    }
  };

  const handleBlockSlot = async (e) => {
    e.preventDefault();
    if (!blockForm.date || !blockForm.time) return;
    try {
      await api.blockSlot(blockForm);
      setBlockForm({ date: "", time: "", reason: "" });
      await loadDashboardData();
    } catch (err) {
      alert("Failed to block slot: " + err.message);
    }
  };

  const handleUnblockSlot = async (block) => {
    try {
      await api.unblockSlot(block);
      await loadDashboardData();
    } catch (err) {
      alert("Failed to unblock slot: " + err.message);
    }
  };

  // Month Calendar Helpers
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

  const renderCalendarGrid = () => {
    const { firstDayIndex, totalDays } = getDaysInMonth(calendarDate);
    const cells = [];
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="min-h-[75px] bg-charcoal-deep/30 border border-white/5 opacity-50" />);
    }
    
    const year = calendarDate.getFullYear();
    const month = String(calendarDate.getMonth() + 1).padStart(2, "0");
    
    for (let day = 1; day <= totalDays; day++) {
      const dayStr = String(day).padStart(2, "0");
      const dateStr = `${year}-${month}-${dayStr}`;
      
      const dayBookings = bookings.filter(b => b.date === dateStr);
      const isSelected = selectedCalendarDateStr === dateStr;
      
      cells.push(
        <div
          key={dateStr}
          onClick={() => setSelectedCalendarDateStr(isSelected ? "" : dateStr)}
          className={`min-h-[75px] p-2 border border-white/5 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
            isSelected 
              ? "bg-gold/10 border-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]" 
              : "bg-charcoal-deep/60 hover:bg-white/5"
          }`}
        >
          <span className={`font-bold text-xs ${isSelected ? "text-gold" : "text-gray-500"}`}>{day}</span>
          
          {dayBookings.length > 0 && (
            <div className="bg-gold text-white rounded text-[9px] font-extrabold px-1.5 py-0.5 mt-2 self-start truncate max-w-full shadow-sm">
              {dayBookings.length} Book{dayBookings.length > 1 ? "s" : ""}
            </div>
          )}
        </div>
      );
    }
    return { weekdays, cells };
  };

  const getFilteredBookings = () => {
    if (selectedCalendarDateStr) {
      return bookings.filter(b => b.date === selectedCalendarDateStr);
    }
    return bookings;
  };

  const calendarData = renderCalendarGrid();
  const filteredBookingsList = getFilteredBookings();

  if (!isAuthenticated) {
    return (
      <OwnerLogin 
        loginPhone={loginPhone} setLoginPhone={setLoginPhone}
        otpSent={otpSent} setOtpSent={setOtpSent}
        otpCode={otpCode} setOtpCode={setOtpCode}
        error={error} loginLoading={loginLoading}
        handleLoginSubmit={handleLoginSubmit} handleVerifyOtp={handleVerifyOtp}
      />
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysBookings = bookings.filter(b => b.date === todayStr);
  const pendingBookings = bookings.filter(b => b.status === "confirmed" || b.status === "rescheduled");
  const activeServices = services.filter(s => s.active);
  const blockedCount = (config?.blocked_slots?.length || 0) + (config?.closed_dates?.length || 0);

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-charcoal-light/30 border border-white/5 backdrop-blur-md p-6 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-gold-dark via-gold to-gold-dark" />
        <div className="space-y-1 pl-2">
          <h2 className="text-2xl font-serif font-bold tracking-tight gold-gradient-text">Salon Management Dashboard</h2>
          <p className="text-gray-400 text-sm font-sans">Organize appointments, configurations, and services catalog</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-red-400 border border-white/10 hover:border-red-500/30 bg-charcoal-deep/80 px-4 py-2.5 rounded-xl transition-all duration-300 active:scale-95 shrink-0"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Quick Stats Cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-charcoal-deep/60 border border-white/5 p-5 rounded-2xl shadow-inner space-y-1">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block">Today's Bookings</span>
            <span className="text-2xl font-bold text-gray-100">{todaysBookings.length}</span>
          </div>
          <div className="bg-charcoal-deep/60 border border-white/5 p-5 rounded-2xl shadow-inner space-y-1">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block">Pending / Upcoming</span>
            <span className="text-2xl font-bold text-blue-400">{pendingBookings.length}</span>
          </div>
          <div className="bg-charcoal-deep/60 border border-white/5 p-5 rounded-2xl shadow-inner space-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gold/5 rounded-bl-full" />
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block">Active Services</span>
            <span className="text-2xl font-bold text-gold">{activeServices.length}</span>
          </div>
          <div className="bg-charcoal-deep/60 border border-white/5 p-5 rounded-2xl shadow-inner space-y-1">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block">Blocked Slots/Days</span>
            <span className="text-2xl font-bold text-red-400">{blockedCount}</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto scrollbar-none border-b border-white/10 gap-6 px-2">
        {[
          { id: "bookings", label: "Appointments", icon: List },
          { id: "services", label: "Manage Services", icon: Sparkles },
          { id: "config", label: "Configurations", icon: Settings },
          { id: "analytics", label: "Analytics", icon: BarChart2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center shrink-0 gap-2 pb-4 px-1 font-semibold text-sm border-b-2 transition-all duration-300 ${
                isActive 
                  ? "border-gold text-gold" 
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="space-y-6">
        {activeTab === "bookings" && (
          <AppointmentsTab 
            loading={loading} viewMode={viewMode} setViewMode={setViewMode}
            calendarDate={calendarDate} changeMonth={changeMonth}
            calendarData={calendarData}
            selectedCalendarDateStr={selectedCalendarDateStr} setSelectedCalendarDateStr={setSelectedCalendarDateStr}
            filteredBookingsList={filteredBookingsList} services={services}
            handleUpdateStatus={handleUpdateStatus} handleOpenReschedule={handleOpenReschedule}
          />
        )}

        {activeTab === "services" && (
          <ServicesTab 
            services={services}
            setEditingServiceId={setEditingServiceId} setServiceForm={setServiceForm} setIsServiceModalOpen={setIsServiceModalOpen}
            handleEditService={handleEditService} handleDeactivateService={handleDeactivateService}
          />
        )}

        {activeTab === "config" && (
          <ConfigTab 
            workingHours={workingHours} setWorkingHours={setWorkingHours}
            slotDuration={slotDuration} setSlotDuration={setSlotDuration}
            handleUpdateConfig={handleUpdateConfig}
            newClosedDate={newClosedDate} setNewClosedDate={setNewClosedDate} handleAddClosedDate={handleAddClosedDate}
            config={config} handleRemoveClosedDate={handleRemoveClosedDate}
            blockForm={blockForm} setBlockForm={setBlockForm} handleBlockSlot={handleBlockSlot} handleUnblockSlot={handleUnblockSlot}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsTab loading={loading} analyticsData={analyticsData} />
        )}
      </div>

      {/* Service Modal Form */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-charcoal border border-white/10 rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative">
            <h4 className="font-serif font-bold text-xl text-gray-100 gold-gradient-text">
              {editingServiceId ? "Edit Service" : "Create Service"}
            </h4>
            
            <form onSubmit={handleSaveService} className="space-y-4 font-sans">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] text-gray-400 uppercase font-semibold tracking-widest">Service Name</label>
                <input
                  type="text"
                  required
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full bg-charcoal-deep border border-white/10 rounded-xl py-2.5 px-3 text-sm text-gray-100 focus:outline-none focus:border-gold/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-gray-400 uppercase font-semibold tracking-widest">Category</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full bg-charcoal-deep border border-white/10 rounded-xl py-2.5 px-2 text-sm text-gray-100 focus:outline-none focus:border-gold/50 transition-all"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-gray-400 uppercase font-semibold tracking-widest">Duration (Min)</label>
                  <input
                    type="number"
                    required
                    value={serviceForm.duration_minutes}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: parseInt(e.target.value) })}
                    className="w-full bg-charcoal-deep border border-white/10 rounded-xl py-2.5 px-3 text-sm text-gray-100 focus:outline-none focus:border-gold/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] text-gray-400 uppercase font-semibold tracking-widest">Price (₹)</label>
                <input
                  type="number"
                  required
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) })}
                  className="w-full bg-charcoal-deep border border-white/10 rounded-xl py-2.5 px-3 text-sm text-gray-100 focus:outline-none focus:border-gold/50 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-3 font-semibold">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="flex-1 bg-charcoal-light border border-white/10 hover:border-white/30 text-gray-300 py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-gold py-3 rounded-xl"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Dialog Modal */}
      {reschedulingBooking && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-charcoal border border-white/10 rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative text-left">
            <div className="space-y-1">
              <h4 className="font-serif font-bold text-xl text-gray-100 gold-gradient-text">Reschedule</h4>
              <p className="text-gray-400 text-xs font-sans">Pick new slot for {reschedulingBooking.customer_name}</p>
            </div>
            
            <div className="space-y-4 font-sans">
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 uppercase font-semibold tracking-widest">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-charcoal-deep border border-white/10 rounded-xl py-2.5 px-3 text-sm text-gray-100 focus:outline-none focus:border-gold/50 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-400 uppercase font-semibold tracking-widest">New Time Slot</label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full bg-charcoal-deep border border-white/10 rounded-xl py-2.5 px-2 text-sm text-gray-100 focus:outline-none focus:border-gold/50 transition-all"
                >
                  <option value="">-- Select slot --</option>
                  {availableRescheduleSlots.map(s => (
                    <option key={s.time} value={s.time}>{s.time}</option>
                  ))}
                </select>
                {availableRescheduleSlots.length === 0 && rescheduleDate && (
                  <p className="text-[10px] text-red-400">No slots available on this date.</p>
                )}
              </div>

              <div className="flex gap-3 pt-3 font-semibold">
                <button
                  onClick={() => setReschedulingBooking(null)}
                  className="flex-1 bg-charcoal-light border border-white/10 hover:border-white/30 text-gray-300 py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRescheduleSubmit}
                  disabled={!rescheduleDate || !rescheduleTime}
                  className="flex-1 btn-gold py-3 rounded-xl disabled:opacity-50"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
