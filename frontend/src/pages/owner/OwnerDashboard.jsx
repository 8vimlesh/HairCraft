import React, { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, Clock, Sparkles, Plus, Trash2, 
  Edit3, LogOut, Check, X, Shield, List, Settings, 
  Loader2, User, Phone, CheckSquare, RefreshCw, BarChart2,
  ChevronLeft, ChevronRight, CalendarDays, CalendarClock
} from "lucide-react";
import { api, setAuthToken } from "../../services/api";
import { sendOwnerOtp } from "../../services/firebase";

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
  
  // View mode inside bookings: "list" or "calendar"
  const [viewMode, setViewMode] = useState("list");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDateStr, setSelectedCalendarDateStr] = useState("");

  // Form States
  const [serviceForm, setServiceForm] = useState({
    _id: null,
    name: "",
    category: "male",
    duration_minutes: 30,
    price: 300,
    active: true
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

  // Fetch Dashboard Data
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

  // Rescheduling logic
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

  const handleAddClosedDate = async () => {
    if (!newClosedDate) return;
    try {
      const payload = {
        ...config,
        closed_dates: [...config.closed_dates, newClosedDate]
      };
      await api.updateConfig(payload);
      setNewClosedDate("");
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
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday
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
    
    // Weekday headers
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    // Prepended empty days
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="min-h-[75px] bg-cream/30 border border-gray-200 opacity-20" />);
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
          className={`min-h-[75px] p-2 border border-gray-200 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
            isSelected 
              ? "bg-gold/10 border-gold shadow-gold-glow" 
              : "bg-white hover:bg-cream-deep"
          }`}
        >
          <span className={`font-bold text-xs ${isSelected ? "text-gold" : "text-gray-500"}`}>{day}</span>
          
          {dayBookings.length > 0 && (
            <div className="bg-gold text-white rounded text-[9px] font-extrabold px-1.5 py-0.5 mt-2 self-start truncate max-w-full">
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

  // Statistics
  const getStats = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayBookings = bookings.filter(b => b.date === todayStr);
    const pendingBookings = bookings.filter(b => b.status === "confirmed" || b.status === "rescheduled");
    const activeServices = services.filter(s => s.active);
    
    return {
      todayCount: todayBookings.length,
      pendingCount: pendingBookings.length,
      activeServicesCount: activeServices.length
    };
  };

  const stats = getStats();
  const calendarData = renderCalendarGrid();
  const filteredBookingsList = getFilteredBookings();

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto w-full px-4 py-16">
        <div id="recaptcha-owner-container"></div>
        <div className="bg-white border border-gray-200 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gold-dark via-gold to-gold-dark" />
          
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-gold/5 border border-gold/20 flex items-center justify-center text-gold mb-2">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight gold-gradient-text">Owner Portal</h2>
            <p className="text-gray-500 text-sm">Log in using owner's credentials to manage salon schedule</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs text-center">
              {error}
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner Phone *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="+919999999999"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full bg-cream-dark border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-gold/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full btn-gold flex items-center justify-center gap-2 py-3.5 text-sm"
              >
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Verification OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center block">Enter 6-digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-cream-dark border border-gray-200 rounded-xl py-3 text-center text-xl font-bold tracking-[0.5em] text-gold placeholder-gray-600 focus:border-gold/50 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="flex-1 btn-outline py-2.5 text-xs"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="flex-1 btn-gold py-2.5 text-xs flex items-center justify-center"
                >
                  {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Owner"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-gray-200 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gold" />
        <div className="space-y-1 pl-2">
          <h2 className="text-2xl font-bold tracking-tight">Salon Management Dashboard</h2>
          <p className="text-gray-500 text-sm">Organize appointments, configurations, and services catalog</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-red-400 border border-gray-200 hover:border-red-500/20 bg-cream-dark px-4 py-2.5 rounded-xl transition-all duration-300 active:scale-95 shrink-0"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Today's Bookings</span>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats.todayCount}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Active/Pending Bookings</span>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats.pendingCount}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Services Catalog</span>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats.activeServicesCount}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto scrollbar-none border-b border-gray-200 gap-4">
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
                  : "border-transparent text-gray-500 hover:text-gold"
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="space-y-6">
        {/* TAB 1: BOOKINGS & CALENDAR */}
        {activeTab === "bookings" && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-6">
            
            {/* View Mode Toggle & Calendar Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-gray-900">Appointments Log</h3>
                <p className="text-xs text-gray-500">
                  {selectedCalendarDateStr 
                    ? `Showing bookings for date: ${selectedCalendarDateStr}` 
                    : "Showing all salon bookings"}
                </p>
              </div>
              
              <div className="flex items-center gap-2 bg-cream-dark border border-gray-200 p-1 rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 w-1/2 sm:w-auto ${
                    viewMode === "list"
                      ? "bg-gold text-white shadow-gold-glow"
                      : "text-gray-500 hover:text-gold"
                  }`}
                >
                  <List className="w-3.5 h-3.5" /> List View
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 w-1/2 sm:w-auto ${
                    viewMode === "calendar"
                      ? "bg-gold text-white shadow-gold-glow"
                      : "text-gray-500 hover:text-gold"
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5" /> Calendar View
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
                <span className="text-gray-500 text-sm font-medium">Fetching salon schedule...</span>
              </div>
            ) : (
              <>
                {/* Visual Calendar Grid View */}
                {viewMode === "calendar" && (
                  <div className="space-y-4">
                    {/* Month Picker Header */}
                    <div className="flex items-center justify-between bg-cream-dark border border-gray-200 px-4 py-3 rounded-2xl">
                      <button 
                        onClick={() => changeMonth(-1)}
                        className="p-1.5 border border-gray-200 hover:border-gold/30 rounded-xl hover:text-gold transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <h4 className="font-bold text-sm uppercase tracking-wider text-gold">
                        {calendarDate.toLocaleString("en-US", { month: "long", year: "numeric" })}
                      </h4>
                      <button 
                        onClick={() => changeMonth(1)}
                        className="p-1.5 border border-gray-200 hover:border-gold/30 rounded-xl hover:text-gold transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Month Grid */}
                    <div className="grid grid-cols-7 gap-1 border border-gray-200 p-1 rounded-2xl overflow-hidden bg-cream-dark/50">
                      {/* Weekday Names */}
                      {calendarData.weekdays.map(d => (
                        <div key={d} className="text-center py-2 text-[10px] uppercase font-bold text-gray-500 border-b border-gray-200 bg-cream-dark">
                          {d}
                        </div>
                      ))}
                      {calendarData.cells}
                    </div>
                    
                    {selectedCalendarDateStr && (
                      <div className="flex justify-between items-center bg-gold/5 border border-gold/10 px-4 py-2.5 rounded-xl text-xs">
                        <span className="text-gray-500">Filtering calendar: <strong>{selectedCalendarDateStr}</strong></span>
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

                {/* Bookings Table List */}
                {filteredBookingsList.length === 0 ? (
                  <div className="text-center py-16 text-gray-500 border border-dashed border-gray-200 rounded-2xl">
                    No appointments recorded for this schedule layout.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                          <th className="py-3 px-4">Schedule</th>
                          <th className="py-3 px-4">Client Details</th>
                          <th className="py-3 px-4">Reserved Slots</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookingsList.map((booking) => {
                          const service = services.find(s => s._id === booking.service_id);
                          return (
                            <tr key={booking._id} className="border-b border-gray-200 hover:bg-white/5 transition-colors text-sm text-gray-700">
                              <td className="py-4 px-4">
                                <span className="font-semibold text-gray-900 block">{booking.date}</span>
                                <span className="text-xs text-gold font-medium mt-1 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" /> {booking.time_slot}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="font-semibold text-gray-900 block">{booking.customer_name}</span>
                                <span className="text-xs text-gray-500 font-medium block mt-0.5">{booking.mobile_number}</span>
                                {booking.notes && <span className="text-[11px] text-gray-500 italic block mt-1">Notes: "{booking.notes}"</span>}
                              </td>
                              <td className="py-4 px-4 font-mono text-xs">
                                <p className="font-medium text-gray-900">{service?.name || "Service"}</p>
                                <span className="text-gray-500 text-[10px]">({booking.slots_reserved?.join(", ")})</span>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                                  booking.status === "confirmed" 
                                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                    : booking.status === "rescheduled"
                                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                      : booking.status === "completed"
                                        ? "bg-gray-500/10 text-gray-700 border border-gray-500/20"
                                        : booking.status === "no_show"
                                          ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                                }`}>
                                  {booking.status === "no_show" ? "No Show" : booking.status}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
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
                                        className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all text-xs font-semibold"
                                      >
                                        Reschedule
                                      </button>
                                      <button
                                        onClick={() => handleUpdateStatus(booking._id, "no_show")}
                                        className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20 transition-all"
                                        title="Mark No Show"
                                      >
                                        <User className="w-4 h-4 text-yellow-400" />
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
        )}

        {/* TAB 2: SERVICE CRUD */}
        {activeTab === "services" && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900">Services Catalog</h3>
              <button 
                onClick={() => {
                  setEditingServiceId(null);
                  setServiceForm({ _id: null, name: "", category: "male", duration_minutes: 30, price: 300, active: true });
                  setIsServiceModalOpen(true);
                }}
                className="btn-gold flex items-center gap-1.5 py-2 px-4 text-xs font-semibold rounded-lg shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Service
              </button>
            </div>

            {/* List Services */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {services.map((service) => (
                <div 
                  key={service._id} 
                  className={`bg-cream-dark border rounded-2xl p-5 space-y-4 relative flex flex-col justify-between transition-all duration-300 ${
                    service.active ? "border-gray-200 hover:border-gold/30" : "border-red-950/20 opacity-60"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-gray-900 text-base">
                        {service.name}
                      </h4>
                      <span className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
                        service.category === "male" ? "bg-blue-500/10 text-blue-400" : "bg-pink-500/10 text-pink-400"
                      }`}>
                        {service.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {service.duration_minutes} mins
                      </span>
                      <span className="flex items-center gap-1 text-gold font-bold">
                        ₹{service.price}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-gray-200 pt-3 justify-end text-xs font-semibold">
                    <button
                      onClick={() => handleEditService(service)}
                      className="flex items-center gap-1 p-2 bg-white hover:bg-white/5 rounded-xl border border-gray-200 text-gray-500 hover:text-gold transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    {service.active && (
                      <button
                        onClick={() => handleDeactivateService(service._id)}
                        className="flex items-center gap-1 p-2 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 rounded-xl text-red-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Deactivate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Form */}
            {isServiceModalOpen && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white border border-gray-200 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
                  <h4 className="font-bold text-lg text-gray-900">
                    {editingServiceId ? "Edit Service Parameters" : "Create Salon Service"}
                  </h4>
                  
                  <form onSubmit={handleSaveService} className="space-y-3">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] text-gray-500 uppercase font-semibold">Service Name</label>
                      <input
                        type="text"
                        required
                        value={serviceForm.name}
                        onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                        className="w-full bg-cream-dark border border-gray-200 rounded-lg py-2.5 px-3 text-xs text-gray-900 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] text-gray-500 uppercase font-semibold">Category</label>
                        <select
                          value={serviceForm.category}
                          onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                          className="w-full bg-cream-dark border border-gray-200 rounded-lg py-2.5 px-2 text-xs text-gray-900 focus:outline-none"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[10px] text-gray-500 uppercase font-semibold">Duration (Mins)</label>
                        <input
                          type="number"
                          required
                          value={serviceForm.duration_minutes}
                          onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: parseInt(e.target.value) })}
                          className="w-full bg-cream-dark border border-gray-200 rounded-lg py-2.5 px-3 text-xs text-gray-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[10px] text-gray-500 uppercase font-semibold">Price (₹)</label>
                      <input
                        type="number"
                        required
                        value={serviceForm.price}
                        onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) })}
                        className="w-full bg-cream-dark border border-gray-200 rounded-lg py-2.5 px-3 text-xs text-gray-900 focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-3 font-semibold">
                      <button
                        type="button"
                        onClick={() => setIsServiceModalOpen(false)}
                        className="flex-1 btn-outline py-2.5 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 btn-gold py-2.5 text-xs"
                      >
                        Save Service
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CONFIGURATIONS */}
        {activeTab === "config" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Base Config & Closed Days */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-6">
              <h3 className="font-bold text-lg text-gray-900">General Salon Settings</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-semibold">Opening hours</label>
                    <input
                      type="text"
                      placeholder="10:00"
                      value={workingHours.start}
                      onChange={(e) => setWorkingHours({ ...workingHours, start: e.target.value })}
                      className="w-full bg-cream-dark border border-gray-200 rounded-xl py-3 px-4 text-sm text-gray-900 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-semibold">Closing hours</label>
                    <input
                      type="text"
                      placeholder="22:00"
                      value={workingHours.end}
                      onChange={(e) => setWorkingHours({ ...workingHours, end: e.target.value })}
                      className="w-full bg-cream-dark border border-gray-200 rounded-xl py-3 px-4 text-sm text-gray-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase font-semibold">Default Slot duration (Mins)</label>
                  <input
                    type="number"
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(parseInt(e.target.value))}
                    className="w-full bg-cream-dark border border-gray-200 rounded-xl py-3 px-4 text-sm text-gray-900 focus:outline-none"
                  />
                </div>

                <button 
                  onClick={handleUpdateConfig}
                  className="btn-gold py-2.5 px-4 text-xs font-semibold rounded-lg"
                >
                  Save Configurations
                </button>
              </div>

              {/* Holiday Management */}
              <div className="border-t border-gray-200 pt-6 space-y-4">
                <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Holidays / Closed Dates</h4>
                
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newClosedDate}
                    onChange={(e) => setNewClosedDate(e.target.value)}
                    className="flex-1 bg-cream-dark border border-gray-200 rounded-xl py-2 px-3 text-xs text-gray-900 focus:outline-none"
                  />
                  <button 
                    onClick={handleAddClosedDate}
                    className="btn-gold py-2 px-4 text-xs font-semibold rounded-xl"
                  >
                    Register Holiday
                  </button>
                </div>

                {config && config.closed_dates?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 max-h-[120px] overflow-y-auto pr-1">
                    {config.closed_dates.map(d => (
                      <span key={d} className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-xl text-xs flex items-center gap-1.5">
                        {d}
                        <Trash2 
                          className="w-3.5 h-3.5 cursor-pointer hover:text-red-300" 
                          onClick={() => handleRemoveClosedDate(d)}
                        />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Blocked Slots Breaks */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-6">
              <h3 className="font-bold text-lg text-gray-900">Manual Schedule Blocking</h3>
              
              <form onSubmit={handleBlockSlot} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-semibold">Blocked Date</label>
                    <input
                      type="date"
                      required
                      value={blockForm.date}
                      onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
                      className="w-full bg-cream-dark border border-gray-200 rounded-xl py-3 px-4 text-xs text-gray-900 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-semibold">Start Time (HH:MM)</label>
                    <input
                      type="text"
                      required
                      placeholder="14:00"
                      value={blockForm.time}
                      onChange={(e) => setBlockForm({ ...blockForm, time: e.target.value })}
                      className="w-full bg-cream-dark border border-gray-200 rounded-xl py-3 px-4 text-xs text-gray-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 uppercase font-semibold">Block Reason</label>
                  <input
                    type="text"
                    placeholder="Staff lunch break, salon maintenance, etc."
                    value={blockForm.reason}
                    onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                    className="w-full bg-cream-dark border border-gray-200 rounded-xl py-3 px-4 text-xs text-gray-900 focus:outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="btn-gold py-2.5 px-4 text-xs font-semibold rounded-lg"
                >
                  Block Target Slot
                </button>
              </form>

              {/* Blocked slots list */}
              {config && config.blocked_slots?.length > 0 && (
                <div className="border-t border-gray-200 pt-6 space-y-3">
                  <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Blocked Slots Directory</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {config.blocked_slots.map((block, idx) => (
                      <div key={idx} className="bg-cream-dark border border-gray-200 rounded-xl p-3 flex justify-between items-center text-xs text-gray-700">
                        <div>
                          <span className="font-semibold text-gray-900">{block.date} at {block.time}</span>
                          {block.reason && <p className="text-[10px] text-gray-500 mt-0.5">Reason: "{block.reason}"</p>}
                        </div>
                        <button 
                          onClick={() => handleUnblockSlot(block)}
                          className="text-red-400 hover:text-red-300 p-1 border border-red-500/10 hover:border-red-500/30 bg-red-500/5 rounded-lg"
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
        )}

        {/* TAB 4: ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-gray-900">Business Analytics & Metrics</h3>
              <p className="text-xs text-gray-500">Real-time indicators of salon performance and booking statistics</p>
            </div>

            {loading || !analyticsData ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
                <span className="text-gray-500 text-sm font-medium">Computing analytics reports...</span>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-cream-dark border border-gray-200 p-5 rounded-2xl space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total Bookings</span>
                    <p className="text-2xl font-bold text-gray-900">{analyticsData.total_bookings}</p>
                  </div>
                  <div className="bg-cream-dark border border-gray-200 p-5 rounded-2xl space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Total Revenue</span>
                    <p className="text-2xl font-bold text-gold">₹{analyticsData.total_revenue}</p>
                  </div>
                  <div className="bg-cream-dark border border-gray-200 p-5 rounded-2xl space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">No-Show Rate</span>
                    <p className="text-2xl font-bold text-yellow-400">{analyticsData.no_show_rate}%</p>
                  </div>
                  <div className="bg-cream-dark border border-gray-200 p-5 rounded-2xl space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Avg Checkout Time</span>
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
                  <div className="bg-cream-dark border border-gray-200 p-6 rounded-2xl space-y-4">
                    <h4 className="font-semibold text-sm text-gray-900 border-b border-gray-200 pb-2">Status Breakdown</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Completed</span>
                          <span className="font-bold text-gray-900">{analyticsData.completed_bookings}</span>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-green-500 h-full rounded-full" 
                            style={{ width: `${analyticsData.total_bookings > 0 ? (analyticsData.completed_bookings / analyticsData.total_bookings) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Cancelled</span>
                          <span className="font-bold text-gray-900">{analyticsData.cancelled_bookings}</span>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-red-500 h-full rounded-full" 
                            style={{ width: `${analyticsData.total_bookings > 0 ? (analyticsData.cancelled_bookings / analyticsData.total_bookings) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>No-Shows</span>
                          <span className="font-bold text-gray-900">{analyticsData.no_shows}</span>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-yellow-500 h-full rounded-full" 
                            style={{ width: `${analyticsData.total_bookings > 0 ? (analyticsData.no_shows / analyticsData.total_bookings) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gender Category Split */}
                  <div className="bg-cream-dark border border-gray-200 p-6 rounded-2xl space-y-4">
                    <h4 className="font-semibold text-sm text-gray-900 border-b border-gray-200 pb-2">Category Split (Men vs Women)</h4>
                    
                    {analyticsData.category_split && (
                      <div className="space-y-4 flex flex-col justify-center h-full">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 block" /> Men's ({analyticsData.category_split.male})</span>
                          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-500 block" /> Women's ({analyticsData.category_split.female})</span>
                        </div>
                        <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-blue-500 h-full" 
                            style={{ 
                              width: `${
                                (analyticsData.category_split.male + analyticsData.category_split.female) > 0 
                                  ? (analyticsData.category_split.male / (analyticsData.category_split.male + analyticsData.category_split.female)) * 100 
                                  : 50
                              }%` 
                            }} 
                          />
                          <div 
                            className="bg-pink-500 h-full" 
                            style={{ 
                              width: `${
                                (analyticsData.category_split.male + analyticsData.category_split.female) > 0 
                                  ? (analyticsData.category_split.female / (analyticsData.category_split.male + analyticsData.category_split.female)) * 100 
                                  : 50
                              }%` 
                            }} 
                          />
                        </div>
                        <p className="text-[10px] text-center text-gray-500">Based on category tags of booked services</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reschedule Dialog Modal */}
      {reschedulingBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative text-left">
            <h4 className="font-bold text-lg text-gray-900">Reschedule Appointment</h4>
            <p className="text-gray-500 text-xs">Pick rescheduling parameters for {reschedulingBooking.customer_name}</p>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase font-semibold">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-cream-dark border border-gray-200 rounded-lg py-2.5 px-3 text-xs text-gray-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase font-semibold">New Time Slot</label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full bg-cream-dark border border-gray-200 rounded-lg py-2.5 px-2 text-xs text-gray-900 focus:outline-none"
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

              <div className="flex gap-2 pt-3 font-semibold">
                <button
                  onClick={() => setReschedulingBooking(null)}
                  className="flex-1 btn-outline py-2.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRescheduleSubmit}
                  disabled={!rescheduleDate || !rescheduleTime}
                  className="flex-1 btn-gold py-2.5 text-xs disabled:opacity-50"
                >
                  Confirm Reschedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
