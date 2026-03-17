/* -------------------------------------------------
   1️⃣  Wait for the DOM to be ready
   ------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {

  /* -------------------------------------------------
     2️⃣  Cache frequently used elements
     ------------------------------------------------- */
  const timeEl    = document.getElementById('currentTime');
  const quoteEl   = document.getElementById('quoteText');
  const authorEl  = document.getElementById('quoteAuthor');
  const weatherEl = document.getElementById('weatherInfo');
  const themeBtn  = document.getElementById('toggleTheme');
  const quoteBtn  = document.getElementById('showQuote');
  const weatherBtn= document.getElementById('showWeather');

  /* -------------------------------------------------
     3️⃣  Data sources
     ------------------------------------------------- */
  const quotes = [
    {text:"The only limit to our realization of tomorrow is our doubts of today.",author:"Franklin D. Roosevelt"},
    {text:"Life is what happens when you're busy making other plans.",author:"John Lennon"},
    {text:"Do not watch the clock. Do what it does. Keep going.",author:"Sam Levenson"},
    {text:"The purpose of our lives is to be happy.",author:"Dalai Lama"},
    {text:"In the middle of difficulty lies opportunity.",author:"Albert Einstein"},
    {text:"You miss 100% of the shots you don’t take.",author:"Wayne Gretzky"},
    {text:"It does not matter how slowly you go as long as you do not stop.",author:"Confucius"}
  ];

  const mockWeatherData = [
    {city:"Springfield",temp:22,desc:"Partly cloudy"},
    {city:"Metropolis",temp:28,desc:"Sunny"},
    {city:"Gotham",temp:18,desc:"Rainy"},
    {city:"Atlantis",temp:24,desc:"Ocean breeze"}
  ];

  /* -------------------------------------------------
     4️⃣  Helper functions
     ------------------------------------------------- */

  // 4.1 Clock – updates every second
  function updateTime() {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString();
  }

  // 4.2 Random quote
  function randomQuote() {
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    quoteEl.textContent = q.text;
    authorEl.textContent = '— ' + q.author;
  }

  // 4.3 Mock weather (random entry from array)
  function randomWeather() {
    const w = mockWeatherData[Math.floor(Math.random() * mockWeatherData.length)];
    weatherEl.innerHTML = `<p><strong>${w.city}</strong>: ${w.temp}°C, ${w.desc}</p>`;
  }

  // 4.4 Theme toggle
  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
  }

  // 4.5 Utility – log activity (helps debugging)
  function logActivity(msg) {
    console.log(`[Dashboard] ${msg}`);
  }

  /* -------------------------------------------------
     5️⃣  Initial render
     ------------------------------------------------- */
  updateTime();               // show time immediately
  setInterval(updateTime, 1000);
  randomQuote();              // first quote
  randomWeather();            // first weather entry
  logActivity('Dashboard initialized');

  /* -------------------------------------------------
     6️⃣  Event listeners
     ------------------------------------------------- */
  themeBtn.addEventListener('click', () => {
    toggleTheme();
    logActivity('Theme toggled');
  });

  quoteBtn.addEventListener('click', () => {
    randomQuote();
    logActivity('New quote displayed');
  });

  weatherBtn.addEventListener('click', () => {
    randomWeather();
    logActivity('Weather refreshed');
  });

}); // end DOMContentLoaded
