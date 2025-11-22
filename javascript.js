// Helper: set accessible message
function setMessage(elem, text, type) {
    if (!elem) return;
    elem.textContent = text || "";
    elem.classList.remove("error", "success");
    if (type === "error") elem.classList.add("error");
    if (type === "success") elem.classList.add("success");
    // Show toast for important messages
    if (text) showToast(text, type);
}

// Toast helper
let toastTimer = null;
function showToast(text, type = 'info', duration = 3000) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = text;
    t.className = 'toast ' + (type === 'error' ? 'toast-error' : 'toast-success');
    t.hidden = false;
    t.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        t.style.opacity = '0';
        setTimeout(()=> t.hidden = true, 300);
    }, duration);
}

// Simple SHA-256 hash using Web Crypto API (client-side only)
async function hashPassword(password) {
    const enc = new TextEncoder();
    const data = enc.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function showElement(el) {
    if (!el) return;
    el.hidden = false;
}
function hideElement(el) {
    if (!el) return;
    el.hidden = true;
}

function showLogin() {
    showElement(document.getElementById('loginPage'));
    hideElement(document.getElementById('signupPage'));
    hideElement(document.getElementById('dashboardPage'));
}

function showSignup() {
    hideElement(document.getElementById('loginPage'));
    showElement(document.getElementById('signupPage'));
    hideElement(document.getElementById('dashboardPage'));
}

function showDashboard(userName) {
    hideElement(document.getElementById('loginPage'));
    hideElement(document.getElementById('signupPage'));
    showElement(document.getElementById('dashboardPage'));
    const greet = document.getElementById('dashboardGreeting');
    if (greet) greet.textContent = `Welcome, ${userName || 'user'}`;
    // show profile badge in header
    const pb = document.getElementById('profileBadge');
    const pn = document.getElementById('profileName');
    if (pb && pn) {
        pn.textContent = userName || '';
        pb.hidden = false;
    }
}

/* ---------- Simple file manager (localStorage) ---------- */
function getFiles() {
    const raw = localStorage.getItem('ued_files');
    try { return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
}

function saveFiles(files) {
    localStorage.setItem('ued_files', JSON.stringify(files));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

let currentFileId = null;

function renderFilesList(containerId = 'filesList', editorNamePrefix = '') {
    const listEl = document.getElementById(containerId);
    if (!listEl) return;
    const files = getFiles();
    listEl.innerHTML = '';
    files.forEach(f => {
        const li = document.createElement('li');
        li.className = 'file-item';
        li.dataset.id = f.id;
        li.tabIndex = 0;
        li.textContent = f.name || 'Untitled';
        li.addEventListener('click', () => openFile(f.id, editorNamePrefix));
        li.addEventListener('keydown', (e) => { if (e.key === 'Enter') openFile(f.id, editorNamePrefix); });
        if (f.id === currentFileId) li.classList.add('active');
        listEl.appendChild(li);
    });
}

function openFile(id, editorNamePrefix = '') {
    const files = getFiles();
    const f = files.find(x => x.id === id);
    if (!f) return;
    currentFileId = id;
    const nameEl = document.getElementById(editorNamePrefix + 'fileName');
    const contentEl = document.getElementById(editorNamePrefix + 'fileContent');
    if (nameEl) nameEl.value = f.name;
    if (contentEl) contentEl.value = f.content;
    renderFilesList('filesList', '');
    renderFilesList('filesListStandalone', 'Standalone');
}

function createFile(openAfter = true, editorNamePrefix = '') {
    const files = getFiles();
    const id = generateId();
    const file = { id, name: 'Untitled.txt', content: '', modified: Date.now() };
    files.unshift(file);
    saveFiles(files);
    if (openAfter) openFile(id, editorNamePrefix);
    renderFilesList('filesList', '');
    renderFilesList('filesListStandalone', 'Standalone');
}

function saveCurrentFile(editorNamePrefix = '') {
    if (!currentFileId) return showToast('No file open', 'error');
    const files = getFiles();
    const f = files.find(x => x.id === currentFileId);
    if (!f) return showToast('File not found', 'error');
    const nameEl = document.getElementById(editorNamePrefix + 'fileName');
    const contentEl = document.getElementById(editorNamePrefix + 'fileContent');
    f.name = nameEl ? nameEl.value || 'Untitled' : f.name;
    f.content = contentEl ? contentEl.value : f.content;
    f.modified = Date.now();
    saveFiles(files);
    renderFilesList('filesList', '');
    renderFilesList('filesListStandalone', 'Standalone');
    showToast('File saved', 'success');
}

function deleteCurrentFile(editorNamePrefix = '') {
    if (!currentFileId) return showToast('No file selected', 'error');
    let files = getFiles();
    files = files.filter(f => f.id !== currentFileId);
    saveFiles(files);
    currentFileId = null;
    const nameEl = document.getElementById(editorNamePrefix + 'fileName');
    const contentEl = document.getElementById(editorNamePrefix + 'fileContent');
    if (nameEl) nameEl.value = '';
    if (contentEl) contentEl.value = '';
    renderFilesList('filesList', '');
    renderFilesList('filesListStandalone', 'Standalone');
    showToast('File deleted', 'success');
}

function renderRecentFiles() {
    const recentEl = document.getElementById('recentFiles');
    if (!recentEl) return;
    const files = getFiles().slice(0,4);
    recentEl.innerHTML = '';
    if (!files.length) { recentEl.innerHTML = '<div class="muted">No recent files</div>'; return; }
    files.forEach(f => {
        const c = document.createElement('div');
        c.className = 'card';
        c.textContent = f.name;
        c.addEventListener('click', () => { openFile(f.id); showToast('Opened ' + f.name); });
        recentEl.appendChild(c);
    });
}

function renderProjects() {
    const el = document.getElementById('projectsList');
    const elStandalone = document.getElementById('projectsListStandalone');
    const projects = JSON.parse(localStorage.getItem('ued_projects') || '[]');
    if (el) {
        el.innerHTML = projects.length ? projects.map(p => `<li>${p.name}</li>`).join('') : '<li class="muted">No projects</li>';
    }
    if (elStandalone) {
        elStandalone.innerHTML = projects.length ? projects.map(p => `<li>${p.name}</li>`).join('') : '<li class="muted">No projects</li>';
    }
}

function switchDashboardSection(section) {
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(s => s.hidden = true);
    const el = document.getElementById(section + 'Section');
    if (el) el.hidden = false;
    // render data when switching
    if (section === 'files') { renderFilesList(); }
    if (section === 'home') { renderRecentFiles(); }
    if (section === 'projects') { renderProjects(); }
}

/* ---------- Dashboard data, charts & filters ---------- */
let lineChart, barChart, pieChart;
let lineChartStandalone, barChartStandalone, pieChartStandalone;

function formatDateISO(ts) {
    const d = new Date(ts);
    return d.toISOString().slice(0,10);
}

function generateMockDataIfEmpty() {
    const files = getFiles();
    if (files.length) return;
    const categories = ['notes','code','docs'];
    const statuses = ['active','archived','alert'];
    const now = Date.now();
    const out = [];
    for (let i=0;i<18;i++){
        const daysAgo = Math.floor(Math.random()*60);
        const ts = now - daysAgo*24*3600*1000;
        const category = categories[Math.floor(Math.random()*categories.length)];
        const status = Math.random() < 0.08 ? 'alert' : (Math.random()<0.2?'archived':'active');
        const name = `${category}-${i+1}.txt`;
        const content = `Sample content for ${name}`;
        const size = Math.max(1, Math.floor(content.length/2 + Math.random()*50));
        out.push({ id: generateId(), name, content, modified: ts, category, status, size });
    }
    saveFiles(out);
}

function initCharts() {
    // main charts
    const lc = document.getElementById('lineChart');
    const bc = document.getElementById('barChart');
    const pc = document.getElementById('pieChart');
    if (lc) {
        lineChart = new Chart(lc.getContext('2d'), { type:'line', data:{labels:[], datasets:[{label:'Activity', data:[], borderColor: 'rgba(43,110,246,0.9)', backgroundColor:'rgba(43,110,246,0.12)', fill:true}] }, options:{responsive:true, maintainAspectRatio:false} });
    }
    if (bc) {
        barChart = new Chart(bc.getContext('2d'), { type:'bar', data:{labels:[], datasets:[{label:'Files', data:[], backgroundColor:['#60a5fa','#7dd3fc','#93c5fd']}] }, options:{responsive:true, maintainAspectRatio:false} });
    }
    if (pc) {
        pieChart = new Chart(pc.getContext('2d'), { type:'pie', data:{labels:[], datasets:[{data:[], backgroundColor:['#34d399','#f59e0b','#f87171']}] }, options:{responsive:true, maintainAspectRatio:false} });
    }

    // standalone charts
    const lcs = document.getElementById('lineChartStandalone');
    const bcs = document.getElementById('barChartStandalone');
    const pcs = document.getElementById('pieChartStandalone');
    if (lcs) {
        lineChartStandalone = new Chart(lcs.getContext('2d'), { type:'line', data:{labels:[], datasets:[{label:'Activity', data:[], borderColor: 'rgba(43,110,246,0.9)', backgroundColor:'rgba(43,110,246,0.12)', fill:true}] }, options:{responsive:true, maintainAspectRatio:false} });
    }
    if (bcs) {
        barChartStandalone = new Chart(bcs.getContext('2d'), { type:'bar', data:{labels:[], datasets:[{label:'Files', data:[], backgroundColor:['#60a5fa','#7dd3fc','#93c5fd']}] }, options:{responsive:true, maintainAspectRatio:false} });
    }
    if (pcs) {
        pieChartStandalone = new Chart(pcs.getContext('2d'), { type:'pie', data:{labels:[], datasets:[{data:[], backgroundColor:['#34d399','#f59e0b','#f87171']}] }, options:{responsive:true, maintainAspectRatio:false} });
    }
}

function filterData({ from, to, category, search } = {}) {
    const files = getFiles();
    return files.filter(f => {
        if (from && new Date(formatDateISO(f.modified)) < new Date(from)) return false;
        if (to && new Date(formatDateISO(f.modified)) > new Date(to)) return false;
        if (category && category !== '' && f.category !== category) return false;
        if (search && search.trim() !== '') {
            const s = search.toLowerCase();
            if (!f.name.toLowerCase().includes(s) && !(f.content||'').toLowerCase().includes(s)) return false;
        }
        return true;
    });
}

function updateKPIs(filtered) {
    const totalFiles = getFiles().length;
    const projects = JSON.parse(localStorage.getItem('ued_projects') || '[]').length;
    const last7 = filtered.filter(f => (Date.now() - f.modified) <= 7*24*3600*1000).length;
    const storage = getFiles().reduce((s,f)=>s + (f.size||0),0);
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('kpiTotalFiles', totalFiles); set('kpiProjects', projects); set('kpiEdits7', last7); set('kpiStorage', storage);
    set('kpiTotalFilesStandalone', totalFiles); set('kpiProjectsStandalone', projects); set('kpiEdits7Standalone', last7); set('kpiStorageStandalone', storage);
}

function updateCharts(filtered) {
    // time series by day (last 30 days)
    const days = 30; const labels = []; const counts = [];
    for (let i=days-1;i>=0;i--){ const d = new Date(); d.setDate(d.getDate()-i); labels.push(d.toISOString().slice(0,10)); counts.push(0); }
    filtered.forEach(f => {
        const idx = labels.indexOf(formatDateISO(f.modified)); if (idx>=0) counts[idx]++;
    });
    if (lineChart) { lineChart.data.labels = labels; lineChart.data.datasets[0].data = counts; lineChart.update(); }
    if (lineChartStandalone) { lineChartStandalone.data.labels = labels; lineChartStandalone.data.datasets[0].data = counts; lineChartStandalone.update(); }

    // category counts
    const catCounts = {};
    filtered.forEach(f=> { catCounts[f.category] = (catCounts[f.category]||0) + 1; });
    const catLabels = Object.keys(catCounts); const catData = catLabels.map(k=>catCounts[k]);
    if (barChart) { barChart.data.labels = catLabels; barChart.data.datasets[0].data = catData; barChart.update(); }
    if (barChartStandalone) { barChartStandalone.data.labels = catLabels; barChartStandalone.data.datasets[0].data = catData; barChartStandalone.update(); }

    // status distribution
    const statusCounts = {}; filtered.forEach(f=> { statusCounts[f.status] = (statusCounts[f.status]||0)+1; });
    const stLabels = Object.keys(statusCounts); const stData = stLabels.map(k=>statusCounts[k]);
    if (pieChart) { pieChart.data.labels = stLabels; pieChart.data.datasets[0].data = stData; pieChart.update(); }
    if (pieChartStandalone) { pieChartStandalone.data.labels = stLabels; pieChartStandalone.data.datasets[0].data = stData; pieChartStandalone.update(); }
}

function renderTable(filtered, tableId='dataTable') {
    const tb = document.getElementById(tableId)?.querySelector('tbody');
    if (!tb) return;
    tb.innerHTML = '';
    filtered.slice(0,200).forEach(f => {
        const tr = document.createElement('tr');
        const date = new Date(f.modified).toLocaleDateString();
        tr.innerHTML = `<td>${escapeHtml(f.name)}</td><td>${escapeHtml(f.category)}</td><td>${date}</td><td>${f.size||0}</td><td>${escapeHtml(f.status)}</td>`;
        tb.appendChild(tr);
    });
}

function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function showAlertsFor(filtered, areaId='alertsArea'){
    const area = document.getElementById(areaId);
    if (!area) return;
    area.innerHTML = '';
    const alerts = filtered.filter(f => f.status === 'alert');
    alerts.slice(0,3).forEach(a=>{ const div = document.createElement('div'); div.className='alert'; div.textContent = `Alert: ${a.name} requires attention`; area.appendChild(div); });
}

function updateDashboard(scope=''){
    // scope '' is main, 'Standalone' is standalone
    const suffix = scope === 'Standalone' ? 'Standalone' : '';
    const from = document.getElementById('filterFrom' + suffix)?.value || '';
    const to = document.getElementById('filterTo' + suffix)?.value || '';
    const category = document.getElementById('categoryFilter' + suffix)?.value || '';
    const search = document.getElementById('searchInput' + suffix)?.value || '';
    const filtered = filterData({from,to,category,search});
    updateKPIs(filtered);
    updateCharts(filtered);
    renderTable(filtered, 'dataTable' + suffix);
    renderRecentFiles();
    showAlertsFor(filtered, 'alertsArea' + suffix);

    // additional dashboard widgets
    renderAchievements();
    renderGoals();
    renderScoreboard();
}

/* Dashboard widgets: achievements, goals, scoreboard */
function generateDashboardMocks(){
    if (!localStorage.getItem('ued_projects')){
        const projects = [ {name:'Website Redesign'}, {name:'Docs Migration'}, {name:'CLI Tool'} ];
        localStorage.setItem('ued_projects', JSON.stringify(projects));
    }
    if (!localStorage.getItem('ued_goals')){
        const goals = [ {title:'Launch v1', progress:78}, {title:'Write docs', progress:45}, {title:'User onboarding', progress:22} ];
        localStorage.setItem('ued_goals', JSON.stringify(goals));
    }
    if (!localStorage.getItem('ued_achievements')){
        const ach = [ {title:'First Save', desc:'Saved your first file'}, {title:'Project Starter', desc:'Created a project'}, {title:'100 Edits', desc:'Made 100 edits'} ];
        localStorage.setItem('ued_achievements', JSON.stringify(ach));
    }
    if (!localStorage.getItem('ued_scores')){
        const scores = [ {name:'Alice', points:1240, pct:80}, {name:'Bob', points:980, pct:62}, {name:'You', points:850, pct:54} ];
        localStorage.setItem('ued_scores', JSON.stringify(scores));
    }
}

function renderAchievements(){
    const area = document.getElementById('achievementsArea');
    if (!area) return;
    const ach = JSON.parse(localStorage.getItem('ued_achievements') || '[]');
    area.innerHTML = '';
    ach.forEach(a=>{
        const d = document.createElement('div'); d.className='achievement-badge';
        d.innerHTML = `<div class="title">${escapeHtml(a.title)}</div><div class="muted" style="font-size:12px">${escapeHtml(a.desc)}</div>`;
        area.appendChild(d);
    });
}

function renderGoals(){
    const gl = document.getElementById('goalsList');
    const proj = JSON.parse(localStorage.getItem('ued_projects') || '[]');
    const goals = JSON.parse(localStorage.getItem('ued_goals') || '[]');
    const plist = document.getElementById('projectsListHome');
    if (plist) plist.innerHTML = proj.length ? proj.map(p=>`<li>${escapeHtml(p.name)}</li>`).join('') : '<li class="muted">No projects</li>';
    if (!gl) return;
    gl.innerHTML = '';
    goals.forEach(g=>{
        const li = document.createElement('li'); li.className='goal';
        li.innerHTML = `<div class="goal-title">${escapeHtml(g.title)}</div><div class="progress-wrap"><div class="progress-bar" style="width:${Math.max(0,Math.min(100,g.progress))}%"></div></div>`;
        gl.appendChild(li);
    });
}

function renderScoreboard(){
    const tb = document.getElementById('scoreboard')?.querySelector('tbody');
    if (!tb) return;
    const scores = JSON.parse(localStorage.getItem('ued_scores') || '[]');
    tb.innerHTML = '';
    scores.sort((a,b)=>b.points-a.points);
    scores.forEach((s,i)=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>#${i+1}</td><td>${escapeHtml(s.name)}</td><td>${s.points}</td><td><div class="score-progress"><i style="width:${s.pct||30}%"></i></div></td>`;
        tb.appendChild(tr);
    });
}


// Save user to localStorage (namespaced). Password stored as SHA-256 hex (demo only).
async function saveUser({ name, email, password }) {
    const passwordHash = await hashPassword(password);
    const user = { name: name.trim(), email: email.trim().toLowerCase(), passwordHash };
    localStorage.setItem('ued_user', JSON.stringify(user));
}

function getUser() {
    const raw = localStorage.getItem('ued_user');
    return raw ? JSON.parse(raw) : null;
}

// Signup handler for SPA and standalone form
async function handleSignupForm(form, msgElem) {
    const name = form.querySelector('#name')?.value || '';
    const email = form.querySelector('#signupEmail')?.value || '';
    const pass = form.querySelector('#signupPassword')?.value || '';
    const passConfirm = form.querySelector('#signupPasswordConfirm')?.value || '';

    if (!name.trim() || !email.trim() || !pass) {
        setMessage(msgElem, 'All fields are required.', 'error');
        return;
    }

    if (!email.includes('@')) {
        setMessage(msgElem, 'Please enter a valid email address.', 'error');
        return;
    }

    if (pass.length < 6) {
        setMessage(msgElem, 'Password must be at least 6 characters.', 'error');
        return;
    }

    if (pass !== passConfirm) {
        setMessage(msgElem, 'Passwords do not match.', 'error');
        return;
    }

    await saveUser({ name, email, password: pass });
    setMessage(msgElem, 'Account created successfully. You can sign in now.', 'success');
    setTimeout(() => showLogin(), 900);
}

// Login handler
async function handleLoginForm(form, msgElem) {
    const email = form.querySelector('#loginEmail')?.value || '';
    const pass = form.querySelector('#loginPassword')?.value || '';
    const user = getUser();

    if (!email || !pass) {
        setMessage(msgElem, 'Please enter both email and password.', 'error');
        return;
    }

    if (!user || user.email !== email.trim().toLowerCase()) {
        setMessage(msgElem, 'Invalid email or password.', 'error');
        return;
    }

    const passHash = await hashPassword(pass);
    if (passHash === user.passwordHash) {
        setMessage(msgElem, 'Login successful.', 'success');
        setTimeout(() => showDashboard(user.name), 700);
    } else {
        setMessage(msgElem, 'Invalid email or password.', 'error');
    }
}

function logout() {
    // For demo, we simply return to login view; user data remains in storage
    showLogin();
    const msg = document.getElementById('loginMsg');
    setMessage(msg, 'You have been logged out.', 'success');
    // hide profile badge
    const pb = document.getElementById('profileBadge');
    if (pb) pb.hidden = true;
}

// Wire up event listeners on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Navigation / view toggles
    document.getElementById('showSignupLink')?.addEventListener('click', (e) => { e.preventDefault(); showSignup(); });
    document.getElementById('showLoginLink')?.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });
    document.getElementById('navSignup')?.addEventListener('click', (e) => { e.preventDefault(); showSignup(); });

    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => { e.preventDefault(); logout(); });
    document.getElementById('profileLogout')?.addEventListener('click', (e) => { e.preventDefault(); logout(); });

    // Password toggle buttons
    document.querySelectorAll('.pw-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (!input) return;
            if (input.type === 'password') { input.type = 'text'; btn.textContent = 'Hide'; btn.setAttribute('aria-pressed','true'); }
            else { input.type = 'password'; btn.textContent = 'Show'; btn.setAttribute('aria-pressed','false'); }
        });
    });

    // SPA forms
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginMsg = document.getElementById('loginMsg');
    const signupMsg = document.getElementById('signupMsg');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLoginForm(loginForm, loginMsg);
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSignupForm(signupForm, signupMsg);
        });
    }

    // Standalone signup page form (if present)
    const signupStandalone = document.getElementById('signupFormStandalone');
    const signupStandaloneMsg = document.getElementById('signupMsg');
    if (signupStandalone) {
        signupStandalone.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSignupForm(signupStandalone, signupStandaloneMsg);
        });
    }

    // If a user is already signed in, show dashboard
    const existingUser = getUser();
    if (existingUser) {
        // Do not auto-login — keep user on login page but show friendly hint
        const msg = document.getElementById('loginMsg');
        if (msg) setMessage(msg, `Account found for ${existingUser.email}. Sign in to continue.`, 'success');
    }

    /* --- Dashboard navigation & file actions --- */
    // sidebar links
    document.querySelectorAll('.sidebar-nav a[data-section]').forEach(a => {
        a.addEventListener('click', (e) => { e.preventDefault(); const s = a.getAttribute('data-section'); switchDashboardSection(s); });
    });

    // SPA file manager buttons
    document.getElementById('btnNewFile')?.addEventListener('click', () => { createFile(true, ''); switchDashboardSection('files'); });
    document.getElementById('btnSaveFile')?.addEventListener('click', () => saveCurrentFile(''));
    document.getElementById('btnDeleteFile')?.addEventListener('click', () => deleteCurrentFile(''));

    // Standalone dashboard file manager buttons
    document.getElementById('btnNewFileStandalone')?.addEventListener('click', () => { createFile(true, 'Standalone'); switchDashboardSection('files'); });
    document.getElementById('btnSaveFileStandalone')?.addEventListener('click', () => saveCurrentFile('Standalone'));
    document.getElementById('btnDeleteFileStandalone')?.addEventListener('click', () => deleteCurrentFile('Standalone'));

    // Initialize file lists and projects on load
    renderFilesList();
    renderFilesList('filesListStandalone', 'Standalone');
    renderRecentFiles();
    renderProjects();

    // ensure mock data exists, init charts and update dashboard
    generateMockDataIfEmpty();
    initCharts();
    updateDashboard();
    updateDashboard('Standalone');

    // filters wiring (main)
    document.getElementById('applyDateFilter')?.addEventListener('click', ()=> updateDashboard());
    document.getElementById('searchInput')?.addEventListener('input', ()=> updateDashboard());
    document.getElementById('categoryFilter')?.addEventListener('change', ()=> updateDashboard());

    // filters wiring (standalone)
    document.getElementById('applyDateFilterStandalone')?.addEventListener('click', ()=> updateDashboard('Standalone'));
    document.getElementById('searchInputStandalone')?.addEventListener('input', ()=> updateDashboard('Standalone'));
    document.getElementById('categoryFilterStandalone')?.addEventListener('change', ()=> updateDashboard('Standalone'));
});
