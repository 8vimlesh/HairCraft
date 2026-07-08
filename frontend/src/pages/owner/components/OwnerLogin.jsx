import React from "react";
import { Shield, Phone, Loader2 } from "lucide-react";

export default function OwnerLogin({
  loginPhone,
  setLoginPhone,
  otpSent,
  setOtpSent,
  otpCode,
  setOtpCode,
  error,
  loginLoading,
  handleLoginSubmit,
  handleVerifyOtp,
}) {
  return (
    <div className="max-w-md mx-auto w-full px-4 py-16">
      <div id="recaptcha-owner-container"></div>
      <div className="bg-charcoal-light/50 border border-white/5 backdrop-blur-md rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Subtle gold top border */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gold-dark via-gold to-gold-dark" />
        
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gold/5 border border-gold/20 flex items-center justify-center text-gold mb-2 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-serif font-bold tracking-tight gold-gradient-text">Owner Portal</h2>
          <p className="text-gray-400 text-sm font-sans">Log in using owner's credentials</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs text-center font-medium">
            {error}
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-sans">Owner Phone *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="+919999999999"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  className="w-full bg-charcoal-deep/80 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-100 placeholder-gray-600 focus:border-gold/50 focus:ring-1 focus:ring-gold/30 focus:outline-none transition-all font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full btn-gold flex items-center justify-center gap-2 py-3.5 text-sm font-sans rounded-xl mt-2"
            >
              {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Verification OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center block font-sans">Enter 6-digit Code</label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-charcoal-deep/80 border border-white/10 rounded-xl py-3 text-center text-xl font-bold tracking-[0.5em] text-gold placeholder-gray-700 focus:border-gold/50 focus:ring-1 focus:ring-gold/30 focus:outline-none transition-all font-mono"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="flex-1 bg-charcoal-light/50 border border-white/10 hover:border-gold/30 hover:text-gold text-gray-300 py-2.5 text-xs font-semibold rounded-xl transition-all font-sans"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loginLoading}
                className="flex-1 btn-gold py-2.5 text-xs font-semibold flex items-center justify-center rounded-xl font-sans"
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
