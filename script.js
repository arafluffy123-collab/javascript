document.addEventListener('DOMContentLoaded', () => {
  const timeEl=document.getElementById('currentTime')
  const quoteEl=document.getElementById('quoteText')
  const authorEl=document.getElementById('quoteAuthor')
  const weatherEl=document.getElementById('weatherInfo')
  const themeBtn=document.getElementById('toggleTheme')
  const quoteBtn=document.getElementById('showQuote')
  const quotes=[
    {text:"The only limit to our realization of tomorrow is our doubts of today.",author:"Franklin D. Roosevelt"},
    {text:"Life is what happens when you're busy making other plans.",author:"John Lennon"},
    {text:"Do not watch the clock. Do what it does. Keep going.",author:"Sam Levenson"},
    {text:"The purpose of our lives is to be happy.",author:"Dalai Lama"},
    {text:"In the middle of difficulty lies opportunity.",author:"Albert Einstein"}
  ]
  function updateTime(){
    const now=new Date()
    timeEl.textContent=now.toLocaleTimeString()
  }
  function randomQuote(){
    const q=quotes[Math.floor(Math.random()*quotes.length)]
    quoteEl.textContent=q.text
    authorEl.textContent='— '+q.author
  }
  function mockWeather(){
    const data={temp:22,desc:"Partly cloudy",city:"Springfield"}
    weatherEl.innerHTML=`<p><strong>${data.city}</strong>: ${data.temp}°C, ${data.desc}</p>`
  }
  function toggleTheme(){
    document.body.classList.toggle('dark-mode')
  }
  updateTime()
  setInterval(updateTime,1000)
  randomQuote()
  mockWeather()
  themeBtn.addEventListener('click',toggleTheme)
  quoteBtn.addEventListener('click',randomQuote)
})
