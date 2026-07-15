import requests
from app.config import settings

def authenticate_user(username: str, password: str):
    payload = {
        "token": "drishtee",
        "username": username,
        "password": password
    }

    try:
        response = requests.post(settings.API_URL, data=payload, verify=False)
        response.raise_for_status()
        data = response.json()
        # print(response.json())
        if data.get("Data") and data["Data"][0].get("user_code") != 0:
            return {
                "success": True,
                "email": data["Data"][0].get("user_email"),
                "first_name": data["Data"][0].get("first_name")
            }
        

        print("API RESPONSE:", data)
        return {"success": False, "message": "Invalid credentials"}

    except Exception as e:
        return {"success": False, "message": str(e)}