import os
import logging
from datetime import datetime
from app.notifications.whatsapp import WhatsAppClient
from app.notifications.sms import SMSClient
from app.notifications.email import EmailClient

logger = logging.getLogger("haircraft")

# Path to local notification logs
LOG_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "notifications.log")

def write_to_log(channel: str, to: str, event_type: str, body: str):
    """Log the notification to a local file for verification when APIs are not configured."""
    log_line = f"[{datetime.utcnow().isoformat()}] [{channel.upper()}] To: {to} | Event: {event_type} | Message: {body}\n"
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(log_line)
    except Exception as e:
        logger.error(f"Failed to write to notification log file: {e}")

class NotificationDispatcher:
    def __init__(self):
        self.wa_client = WhatsAppClient()
        self.sms_client = SMSClient()
        self.email_client = EmailClient()

    async def dispatch_booking_confirmed(self, booking: dict):
        msg = f"Hi {booking['customer_name']}, your appointment for {booking['service_name']} is CONFIRMED on {booking['date']} at {booking['time_slot']}. See you soon! - Hair Craft Salon"
        
        # 1. WhatsApp confirmation
        sent_wa = False
        if self.wa_client.is_configured:
            sent_wa = await self.wa_client.send_text_message(booking['mobile_number'], msg)
            
        if not sent_wa:
            # Fallback to SMS if real Twilio is configured
            sent_sms = False
            if self.sms_client.is_configured:
                sms_text = f"Hair Craft: Your booking for {booking['service_name']} on {booking['date']} at {booking['time_slot']} is confirmed."
                sent_sms = await self.sms_client.send_sms(booking['mobile_number'], sms_text)
            
            if not sent_sms:
                logger.info(f"[MOCK WHATSAPP/SMS FALLBACK] {booking['mobile_number']}: {msg}")
                write_to_log("whatsapp", booking['mobile_number'], "booking_confirmed", msg)
                
        # 2. Email Confirmation Record
        email_subj = f"Appointment Confirmed - Hair Craft Salon"
        email_html = f"""
        <h3>Hello {booking['customer_name']},</h3>
        <p>Your appointment for <strong>{booking['service_name']}</strong> has been confirmed.</p>
        <ul>
            <li><strong>Date:</strong> {booking['date']}</li>
            <li><strong>Time Slot:</strong> {booking['time_slot']}</li>
            <li><strong>Booking ID:</strong> #{booking['_id']}</li>
        </ul>
        <p>Thank you for choosing Hair Craft Salon!</p>
        """
        
        sent_email = False
        if self.email_client.is_configured:
            sent_email = await self.email_client.send_email("customer@example.com", email_subj, email_html)
            
        if not sent_email:
            write_to_log("email", "customer@example.com", "booking_confirmed", f"Subject: {email_subj} | HTML: {email_html}")

    async def dispatch_booking_cancelled(self, booking: dict):
        msg = f"Hi {booking['customer_name']}, your appointment for {booking['service_name']} on {booking['date']} at {booking['time_slot']} has been CANCELLED. - Hair Craft Salon"
        
        sent_wa = False
        if self.wa_client.is_configured:
            sent_wa = await self.wa_client.send_text_message(booking['mobile_number'], msg)
            
        if not sent_wa:
            sent_sms = False
            if self.sms_client.is_configured:
                sms_text = f"Hair Craft: Your booking for {booking['service_name']} on {booking['date']} at {booking['time_slot']} has been cancelled."
                sent_sms = await self.sms_client.send_sms(booking['mobile_number'], sms_text)
                
            if not sent_sms:
                logger.info(f"[MOCK WHATSAPP/SMS FALLBACK] {booking['mobile_number']}: {msg}")
                write_to_log("whatsapp", booking['mobile_number'], "booking_cancelled", msg)

    async def dispatch_booking_rescheduled(self, booking: dict):
        msg = f"Hi {booking['customer_name']}, your appointment for {booking['service_name']} has been RESCHEDULED to {booking['date']} at {booking['time_slot']} (previously on {booking['old_date']} at {booking['old_time_slot']}). - Hair Craft Salon"
        
        sent_wa = False
        if self.wa_client.is_configured:
            sent_wa = await self.wa_client.send_text_message(booking['mobile_number'], msg)
            
        if not sent_wa:
            sent_sms = False
            if self.sms_client.is_configured:
                sms_text = f"Hair Craft: Your booking has been rescheduled to {booking['date']} at {booking['time_slot']}."
                sent_sms = await self.sms_client.send_sms(booking['mobile_number'], sms_text)
                
            if not sent_sms:
                logger.info(f"[MOCK WHATSAPP/SMS FALLBACK] {booking['mobile_number']}: {msg}")
                write_to_log("whatsapp", booking['mobile_number'], "booking_rescheduled", msg)

    async def dispatch_reminder(self, booking: dict, timing: str):
        msg = f"Reminder: Hi {booking['customer_name']}, your appointment for {booking['service_name']} is in {timing} (on {booking['date']} at {booking['time_slot']}). - Hair Craft Salon"
        
        sent_wa = False
        if self.wa_client.is_configured:
            sent_wa = await self.wa_client.send_text_message(booking['mobile_number'], msg)
            
        if not sent_wa:
            sent_sms = False
            if self.sms_client.is_configured:
                sms_text = f"Reminder: Your Hair Craft appointment is in {timing} (on {booking['date']} at {booking['time_slot']})."
                sent_sms = await self.sms_client.send_sms(booking['mobile_number'], sms_text)
                
            if not sent_sms:
                logger.info(f"[MOCK WHATSAPP/SMS FALLBACK] {booking['mobile_number']}: {msg}")
                write_to_log("whatsapp", booking['mobile_number'], f"reminder_{timing}", msg)

notification_dispatcher = NotificationDispatcher()
