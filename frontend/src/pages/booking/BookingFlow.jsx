import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Calendar, Clock, User, Phone, 
  ChevronRight, ChevronLeft, CheckCircle2, 
  Loader2, Scissors, Info 
} from "lucide-react";
import { api } from "../../services/api";
import { sendOtp } from "../../services/firebase";

export default function BookingFlow() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [closedDates, setClosedDates] = useState([]);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "+91",
    notes: ""
  });
  
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [bookingStartTime, setBookingStartTime] = useState(null);

  useEffect(() => {
    const datesList = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString("en-US", { month: "short" });
      
      datesList.push({ dateStr, dayName, dayNum, monthName });
    }
    setDates(datesList);
    setSelectedDate(datesList[0].dateStr);
    
    api.getClosedDates()
      .then(setClosedDates)
      .catch(err => console.error("Failed to fetch closed dates", err));
  }, []);

  useEffect(() => {
    if (category) {
      setLoading(true);
      setError("");
      api.getServices(category)
        .then((data) => {
          setServices(data);
          setLoading(false);
        })
        .catch((err) => {
          setError("Failed to fetch services. Please try again.");
          setLoading(false);
        });
    }
  }, [category]);

  useEffect(() => {
    if (selectedDate && selectedService) {
      if (closedDates.includes(selectedDate)) {
        setSlots([]);
        return;
      }
      
      setLoading(true);
      setError("");
      api.getAvailability(selectedDate, selectedService._id)
        .then((data) => {
          setSlots(data);
          setSelectedSlot(null);
          setLoading(false);
        })
        .catch((err) => {
          setError("Failed to load time slots. Please try again.");
          setLoading(false);
        });
    }
  }, [selectedDate, selectedService]);

  const handleCategorySelect = (cat) => {
    setCategory(cat);
    setStep(2);
    setBookingStartTime(Date.now());
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setStep(3);
  };

  const handleDateSelect = (dateStr) => {
    setSelectedDate(dateStr);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setError("Please fill in all required fields.");
      return;
    }
    
    let formattedPhone = formData.phone.trim();
    if (!formattedPhone.startsWith("+")) {
      if (formattedPhone.length === 10) {
        formattedPhone = "+91" + formattedPhone;
      } else {
        setError("Please enter phone number with country code (e.g., +919999999999).");
        return;
      }
    }
    
    setLoading(true);
    setError("");
    setOtpError("");
    
    try {
      const result = await sendOtp(formattedPhone, "recaptcha-container");
      setConfirmationResult(result);
      setOtpSent(true);
      setLoading(false);
    } catch (err) {
      setError("Failed to send OTP verification code: " + err.message);
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setOtpError("Please enter a valid 6-digit code.");
      return;
    }
    
    setOtpLoading(true);
    setOtpError("");
    
    try {
      const credentials = await confirmationResult.confirm(otpCode);
      const idToken = await credentials.user.getIdToken();
      
      const completionTime = bookingStartTime ? (Date.now() - bookingStartTime) / 1000 : null;
      const bookingPayload = {
        customer_name: formData.name,
        mobile_number: credentials.user.phoneNumber || formData.phone,
        service_id: selectedService._id,
        date: selectedDate,
        time_slot: selectedSlot.time,
        notes: formData.notes,
        id_token: idToken,
        booking_completion_time_seconds: completionTime
      };
      
      const response = await api.createBooking(bookingPayload);
      setConfirmedBooking(response);
      setOtpSent(false);
      setStep(5);
    } catch (err) {
      setOtpError(err.message || "OTP verification failed. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setCategory("");
    setSelectedService(null);
    setSelectedSlot(null);
    setFormData({ name: "", phone: "+91", notes: "" });
    setConfirmedBooking(null);
    setOtpSent(false);
    setBookingStartTime(null);
  };

  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="max-w-md mx-auto w-full px-4 py-8 md:py-16">
      {/* Step Indicators */}
      {step < 5 && (
        <div className="flex items-center justify-between mb-12 px-2">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="flex items-center flex-1 last:flex-none">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-500 ${
                  step === num 
                    ? "bg-gold border-gold text-charcoal shadow-gold-glow" 
                    : step > num 
                      ? "bg-charcoal border-gold/50 text-gold" 
                      : "bg-charcoal-light/30 border-white/10 text-gray-500"
                }`}
              >
                {step > num ? <CheckCircle2 className="w-4 h-4" /> : num}
              </div>
              {num < 4 && (
                <div 
                  className={`h-px flex-1 mx-2 transition-all duration-500 ${
                    step > num ? "bg-gold/40" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-start gap-3 shadow-soft">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm tracking-wide">{error}</span>
        </motion.div>
      )}

      <div id="recaptcha-container"></div>

      <AnimatePresence mode="wait">
        {/* Step 1: Category Selection */}
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="text-center space-y-2 mb-8 pl-1">
              <h2 className="text-3xl font-serif text-white tracking-wide">Select Category</h2>
              <p className="text-gold/80 text-xs uppercase tracking-widest">Tailored Grooming Excellence</p>
            </div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-4"
            >
              <motion.button 
                variants={itemVariants}
                onClick={() => handleCategorySelect("male")}
                className="card-glass flex flex-col items-center justify-center gap-4 group hover:border-gold/40 hover:shadow-gold-glow text-center p-8"
              >
                <div className="w-16 h-16 rounded-full bg-charcoal flex items-center justify-center border border-white/10 group-hover:border-gold/50 group-hover:bg-gold/5 transition-all duration-500">
                  <Scissors className="w-8 h-8 text-white group-hover:text-gold transition-colors duration-500" />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-white group-hover:text-gold transition-colors duration-500">Men's</h3>
                  <p className="text-gray-400 text-[10px] uppercase tracking-widest mt-2">Grooming</p>
                </div>
              </motion.button>

              <motion.button 
                variants={itemVariants}
                onClick={() => handleCategorySelect("female")}
                className="card-glass flex flex-col items-center justify-center gap-4 group hover:border-gold/40 hover:shadow-gold-glow text-center p-8"
              >
                <div className="w-16 h-16 rounded-full bg-charcoal flex items-center justify-center border border-white/10 group-hover:border-gold/50 group-hover:bg-gold/5 transition-all duration-500">
                  <Sparkles className="w-8 h-8 text-white group-hover:text-gold transition-colors duration-500" />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-white group-hover:text-gold transition-colors duration-500">Women's</h3>
                  <p className="text-gray-400 text-[10px] uppercase tracking-widest mt-2">Styling</p>
                </div>
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {/* Step 2: Service Selection */}
        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(1)} className="text-gray-400 hover:text-gold flex items-center gap-1 text-sm transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <span className="text-[10px] uppercase tracking-widest text-gold font-semibold border border-gold/30 px-3 py-1 rounded-full">
                {category}
              </span>
            </div>

            <div className="space-y-2 mb-6 pl-1">
              <h2 className="text-3xl font-serif text-white tracking-wide">Select Service</h2>
              <p className="text-gold/80 text-xs uppercase tracking-widest">Our Gold-Standard Collection</p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
              </div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-3 max-h-[420px] overflow-y-auto pr-2 scrollbar-none"
              >
                {services.map((service) => (
                  <motion.div 
                    variants={itemVariants}
                    key={service._id}
                    onClick={() => handleServiceSelect(service)}
                    className="card-glass p-5 flex items-center justify-between cursor-pointer group hover:border-gold/50 hover:bg-gold/5"
                  >
                    <div className="space-y-2">
                      <h3 className="font-serif text-lg text-gray-100 group-hover:text-gold transition-colors">
                        {service.name}
                      </h3>
                      <div className="flex items-center gap-3 text-[11px] uppercase tracking-widest text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gold/70" /> {service.duration_minutes} mins
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-serif font-semibold text-gold text-xl">
                        ₹{service.price}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Step 3: Date & Slot Selection */}
        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(2)} className="text-gray-400 hover:text-gold flex items-center gap-1 text-sm transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold truncate max-w-[150px]">
                {selectedService?.name}
              </span>
            </div>

            <div className="space-y-2 pl-1">
              <h2 className="text-3xl font-serif text-white tracking-wide">Reserve Time</h2>
              <p className="text-gold/80 text-xs uppercase tracking-widest">Select Your Preference</p>
            </div>

            {/* Dates Slider */}
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-none snap-x">
              {dates.map((d) => {
                const isSelected = selectedDate === d.dateStr;
                const isClosed = closedDates.includes(d.dateStr);
                return (
                  <button
                    key={d.dateStr}
                    onClick={() => handleDateSelect(d.dateStr)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl min-w-[72px] border shrink-0 transition-all duration-300 snap-start ${
                      isSelected
                        ? "bg-gold border-gold text-charcoal shadow-gold-glow scale-105"
                        : isClosed
                          ? "bg-charcoal-deep border-red-500/20 text-gray-600 opacity-60"
                          : "bg-charcoal-light/30 border-white/10 text-gray-400 hover:border-gold/30 hover:text-gold"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">{d.dayName}</span>
                    <span className={`text-2xl font-serif my-1 ${isSelected ? 'text-charcoal' : 'text-white'}`}>{d.dayNum}</span>
                    <span className="text-[9px] uppercase tracking-widest opacity-70">{d.monthName}</span>
                  </button>
                );
              })}
            </div>

            {/* Slots Grid */}
            <div className="space-y-4">
              <h3 className="font-sans text-[10px] uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-gold" /> Available Windows
              </h3>
              
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-gold animate-spin" />
                </div>
              ) : closedDates.includes(selectedDate) ? (
                <div className="card-glass text-center py-10 space-y-3 bg-red-500/5 border-red-500/20">
                  <div className="w-10 h-10 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
                    <Info className="w-5 h-5 text-red-400" />
                  </div>
                  <p className="text-red-400 font-serif text-lg">Salon Closed for Holiday</p>
                  <p className="text-gray-500 text-xs font-sans">We are not accepting bookings on this date.</p>
                </div>
              ) : slots.length === 0 ? (
                <div className="card-glass text-center py-8 text-gray-400 text-sm">
                  Fully booked on this date.
                </div>
              ) : (
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[200px] overflow-y-auto pr-2 scrollbar-none"
                >
                  {slots.map((slot) => {
                    const isSelected = selectedSlot?.time === slot.time;
                    return (
                      <motion.button
                        variants={itemVariants}
                        key={slot.time}
                        onClick={() => handleSlotSelect(slot)}
                        className={`py-3 px-2 rounded-xl border text-center font-sans tracking-wide text-xs transition-all duration-300 ${
                          isSelected
                            ? "bg-gold border-gold text-charcoal shadow-gold-glow"
                            : "bg-charcoal-light/30 border-white/10 text-gray-300 hover:border-gold/40 hover:text-white"
                        }`}
                      >
                        {slot.time}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </div>

            <button
              onClick={() => setStep(4)}
              disabled={!selectedSlot}
              className="w-full btn-gold disabled:opacity-50 disabled:pointer-events-none mt-6 flex items-center justify-center gap-2"
            >
              Confirm Appointment <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Step 4: Details & OTP */}
        {step === 4 && !otpSent && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(3)} className="text-gray-400 hover:text-gold flex items-center gap-1 text-sm transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <div className="text-[10px] uppercase tracking-widest text-gray-400 flex items-center gap-3">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gold" /> {selectedDate}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gold" /> {selectedSlot?.time}</span>
              </div>
            </div>

            <div className="space-y-2 mb-8 pl-1">
              <h2 className="text-3xl font-serif text-white tracking-wide">Client Details</h2>
              <p className="text-gold/80 text-xs uppercase tracking-widest">Verify identity to secure</p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pl-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gold absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-charcoal-light/30 backdrop-blur-sm border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:border-gold/50 focus:bg-charcoal-light/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pl-1">Mobile Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gold absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                  <input
                    type="tel"
                    required
                    placeholder="+919999999999"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-charcoal-light/30 backdrop-blur-sm border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:border-gold/50 focus:bg-charcoal-light/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pl-1">Special Requests</label>
                <textarea
                  rows={3}
                  placeholder="Styling preferences, notes, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-charcoal-light/30 backdrop-blur-sm border border-white/10 rounded-xl py-3.5 px-4 text-sm text-white placeholder-gray-600 focus:border-gold/50 focus:bg-charcoal-light/50 focus:outline-none transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gold flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify & Secure <CheckCircle2 className="w-4 h-4" /></>}
              </button>
            </form>
          </motion.div>
        )}

        {/* OTP verification dialog */}
        {otpSent && (
          <motion.div 
            key="otpVerification"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2 mb-8 pl-1">
              <h2 className="text-3xl font-serif text-white tracking-wide">Verification</h2>
              <p className="text-gray-400 text-xs tracking-wide">
                Secure code dispatched to <strong className="text-gold tracking-widest">{formData.phone}</strong>
              </p>
            </div>

            {otpError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs text-center shadow-soft">
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <input
                type="text"
                maxLength={6}
                required
                placeholder="------"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-charcoal-light/30 backdrop-blur-sm border border-white/10 rounded-xl py-6 text-center text-3xl tracking-[0.5em] font-serif text-gold placeholder-gray-700 focus:border-gold/50 focus:bg-charcoal-light/50 focus:outline-none transition-all"
              />
              <p className="text-[10px] text-gray-500 uppercase tracking-widest text-center">
                Mock Code: <strong className="text-gold">123456</strong>
              </p>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="flex-1 btn-outline py-3.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="flex-1 btn-gold py-3.5 text-xs flex items-center justify-center gap-2"
                >
                  {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authorize"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Step 5: Booking Confirmed Screen */}
        {step === 5 && confirmedBooking && (
          <motion.div 
            key="step5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-8 text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold shadow-gold-glow relative">
                <div className="absolute inset-0 rounded-full border border-gold animate-ping opacity-20" />
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>

            <div className="space-y-2 pl-1">
              <h2 className="text-3xl font-serif text-white tracking-wide">Reservation Secured</h2>
              <p className="text-gray-400 text-xs tracking-wide max-w-[280px] mx-auto">
                We look forward to hosting you at Hair Craft Salon. Your premium experience awaits.
              </p>
            </div>

            {/* Premium VIP Ticket Visual */}
            <div className="bg-charcoal-light/80 backdrop-blur-md border border-white/10 rounded-3xl text-left overflow-hidden shadow-2xl relative mx-auto w-full max-w-sm">
              <div className="bg-gradient-to-r from-gold-dark/30 via-gold/10 to-transparent px-8 py-5 border-b border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2" />
                <h3 className="font-serif text-lg tracking-widest text-gold uppercase relative z-10">VIP Access</h3>
                <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-widest font-bold relative z-10">
                  ID: #{confirmedBooking._id.slice(-6).toUpperCase()}
                </p>
              </div>
              
              <div className="p-8 space-y-6 relative">
                {/* Decorative punched holes on sides */}
                <div className="absolute w-6 h-6 rounded-full bg-charcoal -left-3 top-[45%] border-r border-white/10 shadow-inner" />
                <div className="absolute w-6 h-6 rounded-full bg-charcoal -right-3 top-[45%] border-l border-white/10 shadow-inner" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4 border-b border-white/10 pb-6">
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Guest</span>
                    <p className="font-serif text-white mt-1 text-base">{confirmedBooking.customer_name}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Service</span>
                    <p className="font-sans font-medium tracking-wide text-gold mt-1 text-sm">{selectedService?.name}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Date</span>
                    <p className="font-sans font-medium tracking-wide text-white mt-1 text-sm">{confirmedBooking.date}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Time</span>
                    <p className="font-sans font-medium tracking-wide text-white mt-1 text-sm">{confirmedBooking.time_slot}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Duration</span>
                    <p className="font-sans tracking-wide text-white text-sm mt-1">{selectedService?.duration_minutes} mins</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Total</span>
                    <p className="font-serif font-bold text-gold text-2xl mt-0.5">₹{selectedService?.price}</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={resetFlow}
              className="w-full btn-outline mt-8"
            >
              New Reservation
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
