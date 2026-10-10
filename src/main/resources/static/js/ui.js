/* Small progressive enhancements shared by server-rendered pages. */
(() => {
    // One decorative arrival per tab session; every book is visible without JS.
    const stack = document.querySelector('.book-stack');
    const replay = document.querySelector('.stack-replay');
    if (stack && replay && typeof stack.animate === 'function') {
        const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
        let animations = [];
        let playing = false;
        const settle = () => {
            animations.forEach(animation => animation.cancel());
            animations = [];
            playing = false;
            replay.setAttribute('aria-disabled', 'false');
        };
        const play = () => {
            if (playing || reducedMotion.matches) return;
            playing = true;
            replay.setAttribute('aria-disabled', 'true');
            animations = [...stack.children].map((book, index) => book.animate([
                { transform: `translateY(-260px) rotate(${index % 2 ? -14 : 12}deg)`, opacity: 0, offset: 0 },
                { opacity: 1, offset: .12 },
                { transform: 'translateY(0) rotate(0deg)', opacity: 1, offset: .7 },
                { transform: `translateY(-9px) rotate(${index % 2 ? 2 : -2}deg)`, offset: .84 },
                { transform: 'translateY(0) rotate(0deg)', opacity: 1, offset: 1 }
            ], { duration: 700, delay: index * 260, easing: 'linear', fill: 'backwards' }));
            Promise.all(animations.map(animation => animation.finished)).then(settle).catch(() => {});
        };
        const syncPreference = () => {
            replay.hidden = reducedMotion.matches;
            if (reducedMotion.matches) settle();
        };
        syncPreference();
        reducedMotion.addEventListener('change', syncPreference);
        replay.addEventListener('click', play);
        document.addEventListener('visibilitychange', () => { if (document.hidden) settle(); });
        try {
            if (!sessionStorage.getItem('pageturner-stack-seen')) {
                play();
                sessionStorage.setItem('pageturner-stack-seen', 'true');
            }
        } catch { play(); }
    }
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
