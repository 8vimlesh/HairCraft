import requests
import json
import datetime

API_URL = "http://localhost:8000/api"
date = datetime.date.today().strftime("%Y-%m-%d")

res = requests.get(f"{API_URL}/services?category=male")
services = res.json()
service_id = services[0]["_id"]

res = requests.get(f"{API_URL}/availability?date={date}&service_id={service_id}")
avail_before = res.json()

if not avail_before:
    print("No slots available to test.")
    exit()

slot_to_book = avail_before[0]["time"]
print(f"Booking slot: {slot_to_book}")

booking_payload = {
    "customer_name": "Test User",
    "mobile_number": "+919876543210", # Matches mock token
    "service_id": service_id,
    "date": date,
    "time_slot": slot_to_book,
    "notes": "",
    "id_token": "mock-token"
}
headers = {"Authorization": "Bearer mock-token"}

res = requests.post(f"{API_URL}/bookings", json=booking_payload, headers=headers)
print("Booking response:", res.status_code, res.json())

res = requests.get(f"{API_URL}/availability?date={date}&service_id={service_id}")
avail_after = res.json()

slot_still_there = any(s["time"] == slot_to_book for s in avail_after)
print(f"Is slot still there? {slot_still_there}")
