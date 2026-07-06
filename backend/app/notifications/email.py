import logging
import httpx
from app.core.config import settings

logger = logging.getLogger("haircraft")

class EmailClient:
    def __init__(self):
        self.api_key = settings.RESEND_API_KEY
        self.from_email = settings.EMAIL_FROM
        self.url = "https://api.resend.com/emails"

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def send_email(self, to: str, subject: str, body_html: str) -> bool:
        if not self.is_configured:
            logger.warning("Resend Email credentials not set. Skipping Email send.")
            return False
            
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "from": self.from_email,
            "to": [to],
            "subject": subject,
            "html": body_html
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(self.url, json=payload, headers=headers)
                if response.status_code in [200, 201]:
                    logger.info(f"Email successfully sent to {to}")
                    return True
                else:
                    logger.error(f"Resend API error ({response.status_code}): {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Failed to transmit email: {e}")
            return False
