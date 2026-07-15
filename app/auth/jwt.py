from itsdangerous import URLSafeSerializer
from app.config import settings

serializer = URLSafeSerializer(settings.SECRET_KEY)

def create_session(data: dict):
    return serializer.dumps(data)

def verify_session(token: str):
    try:
        return serializer.loads(token)
    except Exception:
        return None