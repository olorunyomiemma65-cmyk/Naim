import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCqhDIaLS9PfMniZhCxa6kzjZV546AhNDQ",
    authDomain: "test-bc41d.firebaseapp.com",
    projectId: "test-bc41d",
    storageBucket: "test-bc41d.firebasestorage.app",
    messagingSenderId: "884871315952",
    appId: "1:884871315952:web:6ee7bf770d821ff64b5d35",
    measurementId: "G-9VJDQ0L0GD"
};

// ── EMAILJS CONFIG ──
const EMAILJS_PUBLIC_KEY       = "mgXvrQKIT2yNaWdH3";
const EMAILJS_SERVICE_ID       = "service_fpdlbxb";
const EMAILJS_CANCEL_TEMPLATE  = "template_cancel";    // ← create this template in EmailJS
const EMAILJS_CONFIRM_TEMPLATE = "template_confirm";   // ← create this template in EmailJS

// ======= ADD ALL ADMIN EMAILS HERE =======
const ADMIN_EMAILS = [
    "your-admin@email.com",     // ← replace with your email
    // "second-admin@email.com", // ← add more admins here
];
const isAdmin = email => ADMIN_EMAILS.includes(email);
// ==========================================

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── TOAST ──
function toast(type, title, msg) {
    const icons = { success: '✓', error: '✕' };
    const container = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<div class="toast-icon">${icons[type]||'◆'}</div><div class="toast-body"><div class="toast-title">${title}</div><div class="toast-msg">${msg}</div></div>`;
    container.appendChild(el);
    setTimeout(() => { el.classList.add('removing'); setTimeout(() => el.remove(), 300); }, 4000);
}

// ── SHOW DASHBOARD ──
function showDashboard(email) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('nav-user').textContent = email;
    loadBookings();
}

// ── AUTO LOGIN CHECK ──
onAuthStateChanged(auth, user => {
    if (user && isAdmin(user.email)) {
        showDashboard(user.email);
    }
});

// ── ADMIN LOGIN ──
document.getElementById('admin-login-btn').addEventListener('click', async () => {
    const email    = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    const btn      = document.getElementById('admin-login-btn');
    const errorEl  = document.getElementById('login-error');

    errorEl.classList.remove('show');

    if (!email || !password) {
        errorEl.textContent = 'Please enter your email and password.';
        errorEl.classList.add('show');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Signing in...';

    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (!isAdmin(cred.user.email)) {
            await signOut(auth);
            errorEl.textContent = 'Access denied. This account is not an admin.';
            errorEl.classList.add('show');
            btn.disabled = false;
            btn.textContent = 'Sign In to Dashboard';
            return;
        }
        showDashboard(cred.user.email);
    } catch(err) {
        errorEl.textContent = 'Incorrect email or password. Access denied.';
        errorEl.classList.add('show');
        btn.disabled = false;
        btn.textContent = 'Sign In to Dashboard';
    }
});

// Enter key submits
document.getElementById('admin-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('admin-login-btn').click();
});

// ── LOGOUT ──
document.getElementById('logout-btn').addEventListener('click', async () => {
    await signOut(auth);
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('admin-email').value = '';
    document.getElementById('admin-password').value = '';
});

// ── LOAD BOOKINGS ──
let allBookings = [];

function loadBookings() {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    onSnapshot(q, snapshot => {
        allBookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        updateStats();
        renderTable();
    }, err => {
        document.getElementById('bookings-tbody').innerHTML =
            '<tr class="loading-row"><td colspan="7">⚠️ Error loading bookings. Check Firestore rules.</td></tr>';
    });
}

// ── STATS ──
function updateStats() {
    document.getElementById('stat-total').textContent     = allBookings.length;
    document.getElementById('stat-pending').textContent   = allBookings.filter(b => b.status === 'pending').length;
    document.getElementById('stat-confirmed').textContent = allBookings.filter(b => b.status === 'confirmed').length;
    document.getElementById('stat-cancelled').textContent = allBookings.filter(b => b.status === 'cancelled').length;
}

// ── RENDER TABLE ──
function renderTable() {
    const search  = document.getElementById('search-input').value.toLowerCase();
    const status  = document.getElementById('filter-status').value;
    const service = document.getElementById('filter-service').value;

    const filtered = allBookings.filter(b => {
        const matchSearch  = !search || b.name?.toLowerCase().includes(search) || b.email?.toLowerCase().includes(search);
        const matchStatus  = status  === 'all' || b.status  === status;
        const matchService = service === 'all' || b.service === service;
        return matchSearch && matchStatus && matchService;
    });

    document.getElementById('showing-count').textContent = filtered.length;
    const tbody = document.getElementById('bookings-tbody');

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📭</div><p>No bookings found</p></div></td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(b => `
        <tr>
            <td><div class="customer-name">${b.name||'—'}</div><div class="customer-email">${b.email||''}</div></td>
            <td>${b.service||'—'}</td>
            <td>${b.date||'—'}<br><span style="font-size:12px;color:var(--muted)">${b.time||''}</span></td>
            <td style="max-width:160px;font-size:13px">${b.address||'—'}</td>
            <td style="font-weight:600;color:var(--accent)">${b.price||'—'}</td>
            <td><span class="badge ${b.status||'pending'}">${(b.status||'pending').charAt(0).toUpperCase()+(b.status||'pending').slice(1)}</span></td>
            <td>
                <div class="actions">
                    <button class="btn-view" onclick="openDetail('${b.id}')">View</button>
                    ${b.status !== 'confirmed' ? `<button class="btn-confirm-booking" onclick="updateStatus('${b.id}','confirmed')">Confirm</button>` : ''}
                    ${b.status !== 'cancelled' ? `<button class="btn-cancel-booking" onclick="updateStatus('${b.id}','cancelled')">Cancel</button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// ── UPDATE STATUS ──
window.updateStatus = async function(id, status) {
    try {
        // Update Firestore
        await updateDoc(doc(db, 'bookings', id), { status });

        // Find booking details to send email
        const b = allBookings.find(x => x.id === id);
        if (b && b.email) {
            const templateId = status === 'cancelled'
                ? EMAILJS_CANCEL_TEMPLATE
                : EMAILJS_CONFIRM_TEMPLATE;

            emailjs.init(EMAILJS_PUBLIC_KEY);
            await emailjs.send(EMAILJS_SERVICE_ID, templateId, {
                to_email:      b.email,
                customer_name: b.name     || 'Customer',
                service:       b.service  || '—',
                date:          b.date     || '—',
                time:          b.time     || '—',
                address:       b.address  || '—',
                price:         b.price    || '—',
                status:        status.charAt(0).toUpperCase() + status.slice(1)
            });
            toast('success', 'Updated!', `Booking ${status} & email sent to ${b.email}.`);
        } else {
            toast('success', 'Updated!', `Booking marked as ${status}.`);
        }
    } catch(err) {
        console.error(err);
        toast('error', 'Error', err.message);
    }
};

// ── OPEN DETAIL MODAL ──
window.openDetail = function(id) {
    const b = allBookings.find(x => x.id === id);
    if (!b) return;

    document.getElementById('modal-customer-name').textContent  = b.name  || '—';
    document.getElementById('modal-customer-email').textContent = b.email || '—';

    document.getElementById('modal-details').innerHTML = [
        ['Service',   b.service   || '—'],
        ['Date',      b.date      || '—'],
        ['Time',      b.time      || '—'],
        ['Phone',     b.phone     || '—'],
        ['Address',   b.address   || '—'],
        ['Rooms',     b.rooms     || '—'],
        ['Frequency', b.frequency || '—'],
        ['Price',     b.price     || '—'],
        ['Notes',     b.notes     || 'None'],
        ['Status',    (b.status||'pending').charAt(0).toUpperCase()+(b.status||'pending').slice(1)],
    ].map(([label, value]) =>
        `<div class="detail-row"><span class="label">${label}</span><span class="value">${value}</span></div>`
    ).join('');

    document.getElementById('modal-actions').innerHTML = `
        ${b.status !== 'confirmed' ? `<button class="btn-modal-confirm" onclick="updateStatus('${b.id}','confirmed');closeModal()">✓ Confirm Booking</button>` : ''}
        ${b.status !== 'cancelled' ? `<button class="btn-modal-cancel" onclick="updateStatus('${b.id}','cancelled');closeModal()">✕ Cancel Booking</button>` : ''}
    `;

    document.getElementById('detail-modal').classList.add('open');
};

// ── CLOSE MODAL ──
window.closeModal = function() {
    document.getElementById('detail-modal').classList.remove('open');
};

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('detail-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('detail-modal')) closeModal();
});

// ── FILTERS ──
document.getElementById('search-input').addEventListener('input', renderTable);
document.getElementById('filter-status').addEventListener('change', renderTable);
document.getElementById('filter-service').addEventListener('change', renderTable);
