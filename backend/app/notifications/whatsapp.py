import logging
import httpx
from app.core.config import settings

logger = logging.getLogger("haircraft")

class WhatsAppClient:
    def __init__(self):
        self.api_token = settings.WHATSAPP_API_TOKEN
        self.phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID
        self.url = f"https://graph.facebook.com/v18.0/{self.phone_number_id}/messages"
        
    @property
    def is_configured(self) -> bool:
        return bool(self.api_token and self.phone_number_id)

    async def send_text_message(self, to: str, text: str) -> bool:
        if not self.is_configured:
            logger.warning("WhatsApp API credentials not set. Skipping send.")
            return False
            
        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "text",
            "text": {
                "preview_url": False,
                "body": text
            }
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(self.url, json=payload, headers=headers)
                if response.status_code in [200, 201]:
                    logger.info(f"WhatsApp message successfully sent to {to}")
                    return True
                else:
                    logger.error(f"WhatsApp API error ({response.status_code}): {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Failed to transmit WhatsApp message: {e}")
            return False
