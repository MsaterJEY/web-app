// ============================================
// APP.JS — Main controller
// ============================================

// ── PAGE ROUTING ──
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(`page-${name}`)?.classList.remove('hidden');
  if (name === 'explore') loadExplore();
}

// ── DASHBOARD TABS ──
function showDashboardTab(tab) {
  document.querySelectorAll('.dash-tab').forEach(t => t.classList.add('hidden'));
  document.getElementById(`tab-${tab}`)?.classList.remove('hidden');
  document.querySelectorAll('.sidebar-link').forEach(l => {
    l.classList.toggle('active', l.dataset.tab === tab);
  });
  if (tab === 'messages') loadMessages();
  if (tab === 'profile') loadProfileForm();
}

// ── DASHBOARD INIT ──
async function loadDashboard() {
  await Promise.all([loadProjects(), loadSkills()]);
  await loadMessages();
}

// ── MESSAGES ──
async function loadMessages() {
  if (!currentUser) return;
  const { data } = await db.from('contact_messages')
    .select('*').eq('to_user_id', currentUser.id)
    .order('created_at', { ascending: false });

  const msgs = data || [];
  const unread = msgs.filter(m => !m.is_read).length;

  document.getElementById('stat-messages').textContent = unread;
  const badge = document.getElementById('msg-badge');
  if (badge) {
    badge.textContent = unread;
    badge.classList.toggle('hidden', unread === 0);
  }

  const list = document.getElementById('messages-list');
  if (!list) return;

  if (!msgs.length) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">✉️</div>
      <h3>ยังไม่มีข้อความ</h3>
      <p>เมื่อมีคนส่งข้อความถึงคุณ จะแสดงที่นี่</p>
    </div>`;
    return;
  }

  list.innerHTML = msgs.map(m => `
    <div class="message-item ${m.is_read ? '' : 'unread'}" onclick="readMessage('${m.id}', this)">
      <span class="message-date">${new Date(m.created_at).toLocaleDateString('th-TH')}</span>
      <div class="message-from">${m.from_name} &lt;${m.from_email}&gt;</div>
      <div class="message-subject">📌 ${m.subject}</div>
      <div class="message-preview">${m.message}</div>
    </div>
  `).join('');
}

async function readMessage(id, el) {
  await db.from('contact_messages').update({ is_read: true }).eq('id', id);
  el.classList.remove('unread');
  loadMessages();
}

// ── PROFILE FORM ──
async function loadProfileForm() {
  if (!currentUser) return;
  const prof = await loadProfile(currentUser.id);
  if (!prof) return;

  const fields = {
    'prof-fullname': prof.full_name,
    'prof-title': prof.title,
    'prof-bio': prof.bio,
    'prof-location': prof.location,
    'prof-website': prof.website,
    'prof-github': prof.github_url,
    'prof-linkedin': prof.linkedin_url,
    'prof-twitter': prof.twitter_url,
  };
  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  });
  const pub = document.getElementById('prof-public');
  if (pub) pub.checked = prof.is_public !== false;
}

async function saveProfile() {
  if (!currentUser) return;
  const errEl = document.getElementById('profile-error');
  const sucEl = document.getElementById('profile-success');
  errEl.classList.add('hidden');
  sucEl.classList.add('hidden');

  const payload = {
    full_name: document.getElementById('prof-fullname').value.trim(),
    title: document.getElementById('prof-title').value.trim(),
    bio: document.getElementById('prof-bio').value.trim(),
    location: document.getElementById('prof-location').value.trim(),
    website: document.getElementById('prof-website').value.trim() || null,
    github_url: document.getElementById('prof-github').value.trim() || null,
    linkedin_url: document.getElementById('prof-linkedin').value.trim() || null,
    twitter_url: document.getElementById('prof-twitter').value.trim() || null,
    is_public: document.getElementById('prof-public').checked,
  };

  const { error } = await db.from('profiles').update(payload).eq('id', currentUser.id);
  if (error) { errEl.textContent = error.message; errEl.classList.remove('hidden'); return; }

  currentProfile = { ...currentProfile, ...payload };
  updateNavUser();
  sucEl.textContent = '✓ บันทึกโปรไฟล์สำเร็จ';
  sucEl.classList.remove('hidden');
  showToast('บันทึกโปรไฟล์สำเร็จ ✓', 'success');
  setTimeout(() => sucEl.classList.add('hidden'), 3000);
}

// ── TOAST ──
let toastTimer;
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast ${type}`;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3000);
}

// ── INIT ──
window.addEventListener('load', async () => {
  // Check existing session
  const { data: { session } } = await db.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    await loadProfile(session.user.id);
    updateNavUser();
  }

  // Hide loading screen
  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('fade-out');
  }, 1200);
});
