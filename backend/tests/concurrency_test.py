import asyncio
# pyrefly: ignore [missing-import]
import httpx
import sys

BASE_URL = "http://127.0.0.1:8000/api"

async def book_slot(client: httpx.AsyncClient, phone: str, service_id: str, date: str, slot: str) -> httpx.Response:
    # Generate the mock authorization token containing this phone number
    token = f"mock-customer-token-{phone}"
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "customer_name": f"Concurrent User {phone[-2:]}",
        "mobile_number": phone,
        "service_id": service_id,
        "date": date,
        "time_slot": slot,
        "notes": "Concurrency Test Request"
      }
    
    # Send the request
    return await client.post(f"{BASE_URL}/bookings", json=payload, headers=headers)

async def run_concurrency_test():
    print("Starting Concurrency Test...")
    print(f"Connecting to Backend Server at: {BASE_URL}")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Fetch available services to find a valid service ID
        try:
            services_resp = await client.get(f"{BASE_URL}/services")
            if services_resp.status_code != 200:
                print(f"ERROR: Failed to retrieve services list. Status Code: {services_resp.status_code}")
                sys.exit(1)
            
            services = services_resp.json()
            if not services:
                print("ERROR: No services found in DB. Make sure the database is seeded.")
                sys.exit(1)
                
            service_id = services[0]["_id"]
            service_name = services[0]["name"]
            print(f"Found Service: '{service_name}' (ID: {service_id}) for booking tests.")
        except Exception as e:
            print(f"ERROR: Cannot connect to server. Is FastAPI running on port 8000? Exception: {e}")
            sys.exit(1)

        # 2. Define the target slot to book
        test_date = "2026-09-10"
        test_slot = "14:00"
        print(f"Target Slot: Date = {test_date}, Time = {test_slot}")

        # 3. Build 10 concurrent requests with different phone numbers
        # (This simulates 10 different customers clicking book at the exact same millisecond)
        tasks = []
        for i in range(10):
            # Create unique phone number: +919999999900, +919999999901, ...
            phone = f"+9199999999{i:02d}"
            tasks.append(book_slot(client, phone, service_id, test_date, test_slot))
            
        print("Spawning 10 concurrent booking requests simultaneously...")
        responses = await asyncio.gather(*tasks)
        print("All requests processed. Analyzing results...")

        # 4. Assert responses
        success_count = 0
        conflict_count = 0
        other_count = 0

        for idx, resp in enumerate(responses):
            phone = f"+9199999999{idx:02d}"
            status = resp.status_code
            
            if status == 201:
                success_count += 1
                booking = resp.json()
                print(f" -> Request #{idx} ({phone}): SUCCESS (201 Created). Booking ID: {booking['_id']}")
            elif status == 409:
                conflict_count += 1
                print(f" -> Request #{idx} ({phone}): CONFLICT (409 Conflict). Message: {resp.json().get('detail')}")
            else:
                other_count += 1
                print(f" -> Request #{idx} ({phone}): ERROR ({status}). Response: {resp.text}")

        print("\n=== CONCURRENCY TEST REPORT ===")
        print(f"Successful Bookings:  {success_count} (Expected: 1)")
        print(f"Conflict Bookings:    {conflict_count} (Expected: 9)")
        print(f"Other Errors:         {other_count} (Expected: 0)")
        
        # Validate safety guarantees
        if success_count == 1 and conflict_count == 9:
            print("\n[PASS] TEST PASSED: Concurrency safety guarantees fully validated. Zero double bookings occurred!")
            sys.exit(0)
        else:
            print("\n[FAIL] TEST FAILED: Concurrency safety rules breached or database error occurred.")
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_concurrency_test())
