# Meteo.KZ

Қазақстанның ауа-райы және тасқын мониторингіне арналған ашық платформа.

Live → https://merelymerey.github.io/meteo-kz/

## Ерекшеліктер

- **Нақты уақыттағы ауа-райы** — Open-Meteo API арқылы
- **7 күнге болжам** — температура, жауын-шашын, жел
- **Өзен деңгейі** — Қазақстанның негізгі өзендерінің мониторингі
- **Қала іздеу** — геокодинг арқылы кез келген қала
- **Жарық / қараңғы тема**
- **Анимациялар** — parallax, particle network, smooth transitions
- **Mobile-first** адаптив дизайн

## Технологиялар

- Pure HTML / CSS / JS (framework жоқ)
- [Open-Meteo API](https://open-meteo.com) — тегін, токен жоқ
- Google Fonts (Inter)

## Жергілікті іске қосу

```bash
git clone https://github.com/merelymerey/meteo-kz.git
cd meteo-kz
python3 -m http.server 8000
# browser → http://localhost:8000
```

## Лицензия

MIT
