/* Small progressive enhancements shared by server-rendered pages. */
(() => {
    document.querySelectorAll('.site-nav a').forEach(link => {
        if (link.getAttribute('href') === location.pathname) link.setAttribute('aria-current', 'page');
    });
    window.addEventListener('session-user', event => {
        const admin = ['SUPER_ADMIN', 'TENANT_ADMIN'].includes(event.detail.role);
        document.querySelectorAll('.site-nav a[href="/admin"],.site-nav a[href="/admin/users"],.site-nav a[href="/systeminfo"]').forEach(link => link.hidden = !admin);
    });
    if (document.querySelector('.site-nav')) PageTurnerSession.currentUser().catch(() => {});
    document.querySelectorAll('.input-wrapper input[type="password"]').forEach(input => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'password-toggle';
        button.textContent = 'Show';
        button.setAttribute('aria-label', `Show ${document.querySelector(`label[for="${input.id}"]`)?.textContent || 'password'}`);
        button.setAttribute('aria-pressed', 'false');
        button.addEventListener('click', () => {
            const visible = input.type === 'password';
            input.type = visible ? 'text' : 'password';
            button.textContent = visible ? 'Hide' : 'Show';
            button.setAttribute('aria-pressed', String(visible));
        });
        input.parentElement.append(button);
    });
    document.querySelectorAll('[role="button"][tabindex]').forEach(element => {
        element.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); element.click(); }
        });
    });
})();
