// ============================================
// AUTH — Login / Register / Logout
// ============================================

function openAuthModal() {
  document.getElementById('auth-modal').classList.remove('hidden');
}
function closeAuthModal() {
  document.getElementById('auth-modal').classList.add('hidden');
}

function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });
  document.getElementById('tab-login').classList.toggle('hidden', tab !== 'login');
  document.getElementById('tab-register').classList.toggle('hidden', tab !== 'register');
}

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');

  if (!email || !pass) { showError(errEl, 'กรุณากรอกอีเมลและรหัสผ่าน'); return; }

  const { error } = await db.auth.signInWithPassword({ email, password: pass });
  if (error) { showError(errEl, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'); return; }

  closeAuthModal();
  showToast('เข้าสู่ระบบสำเร็จ ✓', 'success');
}

async function handleRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-password').value;
  const errEl = document.getElementById('reg-error');
  const sucEl = document.getElementById('reg-success');
  errEl.classList.add('hidden');
  sucEl.classList.add('hidden');

  if (!name || !email || !pass) { showError(errEl, 'กรุณากรอกข้อมูลให้ครบ'); return; }
  if (pass.length < 6) { showError(errEl, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }

  const { error } = await db.auth.signUp({
    email, password: pass,
    options: { data: { full_name: name } }
  });

  if (error) { showError(errEl, error.message); return; }
  sucEl.textContent = '✓ สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยัน';
  sucEl.classList.remove('hidden');
}

async function handleGoogleLogin() {
  await db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
}

async function handleLogout() {
  await db.auth.signOut();
  currentUser = null;
  currentProfile = null;
  showPage('landing');
  showToast('ออกจากระบบแล้ว', 'success');
}

function toggleUserMenu() {
  document.getElementById('user-dropdown').classList.toggle('hidden');
}

document.addEventListener('click', (e) => {
  const menu = document.getElementById('user-dropdown');
  if (menu && !e.target.closest('.user-menu')) menu.classList.add('hidden');
});

// ── AUTH STATE LISTENER ──
db.auth.onAuthStateChange(async (event, session) => {
  if (session?.user) {
    currentUser = session.user;
    await loadProfile(session.user.id);
    updateNavUser();
    if (event === 'SIGNED_IN') {
      showPage('dashboard');
      loadDashboard();
    }
  } else {
    currentUser = null;
    currentProfile = null;
  }
});

async function loadProfile(userId) {
  const { data } = await db.from('profiles').select('*').eq('id', userId).single();
  currentProfile = data;
  return data;
}

function updateNavUser() {
  if (!currentUser) return;
  const initial = (currentProfile?.full_name || currentUser.email || '?')[0].toUpperCase();
  const avatarEls = document.querySelectorAll('#user-avatar-nav, #sidebar-avatar');
  avatarEls.forEach(el => el.textContent = initial);

  const name = currentProfile?.full_name || currentUser.email?.split('@')[0] || 'User';
  const nameEl = document.getElementById('sidebar-name');
  const dropName = document.getElementById('dropdown-name');
  const welcomeName = document.getElementById('welcome-name');
  if (nameEl) nameEl.textContent = name;
  if (dropName) dropName.textContent = name;
  if (welcomeName) welcomeName.textContent = `สวัสดี, ${name} 👋`;

  const titleEl = document.getElementById('sidebar-job-title');
  if (titleEl) titleEl.textContent = currentProfile?.title || 'เพิ่มตำแหน่งงาน';
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}
