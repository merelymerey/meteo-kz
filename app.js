// ===============================================================
// Meteo.KZ — interactive front-end
// Data: Open-Meteo API (free, no key needed)
// ===============================================================

const WMO = {
  0:  {emoji:'☀️', text:'Ашық'},
  1:  {emoji:'🌤️', text:'Негізінен ашық'},
  2:  {emoji:'⛅', text:'Жартылай бұлтты'},
  3:  {emoji:'☁️', text:'Бұлтты'},
  45: {emoji:'🌫️', text:'Тұман'},
  48: {emoji:'🌫️', text:'Қырау тұман'},
  51: {emoji:'🌦️', text:'Жеңіл сіркіреме'},
  53: {emoji:'🌦️', text:'Сіркіреме'},
  55: {emoji:'🌧️', text:'Қалың сіркіреме'},
  61: {emoji:'🌦️', text:'Жеңіл жаңбыр'},
  63: {emoji:'🌧️', text:'Жаңбыр'},
  65: {emoji:'🌧️', text:'Нөсер'},
  71: {emoji:'🌨️', text:'Жеңіл қар'},
  73: {emoji:'🌨️', text:'Қар'},
  75: {emoji:'❄️', text:'Қалың қар'},
  77: {emoji:'🌨️', text:'Қар дәні'},
  80: {emoji:'🌦️', text:'Жаңбыр жауады'},
  81: {emoji:'🌧️', text:'Қатты жаңбыр'},
  82: {emoji:'⛈️', text:'Күшті нөсер'},
  85: {emoji:'🌨️', text:'Қар жауады'},
  86: {emoji:'❄️', text:'Қатты қар'},
  95: {emoji:'⛈️', text:'Найзағай'},
  96: {emoji:'⛈️', text:'Найзағай + бұршақ'},
  99: {emoji:'⛈️', text:'Күшті найзағай'},
};

const DAYS = ['Жс','Дс','Сс','Ср','Бс','Жм','Сб'];
const MONTHS = ['қаңтар','ақпан','наурыз','сәуір','мамыр','маусым','шілде','тамыз','қыркүйек','қазан','қараша','желтоқсан'];

let currentUnit = 'c';
let currentCity = 'Almaty';
let currentCoords = {lat:43.238, lon:76.889};
let currentData = null;

// ===============================================================
// Fetch weather
// ===============================================================
async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
    + `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure`
    + `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum`
    + `&timezone=auto&forecast_days=7`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('API error');
  return r.json();
}

// ===============================================================
// Convert temperature
// ===============================================================
function conv(c){ return currentUnit === 'f' ? c*9/5+32 : c; }
function unitSymbol(){ return currentUnit === 'f' ? '°F' : '°C'; }

// ===============================================================
// Render current weather card
// ===============================================================
function renderCurrent(data, cityName) {
  const c = data.current;
  const w = WMO[c.weather_code] || {emoji:'🌡️', text:'—'};
  const card = document.getElementById('weather-card');
  card.innerHTML = `
    <div class="wc-head">
      <div>
        <div class="wc-city">${cityName}, ҚАЗАҚСТАН</div>
        <div class="wc-title">${new Date().getDate()} ${MONTHS[new Date().getMonth()]}</div>
        <div class="wc-meta">${DAYS[new Date().getDay()]}, ${new Date().toLocaleTimeString('kk-KZ',{hour:'2-digit',minute:'2-digit'})}</div>
      </div>
      <div class="wc-emoji">${w.emoji}</div>
    </div>
    <div class="wc-temp">${Math.round(conv(c.temperature_2m))}<sup>${unitSymbol()}</sup></div>
    <div class="wc-cond">${w.text} · Сезілетін ${Math.round(conv(c.apparent_temperature))}${unitSymbol()}</div>
    <div class="wc-stats">
      <div class="wc-stat"><div class="v">💨 ${Math.round(c.wind_speed_10m)}</div><div class="l">км/сағ</div></div>
      <div class="wc-stat"><div class="v">💧 ${c.relative_humidity_2m}%</div><div class="l">Ылғал</div></div>
      <div class="wc-stat"><div class="v">🧭 ${Math.round(c.surface_pressure)}</div><div class="l">гПа</div></div>
    </div>
  `;
}

// ===============================================================
// Render 7-day forecast
// ===============================================================
function renderForecast(data) {
  const d = data.daily;
  const grid = document.getElementById('forecast-grid');
  grid.innerHTML = '';
  for (let i=0; i<7; i++) {
    const date = new Date(d.time[i]);
    const w = WMO[d.weather_code[i]] || {emoji:'🌡️', text:'—'};
    const card = document.createElement('div');
    card.className = 'fc-card';
    card.style.animation = `card-in .5s ease ${i*0.05}s both`;
    card.innerHTML = `
      <div class="fc-day">${i===0?'Бүгін':DAYS[date.getDay()]}</div>
      <div class="fc-date">${date.getDate()} ${MONTHS[date.getMonth()].slice(0,3)}</div>
      <div class="fc-icon">${w.emoji}</div>
      <div class="fc-hi">${Math.round(conv(d.temperature_2m_max[i]))}${unitSymbol()}</div>
      <div class="fc-lo">${Math.round(conv(d.temperature_2m_min[i]))}${unitSymbol()}</div>
    `;
    grid.appendChild(card);
  }
}

// ===============================================================
// Load city
// ===============================================================
async function loadCity(name, lat, lon) {
  currentCity = name;
  currentCoords = {lat, lon};
  document.getElementById('weather-card').innerHTML = '<div class="wc-loading">Деректер жүктелуде…</div>';
  try {
    const data = await fetchWeather(lat, lon);
    currentData = data;
    const kzName = {
      'Almaty':'Алматы','Astana':'Астана','Shymkent':'Шымкент',
      'Aktobe':'Ақтөбе','Atyrau':'Атырау','Oral':'Орал','Kostanay':'Қостанай'
    }[name] || name;
    renderCurrent(data, kzName);
    renderForecast(data);
  } catch (e) {
    document.getElementById('weather-card').innerHTML = '<div class="wc-loading">Қате: деректерді жүктеу мүмкін болмады</div>';
    console.error(e);
  }
}

// ===============================================================
// Events
// ===============================================================
document.querySelectorAll('.chip').forEach(btn => {
  btn.addEventListener('click', () => {
    loadCity(btn.dataset.city, parseFloat(btn.dataset.lat), parseFloat(btn.dataset.lon));
    document.querySelectorAll('.chip').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  });
});

document.querySelectorAll('.ut-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.ut-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    currentUnit = btn.dataset.unit;
    if (currentData) {
      renderCurrent(currentData, {'Almaty':'Алматы','Astana':'Астана','Shymkent':'Шымкент','Aktobe':'Ақтөбе','Atyrau':'Атырау','Oral':'Орал','Kostanay':'Қостанай'}[currentCity]||currentCity);
      renderForecast(currentData);
    }
  });
});

// City search via geocoding
async function searchCity(q) {
  if (!q.trim()) return;
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=ru`);
    const j = await r.json();
    if (j.results && j.results[0]) {
      const res = j.results[0];
      loadCity(res.name, res.latitude, res.longitude);
    } else {
      alert('Қала табылмады');
    }
  } catch(e){ alert('Іздеу қатесі'); }
}
document.getElementById('search-btn').addEventListener('click', () => {
  searchCity(document.getElementById('city-input').value);
});
document.getElementById('city-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchCity(e.target.value);
});

// ===============================================================
// Theme toggle
// ===============================================================
document.getElementById('theme').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  document.documentElement.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
  localStorage.setItem('theme', document.documentElement.getAttribute('data-theme'));
});
// restore theme
if (localStorage.getItem('theme') === 'dark') document.documentElement.setAttribute('data-theme','dark');

// ===============================================================
// River level bars — set width based on data-level
// ===============================================================
document.querySelectorAll('.river-card').forEach(c => {
  const l = c.dataset.level;
  c.querySelector('.fill').style.setProperty('--w', l+'%');
});

// ===============================================================
// Particle background — floating dots
// ===============================================================
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];

function resize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function createParticles(){
  particles = [];
  const count = Math.floor(window.innerWidth / 20);
  for (let i=0;i<count;i++){
    particles.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      r: Math.random()*2 + 0.5,
      vx: (Math.random()-.5)*0.3,
      vy: (Math.random()-.5)*0.3,
      opacity: Math.random()*0.5 + 0.2
    });
  }
}
createParticles();

function animate(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x<0||p.x>canvas.width) p.vx *= -1;
    if (p.y<0||p.y>canvas.height) p.vy *= -1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fillStyle = `rgba(47,128,237,${p.opacity})`;
    ctx.fill();
  });
  // Draw connecting lines
  for (let i=0;i<particles.length;i++){
    for (let j=i+1;j<particles.length;j++){
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d < 120){
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(47,128,237,${.15*(1-d/120)})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(animate);
}
animate();

// ===============================================================
// Scroll reveal
// ===============================================================
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting){
      e.target.style.opacity = 1;
      e.target.style.transform = 'translateY(0)';
    }
  });
}, {threshold:0.15});
document.querySelectorAll('.section, .fc-card, .river-card, .stat-card, .feat').forEach(el => {
  el.style.opacity = 0;
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity .8s ease, transform .8s ease';
  io.observe(el);
});

// ===============================================================
// Init
// ===============================================================
loadCity('Almaty', 43.238, 76.889);
