# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Импортируем функцию расчета из нашего соседнего модуля engine
from engine import calculate_cantilever_beam

app = FastAPI()

# Разрешаем фронтенду (даже если он запущен локально) делать запросы к бэкенду
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/calculate")
def get_calculation(L: float, F: float, EI: float):
    # Вызываем наш изолированный движок
    results = calculate_cantilever_beam(L, F, EI)
    return results

# Запуск сервера в терминале командой: uvicorn main:app --reload