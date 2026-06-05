// ============================================
// PROJECTS — CRUD
// ============================================

let allProjects = [];

async function loadProjects() {
  if (!currentUser) return;
  const { data } = await db.from('projects')
    .select('*').eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });
  allProjects = data || [];
  renderProjects();
  document.getElementById('stat-projects').textContent = allProjects.length;
  const totalViews = allProjects.reduce((s, p) => s + (p.view_count || 0), 0);
  document.getElementById('stat-views').textContent = totalViews;
}

function renderProjects() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  if (!allProjects.length) {
    grid.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📂</div>
      <h3>ยังไม่มีโปรเจกต์</h3>
      <p>เริ่มเพิ่มโปรเจกต์แรกของคุณเลย!</p>
      <button class="btn-primary" onclick="openProjectModal()">+ เพิ่มโปรเจกต์แรก</button>
    </div>`;
    return;
  }
  grid.innerHTML = allProjects.map(p => `
    <div class="project-card">
      <div class="project-thumb">
        ${p.thumbnail_url ? `<img src="${p.thumbnail_url}" alt="${p.title}" onerror="this.parentElement.innerHTML='📁'"/>` : '📁'}
      </div>
      <div class="project-info">
        <div class="project-title">
          ${p.title}
          ${p.is_featured ? '<span class="project-featured-badge">★ Featured</span>' : ''}
          ${!p.is_published ? '<span style="font-size:10px;color:var(--muted);margin-left:4px;">[ซ่อน]</span>' : ''}
        </div>
        <div class="project-desc">${p.description || 'ไม่มีคำอธิบาย'}</div>
        <div class="project-tags">
          ${(p.tech_stack || []).slice(0,4).map(t => `<span class="project-tag">${t}</span>`).join('')}
        </div>
        <div class="project-footer">
          <button class="project-btn" onclick="editProject('${p.id}')">✏️ แก้ไข</button>
          <button class="project-btn danger" onclick="deleteProject('${p.id}')">🗑️ ลบ</button>
        </div>
      </div>
      <div class="project-stats">
        <span class="project-stat">👁️ ${p.view_count || 0} views</span>
        <span class="project-stat">❤️ ${p.like_count || 0} likes</span>
        ${p.project_url ? `<a href="${p.project_url}" target="_blank" class="project-stat" style="color:var(--accent);">🔗 Demo</a>` : ''}
      </div>
    </div>
  `).join('');
}

function openProjectModal(id) {
  clearProjectModal();
  document.getElementById('project-modal-title').textContent = '+ เพิ่มโปรเจกต์ใหม่';
  document.getElementById('project-modal').classList.remove('hidden');
}

function closeProjectModal() {
  document.getElementById('project-modal').classList.add('hidden');
}

function clearProjectModal() {
  ['project-edit-id','project-title','project-desc','project-thumbnail',
   'project-url','project-github','project-tech'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('project-category').value = '';
  document.getElementById('project-featured').checked = false;
  document.getElementById('project-published').checked = true;
  document.getElementById('project-error').classList.add('hidden');
}

async function editProject(id) {
  const p = allProjects.find(x => x.id === id);
  if (!p) return;
  document.getElementById('project-modal-title').textContent = '✏️ แก้ไขโปรเจกต์';
  document.getElementById('project-edit-id').value = p.id;
  document.getElementById('project-title').value = p.title || '';
  document.getElementById('project-desc').value = p.description || '';
  document.getElementById('project-thumbnail').value = p.thumbnail_url || '';
  document.getElementById('project-category').value = p.category || '';
  document.getElementById('project-url').value = p.project_url || '';
  document.getElementById('project-github').value = p.github_url || '';
  document.getElementById('project-tech').value = (p.tech_stack || []).join(', ');
  document.getElementById('project-featured').checked = p.is_featured || false;
  document.getElementById('project-published').checked = p.is_published !== false;
  document.getElementById('project-modal').classList.remove('hidden');
}

async function saveProject() {
  if (!currentUser) return;
  const title = document.getElementById('project-title').value.trim();
  const errEl = document.getElementById('project-error');
  errEl.classList.add('hidden');
  if (!title) { errEl.textContent = 'กรุณาใส่ชื่อโปรเจกต์'; errEl.classList.remove('hidden'); return; }

  const techRaw = document.getElementById('project-tech').value;
  const tech = techRaw ? techRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

  const payload = {
    user_id: currentUser.id,
    title,
    description: document.getElementById('project-desc').value.trim(),
    thumbnail_url: document.getElementById('project-thumbnail').value.trim() || null,
    category: document.getElementById('project-category').value || null,
    project_url: document.getElementById('project-url').value.trim() || null,
    github_url: document.getElementById('project-github').value.trim() || null,
    tech_stack: tech,
    is_featured: document.getElementById('project-featured').checked,
    is_published: document.getElementById('project-published').checked,
  };

  const editId = document.getElementById('project-edit-id').value;
  let error;
  if (editId) {
    ({ error } = await db.from('projects').update(payload).eq('id', editId));
  } else {
    ({ error } = await db.from('projects').insert([payload]));
  }

  if (error) { errEl.textContent = error.message; errEl.classList.remove('hidden'); return; }
  closeProjectModal();
  showToast(editId ? 'อัพเดทโปรเจกต์สำเร็จ ✓' : 'เพิ่มโปรเจกต์สำเร็จ ✓', 'success');
  await loadProjects();
}

async function deleteProject(id) {
  if (!confirm('ต้องการลบโปรเจกต์นี้?')) return;
  const { error } = await db.from('projects').delete().eq('id', id);
  if (error) { showToast('เกิดข้อผิดพลาด', 'error'); return; }
  showToast('ลบโปรเจกต์แล้ว', 'success');
  await loadProjects();
}
