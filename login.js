// ================== FIREBASE CONFIG ==================
const firebaseConfig = {
    apiKey: "AIzaSyCqhDIaLS9PfMniZhCxa6kzjZV546AhNDQ",
    authDomain: "test-bc41d.firebaseapp.com",
    projectId: "test-bc41d",
    storageBucket: "test-bc41d.firebasestorage.app",
    messagingSenderId: "884871315952",
    appId: "1:884871315952:web:6ee7bf770d821ff64b5d35",
    measurementId: "G-9VJDQ0L0GD"
};
// ======================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ── TOAST SYSTEM ──
function toast(type, title, msg) {
    const icons = { success: '✓', error: '✕', info: '◆' };
    const container = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-body">
            <div class="toast-title">${title}</div>
            <div class="toast-msg">${msg}</div>
        </div>`;
    container.appendChild(el);
    setTimeout(() => {
        el.classList.add('removing');
        setTimeout(() => el.remove(), 300);
    }, 4000);
}

// ── TABS ──
const loginTab  = document.getElementById('login-tab');
const signupTab = document.getElementById('signup-tab');
const loginForm  = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

function showLogin() {
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
}

function showSignup() {
    signupForm.classList.add('active');
    loginForm.classList.remove('active');
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
}

loginTab.addEventListener('click', showLogin);
signupTab.addEventListener('click', showSignup);
document.getElementById('to-signup').addEventListener('click', showSignup);
document.getElementById('to-login').addEventListener('click', showLogin);

// ── FORGOT PASSWORD MODAL ──
const modal = document.getElementById('forgot-modal');

document.getElementById('forgot-link').addEventListener('click', () => {
    modal.classList.add('open');
    document.getElementById('reset-email').focus();
});

document.getElementById('cancel-reset').addEventListener('click', () => modal.classList.remove('open'));

modal.addEventListener('click', e => {
    if (e.target === modal) modal.classList.remove('open');
});

document.getElementById('send-reset').addEventListener('click', async () => {
    const email = document.getElementById('reset-email').value.trim();
    if (!email) { toast('error', 'Missing email', 'Please enter your email address.'); return; }

    const btn = document.getElementById('send-reset');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
        await sendPasswordResetEmail(auth, email);
        toast('success', 'Email sent!', `Check your inbox (and spam folder) for ${email}.`);
        modal.classList.remove('open');
        document.getElementById('reset-email').value = '';
    } catch (err) {
        console.error('Password reset error:', err.code, err.message);

        let msg = err.message;
        if (err.code === 'auth/user-not-found')     msg = 'No account found with this email address.';
        if (err.code === 'auth/invalid-email')       msg = 'Please enter a valid email address.';
        if (err.code === 'auth/too-many-requests')   msg = 'Too many attempts. Please try again later.';
        if (err.code === 'auth/network-request-failed') msg = 'Network error. Check your internet connection.';

        toast('error', 'Failed to send', msg);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Send Link';
    }
});

// ── LOGIN ──
loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    btn.disabled = true; btn.textContent = 'Signing in…';
    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        toast('success', 'Welcome back!', cred.user.email);
        setTimeout(() => { window.location.href = 'booking.html'; }, 1000);
    } catch (err) {
        toast('error', 'Login failed', err.message);
    } finally {
        btn.disabled = false; btn.textContent = 'Sign In';
    }
});

// ── SIGN UP ──
signupForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('signup-btn');
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    if (password !== confirm) { toast('error', 'Mismatch', 'Your passwords do not match.'); return; }
    btn.disabled = true; btn.textContent = 'Creating account…';
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        toast('success', 'Account created!', 'You can now log in.');
        showLogin();
    } catch (err) {
        toast('error', 'Sign up failed', err.message);
    } finally {
        btn.disabled = false; btn.textContent = 'Create Account';
    }
});

// ── INIT ──
showLogin();
