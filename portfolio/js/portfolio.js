// ============================================
// PUBLIC PORTFOLIO VIEW
// ============================================

async function viewMyPortfolio() {
  if (!currentProfile) return;
  await renderPublicPortfolio(currentProfile.id);
  showPage('portfolio');
}

async function renderPublicPortfolio(userId) {
  const container = document.getElementById('portfolio-content');
  container.innerHTML = '<div style="text-align:center;padding:4rem;color:var(--muted);">กำลังโหลด...</div>';

  // Fetch all data in parallel
  const [profileRes, projectsRes, skillsRes] = await Promise.all([
    db.from('profiles').select('*').eq('id', userId).single(),
    db.from('projects').select('*').eq('user_id', userId).eq('is_published', true).order('is_featured', { ascending: false }).order('created_at', { ascending: false }),
    db.from('skills').select('*').eq('user_id', userId).order('level', { ascending: false })
  ]);

  const profile = profileRes.data;
  const projects = projectsRes.data || [];
  const skills = skillsRes.data || [];

  if (!profile) { container.innerHTML = '<div style="text-align:center;padding:4rem;">ไม่พบโปรไฟล์นี้</div>'; return; }

  const initial = (profile.full_name || '?')[0].toUpperCase();

  // Group skills by category
  const skillCats = {};
  skills.forEach(s => {
    const cat = s.category || 'other';
    if (!skillCats[cat]) skillCats[cat] = [];
    skillCats[cat].push(s);
  });
  const catLabels = { frontend:'Frontend', backend:'Backend', mobile:'Mobile', design:'Design', devops:'DevOps', database:'Database', other:'อื่นๆ' };

  container.innerHTML = `
    <!-- HERO -->
    <div class="portfolio-hero">
      <div class="portfolio-hero-inner">
        <div class="portfolio-big-avatar">
          ${profile.avatar_url ? `<img src="${profile.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />` : initial}
        </div>
        <div>
          <div class="portfolio-name">${profile.full_name || 'ไม่มีชื่อ'}</div>
          ${profile.title ? `<div class="portfolio-job-title">${profile.title}</div>` : ''}
          ${profile.bio ? `<div class="portfolio-bio">${profile.bio}</div>` : ''}
          <div class="portfolio-meta">
            ${profile.location ? `<span class="portfolio-meta-item">📍 ${profile.location}</span>` : ''}
            ${profile.website ? `<span class="portfolio-meta-item">🌐 <a href="${profile.website}" target="_blank" style="color:var(--accent)">${profile.website}</a></span>` : ''}
          </div>
          <div class="portfolio-socials">
            ${profile.github_url ? `<a href="${profile.github_url}" target="_blank" class="social-link">GitHub</a>` : ''}
            ${profile.linkedin_url ? `<a href="${profile.linkedin_url}" target="_blank" class="social-link">LinkedIn</a>` : ''}
            ${profile.twitter_url ? `<a href="${profile.twitter_url}" target="_blank" class="social-link">Twitter/X</a>` : ''}
            <button class="contact-btn" onclick="openContactModal('${profile.id}', '${profile.full_name || ''}')">✉️ ติดต่อ</button>
          </div>
        </div>
      </div>
    </div>

    <!-- PROJECTS -->
    ${projects.length ? `
    <div class="portfolio-section">
      <div class="section-title">ผลงาน (${projects.length})</div>
      <div class="pub-projects-grid">
        ${projects.map(p => `
          <div class="pub-project-card">
            <div class="pub-thumb">
              ${p.thumbnail_url ? `<img src="${p.thumbnail_url}" alt="${p.title}" onerror="this.parentElement.innerHTML='📁'"/>` : '📁'}
            </div>
            <div class="pub-info">
              <div class="pub-title">${p.title}${p.is_featured ? ' <span style="color:var(--warning);font-size:12px;">★</span>' : ''}</div>
              ${p.description ? `<div class="pub-desc">${p.description}</div>` : ''}
              <div class="pub-tags">
                ${(p.tech_stack || []).slice(0,5).map(t => `<span class="pub-tag">${t}</span>`).join('')}
              </div>
              <div class="pub-links">
                ${p.project_url ? `<a href="${p.project_url}" target="_blank" class="pub-link">🔗 Demo</a>` : ''}
                ${p.github_url ? `<a href="${p.github_url}" target="_blank" class="pub-link">GitHub</a>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- SKILLS -->
    ${skills.length ? `
    <div class="portfolio-section">
      <div class="section-title">ทักษะ</div>
      ${Object.entries(skillCats).map(([cat, catSkills]) => `
        <div style="margin-bottom:2rem;">
          <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:1rem;">${catLabels[cat] || cat}</div>
          <div class="pub-skills-grid">
            ${catSkills.map(s => `
              <div class="pub-skill-item">
                <div class="pub-skill-head">
                  <span class="pub-skill-name">${s.name}</span>
                  <span class="pub-skill-pct">${s.level}%</span>
                </div>
                <div class="skill-bar">
                  <div class="skill-bar-fill" style="width:${s.level}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
    ` : ''}
  `;
}

// ── CONTACT MODAL ──
function openContactModal(toId, toName) {
  document.getElementById('contact-to-id').value = toId;
  document.getElementById('contact-to-name').textContent = `ส่งถึง: ${toName}`;
  ['contact-name','contact-email','contact-subject','contact-message'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('contact-error').classList.add('hidden');
  document.getElementById('contact-success').classList.add('hidden');
  document.getElementById('contact-modal').classList.remove('hidden');
}

function closeContactModal() {
  document.getElementById('contact-modal').classList.add('hidden');
}

async function sendContact() {
  const toId = document.getElementById('contact-to-id').value;
  const fromName = document.getElementById('contact-name').value.trim();
  const fromEmail = document.getElementById('contact-email').value.trim();
  const subject = document.getElementById('contact-subject').value.trim();
  const message = document.getElementById('contact-message').value.trim();
  const errEl = document.getElementById('contact-error');
  const sucEl = document.getElementById('contact-success');
  errEl.classList.add('hidden');

  if (!fromName || !fromEmail || !message) { errEl.textContent = 'กรุณากรอกชื่อ อีเมล และข้อความ'; errEl.classList.remove('hidden'); return; }

  const { error } = await db.from('contact_messages').insert([{
    to_user_id: toId, from_name: fromName, from_email: fromEmail,
    subject: subject || 'ไม่มีหัวข้อ', message
  }]);

  if (error) { errEl.textContent = 'เกิดข้อผิดพลาด กรุณาลองใหม่'; errEl.classList.remove('hidden'); return; }
  sucEl.textContent = '✓ ส่งข้อความสำเร็จแล้ว!';
  sucEl.classList.remove('hidden');
  setTimeout(closeContactModal, 2000);
}
