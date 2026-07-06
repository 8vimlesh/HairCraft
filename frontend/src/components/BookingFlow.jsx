import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Calendar, Clock, User, Phone, 
  ChevronRight, ChevronLeft, CheckCircle2, 
  MapPin, Loader2, Scissors, Info 
} from "lucide-react";
import { api } from "../services/api";
import { sendOtp } from "../services/firebase";

export default function BookingFlow() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState(""); // male / female
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null); // { time, slots_reserved }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Booking Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    notes: ""
  });
  
  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  
  // Final Confirmation Details
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [bookingStartTime, setBookingStartTime] = useState(null);

  // 1. Generate Next 14 Days
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
      
      datesList.push({
        dateStr,
        dayName,
        dayNum,
        monthName
      });
    }
    setDates(datesList);
    setSelectedDate(datesList[0].dateStr);
  }, []);

  // 2. Load Services when Category is Selected
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

  // 3. Load Available Slots when Date or Service changes
  useEffect(() => {
    if (selectedDate && selectedService) {
      setLoading(true);
      setError("");
      api.getAvailability(selectedDate, selectedService._id)
        .then((data) => {
          setSlots(data);
          setSelectedSlot(null); // Reset selection
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
    
    // Format phone to international format if not already
    let formattedPhone = formData.phone.trim();
    if (!formattedPhone.startsWith("+")) {
      // Default to Indian code +91 if not specified
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
      // Trigger OTP sending
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
      // 1. Confirm Firebase OTP
      const credentials = await confirmationResult.confirm(otpCode);
      const idToken = await credentials.user.getIdToken();
      
      // 2. Submit booking to backend
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
      console.error(err);
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
    setFormData({ name: "", phone: "", notes: "" });
    setConfirmedBooking(null);
    setOtpSent(false);
    setBookingStartTime(null);
  };

  // Animation variants
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      transition: { duration: 0.2, ease: "easeInOut" }
    })
  };

  return (
    <div className="max-w-md mx-auto w-full px-4 py-4 sm:py-8">
      {/* Step Indicators */}
      {step < 5 && (
        <div className="flex items-center justify-between mb-8 px-2">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="flex items-center flex-1 last:flex-none">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-300 ${
                  step === num 
                    ? "bg-gold border-gold text-white shadow-gold-glow" 
                    : step > num 
                      ? "bg-white border-gold/50 text-gold" 
                      : "bg-white border-gray-300 text-gray-500"
                }`}
              >
                {num}
              </div>
              {num < 4 && (
                <div 
                  className={`h-0.5 flex-1 mx-2 transition-all duration-500 ${
                    step > num ? "bg-gold/40" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Invisible Recaptcha Anchor */}
      <div id="recaptcha-container"></div>

      <AnimatePresence mode="wait">
        {/* Step 1: Category Selection */}
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Select Category</h2>
              <p className="text-gray-500 text-sm">Choose grooming tailored for your styling needs</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <button 
                onClick={() => handleCategorySelect("male")}
                className="bg-cream-dark border border-gray-200 hover:border-gold/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 group hover:shadow-gold-glow text-center"
              >
                <div className="w-16 h-16 rounded-full bg-gold/5 flex items-center justify-center border border-gold/10 group-hover:border-gold/30 group-hover:bg-gold/10 transition-colors">
                  <Scissors className="w-8 h-8 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 group-hover:text-gold transition-colors">Men's</h3>
                  <p className="text-gray-500 text-xs mt-1">Grooming & Haircuts</p>
                </div>
              </button>

              <button 
                onClick={() => handleCategorySelect("female")}
                className="bg-cream-dark border border-gray-200 hover:border-gold/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 group hover:shadow-gold-glow text-center"
              >
                <div className="w-16 h-16 rounded-full bg-gold/5 flex items-center justify-center border border-gold/10 group-hover:border-gold/30 group-hover:bg-gold/10 transition-colors">
                  <Sparkles className="w-8 h-8 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 group-hover:text-gold transition-colors">Women's</h3>
                  <p className="text-gray-500 text-xs mt-1">Styling & Haircuts</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Service Selection */}
        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setStep(1)} 
                className="text-gray-500 hover:text-gold flex items-center gap-1 text-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <span className="text-xs uppercase tracking-wider text-gold font-semibold bg-gold/10 px-3 py-1 rounded-full">
                {category}
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Select Service</h2>
              <p className="text-gray-500 text-sm">Choose from our gold-standard collection</p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
                <span className="text-gray-500 text-sm">Crafting service list...</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {services.map((service) => (
                  <div 
                    key={service._id}
                    onClick={() => handleServiceSelect(service)}
                    className="bg-white border border-gray-200 hover:border-gold/20 rounded-xl p-4 flex items-center justify-between cursor-pointer group hover:bg-cream-deep transition-all duration-300"
                  >
                    <div className="space-y-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-gold transition-colors">
                        {service.name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {service.duration_minutes} mins
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gold text-lg">
                        ₹{service.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3: Date & Slot Selection */}
        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setStep(2)} 
                className="text-gray-500 hover:text-gold flex items-center gap-1 text-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <span className="text-xs text-gray-500 font-medium">
                {selectedService?.name}
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Pick Date & Time</h2>
              <p className="text-gray-500 text-sm">Select an available schedule</p>
            </div>

            {/* Dates Slider */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
              {dates.map((d) => (
                <button
                  key={d.dateStr}
                  onClick={() => handleDateSelect(d.dateStr)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl min-w-[64px] border shrink-0 transition-all duration-300 ${
                    selectedDate === d.dateStr
                      ? "bg-gold border-gold text-white shadow-gold-glow"
                      : "bg-white border-gray-200 text-gray-500 hover:border-gold/30 hover:text-gold"
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider">{d.dayName}</span>
                  <span className="text-lg font-bold mt-1">{d.dayNum}</span>
                  <span className="text-[9px] uppercase tracking-wide opacity-80">{d.monthName}</span>
                </button>
              ))}
            </div>

            {/* Slots Grid */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-gold/80 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Available Slots
              </h3>
              
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="w-6 h-6 text-gold animate-spin" />
                  <span className="text-gray-500 text-xs">Checking availability...</span>
                </div>
              ) : slots.length === 0 ? (
                <div className="bg-white/50 border border-gray-200 text-center py-10 rounded-xl text-gray-500 text-sm">
                  No slots available on this date.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {slots.map((slot) => {
                    const isSelected = selectedSlot?.time === slot.time;
                    return (
                      <button
                        key={slot.time}
                        onClick={() => handleSlotSelect(slot)}
                        className={`py-2 px-3 rounded-lg border text-center font-semibold text-xs transition-all duration-200 ${
                          isSelected
                            ? "bg-gold border-gold text-white shadow-gold-glow"
                            : "bg-white border-gray-200 text-gray-700 hover:border-gold/30 hover:text-gold"
                        }`}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Next Button */}
            <button
              onClick={() => setStep(4)}
              disabled={!selectedSlot}
              className="w-full btn-gold disabled:opacity-50 disabled:pointer-events-none mt-4 flex items-center justify-center gap-2 text-sm py-3.5"
            >
              Confirm Time <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Step 4: Details & SMS Verification triggering */}
        {step === 4 && !otpSent && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setStep(3)} 
                className="text-gray-500 hover:text-gold flex items-center gap-1 text-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-gold" /> {selectedDate}
                <Clock className="w-3.5 h-3.5 text-gold" /> {selectedSlot?.time}
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Your Details</h2>
              <p className="text-gray-500 text-sm">Verify via Phone OTP to secure booking</p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-gold/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="+919999999999"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:border-gold/50 focus:outline-none transition-colors"
                  />
                </div>
                <p className="text-[10px] text-gray-500">Include country code. Real SMS or Mock accepted.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Special Notes (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Styling preferences, requests, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm text-gray-900 placeholder-gray-500 focus:border-gold/50 focus:outline-none transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gold flex items-center justify-center gap-2 mt-4 text-sm py-3.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending Verification...
                  </>
                ) : (
                  <>
                    Verify & Book <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
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
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Enter OTP</h2>
              <p className="text-gray-500 text-sm">
                We sent a 6-digit verification code to <strong className="text-gray-900">{formData.phone}</strong>
              </p>
            </div>

            {otpError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs text-center">
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-white border border-gray-200 rounded-xl py-3.5 text-center text-2xl tracking-[0.5em] font-bold text-gold placeholder-gray-600 focus:border-gold/50 focus:outline-none transition-colors"
              />
              <p className="text-[11px] text-gray-500 text-center">
                Mock mode default code: <strong className="text-gold">123456</strong>
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="flex-1 btn-outline py-3 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="flex-1 btn-gold py-3 text-xs flex items-center justify-center gap-1"
                >
                  {otpLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Verify & Confirm"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Step 5: Booking Confirmed Screen */}
        {step === 5 && confirmedBooking && (
          <motion.div 
            key="step5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center"
          >
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold shadow-gold-glow">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-gold">Appointment Confirmed!</h2>
              <p className="text-gray-500 text-sm">
                Your reservation is secured. A confirmation message has been dispatched.
              </p>
            </div>

            {/* Receipt Ticket Visual */}
            <div className="bg-white border border-gray-200 rounded-2xl text-left overflow-hidden shadow-2xl relative">
              <div className="bg-gradient-to-r from-gold-dark/20 to-gold/5 px-6 py-4 border-b border-gray-200">
                <h3 className="font-bold text-xs uppercase tracking-wider text-gold">Booking Receipt</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Booking ID: #{confirmedBooking._id.slice(-6).toUpperCase()}</p>
              </div>
              
              <div className="p-6 space-y-4 text-sm relative">
                {/* Decorative punched holes on sides */}
                <div className="absolute w-4 h-4 rounded-full bg-cream -left-2 top-[35%] border-r border-gray-200" />
                <div className="absolute w-4 h-4 rounded-full bg-cream -right-2 top-[35%] border-l border-gray-200" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-2 border-b border-gray-200 pb-4">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Customer</span>
                    <p className="font-medium text-gray-900 mt-0.5">{confirmedBooking.customer_name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Service</span>
                    <p className="font-medium text-gold mt-0.5">{selectedService?.name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Date</span>
                    <p className="font-medium text-gray-900 mt-0.5">{confirmedBooking.date}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Time Slot</span>
                    <p className="font-medium text-gray-900 mt-0.5">{confirmedBooking.time_slot}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Duration</span>
                    <p className="font-medium text-gray-900 text-xs mt-0.5">{selectedService?.duration_minutes} mins</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Amount Paid</span>
                    <p className="font-bold text-gold text-lg mt-0.5">₹{selectedService?.price}</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={resetFlow}
              className="w-full btn-gold text-sm py-3.5"
            >
              Book Another Appointment
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
