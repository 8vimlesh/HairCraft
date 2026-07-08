const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

let authToken = localStorage.getItem("owner_token") || null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem("owner_token", token);
  } else {
    localStorage.removeItem("owner_token");
  }
};

export const getAuthToken = () => authToken;

const request = async (path, options = {}) => {
  const url = `${API_BASE}${path}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {}),
    ...options.headers,
  };
  
  const config = {
    ...options,
    headers,
  };
  
  try {
    const response = await fetch(url, config);
    const text = await response.text();
    
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (err) {
        data = text;
      }
    }
    
    if (!response.ok) {
      const errorMsg = (data && data.detail) || response.statusText || "Request failed";
      throw new Error(errorMsg);
    }
    
    return data;
  } catch (error) {
    console.error(`API Error on ${path}:`, error.message);
    throw error;
  }
};

export const api = {
  // Customer routes
  getServices: (category) => request(`/services?category=${category || ""}`),
  getClosedDates: () => request("/availability/closed-dates"),
  getAvailability: (date, serviceId) => request(`/availability?date=${date}&service_id=${serviceId}`),
  createBooking: (bookingData) => {
    const { id_token, ...rest } = bookingData;
    return request("/bookings", {
      method: "POST",
      headers: id_token ? { "Authorization": `Bearer ${id_token}` } : {},
      body: JSON.stringify(rest)
    });
  },
  
  // Owner Login
  ownerLogin: (idToken) => request("/owner/login", {
    method: "POST",
    body: JSON.stringify({ id_token: idToken })
  }),
  
  // Owner dashboard routes
  getBookings: () => request("/owner/bookings"),
  updateBookingStatus: (id, status) => request(`/owner/bookings/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status })
  }),
  rescheduleBooking: (id, date, timeSlot) => request(`/owner/bookings/${id}/reschedule`, {
    method: "POST",
    body: JSON.stringify({ date, time_slot: timeSlot })
  }),
  
  // Service management (CRUD)
  getAllServices: () => request("/owner/services"),
  createService: (serviceData) => request("/owner/services", {
    method: "POST",
    body: JSON.stringify(serviceData)
  }),
  updateService: (id, serviceData) => request(`/owner/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(serviceData)
  }),
  deactivateService: (id) => request(`/owner/services/${id}`, {
    method: "DELETE"
  }),
  
  // Configuration routes
  getConfig: () => request("/owner/config"),
  getAnalytics: () => request("/owner/analytics"),
  updateConfig: (configData) => request("/owner/config", {
    method: "PUT",
    body: JSON.stringify(configData)
  }),
  blockSlot: (blockData) => request("/owner/config/block", {
    method: "POST",
    body: JSON.stringify(blockData)
  }),
  unblockSlot: (blockData) => request("/owner/config/block", {
    method: "DELETE",
    body: JSON.stringify(blockData)
  })
};
