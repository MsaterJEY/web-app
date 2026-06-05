// ============================================
// EXPLORE — Browse all public projects
// ============================================

let exploreProjects = [];

async function loadExplore() {
  const grid = document.getElementById('explore-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading-projects">กำลังโหลด...</div>';

  const { data } = await db.from('projects')
    .select(`*, profiles(full_name, title, avatar_url)`)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(50);

  exploreProjects = data || [];
  renderExplore(exploreProjects);

  // Update auth button
  const navBtn = document.getElementById('nav-auth-btn');
  if (navBtn) {
    if (currentUser) {
      navBtn.textContent = 'Dashboard';
      navBtn.onclick = () => showPage('dashboard');
    } else {
      navBtn.textContent = 'เข้าสู่ระบบ';
      navBtn.onclick = openAuthModal;
    }
  }
}

function renderExplore(projects) {
  const grid = document.getElementById('explore-grid');
  if (!grid) return;

  if (!projects.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔍</div><h3>ไม่พบโปรเจกต์</h3></div>';
    return;
  }

  grid.innerHTML = projects.map(p => {
    const authorName = p.profiles?.full_name || 'Anonymous';
    const authorInitial = authorName[0].toUpperCase();
    return `
      <div class="pub-project-card" onclick="viewAuthorPortfolio('${p.user_id}')" style="cursor:pointer;">
        <div class="pub-thumb">
          ${p.thumbnail_url ? `<img src="${p.thumbnail_url}" alt="${p.title}" onerror="this.parentElement.innerHTML='📁'"/>` : '📁'}
        </div>
        <div class="pub-info">
          <div class="pub-title">${p.title}${p.is_featured ? ' <span style="color:var(--warning)">★</span>' : ''}</div>
          ${p.description ? `<div class="pub-desc">${p.description}</div>` : ''}
          <div class="pub-tags">
            ${(p.tech_stack || []).slice(0,4).map(t => `<span class="pub-tag">${t}</span>`).join('')}
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid var(--border);">
            <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">${authorInitial}</div>
            <div>
              <div style="font-size:12px;font-weight:600;">${authorName}</div>
              ${p.profiles?.title ? `<div style="font-size:10px;color:var(--muted)">${p.profiles.title}</div>` : ''}
            </div>
            <div style="margin-left:auto;font-size:11px;color:var(--muted);">👁️ ${p.view_count || 0}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function viewAuthorPortfolio(userId) {
  await renderPublicPortfolio(userId);
  showPage('portfolio');
}

function filterProjects(query) {
  if (!query.trim()) { renderExplore(exploreProjects); return; }
  const q = query.toLowerCase();
  const filtered = exploreProjects.filter(p =>
    p.title?.toLowerCase().includes(q) ||
    p.description?.toLowerCase().includes(q) ||
    (p.tech_stack || []).some(t => t.toLowerCase().includes(q)) ||
    p.profiles?.full_name?.toLowerCase().includes(q)
  );
  renderExplore(filtered);
}
