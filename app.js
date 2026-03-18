/* app.js – core logic for the dashboard */
const Dashboard = (() => {
  // ----- private data -------------------------------------------------
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

  // ----- private helpers ---------------------------------------------
  function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ----- public API --------------------------------------------------
  return {
    getTime() {
      return new Date().toLocaleTimeString();
    },
    getRandomQuote() {
      return randomItem(quotes);
    },
    getRandomWeather() {
      return randomItem(mockWeatherData);
    }
  };
})();
