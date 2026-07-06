import logging
import httpx
from app.core.config import settings

logger = logging.getLogger("haircraft")

class SMSClient:
    def __init__(self):
        self.account_sid = settings.TWILIO_ACCOUNT_SID
        self.auth_token = settings.TWILIO_AUTH_TOKEN
        self.from_number = settings.TWILIO_PHONE_NUMBER
        self.url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"

    @property
    def is_configured(self) -> bool:
        return bool(self.account_sid and self.auth_token and self.from_number)

    async def send_sms(self, to: str, text: str) -> bool:
        if not self.is_configured:
            logger.warning("Twilio SMS credentials not set. Skipping SMS send.")
            return False
            
        data = {
            "To": to,
            "From": self.from_number,
            "Body": text
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.url,
                    data=data,
                    auth=(self.account_sid, self.auth_token)
                )
                if response.status_code in [200, 201]:
                    logger.info(f"SMS successfully sent to {to} via Twilio")
                    return True
                else:
                    logger.error(f"Twilio API error ({response.status_code}): {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Failed to transmit SMS: {e}")
            return False
