// ── PASSWORD TOGGLE (runs independently of Firebase) ──
document.getElementById('toggle-pw').addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var input = document.getElementById('admin-password');
    var show = input.getAttribute('type') === 'password';
    input.setAttribute('type', show ? 'text' : 'password');
    this.innerHTML = show ? '🙈' : '👁';
});
