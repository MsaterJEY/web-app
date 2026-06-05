// ============================================
// SKILLS — CRUD
// ============================================

let allSkills = [];

async function loadSkills() {
  if (!currentUser) return;
  const { data } = await db.from('skills')
    .select('*').eq('user_id', currentUser.id)
    .order('sort_order').order('created_at');
  allSkills = data || [];
  renderSkills();
  document.getElementById('stat-skills').textContent = allSkills.length;
}

function renderSkills() {
  const list = document.getElementById('skills-list');
  if (!list) return;
  if (!allSkills.length) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">⚡</div>
      <h3>ยังไม่มีทักษะ</h3>
      <p>เพิ่มทักษะเพื่อแสดงความสามารถของคุณ</p>
      <button class="btn-primary" onclick="openSkillModal()">+ เพิ่มทักษะแรก</button>
    </div>`;
    return;
  }

  // Group by category
  const cats = {};
  allSkills.forEach(s => {
    const cat = s.category || 'other';
    if (!cats[cat]) cats[cat] = [];
    cats[cat].push(s);
  });

  const catLabels = { frontend: 'Frontend', backend: 'Backend', mobile: 'Mobile', design: 'Design', devops: 'DevOps', database: 'Database', other: 'อื่นๆ' };

  list.innerHTML = Object.entries(cats).map(([cat, skills]) => `
    <div style="margin-bottom:1.5rem;">
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:0.75rem;">${catLabels[cat] || cat}</div>
      ${skills.map(s => `
        <div class="skill-item">
          <div class="skill-info">
            <div class="skill-name">${s.name}</div>
          </div>
          <div class="skill-bar-wrap">
            <div class="skill-bar">
              <div class="skill-bar-fill" style="width:${s.level || 0}%"></div>
            </div>
          </div>
          <div class="skill-pct">${s.level || 0}%</div>
          <div class="skill-actions">
            <button class="icon-btn" onclick="editSkill('${s.id}')">✏️</button>
            <button class="icon-btn danger" onclick="deleteSkill('${s.id}')">🗑️</button>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');
}

function openSkillModal() {
  document.getElementById('skill-edit-id').value = '';
  document.getElementById('skill-name').value = '';
  document.getElementById('skill-level').value = 75;
  document.getElementById('skill-level-display').textContent = '75';
  document.getElementById('skill-category').value = 'frontend';
  document.getElementById('skill-error').classList.add('hidden');
  document.getElementById('skill-modal').classList.remove('hidden');
}

function closeSkillModal() {
  document.getElementById('skill-modal').classList.add('hidden');
}

function editSkill(id) {
  const s = allSkills.find(x => x.id === id);
  if (!s) return;
  document.getElementById('skill-edit-id').value = s.id;
  document.getElementById('skill-name').value = s.name;
  document.getElementById('skill-level').value = s.level || 75;
  document.getElementById('skill-level-display').textContent = s.level || 75;
  document.getElementById('skill-category').value = s.category || 'other';
  document.getElementById('skill-modal').classList.remove('hidden');
}

async function saveSkill() {
  if (!currentUser) return;
  const name = document.getElementById('skill-name').value.trim();
  const errEl = document.getElementById('skill-error');
  errEl.classList.add('hidden');
  if (!name) { errEl.textContent = 'กรุณาใส่ชื่อทักษะ'; errEl.classList.remove('hidden'); return; }

  const payload = {
    user_id: currentUser.id,
    name,
    category: document.getElementById('skill-category').value,
    level: parseInt(document.getElementById('skill-level').value),
  };

  const editId = document.getElementById('skill-edit-id').value;
  let error;
  if (editId) {
    ({ error } = await db.from('skills').update(payload).eq('id', editId));
  } else {
    ({ error } = await db.from('skills').insert([payload]));
  }

  if (error) { errEl.textContent = error.message; errEl.classList.remove('hidden'); return; }
  closeSkillModal();
  showToast(editId ? 'อัพเดทสำเร็จ ✓' : 'เพิ่มทักษะสำเร็จ ✓', 'success');
  await loadSkills();
}

async function deleteSkill(id) {
  if (!confirm('ต้องการลบทักษะนี้?')) return;
  await db.from('skills').delete().eq('id', id);
  showToast('ลบทักษะแล้ว', 'success');
  await loadSkills();
}
