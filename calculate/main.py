from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from engine import calculate_cantilever_beam

app = FastAPI()

# Разрешаем CORS (пусть будет, не помешает)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/calculate")
def get_calculation(L: float, F: float, EI: float):
    return calculate_cantilever_beam(L, F, EI)

# А ЭТО САМОЕ ВАЖНОЕ ДЛЯ ХОСТИНГА:
# Теперь сервер будет искать файлы в папке 'frontend'
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")