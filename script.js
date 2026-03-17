document.addEventListener('DOMContentLoaded', () => {
  function showTime() {
    const now = new Date();
    document.getElementById('currentTime').textContent = now.toLocaleTimeString();
  }
  showTime();
  setInterval(showTime, 1000);
});
