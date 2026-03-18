document.addEventListener('DOMContentLoaded', () => {
  const timeEl    = document.getElementById('currentTime');
  const quoteEl   = document.getElementById('quoteText');
  const authorEl  = document.getElementById('quoteAuthor');
  const weatherEl = document.getElementById('weatherInfo');
  const themeBtn  = document.getElementById('toggleTheme');
  const quoteBtn  = document.getElementById('showQuote');
  const weatherBtn= document.getElementById('showWeather');

  function updateClock() {
    timeEl.textContent = Dashboard.getTime();
  }

  function showQuote() {
    const q = Dashboard.getRandomQuote();
    quoteEl.textContent = q.text;
    authorEl.textContent = '— ' + q.author;
  }

  function showWeather() {
    const w = Dashboard.getRandomWeather();
    weatherEl.innerHTML = `<p><strong>${w.city}</strong>: ${w.temp}°C, ${w.desc}</p>`;
  }

  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
  }

  // initial render
  updateClock();
  setInterval(updateClock, 1000);
  showQuote();
  showWeather();

  // event listeners
  themeBtn.addEventListener('click', toggleTheme);
  quoteBtn.addEventListener('click', showQuote);
  weatherBtn.addEventListener('click', showWeather);
});
