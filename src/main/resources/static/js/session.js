/* All same-origin mutations carry a CSRF token; server sessions remain authoritative. */
(() => {
    const nativeFetch = window.fetch.bind(window);
    let tokenPromise;
    async function csrf() {
        if (!tokenPromise) {
            tokenPromise = nativeFetch('/api/csrf', {cache: 'no-store'})
                .then(response => { if (!response.ok) throw new Error('Unable to verify your session'); return response.json(); })
                .catch(error => { tokenPromise = null; throw error; });
        }
        return tokenPromise;
    }
    function expired() {
        sessionStorage.removeItem('currentUser');
        if (location.pathname !== '/login') location.replace('/login?expired=1');
    }
    window.fetch = async (input, init = {}) => {
        const url = new URL(input instanceof Request ? input.url : input, location.href);
        const local = url.origin === location.origin;
        const method = (init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
        if (local && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
            const token = await csrf();
            const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
            headers.set(token.headerName, token.token);
            init = {...init, headers};
        }
        const response = await nativeFetch(input, init);
        if (local && response.headers.get('X-Session-Expired') === 'true') expired();
        // CSRF runs before the session interceptor: an expired mutation may return 403 first.
        if (local && response.status === 403 && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
            tokenPromise = null;
            try {
                const session = await nativeFetch('/users/me', {cache: 'no-store'});
                if (session.status === 401) expired();
            } catch { /* Keep the original error available during a network failure. */ }
        }
        return response;
    };
    let pendingUser;
    window.PageTurnerSession = {
        async currentUser(force = false) {
            if (!pendingUser || force) {
                pendingUser = fetch('/users/me', {cache: 'no-store'}).then(async response => {
                    if (!response.ok) { if (response.status === 401) expired(); throw new Error('Unable to load your account'); }
                    const user = await response.json();
                    sessionStorage.setItem('currentUser', JSON.stringify(user));
                    window.dispatchEvent(new CustomEvent('session-user', {detail: user}));
                    return user;
                }).catch(error => { pendingUser = null; throw error; });
            }
            return pendingUser;
        },
        async logout() {
            const response = await fetch('/users/logout', {method: 'POST'});
            if (!response.ok) throw new Error('Could not sign out. Please try again.');
            sessionStorage.removeItem('currentUser');
            tokenPromise = null;
            location.assign('/login');
        }
    };
    // Revalidate restored/back-forward pages without extending idle sessions periodically.
    window.addEventListener('pageshow', event => {
        if (event.persisted && !['/login', '/register'].includes(location.pathname))
            PageTurnerSession.currentUser(true).catch(() => {});
    });
})();
