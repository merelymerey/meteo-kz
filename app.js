// =============================================================
// Meteo.KZ v2 — with extra cool effects
// =============================================================

const WMO = {
  0:{e:'☀️',t:'Ашық',fx:'clear'},
  1:{e:'🌤️',t:'Негізінен ашық',fx:'clear'},
  2:{e:'⛅',t:'Жартылай бұлтты',fx:'clear'},
  3:{e:'☁️',t:'Бұлтты',fx:'cloud'},
  45:{e:'🌫️',t:'Тұман',fx:'fog'},
  48:{e:'🌫️',t:'Қырау тұман',fx:'fog'},
  51:{e:'🌦️',t:'Жеңіл сіркіреме',fx:'rain'},
  53:{e:'🌦️',t:'Сіркіреме',fx:'rain'},
  55:{e:'🌧️',t:'Қалың сіркіреме',fx:'rain'},
  61:{e:'🌦️',t:'Жеңіл жаңбыр',fx:'rain'},
  63:{e:'🌧️',t:'Жаңбыр',fx:'rain'},
  65:{e:'🌧️',t:'Нөсер',fx:'rain'},
  71:{e:'🌨️',t:'Жеңіл қар',fx:'snow'},
  73:{e:'🌨️',t:'Қар',fx:'snow'},
  75:{e:'❄️',t:'Қалың қар',fx:'snow'},
  77:{e:'🌨️',t:'Қар дәні',fx:'snow'},
  80:{e:'🌦️',t:'Жаңбыр жауады',fx:'rain'},
  81:{e:'🌧️',t:'Қатты жаңбыр',fx:'rain'},
  82:{e:'⛈️',t:'Күшті нөсер',fx:'thunder'},
  85:{e:'🌨️',t:'Қар жауады',fx:'snow'},
  86:{e:'❄️',t:'Қатты қар',fx:'snow'},
  95:{e:'⛈️',t:'Найзағай',fx:'thunder'},
  96:{e:'⛈️',t:'Найзағай + бұршақ',fx:'thunder'},
  99:{e:'⛈️',t:'Күшті найзағай',fx:'thunder'}
};
const DAYS = ['Жс','Дс','Сс','Ср','Бс','Жм','Сб'];
const MONTHS = ['қаңтар','ақпан','наурыз','сәуір','мамыр','маусым','шілде','тамыз','қыркүйек','қазан','қараша','желтоқсан'];
const CITY_KK = {'Almaty':'Алматы','Astana':'Астана','Shymkent':'Шымкент','Aktobe':'Ақтөбе','Atyrau':'Атырау','Oral':'Орал','Kostanay':'Қостанай'};

let currentUnit='c', currentCity='Almaty', currentCoords={lat:43.238,lon:76.889}, currentData=null;
let currentFx='clear';

// ========================================================
// API
// ========================================================
async function fetchWeather(lat, lon){
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
    + `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure`
    + `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum`
    + `&timezone=auto&forecast_days=7`;
  const r = await fetch(url);
  if(!r.ok) throw new Error('API error');
  return r.json();
}

const conv = c => currentUnit==='f' ? c*9/5+32 : c;
const unitSym = () => currentUnit==='f' ? '°F' : '°C';

// ========================================================
// Rendering
// ========================================================
function setFavicon(emoji){
  const link = document.getElementById('favicon');
  link.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${emoji}</text></svg>`;
}

function renderCurrent(data, city){
  const c = data.current;
  const w = WMO[c.weather_code] || {e:'🌡️',t:'—',fx:'clear'};
  setFavicon(w.e);
  currentFx = w.fx;
  startWeatherFx(w.fx);

  document.getElementById('weather-card').innerHTML = `
    <div class="wc-head">
      <div>
        <div class="wc-city">${city}, ҚАЗАҚСТАН</div>
        <div class="wc-title">${new Date().getDate()} ${MONTHS[new Date().getMonth()]}</div>
        <div class="wc-meta">${DAYS[new Date().getDay()]}, ${new Date().toLocaleTimeString('kk-KZ',{hour:'2-digit',minute:'2-digit'})}</div>
      </div>
      <div class="wc-emoji">${w.e}</div>
    </div>
    <div class="wc-temp">${Math.round(conv(c.temperature_2m))}<sup>${unitSym()}</sup></div>
    <div class="wc-cond">${w.t} · Сезілетін ${Math.round(conv(c.apparent_temperature))}${unitSym()}</div>
    <div class="wc-stats">
      <div class="wc-stat"><div class="v">💨 ${Math.round(c.wind_speed_10m)}</div><div class="l">км/сағ</div></div>
      <div class="wc-stat"><div class="v">💧 ${c.relative_humidity_2m}%</div><div class="l">Ылғал</div></div>
      <div class="wc-stat"><div class="v">🧭 ${Math.round(c.surface_pressure)}</div><div class="l">гПа</div></div>
    </div>
  `;

  // Wind compass
  const arr = document.getElementById('compass-arrow');
  if(arr){ arr.style.transform = `rotate(${c.wind_direction_10m}deg)`; }
  const wt = document.getElementById('wind-title');
  if(wt) wt.textContent = `${Math.round(c.wind_speed_10m)} км/сағ`;

  // Sun arc
  if(data.daily && data.daily.sunrise){
    const sr = new Date(data.daily.sunrise[0]);
    const ss = new Date(data.daily.sunset[0]);
    const now = new Date();
    let t = (now - sr) / (ss - sr);
    t = Math.max(0, Math.min(1, t));
    const x = 40 + t * 320;
    const y = 200 - Math.sin(t * Math.PI) * 180;
    const dot = document.getElementById('sun-dot');
    if(dot){ dot.setAttribute('cx', x); dot.setAttribute('cy', y); }
    document.getElementById('sunrise-t').textContent = sr.toLocaleTimeString('kk-KZ',{hour:'2-digit',minute:'2-digit'});
    document.getElementById('sunset-t').textContent = ss.toLocaleTimeString('kk-KZ',{hour:'2-digit',minute:'2-digit'});
  }
}

function renderForecast(data){
  const d = data.daily;
  const grid = document.getElementById('forecast-grid');
  grid.innerHTML = '';
  for(let i=0;i<7;i++){
    const date = new Date(d.time[i]);
    const w = WMO[d.weather_code[i]] || {e:'🌡️',t:'—'};
    const card = document.createElement('div');
    card.className = 'fc-card tilt-card';
    card.style.animation = `card-in .5s ease ${i*.06}s both`;
    card.innerHTML = `
      <div class="fc-day">${i===0?'Бүгін':DAYS[date.getDay()]}</div>
      <div class="fc-date">${date.getDate()} ${MONTHS[date.getMonth()].slice(0,3)}</div>
      <div class="fc-icon">${w.e}</div>
      <div class="fc-hi">${Math.round(conv(d.temperature_2m_max[i]))}${unitSym()}</div>
      <div class="fc-lo">${Math.round(conv(d.temperature_2m_min[i]))}${unitSym()}</div>
    `;
    grid.appendChild(card);
  }
  attachTilt();
}

async function loadCity(name, lat, lon){
  currentCity = name;
  currentCoords = {lat, lon};
  document.getElementById('weather-card').innerHTML = '<div class="wc-loading">Деректер жүктелуде…</div>';
  try{
    const data = await fetchWeather(lat, lon);
    currentData = data;
    renderCurrent(data, CITY_KK[name] || name);
    renderForecast(data);
  }catch(e){
    document.getElementById('weather-card').innerHTML = '<div class="wc-loading">Қате: деректерді жүктеу мүмкін болмады</div>';
    console.error(e);
  }
}

// ========================================================
// Chip handlers
// ========================================================
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
    if(currentData){ renderCurrent(currentData, CITY_KK[currentCity]||currentCity); renderForecast(currentData); }
  });
});

async function searchCity(q){
  if(!q.trim()) return;
  try{
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=ru`);
    const j = await r.json();
    if(j.results && j.results[0]){
      const res = j.results[0];
      loadCity(res.name, res.latitude, res.longitude);
    }else alert('Қала табылмады');
  }catch(e){ alert('Іздеу қатесі'); }
}
document.getElementById('search-btn').addEventListener('click', () => searchCity(document.getElementById('city-input').value));
document.getElementById('city-input').addEventListener('keypress', e => { if(e.key==='Enter') searchCity(e.target.value); });

// ========================================================
// Theme toggle
// ========================================================
document.getElementById('theme').addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur==='dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});
if(localStorage.getItem('theme')==='dark') document.documentElement.setAttribute('data-theme','dark');

// ========================================================
// River bars
// ========================================================
document.querySelectorAll('.river-card').forEach(c => {
  c.querySelector('.fill').style.setProperty('--w', c.dataset.level+'%');
});

// ========================================================
// Particle network background
// ========================================================
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let particles = [];
function resize1(){ canvas.width=innerWidth; canvas.height=innerHeight; }
resize1(); addEventListener('resize', resize1);
function createParticles(){
  particles = [];
  const n = Math.floor(innerWidth/22);
  for(let i=0;i<n;i++) particles.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*2+.5,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,o:Math.random()*.5+.2});
}
createParticles();
function animatePart(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>canvas.width)p.vx*=-1;if(p.y<0||p.y>canvas.height)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(47,128,237,${p.o})`;ctx.fill();});
  for(let i=0;i<particles.length;i++) for(let j=i+1;j<particles.length;j++){const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y, d=Math.sqrt(dx*dx+dy*dy);if(d<120){ctx.beginPath();ctx.moveTo(particles[i].x,particles[i].y);ctx.lineTo(particles[j].x,particles[j].y);ctx.strokeStyle=`rgba(47,128,237,${.15*(1-d/120)})`;ctx.lineWidth=.6;ctx.stroke();}}
  requestAnimationFrame(animatePart);
}
animatePart();

// ========================================================
// Weather FX overlay — rain, snow, thunder
// ========================================================
const wfx = document.getElementById('weather-fx');
const wctx = wfx.getContext('2d');
let fxDrops = [], fxFlakes = [], fxFog = 0, lightningT = 0;
let fxMode = 'clear';
function resize2(){ wfx.width=innerWidth; wfx.height=innerHeight; }
resize2(); addEventListener('resize', resize2);

function startWeatherFx(mode){
  fxMode = mode;
  fxDrops = [];
  fxFlakes = [];
  if(mode==='rain' || mode==='thunder'){
    for(let i=0;i<180;i++) fxDrops.push({x:Math.random()*wfx.width,y:Math.random()*wfx.height,l:10+Math.random()*20,v:8+Math.random()*8});
  }
  if(mode==='snow'){
    for(let i=0;i<120;i++) fxFlakes.push({x:Math.random()*wfx.width,y:Math.random()*wfx.height,r:1+Math.random()*3,v:.5+Math.random()*1.5,dx:(Math.random()-.5)*.8});
  }
}
function animateWeatherFx(){
  wctx.clearRect(0,0,wfx.width,wfx.height);
  if(fxMode==='rain' || fxMode==='thunder'){
    wctx.strokeStyle = 'rgba(47,128,237,.45)';
    wctx.lineWidth = 1.2;
    fxDrops.forEach(d=>{
      wctx.beginPath();
      wctx.moveTo(d.x, d.y);
      wctx.lineTo(d.x-2, d.y+d.l);
      wctx.stroke();
      d.y += d.v;
      d.x -= 1;
      if(d.y > wfx.height){ d.y = -20; d.x = Math.random()*wfx.width; }
    });
    if(fxMode==='thunder'){
      if(Math.random() < 0.005) lightningT = 15;
      if(lightningT > 0){
        wctx.fillStyle = `rgba(255,255,255,${lightningT/15*.4})`;
        wctx.fillRect(0,0,wfx.width,wfx.height);
        lightningT--;
      }
    }
  }
  if(fxMode==='snow'){
    wctx.fillStyle = 'rgba(255,255,255,.9)';
    fxFlakes.forEach(f=>{
      wctx.beginPath();
      wctx.arc(f.x, f.y, f.r, 0, Math.PI*2);
      wctx.fill();
      f.y += f.v;
      f.x += f.dx;
      if(f.y > wfx.height){ f.y = -10; f.x = Math.random()*wfx.width; }
    });
  }
  requestAnimationFrame(animateWeatherFx);
}
animateWeatherFx();

// ========================================================
// 3D Tilt cards
// ========================================================
function attachTilt(){
  document.querySelectorAll('.tilt-card').forEach(c => {
    c.removeEventListener('mousemove', c._tilt);
    c._tilt = e => {
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = `perspective(1000px) rotateX(${-y*8}deg) rotateY(${x*8}deg) translateY(-4px)`;
    };
    c._reset = () => { c.style.transform = ''; };
    c.addEventListener('mousemove', c._tilt);
    c.addEventListener('mouseleave', c._reset);
  });
}
attachTilt();

// ========================================================
// Custom cursor
// ========================================================
const cur = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
let mx=0, my=0, rx=0, ry=0;
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cur.style.left = mx+'px'; cur.style.top = my+'px';
});
function animCursor(){
  rx += (mx - rx)*.15;
  ry += (my - ry)*.15;
  ring.style.left = rx+'px'; ring.style.top = ry+'px';
  requestAnimationFrame(animCursor);
}
animCursor();
document.addEventListener('mouseover', e => {
  if(e.target.closest('a,button,.chip,.tilt-card,input')) ring.classList.add('hover');
  else ring.classList.remove('hover');
});

// ========================================================
// Hero mouse-follow glow
// ========================================================
const heroGlow = document.getElementById('hero-glow');
const hero = document.querySelector('.hero');
hero.addEventListener('mousemove', e => {
  const r = hero.getBoundingClientRect();
  heroGlow.style.transform = `translate(${e.clientX - r.left - 200}px, ${e.clientY - r.top - 200}px)`;
});

// ========================================================
// Scroll progress
// ========================================================
const sp = document.getElementById('scroll-progress');
addEventListener('scroll', () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  sp.style.width = (scrollY/h*100)+'%';
});

// ========================================================
// Scroll reveal
// ========================================================
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting){ e.target.style.opacity=1; e.target.style.transform='translateY(0)'; }});
}, {threshold:.15});
document.querySelectorAll('.section, .fc-card, .river-card, .stat-card, .feat, .sun-card').forEach(el => {
  el.style.opacity=0; el.style.transform='translateY(30px)';
  el.style.transition = 'opacity .8s ease, transform .8s ease';
  io.observe(el);
});

// ========================================================
// Counter animation on stats
// ========================================================
const counterIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if(!e.isIntersecting) return;
    const el = e.target;
    const target = parseInt(el.dataset.count);
    if(!target || el.dataset.done) return;
    el.dataset.done = '1';
    let v = 0;
    const step = Math.max(1, Math.floor(target/40));
    const t = setInterval(() => {
      v += step;
      if(v >= target){ v = target; clearInterval(t); el.textContent = target+'+'; }
      else el.textContent = v;
    }, 25);
  });
}, {threshold:.5});
document.querySelectorAll('[data-count]').forEach(el => counterIO.observe(el));

// ========================================================
// Intro splash dismiss
// ========================================================
setTimeout(() => document.getElementById('intro').classList.add('hide'), 1400);

// ========================================================
// Konami code -> retro mode + confetti
// ========================================================
const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let kbuf = [];
document.addEventListener('keydown', e => {
  kbuf.push(e.key.toLowerCase().replace('arrowup','ArrowUp').replace('arrowdown','ArrowDown').replace('arrowleft','ArrowLeft').replace('arrowright','ArrowRight'));
  if(kbuf.length > 10) kbuf.shift();
  const k = kbuf.map(x => {
    if(x==='arrowup') return 'ArrowUp';
    if(x==='arrowdown') return 'ArrowDown';
    if(x==='arrowleft') return 'ArrowLeft';
    if(x==='arrowright') return 'ArrowRight';
    return x;
  });
  if(JSON.stringify(k) === JSON.stringify(konami)){
    triggerRetro();
    kbuf = [];
  }
});
function triggerRetro(){
  const html = document.documentElement;
  const isRetro = html.getAttribute('data-mode') === 'retro';
  html.setAttribute('data-mode', isRetro ? '' : 'retro');
  const badge = document.getElementById('retro-badge');
  badge.classList.add('show');
  setTimeout(() => badge.classList.remove('show'), 3000);
  fireConfetti();
}

// ========================================================
// Confetti
// ========================================================
const conf = document.getElementById('confetti');
const cctx = conf.getContext('2d');
function resize3(){ conf.width=innerWidth; conf.height=innerHeight; }
resize3(); addEventListener('resize', resize3);
let confPieces = [];
function fireConfetti(){
  for(let i=0;i<200;i++){
    confPieces.push({
      x: innerWidth/2, y: innerHeight/2,
      vx: (Math.random()-.5)*14,
      vy: (Math.random()-.7)*16,
      g: .3,
      r: Math.random()*6+3,
      color: ['#2F80ED','#2AC3BD','#F5B942','#E25C5C','#4AE3A8','#ff00ff','#39ff14'][Math.floor(Math.random()*7)],
      rot: Math.random()*Math.PI*2,
      vrot: (Math.random()-.5)*.2,
      life: 120
    });
  }
}
function animConf(){
  cctx.clearRect(0,0,conf.width,conf.height);
  confPieces = confPieces.filter(p => p.life > 0);
  confPieces.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += p.g; p.rot += p.vrot; p.life--;
    cctx.save();
    cctx.translate(p.x, p.y);
    cctx.rotate(p.rot);
    cctx.fillStyle = p.color;
    cctx.fillRect(-p.r/2, -p.r/2, p.r, p.r*1.5);
    cctx.restore();
  });
  requestAnimationFrame(animConf);
}
animConf();

// First-visit confetti (no localStorage flag = first time)
if(!localStorage.getItem('visited')){
  setTimeout(() => fireConfetti(), 2000);
  localStorage.setItem('visited','1');
}

// ========================================================
// Sound (ambient rain/wind via Web Audio)
// ========================================================
let audioCtx = null, audioNode = null, soundOn = false;
document.getElementById('sound').addEventListener('click', () => {
  if(!audioCtx){ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
  if(soundOn){
    if(audioNode){ audioNode.stop(); audioNode = null; }
    document.getElementById('sound').textContent = '🔇';
    soundOn = false;
  } else {
    // White noise for rain ambience
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for(let i=0;i<bufferSize;i++) output[i] = Math.random()*2-1;
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = currentFx==='rain'||currentFx==='thunder' ? 2000 : 400;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.05;
    noise.connect(filter).connect(gain).connect(audioCtx.destination);
    noise.start();
    audioNode = noise;
    document.getElementById('sound').textContent = '🔊';
    soundOn = true;
  }
});

// ========================================================
// AUTH (localStorage-based demo)
// ========================================================
const AUTH_KEY = 'meteo_auth_user';
const USERS_KEY = 'meteo_auth_users';

function getUsers(){ try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; } }
function saveUsers(u){ localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function getCurrentUser(){ try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch { return null; } }
function setCurrentUser(u){ if(u) localStorage.setItem(AUTH_KEY, JSON.stringify(u)); else localStorage.removeItem(AUTH_KEY); }

// Simple hash (demo only — not real security)
function hash(s){
  let h = 0;
  for(let i=0;i<s.length;i++){ h = ((h<<5)-h) + s.charCodeAt(i); h |= 0; }
  return h.toString(36);
}

function showToast(text){
  let t = document.querySelector('.toast');
  if(!t){
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = text;
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => t.classList.remove('show'), 3200);
}

function updateAuthUI(){
  const user = getCurrentUser();
  const authBtn = document.getElementById('auth-btn');
  const userMenu = document.getElementById('user-menu');
  const userAvatar = document.getElementById('user-avatar');
  const userEmail = document.getElementById('user-email');
  if(user){
    authBtn.classList.add('hidden');
    userMenu.classList.remove('hidden');
    userAvatar.textContent = (user.name || user.email || '?').charAt(0).toUpperCase();
    userEmail.textContent = user.email;
  } else {
    authBtn.classList.remove('hidden');
    userMenu.classList.add('hidden');
  }
}

// Open / close modal
const modal = document.getElementById('auth-modal');
function openModal(tab){
  modal.style.display = 'flex';
  requestAnimationFrame(() => modal.classList.add('show'));
  if(tab) switchTab(tab);
}
function closeModal(){
  modal.classList.remove('show');
  setTimeout(() => { modal.style.display = 'none'; }, 300);
  document.querySelectorAll('.auth-error').forEach(e => e.classList.remove('show'));
  document.querySelectorAll('.auth-form').forEach(f => f.reset());
}
document.getElementById('auth-btn').addEventListener('click', () => openModal('login'));
modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
document.addEventListener('keydown', e => { if(e.key==='Escape' && modal.classList.contains('show')) closeModal(); });

// Tabs
function switchTab(tab){
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.toggle('active', f.id === 'form-'+tab));
  document.querySelectorAll('.auth-error').forEach(e => e.classList.remove('show'));
}
document.querySelectorAll('.auth-tab').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
document.querySelectorAll('[data-switch]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); switchTab(a.dataset.switch); }));

function showError(id, msg){
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add('show');
}

// Signup
document.getElementById('form-signup').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  const name = f.name.value.trim();
  const email = f.email.value.trim().toLowerCase();
  const password = f.password.value;
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ showError('signup-error','Email дұрыс емес'); return; }
  const users = getUsers();
  if(users.find(u => u.email === email)){ showError('signup-error','Бұл email тіркелген'); return; }
  const user = { name, email, passHash: hash(password), createdAt: Date.now(), favorites: [] };
  users.push(user);
  saveUsers(users);
  setCurrentUser({ name, email, createdAt: user.createdAt });
  closeModal();
  updateAuthUI();
  showToast(`Қош келдіңіз, ${name}! 🎉`);
  fireConfetti();
});

// Login
document.getElementById('form-login').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target;
  const email = f.email.value.trim().toLowerCase();
  const password = f.password.value;
  const users = getUsers();
  const user = users.find(u => u.email === email);
  if(!user){ showError('login-error','Email табылмады'); return; }
  if(user.passHash !== hash(password)){ showError('login-error','Құпиясөз қате'); return; }
  setCurrentUser({ name: user.name, email: user.email, createdAt: user.createdAt });
  closeModal();
  updateAuthUI();
  showToast(`Қайта қош келдіңіз, ${user.name}! 👋`);
});

// User menu dropdown
document.getElementById('user-avatar').addEventListener('click', () => {
  document.getElementById('user-menu').classList.toggle('open');
});
document.addEventListener('click', e => {
  if(!e.target.closest('#user-menu')) document.getElementById('user-menu').classList.remove('open');
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
  const user = getCurrentUser();
  setCurrentUser(null);
  updateAuthUI();
  showToast(`Сау болыңыз, ${user?.name || 'user'}!`);
});

// Init on load
updateAuthUI();

// ========================================================
// Init
// ========================================================
loadCity('Almaty', 43.238, 76.889);
