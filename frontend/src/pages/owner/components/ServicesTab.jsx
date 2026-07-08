import React from "react";
import { Plus, Clock, Edit3, Trash2 } from "lucide-react";

export default function ServicesTab({
  services,
  setEditingServiceId,
  setServiceForm,
  setIsServiceModalOpen,
  handleEditService,
  handleDeactivateService
}) {
  return (
    <div className="bg-charcoal-light/30 border border-white/5 backdrop-blur-sm rounded-3xl p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-serif font-bold text-xl text-gray-100 tracking-tight">Services Catalog</h3>
        <button 
          onClick={() => {
            setEditingServiceId(null);
            setServiceForm({ _id: null, name: "", category: "male", duration_minutes: 30, price: 300, active: true });
            setIsServiceModalOpen(true);
          }}
          className="btn-gold flex items-center gap-1.5 py-2 px-4 text-xs font-semibold rounded-xl shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.2)] font-sans"
        >
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {services.map((service) => (
          <div 
            key={service._id} 
            className={`bg-charcoal-deep/50 border rounded-2xl p-5 space-y-4 relative flex flex-col justify-between transition-all duration-300 font-sans ${
              service.active ? "border-white/10 hover:border-gold/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.05)]" : "border-red-500/20 opacity-60"
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-gray-100 text-base">
                  {service.name}
                </h4>
                <span className={`text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full ${
                  service.category === "male" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                }`}>
                  {service.category}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-500" /> {service.duration_minutes} mins
                </span>
                <span className="flex items-center gap-1 text-gold font-bold">
                  ₹{service.price}
                </span>
              </div>
            </div>

            <div className="flex gap-2 border-t border-white/5 pt-3 justify-end text-xs font-semibold">
              <button
                onClick={() => handleEditService(service)}
                className="flex items-center gap-1 p-2 bg-charcoal-light hover:bg-charcoal-light/80 rounded-lg border border-white/10 text-gray-300 hover:text-gold hover:border-gold/30 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              {service.active && (
                <button
                  onClick={() => handleDeactivateService(service._id)}
                  className="flex items-center gap-1 p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Deactivate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
