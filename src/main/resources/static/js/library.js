/* All book content is rendered as text; ownership is enforced by the server. */
(() => {
    const grid = document.getElementById('bookGrid');
    const title = document.getElementById('resultsTitle');
    const count = document.getElementById('resultsCount');
    const refresh = document.getElementById('refreshBooks');
    const previous = document.getElementById('previousBooks');
    const filter = document.getElementById('readingFilter');
    const dialog = document.getElementById('bookDetails');
    const statuses = {WANT_TO_READ: 'Want to read', READING: 'Reading', FINISHED: 'Finished'};
    let activeRequest, noticeTimer;
    let libraryView = false, currentPage = 1, currentQuery = 'bestsellers', currentBooks = [];
    const saved = new Map();
    // The database uses one saved title per account, independent of edition.
    const key = book => String(book.title || '').trim().toLocaleLowerCase();
    const node = (tag, className, text) => {
        const element = document.createElement(tag);
        element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    };
    function notify(message, error = false) {
        const notice = document.getElementById('libraryNotice');
        notice.textContent = message;
        notice.classList.toggle('error', error);
        notice.hidden = false;
        clearTimeout(noticeTimer);
        noticeTimer = setTimeout(() => { notice.hidden = true; }, 5000);
    }
    async function jsonResponse(response) {
        if (!response.ok) {
            const data = await response.json().catch(() => null);
            throw new Error(data?.message || 'Unable to complete this request. Please try again.');
        }
        return response.json();
    }
    function emptyState(heading, description, label, action) {
        const state = node('div', 'state-msg');
        state.append(node('h3', '', heading), node('p', '', description));
        if (action) {
            const button = node('button', 'btn', label);
            button.addEventListener('click', action);
            state.append(button);
        }
        grid.replaceChildren(state);
    }
    function renderCollection() {
        const visible = libraryView && filter.value !== 'ALL'
            ? currentBooks.filter(book => (book.readingStatus || 'WANT_TO_READ') === filter.value) : currentBooks;
        count.textContent = libraryView ? `${visible.length} ${visible.length === 1 ? 'book' : 'books'} saved` : `${currentBooks.length} books · Selection ${currentPage}`;
        if (!visible.length) {
            const filtered = libraryView && currentBooks.length > 0;
            emptyState(filtered ? 'No books at this stage yet.' : libraryView ? 'Make room for your favorites.' : 'A different story awaits.',
                filtered ? 'Change a book’s reading status to organize your collection.' : libraryView ? 'Save a book from Discover and you’ll find it here.' : 'Try another title, author, or genre.',
                filtered ? 'Show all saved books' : 'Explore books', filtered ? () => { filter.value = 'ALL'; renderCollection(); } : () => loadBooks('bestsellers'));
        } else grid.replaceChildren(...visible.map(renderBook));
    }
    async function loadBooks(query = currentQuery, personal = false, page = 1) {
        activeRequest?.abort();
        const request = new AbortController();
        activeRequest = request;
        libraryView = personal;
        currentQuery = query;
        refresh.disabled = true;
        previous.disabled = true;
        refresh.textContent = personal ? 'Refreshing…' : 'Finding new books…';
        document.getElementById('shelfControls').hidden = !personal;
        document.querySelectorAll('.cat-btn').forEach(button => {
            const active = personal ? button.id === 'savedBooks' : button.dataset.query === query;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
        title.textContent = personal ? 'Your bookshelf' : query === 'bestsellers' ? 'From the library shelves' : query.startsWith('subject:') ? `${query.slice(8).replaceAll('_', ' ').replace(/^./, c => c.toUpperCase())} stories` : `Results for “${query}”`;
        count.textContent = 'Finding your next read…';
        grid.setAttribute('aria-busy', 'true');
        grid.replaceChildren(...Array.from({length: 4}, () => {
            const skeleton = node('div', 'skeleton');
            skeleton.setAttribute('aria-hidden', 'true');
            return skeleton;
        }));
        try {
            const options = {signal: request.signal, cache: 'no-store'};
            const [collection, catalog] = await Promise.all([
                fetch('/books', options).then(jsonResponse),
                personal ? Promise.resolve(null) : fetch(`/books/search?query=${encodeURIComponent(query)}&page=${page}`, options).then(jsonResponse)
            ]);
            if (request.signal.aborted) return;
            if (!Array.isArray(collection) || (!personal && !Array.isArray(catalog))) throw new Error('Unexpected book data. Please try again.');
            if (!personal && catalog.length === 0 && page > 1) {
                notify('You’ve reached the end of this selection. Starting again from the first page.');
                return loadBooks(query, false, 1);
            }
            saved.clear();
            collection.forEach(book => saved.set(key(book), book));
            currentPage = page;
            currentBooks = personal ? collection : catalog;
            renderCollection();
        } catch (error) {
            if (error.name === 'AbortError') return;
            count.textContent = 'Unable to load books';
            emptyState('We couldn’t reach the bookshelf.', error.message, 'Try again', () => loadBooks(query, personal, page));
        } finally {
            if (activeRequest === request) {
                grid.setAttribute('aria-busy', 'false');
                refresh.disabled = false;
                previous.disabled = false;
                previous.hidden = personal || currentPage <= 1;
                refresh.textContent = personal ? '↻ Refresh bookshelf' : '↻ New books';
            }
        }
    }
    function coverFrame(book) {
        const frame = node('div', 'cover-frame');
        const fallback = node('div', 'cover-fallback');
        const colorIndex = Array.from(book.title || '').reduce((sum, letter) => sum + letter.codePointAt(0), 0) % 6;
        fallback.dataset.binding = colorIndex;
        fallback.append(node('small', '', 'PAGETURNER'), node('span', '', book.title || 'Untitled'), node('small', '', 'A NEW CHAPTER'));
        frame.append(fallback);
        const cover = book.coverId ? `https://covers.openlibrary.org/b/id/${encodeURIComponent(book.coverId)}-M.jpg`
            : book.isbn && book.isbn !== 'N/A' ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(book.isbn)}-M.jpg` : null;
        if (cover) {
            const image = node('img', 'book-cover pending-cover');
            image.alt = `Cover of ${book.title || 'Untitled'}`;
            image.loading = 'lazy';
            image.decoding = 'async';
            image.addEventListener('load', () => {
                if (image.naturalWidth > 1) { fallback.remove(); image.classList.remove('pending-cover'); }
                else image.remove();
            });
            image.addEventListener('error', () => image.remove());
            image.src = cover;
            frame.append(image);
        }
        return frame;
    }
    function showDetails(book) {
        const trigger = document.activeElement;
        dialog.replaceChildren();
        const heading = node('h2', '', book.title || 'Untitled');
        heading.id = 'bookDetailsTitle';
        const savedBook = saved.get(key(book));
        dialog.append(heading, node('p', '', `By ${book.author || 'Unknown author'}`), coverFrame(book), node('p', 'detail-description', book.description || 'No additional description is available for this edition.'));
        if (book.isbn && book.isbn !== 'N/A') dialog.append(node('p', '', `ISBN: ${book.isbn}`));
        dialog.append(node('p', 'detail-status', savedBook ? `On your bookshelf · ${statuses[savedBook.readingStatus || 'WANT_TO_READ']}` : 'Save this book to track your reading progress.'));
        const close = node('button', 'btn', 'Close details');
        close.addEventListener('click', () => dialog.close());
        dialog.append(close);
        dialog.addEventListener('close', () => trigger?.focus(), {once: true});
        dialog.showModal();
    }
    dialog.addEventListener('click', event => {
        const bounds = dialog.getBoundingClientRect();
        if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
    });
    function renderBook(book) {
        const card = node('article', 'book-card');
        const info = node('div', 'book-info');
        const heading = node('h3', 'book-title');
        const details = node('button', 'book-details-link', book.title || 'Untitled');
        details.setAttribute('aria-label', `View details for ${book.title || 'book'}`);
        details.addEventListener('click', () => showDetails(book));
        heading.append(details);
        info.append(heading, node('div', 'book-author', book.author || 'Unknown author'));
        if (book.description) info.append(node('div', 'book-meta', String(book.description).slice(0, 85) + (String(book.description).length > 85 ? '…' : '')));
        const savedBook = saved.get(key(book));
        if (libraryView && savedBook) {
            const label = node('label', 'reading-status-label', 'Reading status');
            const select = node('select', 'reading-status');
            select.setAttribute('aria-label', `Reading status for ${book.title}`);
            Object.entries(statuses).forEach(([value, text]) => {
                const option = node('option', '', text); option.value = value; select.append(option);
            });
            select.value = savedBook.readingStatus || 'WANT_TO_READ';
            select.addEventListener('change', async () => {
                const oldValue = savedBook.readingStatus || 'WANT_TO_READ';
                select.disabled = true;
                try {
                    const updated = await fetch(`/books/${savedBook.id}/status`, {method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({readingStatus: select.value})}).then(jsonResponse);
                    saved.set(key(book), updated);
                    currentBooks = currentBooks.map(item => item.id === updated.id ? updated : item);
                    notify(`Moved to ${statuses[updated.readingStatus].toLowerCase()}.`);
                    if (libraryView) renderCollection();
                } catch (error) { select.value = oldValue; notify(error.message, true); }
                finally { select.disabled = false; }
            });
            label.append(select);
            info.append(label);
        }
        const button = node('button', 'card-action-btn' + (savedBook ? ' btn-delete' : ''), savedBook ? '✓ Saved · Remove' : '+ Add to bookshelf');
        button.setAttribute('aria-label', `${savedBook ? 'Remove' : 'Save'} ${book.title || 'book'} ${savedBook ? 'from' : 'to'} your bookshelf`);
        button.addEventListener('click', async () => {
            button.disabled = true;
            button.textContent = savedBook ? 'Removing…' : 'Saving…';
            try {
                if (savedBook) {
                    const response = await fetch(`/books/${savedBook.id}`, {method: 'DELETE'});
                    if (!response.ok) await jsonResponse(response);
                    saved.delete(key(book));
                    if (libraryView) currentBooks = currentBooks.filter(item => item.id !== savedBook.id);
                } else {
                    const result = await fetch('/books', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({title: book.title, author: book.author, description: book.description || 'Imported from Open Library', isbn: book.isbn || 'N/A', coverId: book.coverId || null})}).then(jsonResponse);
                    saved.set(key(book), result);
                    if (libraryView) currentBooks.unshift(result);
                }
                notify(savedBook ? 'Book removed from your bookshelf.' : 'Book saved to Want to read.');
                renderCollection();
            } catch (error) {
                notify(error.message, true);
                button.disabled = false;
                button.textContent = savedBook ? '✓ Saved · Remove' : '+ Add to bookshelf';
            }
        });
        const coverButton = node('button', 'book-cover-button');
        coverButton.type = 'button';
        coverButton.setAttribute('aria-label', `Open ${book.title || 'book'} details`);
        coverButton.addEventListener('click', () => showDetails(book));
        coverButton.append(coverFrame(book));
        card.append(coverButton, info, button);
        return card;
    }
    document.getElementById('searchForm').addEventListener('submit', event => {
        event.preventDefault();
        const input = document.getElementById('searchInput');
        if (input.value.trim()) loadBooks(input.value.trim()); else input.focus();
    });
    document.querySelectorAll('[data-query]').forEach(button => button.addEventListener('click', () => loadBooks(button.dataset.query)));
    document.getElementById('savedBooks').addEventListener('click', () => loadBooks(currentQuery, true));
    refresh.addEventListener('click', () => loadBooks(currentQuery, libraryView, libraryView ? 1 : currentPage >= 100 ? 1 : currentPage + 1));
    previous.addEventListener('click', () => loadBooks(currentQuery, false, Math.max(1, currentPage - 1)));
    filter.addEventListener('change', renderCollection);
    document.getElementById('logoutLink').addEventListener('click', async event => {
        event.preventDefault();
        try { await PageTurnerSession.logout(); } catch (error) { notify(error.message, true); }
    });
    PageTurnerSession.currentUser().then(user => {
        document.getElementById('adminNavLink').classList.toggle('hidden', !['SUPER_ADMIN', 'TENANT_ADMIN'].includes(user.role));
        loadBooks();
    }).catch(() => emptyState('Please sign in again.', 'Your account could not be loaded.', 'Sign in', () => location.assign('/login')));
})();
