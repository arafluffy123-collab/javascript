/* script.js
   Handles UI interactions, event wiring, and light utilities.
   This file intentionally contains verbose comments and multiple helper functions
   to illustrate a large, single page application structure.
*/

/* App bootstrap */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI references
  const editor = document.getElementById('editor');
  const fileList = document.getElementById('fileList');
  const btnNew = document.getElementById('btnNew');
  const btnAddFile = document.getElementById('btnAddFile');
  const btnRemoveFile = document.getElementById('btnRemoveFile');
  const btnRun = document.getElementById('btnRun');
  const btnExport = document.getElementById('btnExport');
  const btnImport = document.getElementById('btnImport');
  const btnTheme = document.getElementById('btnTheme');
  const previewFrame = document.getElementById('previewFrame');
  const toggleAutoRun = document.getElementById('toggleAutoRun');
  const toggleSandbox = document.getElementById('toggleSandbox');
  const languageSelect = document.getElementById('languageSelect');
  const globalSearch = document.getElementById('globalSearch');
  const notesArea = document.getElementById('notesArea');
  const btnSaveNotes = document.getElementById('btnSaveNotes');
  const btnClearNotes = document.getElementById('btnClearNotes');
  const metaOutput = document.getElementById('metaOutput');
  const btnDump = document.getElementById('btnDump');
  const btnReset = document.getElementById('btnReset');
  const clock = document.getElementById('clock');

  // Terminal
  const terminal = document.getElementById('terminal');
  const terminalOutput = document.getElementById('terminalOutput');
  const terminalCmd = document.getElementById('terminalCmd');
  const btnClearTerminal = document.getElementById('btnClearTerminal');

  // Visualizer
  const visualizerPanel = document.getElementById('visualizer');
  const visualCanvas = document.getElementById('visualCanvas');
  const btnStartVisual = document.getElementById('btnStartVisual');
  const btnStopVisual = document.getElementById('btnStopVisual');

  // Audio
  const audioPanel = document.getElementById('audioPanel');
  const btnPlayTone = document.getElementById('btnPlayTone');
  const btnStopTone = document.getElementById('btnStopTone');
  const waveSelect = document.getElementById('waveSelect');
  const freqRange = document.getElementById('freqRange');
  const audioLog = document.getElementById('audioLog');

  // State
  const state = {
    files: [],
    activeFileId: null,
    notes: '',
    settings: {
      theme: 'theme-dark',
      autoRun: false,
      sandbox: true
    },
    terminalHistory: [],
    visualRunning: false,
    audioRunning: false
  };

  // Utilities
  function uid(prefix = 'id') {
    return prefix + '_' + Math.random().toString(36).slice(2, 10);
  }

  function nowISO() {
    return new Date().toISOString();
  }

  // Persistence
  function saveState() {
    try {
      localStorage.setItem('mega_demo_state', JSON.stringify(state));
      logTerminal('State saved at ' + nowISO());
    } catch (e) {
      logTerminal('Failed to save state: ' + e.message);
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem('mega_demo_state');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      Object.assign(state, parsed);
      logTerminal('State loaded from storage');
    } catch (e) {
      logTerminal('Failed to load state: ' + e.message);
    }
  }

  // File management
  function createFile(name = 'untitled.txt', content = '', lang = 'md') {
    const f = {
      id: uid('file'),
      name,
      content,
      lang,
      createdAt: nowISO(),
      updatedAt: nowISO()
    };
    state.files.push(f);
    state.activeFileId = f.id;
    renderFileList();
    renderActiveFile();
    saveState();
    return f;
  }

  function removeActiveFile() {
    if (!state.activeFileId) return;
    const idx = state.files.findIndex(f => f.id === state.activeFileId);
    if (idx >= 0) {
      state.files.splice(idx, 1);
      state.activeFileId = state.files.length ? state.files[0].id : null;
      renderFileList();
      renderActiveFile();
      saveState();
    }
  }

  function renderFileList() {
    fileList.innerHTML = '';
    state.files.forEach(f => {
      const li = document.createElement('li');
      li.dataset.id = f.id;
      li.className = f.id === state.activeFileId ? 'active' : '';
      li.innerHTML = `<div>
                        <div class="name">${escapeHtml(f.name)}</div>
                        <div class="meta">${f.lang} • ${new Date(f.updatedAt).toLocaleString()}</div>
                      </div>
                      <div class="actions">
                        <button class="btn small" data-action="rename">Rename</button>
                      </div>`;
      li.addEventListener('click', () => {
        state.activeFileId = f.id;
        renderFileList();
        renderActiveFile();
      });
      fileList.appendChild(li);
    });
  }

  function renderActiveFile() {
    const f = state.files.find(x => x.id === state.activeFileId);
    if (!f) {
      editor.value = '';
      languageSelect.value = 'md';
      document.getElementById('fileStats').textContent = 'No file';
      return;
    }
    editor.value = f.content;
    languageSelect.value = f.lang;
    document.getElementById('fileStats').textContent = `${f.content.length} bytes`;
    updateCursorPos();
  }

  // Editor helpers
  function updateCursorPos() {
    const pos = editor.selectionStart;
    const lines = editor.value.slice(0, pos).split('\n');
    const ln = lines.length;
    const col = lines[lines.length - 1].length + 1;
    document.getElementById('cursorPos').textContent = `Ln ${ln}, Col ${col}`;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // Terminal
  function logTerminal(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = 'term-line ' + type;
    el.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    terminalOutput.appendChild(el);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
    state.terminalHistory.push({ts: Date.now(), msg, type});
  }

  // Preview runner
  function runPreview() {
    const f = state.files.find(x => x.id === state.activeFileId);
    if (!f) {
      logTerminal('No active file to run', 'warn');
      return;
    }
    const lang = f.lang;
    const content = f.content;
    document.getElementById('liveStatus').textContent = 'Running';
    // Build a safe HTML wrapper
    let html = '';
    if (lang === 'html') {
      html = content;
    } else if (lang === 'css') {
      html = `<html><head><style>${content}</style></head><body><div style="padding:20px;color:#fff">CSS preview</div></body></html>`;
    } else if (lang === 'js') {
      html = `<html><head></head><body><pre id="out" style="color:#fff;background:#02040a;padding:12px"></pre><script>try{${content}}catch(e){document.getElementById('out').textContent='Error: '+e.message}</script></body></html>`;
    } else if (lang === 'md') {
      // Simple markdown to HTML
      const md = simpleMarkdown(content);
      html = `<html><head><meta charset="utf-8"><style>body{font-family:Inter,Arial;color:#e6eef8;background:#071022;padding:20px}</style></head><body>${md}</body></html>`;
    } else {
      html = `<html><body><pre>${escapeHtml(content)}</pre></body></html>`;
    }

    try {
      if (toggleSandbox.checked) {
        previewFrame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      } else {
        previewFrame.removeAttribute('sandbox');
      }
      const doc = previewFrame.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();
      logTerminal('Preview updated for ' + f.name);
      document.getElementById('liveStatus').textContent = 'Idle';
    } catch (e) {
      logTerminal('Preview error: ' + e.message, 'error');
      document.getElementById('liveStatus').textContent = 'Error';
    }
  }

  // Simple markdown renderer
  function simpleMarkdown(md) {
    // Very small markdown to HTML converter for demo
    let out = md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/\n$/gim, '<br/>');
    // Links
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>');
    return out;
  }

  // Format code (very naive)
  function formatCode() {
    const lang = languageSelect.value;
    if (lang === 'js') {
      // naive indentation normalization
      editor.value = editor.value.split('\n').map(line => line.trim()).join('\n');
    } else if (lang === 'html' || lang === 'css') {
      editor.value = editor.value.replace(/\t/g, '  ');
    } else {
      // markdown no-op
    }
    logTerminal('Formatted code for ' + lang);
  }

  // Export and import
  function exportState() {
    const payload = JSON.stringify(state, null, 2);
    const blob = new Blob([payload], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mega_demo_export_' + Date.now() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    logTerminal('Exported state');
  }

  function importState(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target.result);
        Object.assign(state, parsed);
        renderFileList();
        renderActiveFile();
        logTerminal('Imported state');
        saveState();
      } catch (err) {
        logTerminal('Import failed: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (ev) => {
    if (ev.ctrlKey && ev.key.toLowerCase() === 's') {
      ev.preventDefault();
      saveActiveFile();
    } else if (ev.ctrlKey && ev.key.toLowerCase() === 'b') {
      ev.preventDefault();
      document.querySelector('.sidebar').classList.toggle('hidden');
    } else if (ev.ctrlKey && ev.key === '/') {
      ev.preventDefault();
      toggleComment();
    } else if (ev.ctrlKey && ev.key === 'Enter') {
      ev.preventDefault();
      runPreview();
    }
  });

  // Save active file
  function saveActiveFile() {
    const f = state.files.find(x => x.id === state.activeFileId);
    if (!f) {
      logTerminal('No file to save', 'warn');
      return;
    }
    f.content = editor.value;
    f.lang = languageSelect.value;
    f.updatedAt = nowISO();
    document.getElementById('fileStats').textContent = `${f.content.length} bytes`;
    saveState();
    logTerminal('Saved ' + f.name);
  }

  // Toggle comment for selected lines
  function toggleComment() {
    const selStart = editor.selectionStart;
    const selEnd = editor.selectionEnd;
    const before = editor.value.slice(0, selStart);
    const selected = editor.value.slice(selStart, selEnd);
    const after = editor.value.slice(selEnd);
    const lang = languageSelect.value;
    if (!selected) {
      // comment current line
      const lines = editor.value.slice(0, selEnd).split('\n');
      const lineIndex = lines.length - 1;
      const allLines = editor.value.split('\n');
      allLines[lineIndex] = allLines[lineIndex].startsWith('//') ? allLines[lineIndex].replace(/^\/\/\s?/, '') : '// ' + allLines[lineIndex];
      editor.value = allLines.join('\n');
      return;
    }
    const lines = selected.split('\n');
    const toggled = lines.map(l => l.startsWith('//') ? l.replace(/^\/\/\s?/, '') : '// ' + l).join('\n');
    editor.value = before + toggled + after;
    logTerminal('Toggled comment');
  }

  // Terminal commands
  terminalCmd.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const cmd = terminalCmd.value.trim();
      if (!cmd) return;
      logTerminal('> ' + cmd, 'cmd');
      handleCommand(cmd);
      terminalCmd.value = '';
    }
  });

  function handleCommand(cmd) {
    const parts = cmd.split(' ');
    const base = parts[0].toLowerCase();
    if (base === 'help') {
      logTerminal('Commands: help, list, run, save, export, import, clear, echo', 'info');
    } else if (base === 'list') {
      state.files.forEach(f => logTerminal(`${f.name} (${f.lang})`));
    } else if (base === 'run') {
      runPreview();
    } else if (base === 'save') {
      saveActiveFile();
    } else if (base === 'export') {
      exportState();
    } else if (base === 'clear') {
      terminalOutput.innerHTML = '';
    } else if (base === 'echo') {
      logTerminal(parts.slice(1).join(' '));
    } else {
      logTerminal('Unknown command: ' + base, 'warn');
    }
  }

  btnClearTerminal.addEventListener('click', () => {
    terminalOutput.innerHTML = '';
  });

  // Visualizer
  let visualCtx = visualCanvas.getContext('2d');
  let visualAnimId = null;
  function startVisualizer(seed = 1) {
    state.visualRunning = true;
    let t = 0;
    function draw() {
      const w = visualCanvas.width = visualCanvas.clientWidth * devicePixelRatio;
      const h = visualCanvas.height = visualCanvas.clientHeight * devicePixelRatio;
      visualCtx.clearRect(0,0,w,h);
      visualCtx.save();
      visualCtx.scale(devicePixelRatio, devicePixelRatio);
      // background gradient
      const g = visualCtx.createLinearGradient(0,0,visualCanvas.clientWidth,visualCanvas.clientHeight);
      g.addColorStop(0, '#071022');
      g.addColorStop(1, '#00121a');
      visualCtx.fillStyle = g;
      visualCtx.fillRect(0,0,visualCanvas.clientWidth,visualCanvas.clientHeight);

      // draw many circles with pseudo-random positions
      for (let i=0;i<120;i++){
        const r = 2 + Math.abs(Math.sin((t + i*0.1) * 0.02 + seed)) * 24;
        const x = (visualCanvas.clientWidth/2) + Math.sin((i + t*0.01) * 0.7 + seed) * (visualCanvas.clientWidth/3);
        const y = (visualCanvas.clientHeight/2) + Math.cos((i + t*0.01) * 0.9 + seed) * (visualCanvas.clientHeight/3);
        visualCtx.beginPath();
        visualCtx.fillStyle = `hsla(${(i*3 + t*0.2) % 360},70%,60%,0.12)`;
        visualCtx.arc(x, y, r, 0, Math.PI*2);
        visualCtx.fill();
      }

      visualCtx.restore();
      t += 1;
      visualAnimId = requestAnimationFrame(draw);
    }
    draw();
    logTerminal('Visualizer started');
  }

  function stopVisualizer() {
    state.visualRunning = false;
    if (visualAnimId) cancelAnimationFrame(visualAnimId);
    visualAnimId = null;
    visualCtx.clearRect(0,0,visualCanvas.width,visualCanvas.height);
    logTerminal('Visualizer stopped');
  }

  // Audio synth
  let audioCtx = null;
  let oscillator = null;
  function startTone(type = 'sine', freq = 440) {
    if (!window.AudioContext && !window.webkitAudioContext) {
      audioLog.textContent += 'Audio not supported\n';
      return;
    }
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = freq;
    gain.gain.value = 0.08;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    state.audioRunning = true;
    audioLog.textContent += `Started ${type} ${freq}Hz\n`;
    logTerminal('Audio started ' + type + ' ' + freq + 'Hz');
  }

  function stopTone() {
    if (oscillator) {
      try { oscillator.stop(); } catch(e){}
      oscillator.disconnect();
      oscillator = null;
      state.audioRunning = false;
      audioLog.textContent += 'Stopped\n';
      logTerminal('Audio stopped');
    }
  }

  // Event wiring
  btnNew.addEventListener('click', () => {
    createFile('untitled.md', '# New File\n\nStart writing...', 'md');
  });

  btnAddFile.addEventListener('click', () => {
    const name = prompt('File name', 'note.md') || 'note.md';
    createFile(name, '', 'md');
  });

  btnRemoveFile.addEventListener('click', () => {
    if (!confirm('Remove active file?')) return;
    removeActiveFile();
  });

  btnRun.addEventListener('click', () => {
    saveActiveFile();
    runPreview();
  });

  btnFormat.addEventListener('click', () => {
    formatCode();
  });

  btnExport.addEventListener('click', () => {
    exportState();
  });

  btnImport.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = () => {
      if (input.files.length) importState(input.files[0]);
    };
    input.click();
  });

  btnTheme.addEventListener('click', () => {
    const root = document.documentElement;
    const themes = ['theme-dark','theme-soft','theme-highcontrast'];
    const idx = themes.indexOf(state.settings.theme);
    const next = themes[(idx + 1) % themes.length];
    state.settings.theme = next;
    root.className = next;
    saveState();
    logTerminal('Theme switched to ' + next);
  });

  editor.addEventListener('input', () => {
    updateCursorPos();
    document.getElementById('fileStats').textContent = `${editor.value.length} bytes`;
    if (toggleAutoRun.checked) {
      // debounce
      if (editor._autoRunTimer) clearTimeout(editor._autoRunTimer);
      editor._autoRunTimer = setTimeout(() => {
        saveActiveFile();
        runPreview();
      }, 700);
    }
  });

  languageSelect.addEventListener('change', () => {
    const f = state.files.find(x => x.id === state.activeFileId);
    if (f) {
      f.lang = languageSelect.value;
      saveState();
    }
  });

  globalSearch.addEventListener('input', () => {
    const q = globalSearch.value.trim().toLowerCase();
    if (!q) {
      renderFileList();
      return;
    }
    fileList.innerHTML = '';
    state.files.filter(f => (f.name + ' ' + f.content).toLowerCase().includes(q)).forEach(f => {
      const li = document.createElement('li');
      li.dataset.id = f.id;
      li.innerHTML = `<div><div class="name">${escapeHtml(f.name)}</div><div class="meta">${f.lang}</div></div>`;
      li.addEventListener('click', () => {
        state.activeFileId = f.id;
        renderFileList();
        renderActiveFile();
      });
      fileList.appendChild(li);
    });
  });

  btnSaveNotes.addEventListener('click', () => {
    state.notes = notesArea.value;
    saveState();
    logTerminal('Notes saved');
  });

  btnClearNotes.addEventListener('click', () => {
    if (!confirm('Clear notes?')) return;
    notesArea.value = '';
    state.notes = '';
    saveState();
    logTerminal('Notes cleared');
  });

  btnDump.addEventListener('click', () => {
    metaOutput.textContent = JSON.stringify(state, null, 2);
  });

  btnReset.addEventListener('click', () => {
    if (!confirm('Reset app state? This will clear local storage.')) return;
    localStorage.removeItem('mega_demo_state');
    location.reload();
  });

  // Terminal quick commands
  document.querySelectorAll('.tool').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      const tool = btn.dataset.tool;
      document.getElementById('preview').classList.toggle('hidden', tool !== 'preview');
      document.getElementById('terminal').classList.toggle('hidden', tool !== 'terminal');
      document.getElementById('visualizer').classList.toggle('hidden', tool !== 'visual');
      document.getElementById('audioPanel').classList.toggle('hidden', tool !== 'audio');
      document.getElementById('notesArea').closest('.panel').classList.toggle('hidden', tool !== 'notes');
      document.getElementById('editor').closest('.left-pane').classList.toggle('hidden', tool === 'preview');
    });
  });

  // Visualizer controls
  btnStartVisual.addEventListener('click', () => {
    const seed = Number(document.getElementById('visualSeed').value) || Math.random();
    startVisualizer(seed);
  });
  btnStopVisual.addEventListener('click', () => stopVisualizer());

  // Audio controls
  btnPlayTone.addEventListener('click', () => {
    const type = waveSelect.value;
    const freq = Number(freqRange.value);
    startTone(type, freq);
  });
  btnStopTone.addEventListener('click', () => stopTone());

  // Terminal quick run
  document.getElementById('btnRun').addEventListener('click', () => {
    runPreview();
  });

  // Clock
  setInterval(() => {
    const d = new Date();
    clock.textContent = d.toLocaleTimeString();
  }, 1000);

  // Initial seed data
  loadState();
  if (!state.files.length) {
    createFile('welcome.md', '# Welcome\n\nThis is a demo file. Use the editor to create content and run preview.', 'md');
    createFile('index.html', '<!doctype html>\n<html><body><h1>Hello</h1></body></html>', 'html');
    createFile('style.css', 'body{background:#071022;color:#fff}', 'css');
    createFile('app.js', 'console.log("hello world")', 'js');
  } else {
    renderFileList();
    renderActiveFile();
    notesArea.value = state.notes || '';
    document.documentElement.className = state.settings.theme || 'theme-dark';
  }

  // Save on unload
  window.addEventListener('beforeunload', () => {
    saveActiveFile();
    saveState();
  });

  // Helper to save active file on demand
  function saveActiveFileDebounced() {
    if (editor._saveTimer) clearTimeout(editor._saveTimer);
    editor._saveTimer = setTimeout(saveActiveFile, 400);
  }

  // Wire editor changes to save
  editor.addEventListener('input', saveActiveFileDebounced);

  // Expose for debugging
  window.megaDemo = {
    state,
    createFile,
    saveState,
    loadState,
    runPreview,
    startVisualizer,
    stopVisualizer,
    startTone,
    stopTone
  };

  logTerminal('App initialized');
});
