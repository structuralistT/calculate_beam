# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
# Импортируем функцию расчета из нашего модуля engine
from engine import calculate_cantilever_beam

app = FastAPI()

# Разрешаем CORS для локальной разработки
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

# ЭТА СТРОКА ПОЗВОЛЯЕТ ХОСТИНГУ ВИДЕТЬ ТВОИ ФАЙЛЫ
# Если ты всё перенесла в корень, оставляем directory="."
app.mount("/", StaticFiles(directory=".", html=True), name="static")

# Запуск сервера в терминале командой: uvicorn main:app --reload