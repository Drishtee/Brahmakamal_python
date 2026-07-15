from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    #  Auth / External APIs
    API_URL: str
    SECRET_KEY: str

    #  Database
    DB_SERVER: str
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str
    DB_DRIVER: str = "ODBC Driver 17 for SQL Server"

    class Config:
        env_file = ".env"


settings = Settings()