const API_BASE = '/api/investigation/';
const CASES_API = '/api/cases/';
const EVIDENCE_API = '/api/evidence/';

const token = localStorage.getItem('token');
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
};


let currentCaseId = null;
let currentSuspectId = null;
let userRoles = [];

// DOM Elements
const caseSelect = document.getElementById('caseSelect');
const caseContent = document.getElementById('caseContent');
const resolutionPanel = document.getElementById('resolutionPanel');
const caseStatusText = document.getElementById('caseStatusText');
const detectiveActions = document.getElementById('detectiveActions');
const sergeantActions = document.getElementById('sergeantActions');
const chiefActions = document.getElementById('chiefActions');

// Warrant Elements
const warrantStatus = document.getElementById('warrantStatus');
const warrantType = document.getElementById('warrantType');
const warrantSuspect = document.getElementById('warrantSuspect');
const warrantDesc = document.getElementById('warrantDesc');
const btnRequestWarrant = document.getElementById('btnRequestWarrant');

const suspectsList = document.getElementById('suspectsList');

const addSuspectForm = document.getElementById('addSuspectForm');
const interrogationArea = document.getElementById('interrogationArea');
const currentSuspectName = document.getElementById('currentSuspectName');
const addInterrogationForm = document.getElementById('addInterrogationForm');
const interrogationsList = document.getElementById('interrogationsList');
const boardItems = document.getElementById('boardItems');
const fromItem = document.getElementById('fromItem');
const toItem = document.getElementById('toItem');
const addConnectionForm = document.getElementById('addConnectionForm');
const connectionsList = document.getElementById('connectionsList');

// Initialize
async function init() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('is_superuser');
        window.location.href = '/login/';
    });

    if (!token) {
        alert('لطفا ابتدا وارد شوید.');
        window.location.href = '/login/';
        return;
    }
    initTabs();
    await loadUserInfo();
    await loadCases();
}

async function loadUserInfo() {
    try {
        const res = await fetch('/api/auth/me/', { headers });
        if (!res.ok) {
            console.error('Failed to load user info', res.status);
            userRoles = [];
            return;
        }
        const data = await res.json();
        const rolesArray = Array.isArray(data.roles) ? data.roles : [];
        userRoles = rolesArray.map(r => r.code).filter(Boolean);
        if (data.is_superuser && !userRoles.includes('system_admin')) {
            userRoles.push('system_admin');
        }
        // Fallback: if roles came back empty but username is detective, assume detective role
        if (!userRoles.length && data.username === 'detective') {
            userRoles.push('detective');
        }
        console.log('User roles:', userRoles, 'raw:', data.roles);
        console.log('User info:', data);
    } catch (err) {
        console.error('Error loading user info:', err);
    }
}

async function loadCases() {
    try {
        const res = await fetch(CASES_API, { headers });
        const cases = await res.json();
        cases.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.id} - ${c.title} (${c.status_label})`;
            caseSelect.appendChild(opt);
        });
    } catch (err) {
        console.error('Error loading cases:', err);
    }
}

caseSelect.addEventListener('change', async (e) => {
    currentCaseId = e.target.value;
    if (currentCaseId) {
        caseContent.style.display = 'block';
        try { await updateCaseInfo(); } catch(e) { console.error(e); }
        try { await loadSuspects(); } catch(e) { console.error(e); }
        try { await loadEvidence(); } catch(e) { console.error(e); }
        try { await loadBoard(); } catch(e) { console.error(e); }
        try { await loadWarrants(); } catch(e) { console.error(e); }
    } else {
        caseContent.style.display = 'none';
    }
});

async function loadWarrants() {
    if (!warrantStatus) return;
    try {
        const res = await fetch(`${API_BASE}warrants/?case=${currentCaseId}`, { headers });
        if (res.ok) {
            const warrants = await res.json();
            if (warrants.length === 0) {
                warrantStatus.textContent = 'هیچ حکمی برای این پرونده ثبت نشده است.';
            } else {
                warrantStatus.innerHTML = warrants.map(w => `
                    <div style="font-size: 0.85em; margin-bottom: 4px; padding: 4px; background: rgba(0,0,0,0.2); border-radius: 4px;">
                        [${w.type_display}] ${w.status_display} 
                        ${w.approver_name ? `توسط ${w.approver_name}` : ''}
                        ${w.approver_notes ? `<br>نوشته: ${w.approver_notes}` : ''}
                    </div>
                `).join('');
            }
        }
    } catch (err) {
        warrantStatus.textContent = 'خطا در بارگذاری احکام.';
    }
}

if (btnRequestWarrant) {
    btnRequestWarrant.addEventListener('click', async () => {
        const data = {
            case: currentCaseId,
            type: warrantType.value,
            suspect: warrantSuspect.value || null,
            description: warrantDesc.value
        };
        if (!data.description) {
            alert('لطفا علت درخواست را بنویسید.');
            return;
        }
        try {
            const res = await fetch(`${API_BASE}warrants/`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data)
            });
            if (res.ok) {
                warrantDesc.value = '';
                await loadWarrants();
                alert('درخواست حکم با موفقیت ثبت شد.');
            } else {
                alert('خطا در ثبت درخواست.');
            }
        } catch (err) {
            alert('خطا در ارتباط با سرور.');
        }
    });
}


async function updateCaseInfo() {
    try {
        const res = await fetch(`${CASES_API}${currentCaseId}/`, { headers });
        const c = await res.json();
        
        console.log('Case Info:', c);
        console.log('User Roles:', userRoles);

        caseStatusText.textContent = c.status_label;
        resolutionPanel.style.display = 'block';
        
        // Hide all actions first
        detectiveActions.style.display = 'none';
        sergeantActions.style.display = 'none';
        chiefActions.style.display = 'none';
        // Clear any previous note
        if (!updateCaseInfo._noteEl) {
            const note = document.createElement('div');
            note.id = 'resolutionNote';
            note.style.marginTop = '6px';
            note.style.fontSize = '0.9em';
            note.style.color = '#ecf0f1';
            resolutionPanel.appendChild(note);
            updateCaseInfo._noteEl = note;
        }
        updateCaseInfo._noteEl.textContent = '';

        const isDetective = userRoles.includes('detective');
        const isSergeant = userRoles.includes('sergeant');
        const isChief = userRoles.includes('police_chief');
        const isCaptain = userRoles.includes('captain');
        const isAdmin = userRoles.includes('system_admin');

        // Detective can submit if status is Active
        if (c.status === 'AC' && (isDetective || isCaptain || isChief || isAdmin)) {
            detectiveActions.style.display = 'block';
        } 
        // Sergeant can review if status is Pending Sergeant
        else if (c.status === 'PS' && (isSergeant || isCaptain || isChief || isAdmin)) {
            sergeantActions.style.display = 'block';
        } 
        // Chief can review if status is Pending Chief
        else if (c.status === 'PC' && (isChief || isCaptain || isAdmin)) {
            chiefActions.style.display = 'block';
        }

        // If no action is visible, show a hint for why
        const anyVisible = ['block'].includes(detectiveActions.style.display) ||
                            ['block'].includes(sergeantActions.style.display) ||
                            ['block'].includes(chiefActions.style.display);
        if (!anyVisible) {
            const rolesStr = userRoles.join(', ') || 'بدون نقش';
            let reason = 'دکمه‌ای در دسترس نیست.';
            if (c.status === 'AC') {
                reason = 'پرونده در جریان است؛ برای ارسال، باید نقش کارآگاه/کاپیتان/رئیس پلیس داشته باشید.';
            } else if (c.status === 'PS') {
                reason = 'پرونده در انتظار بررسی گروهبان است؛ تنها گروهبان/کاپیتان/رئیس پلیس می‌بینند.';
            } else if (c.status === 'PC') {
                reason = 'پرونده در انتظار رئیس پلیس است؛ تنها رئیس پلیس/کاپیتان می‌بینند.';
            } else if (c.status === 'SO') {
                reason = 'پرونده مختومه شده است.';
            }
            updateCaseInfo._noteEl.textContent = `وضعیت: ${c.status_label} | نقش‌های شما: ${rolesStr} | ${reason}`;
        }

    } catch (err) {
        console.error('Error updating case info:', err);
    }
}

// Tab Switching
function initTabs() {
    console.log('Initializing tabs...');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('Tab clicked:', btn.dataset.tab);
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.style.display = 'none');
            
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            const targetTab = document.getElementById(tabId);
            if (targetTab) {
                targetTab.style.display = 'block';
                if (tabId === 'boardTab') {
                    loadBoard();
                }
            } else {
                console.error('Target tab not found:', tabId);
            }
        });
    });
}

// Evidence Logic
const evidenceTypeSelect = document.getElementById('evidenceTypeSelect');
const addEvidenceForm = document.getElementById('addEvidenceForm');
const evidenceList = document.getElementById('evidenceList');

evidenceTypeSelect.addEventListener('change', (e) => {
    document.querySelectorAll('.evidence-fields').forEach(f => f.style.display = 'none');
    const type = e.target.value;
    if (type === 'witness') document.getElementById('witnessFields').style.display = 'block';
    if (type === 'biological') document.getElementById('biologicalFields').style.display = 'block';
    if (type === 'vehicle') document.getElementById('vehicleFields').style.display = 'block';
    if (type === 'id_doc') document.getElementById('idDocFields').style.display = 'block';
});

async function loadEvidence() {
    try {
        const res = await fetch(`${EVIDENCE_API}?case=${currentCaseId}`, { headers });
        const evidence = await res.json();
        evidenceList.innerHTML = '';
        evidence.forEach(e => {
            const li = document.createElement('li');
            li.className = 'panel';
            li.style.marginBottom = '10px';
            li.innerHTML = `
                <strong>${e.title}</strong> (${e.type_display})<br>
                <small>${e.description}</small>
                <div style="margin-top:10px;">
                    <button onclick="toggleEvidenceBoard(${e.id})" class="button ghost small">${e.is_on_board ? 'حذف از تخته' : 'افزودن به تخته'}</button>
                </div>
            `;
            evidenceList.appendChild(li);
        });
    } catch (err) {
        console.error('Error loading evidence:', err);
    }
}

addEvidenceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(addEvidenceForm);
    const type = evidenceTypeSelect.value;
    
    let url = `${EVIDENCE_API}${type}/`;
    const data = {
        case: currentCaseId,
        title: formData.get('title'),
        description: formData.get('description')
    };

    if (type === 'witness') data.transcript = formData.get('transcript');
    if (type === 'biological') {
        data.is_verified = formData.get('is_verified') === 'on';
        data.medical_follow_up = formData.get('medical_follow_up');
    }
    if (type === 'vehicle') {
        data.model_name = formData.get('model_name');
        data.color = formData.get('color');
        data.license_plate = formData.get('license_plate');
        data.serial_number = formData.get('serial_number');
    }
    if (type === 'id_doc') {
        data.owner_full_name = formData.get('owner_full_name');
        try {
            data.extra_info = JSON.parse(formData.get('extra_info_json') || '{}');
        } catch (err) {
            alert('JSON نامعتبر است');
            return;
        }
    }
    if (type === 'other') url = `${EVIDENCE_API}other/`;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        if (res.ok) {
            addEvidenceForm.reset();
            await loadEvidence();
            await loadBoard();
        } else {
            const errData = await res.json();
            alert('خطا: ' + JSON.stringify(errData));
        }
    } catch (err) {
        console.error('Error adding evidence:', err);
    }
});

window.toggleEvidenceBoard = async (id) => {
    try {
        const res = await fetch(`${EVIDENCE_API}all/${id}/toggle_board/`, {
            method: 'POST',
            headers
        });
        if (res.ok) {
            await loadEvidence();
            await loadBoard();
        }
    } catch (err) {
        console.error('Error toggling evidence board:', err);
    }
};

// Suspects Logic
async function loadSuspects() {
    try {
        const res = await fetch(`${API_BASE}suspects/?case=${currentCaseId}`, { headers });
        const suspects = await res.json();
        suspectsList.innerHTML = '';
        
        // Update Warrant Suspect Dropdown
        if (warrantSuspect) {
            warrantSuspect.innerHTML = '<option value="">بدون متهم مشخص</option>';
            suspects.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.name;
                warrantSuspect.appendChild(opt);
            });
        }

        suspects.forEach(s => {

            const li = document.createElement('li');
            li.className = 'panel';
            li.style.marginBottom = '10px';
            li.innerHTML = `
                <strong>${s.name}</strong> - ${s.details} 
                ${s.is_main_suspect ? '<span class="badge">متهم اصلی</span>' : ''}
                <div style="margin-top:10px;">
                    <button onclick="showInterrogations(${s.id}, '${s.name}')" class="button small">بازجویی‌ها</button>
                    <button onclick="toggleSuspectBoard(${s.id})" class="button ghost small">${s.is_on_board ? 'حذف از تخته' : 'افزودن به تخته'}</button>
                </div>
            `;
            suspectsList.appendChild(li);
        });
    } catch (err) {
        console.error('Error loading suspects:', err);
    }
}

addSuspectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(addSuspectForm);
    const data = {
        case: currentCaseId,
        name: formData.get('name'),
        details: formData.get('details'),
        is_main_suspect: formData.get('is_main_suspect') === 'on'
    };
    try {
        const res = await fetch(`${API_BASE}suspects/`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        if (res.ok) {
            addSuspectForm.reset();
            await loadSuspects();
        } else {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const errData = await res.json();
                console.error('Server error:', errData);
                alert('خطا در افزودن متهم: ' + JSON.stringify(errData));
            } else {
                const text = await res.text();
                console.error('Server error (HTML):', text);
                alert('خطا در سرور. لطفا کنسول را چک کنید.');
            }
        }
    } catch (err) {
        console.error('Error adding suspect:', err);
    }
});

async function toggleSuspectBoard(id) {
    try {
        await fetch(`${API_BASE}suspects/${id}/toggle_board/`, { method: 'POST', headers });
        await loadSuspects();
        await loadBoard();
    } catch (err) {
        console.error('Error toggling suspect board:', err);
    }
}

// Interrogations Logic
async function showInterrogations(id, name) {
    currentSuspectId = id;
    currentSuspectName.textContent = name;
    interrogationArea.style.display = 'block';
    await loadInterrogations();
}

async function loadInterrogations() {
    try {
        const res = await fetch(`${API_BASE}interrogations/?suspect=${currentSuspectId}`, { headers });
        const data = await res.json();
        interrogationsList.innerHTML = '';
        
        const isCaptain = userRoles.includes('captain') || userRoles.includes('police_chief') || userRoles.includes('system_admin');

        if (data.length === 0) {
            interrogationsList.innerHTML = '<li style="color:#7f8c8d; text-align:center; padding:20px;">هنوز بازجویی‌ای برای این متهم ثبت نشده است.</li>';
            return;
        }

        data.forEach(i => {
            const li = document.createElement('li');
            li.style.borderBottom = '1px solid #ddd';
            li.style.padding = '15px';
            li.style.marginBottom = '10px';
            li.style.background = '#fafafa';
            li.style.borderRadius = '6px';
            
            let feedbackHtml = '';
            if (i.feedback) {
                feedbackHtml = `
                    <div style="background:#d4edda; color:#155724; padding:10px; border-radius:4px; margin-top:10px; border-left:4px solid #28a745;">
                        <strong>✓ تایید شده توسط کاپیتان</strong><br>
                        <small>امتیاز نهایی: <strong>${i.feedback.final_score}</strong></small>
                    </div>
                `;
            } else if (isCaptain) {
                feedbackHtml = `
                    <div style="background:#cfe2ff; color:#084298; padding:10px; border-radius:4px; margin-top:10px; border-left:4px solid #0d6efd;">
                        <small style="font-weight:bold;">کاپیتان: امتیاز نهایی را تایید کنید</small><br>
                        <div style="margin-top:8px; display:flex; gap:8px;">
                            <input type="number" id="finalScore-${i.id}" min="1" max="10" placeholder="۱-۱۰" style="flex:1; padding:6px; border:1px solid #0d6efd; border-radius:4px;" />
                            <button onclick="provideFeedback(${i.id})" class="button small" style="background:#0d6efd; padding:6px 12px;">تایید</button>
                        </div>
                    </div>
                `;
            } else {
                feedbackHtml = '<div style="background:#fff3cd; color:#664d03; padding:10px; border-radius:4px; margin-top:10px; border-left:4px solid #ffc107;"><em>⏳ در انتظار تایید کاپیتان</em></div>';
            }

            li.innerHTML = `
                <div style="margin-bottom:8px;">
                    <strong style="color:#2c3e50;">بازجویی کارآگاه</strong>
                </div>
                <p style="margin:5px 0; color:#555;"><strong>متن:</strong> ${i.transcript.substring(0, 100)}${i.transcript.length > 100 ? '...' : ''}</p>
                <p style="margin:5px 0; color:#2c3e50;"><strong>امتیاز اولیه (کارآگاه):</strong> <span style="background:#3498db; color:white; padding:2px 6px; border-radius:3px; font-weight:bold;">${i.score}/10</span></p>
                ${feedbackHtml}
            `;
            interrogationsList.appendChild(li);
        });
    } catch (err) {
        console.error('Error loading interrogations:', err);
    }
}

window.provideFeedback = async function(interrogationId) {
    const score = document.getElementById(`finalScore-${interrogationId}`).value;
    if (!score) return alert('لطفا امتیاز را وارد کنید.');
    
    try {
        const res = await fetch(`${API_BASE}interrogations/${interrogationId}/feedback/`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ final_score: score, is_confirmed: true })
        });
        if (res.ok) {
            alert('امتیاز نهایی ثبت شد.');
            await loadInterrogations();
        }
    } catch (err) {
        console.error('Error providing feedback:', err);
    }
}

addInterrogationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(addInterrogationForm);
    const data = {
        suspect: currentSuspectId,
        transcript: formData.get('transcript'),
        score: formData.get('score')
    };
    try {
        const res = await fetch(`${API_BASE}interrogations/`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        if (res.ok) {
            addInterrogationForm.reset();
            await loadInterrogations();
        }
    } catch (err) {
        console.error('Error adding interrogation:', err);
    }
});

// Board Logic
async function loadBoard() {
    if (!currentCaseId) return;
    try {
        console.log('Loading board for case:', currentCaseId);
        
        // Load suspects on board
        const sRes = await fetch(`${API_BASE}suspects/?case=${currentCaseId}`, { headers });
        const suspects = sRes.ok ? await sRes.json() : [];
        
        // Load all evidence for the case
        const eRes = await fetch(`${EVIDENCE_API}all/?case=${currentCaseId}`, { headers });
        const evidence = eRes.ok ? await eRes.json() : [];
        
        console.log('Suspects found:', suspects.length);
        console.log('Evidence found:', evidence.length);

        // Preserve the SVG element, clear everything else
        const svg = document.getElementById('boardSvg');
        boardItems.innerHTML = '';
        if (svg) {
            boardItems.appendChild(svg);
            svg.innerHTML = ''; // Clear old lines
        } else {
            // Recreate if missing
            const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            newSvg.id = 'boardSvg';
            boardItems.appendChild(newSvg);
        }

        fromItem.innerHTML = '<option value="">از...</option>';
        toItem.innerHTML = '<option value="">به...</option>';

        if (!Array.isArray(suspects) || !Array.isArray(evidence)) {
            boardItems.innerHTML = '<p style="color:white;">خطا در دریافت داده‌ها</p>';
            return;
        }

        // Render Suspects on Board
        const suspectsOnBoard = suspects.filter(s => s.is_on_board);
        console.log('Suspects on board:', suspectsOnBoard.length);
        
        suspectsOnBoard.forEach(s => {
            const div = document.createElement('div');
            div.className = 'board-item suspect';
            div.id = `board-suspect-${s.id}`;
            div.innerHTML = `<strong style="font-size:0.85em;">${s.name}</strong><br><small style="font-size:0.7em;">متهم</small>`;
            boardItems.appendChild(div);

            const opt = document.createElement('option');
            opt.value = `suspect_${s.id}`;
            opt.textContent = `متهم: ${s.name}`;
            fromItem.appendChild(opt.cloneNode(true));
            toItem.appendChild(opt);
        });

        // Render Evidence on Board
        const evidenceOnBoard = evidence.filter(e => e.is_on_board);
        console.log('Evidence on board:', evidenceOnBoard.length);

        evidenceOnBoard.forEach(e => {
            const div = document.createElement('div');
            div.className = 'board-item evidence';
            div.id = `board-evidence-${e.id}`;
            
            let imgHtml = '';
            if (e.images && e.images.length > 0) {
                imgHtml = `<img src="${e.images[0].image}" style="width:100%; height:60px; object-fit:cover; border-radius:2px; margin-bottom:5px;">`;
            } else {
                imgHtml = `<div style="width:100%; height:60px; background:#ecf0f1; border-radius:2px; margin-bottom:5px; display:flex; align-items:center; justify-content:center; color:#95a5a6; font-size:0.6em; border: 1px dashed #bdc3c7;">بدون تصویر</div>`;
            }

            div.innerHTML = `
                ${imgHtml}
                <div style="font-weight:bold; font-size:0.8em; margin-bottom:2px;">${e.title}</div>
                <div style="font-size:0.7em; color:#7f8c8d;">${e.type_display || 'مدرک'}</div>
            `;
            boardItems.appendChild(div);

            const opt = document.createElement('option');
            opt.value = `evidence_${e.id}`;
            opt.textContent = `مدرک: ${e.title}`;
            fromItem.appendChild(opt.cloneNode(true));
            toItem.appendChild(opt);
        });

        if (suspectsOnBoard.length === 0 && evidenceOnBoard.length === 0) {
            boardItems.innerHTML += '<p style="color:#bdc3c7; width:100%; text-align:center; margin-top:100px;">هیچ موردی به تخته اضافه نشده است. از تب‌های دیگر "افزودن به تخته" را بزنید.</p>';
        }

        // Small delay to allow browser to layout items before drawing lines
        setTimeout(() => loadConnections(), 100);
    } catch (err) {
        console.error('Error loading board:', err);
        boardItems.innerHTML = '<p style="color:white;">خطا در بارگذاری تخته</p>';
    }
}

async function loadConnections() {
    const svg = document.getElementById('boardSvg');
    if (svg) svg.innerHTML = '';

    try {
        const res = await fetch(`${API_BASE}board-connections/?case=${currentCaseId}`, { headers });
        const connections = await res.json();
        console.log('Loaded connections:', connections);
        connectionsList.innerHTML = '';
        
        connections.forEach(c => {
            const li = document.createElement('li');
            li.textContent = `${c.description}`;
            connectionsList.appendChild(li);

            // Draw line on SVG
            if (svg) {
                const fromId = c.from_suspect ? `board-suspect-${c.from_suspect}` : `board-evidence-${c.from_evidence}`;
                const toId = c.to_suspect ? `board-suspect-${c.to_suspect}` : `board-evidence-${c.to_evidence}`;

                console.log(`Attempting to draw line from ${fromId} to ${toId}`);

                const fromEl = document.getElementById(fromId);
                const toEl = document.getElementById(toId);

                if (fromEl && toEl) {
                    const rect1 = fromEl.getBoundingClientRect();
                    const rect2 = toEl.getBoundingClientRect();
                    const containerRect = boardItems.getBoundingClientRect();

                    const x1 = rect1.left + rect1.width / 2 - containerRect.left;
                    const y1 = rect1.top + rect1.height / 2 - containerRect.top;
                    const x2 = rect2.left + rect2.width / 2 - containerRect.left;
                    const y2 = rect2.top + rect2.height / 2 - containerRect.top;

                    console.log(`Coordinates: (${x1}, ${y1}) to (${x2}, ${y2})`);

                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', x1);
                    line.setAttribute('y1', y1);
                    line.setAttribute('x2', x2);
                    line.setAttribute('y2', y2);
                    line.setAttribute('stroke', '#ff0000'); // Pure red
                    line.setAttribute('stroke-width', '4'); // Thicker
                    line.setAttribute('stroke-dasharray', '8,4'); // Better dash pattern
                    line.setAttribute('style', 'filter: drop-shadow(0 0 2px rgba(255,0,0,0.5));'); // Glow effect
                    
                    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                    title.textContent = c.description;
                    line.appendChild(title);

                    svg.appendChild(line);
                } else {
                    console.warn('Could not find elements for connection:', { fromId, toId, fromEl: !!fromEl, toEl: !!toEl });
                }
            }
        });
    } catch (err) {
        console.error('Error loading connections:', err);
    }
}

addConnectionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentCaseId) {
        alert('لطفا ابتدا یک پرونده انتخاب کنید.');
        return;
    }

    const formData = new FormData(addConnectionForm);
    const fromVal = formData.get('from');
    const toVal = formData.get('to');
    
    const data = {
        case: parseInt(currentCaseId),
        description: formData.get('description'),
        from_suspect: null,
        from_evidence: null,
        to_suspect: null,
        to_evidence: null
    };

    if (fromVal.startsWith('suspect_')) data.from_suspect = parseInt(fromVal.split('_')[1]);
    if (fromVal.startsWith('evidence_')) data.from_evidence = parseInt(fromVal.split('_')[1]);
    
    if (toVal.startsWith('suspect_')) data.to_suspect = parseInt(toVal.split('_')[1]);
    if (toVal.startsWith('evidence_')) data.to_evidence = parseInt(toVal.split('_')[1]);

    console.log('Sending connection data:', data);

    try {
        const res = await fetch(`${API_BASE}board-connections/`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        
        if (res.ok) {
            addConnectionForm.reset();
            await loadBoard(); // Refresh everything to ensure IDs are present
        } else {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const errData = await res.json();
                console.error('Server error:', errData);
                alert('خطا در ایجاد اتصال: ' + JSON.stringify(errData));
            } else {
                const text = await res.text();
                console.error('Server error (HTML):', text);
                alert('خطا در سرور. لطفا کنسول را چک کنید.');
            }
        }
    } catch (err) {
        console.error('Error adding connection:', err);
        alert('خطا در ارتباط با سرور.');
    }
});

// Resolution Actions
document.getElementById('btnSubmitResolution').addEventListener('click', async () => {
    try {
        const res = await fetch(`${CASES_API}${currentCaseId}/submit_resolution/`, {
            method: 'POST',
            headers
        });
        if (res.ok) {
            alert('پرونده برای بررسی گروهبان ارسال شد.');
            await updateCaseInfo();
        } else {
            const data = await res.json();
            alert('خطا: ' + (data.error || 'ارسال ناموفق بود.'));
        }
    } catch (err) {
        console.error('Error submitting resolution:', err);
    }
});

document.getElementById('btnApproveSergeant').addEventListener('click', async () => {
    const notes = document.getElementById('sergeantNotes').value;
    try {
        const res = await fetch(`${CASES_API}${currentCaseId}/sergeant_review/`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ approved: true, notes })
        });
        if (res.ok) {
            alert('بررسی ثبت شد.');
            await updateCaseInfo();
        }
    } catch (err) {
        console.error('Error in sergeant review:', err);
    }
});

document.getElementById('btnRejectSergeant').addEventListener('click', async () => {
    const notes = document.getElementById('sergeantNotes').value;
    try {
        const res = await fetch(`${CASES_API}${currentCaseId}/sergeant_review/`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ approved: false, notes })
        });
        if (res.ok) {
            alert('پرونده رد شد و به کارآگاه بازگشت.');
            await updateCaseInfo();
        }
    } catch (err) {
        console.error('Error in sergeant review:', err);
    }
});

document.getElementById('btnApproveChief').addEventListener('click', async () => {
    try {
        const res = await fetch(`${CASES_API}${currentCaseId}/chief_review/`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ approved: true })
        });
        if (res.ok) {
            alert('تایید نهایی رئیس پلیس ثبت شد. پرونده مختومه گشت.');
            await updateCaseInfo();
        }
    } catch (err) {
        console.error('Error in chief review:', err);
    }
});

document.getElementById('btnRejectChief').addEventListener('click', async () => {
    try {
        const res = await fetch(`${CASES_API}${currentCaseId}/chief_review/`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ approved: false })
        });
        if (res.ok) {
            alert('پرونده توسط رئیس پلیس رد شد.');
            await updateCaseInfo();
        }
    } catch (err) {
        console.error('Error in chief review:', err);
    }
});

init();
