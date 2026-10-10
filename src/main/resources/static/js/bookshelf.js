/* Pure collection operations shared by rendering and the browser tests. */
(() => {
    const collator = new Intl.Collator(undefined, {sensitivity: 'base', numeric: true});
    const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
    const statusOrder = {WANT_TO_READ: 0, READING: 1, FINISHED: 2};
    function select(books, {query = '', status = 'ALL', sort = 'NEWEST'} = {}) {
        const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
        return books.filter(book => (status === 'ALL' || (book.readingStatus || 'WANT_TO_READ') === status)
            && terms.every(term => normalize(`${book.title || ''} ${book.author || ''}`).includes(term)))
            .sort((a, b) => {
                let result = 0;
                if (sort === 'TITLE_ASC' || sort === 'TITLE_DESC') result = collator.compare(a.title || '', b.title || '') * (sort === 'TITLE_DESC' ? -1 : 1);
                else if (sort === 'AUTHOR') result = collator.compare(a.author || '', b.author || '') || collator.compare(a.title || '', b.title || '');
                else if (sort === 'STATUS') result = (statusOrder[a.readingStatus || 'WANT_TO_READ'] ?? 3) - (statusOrder[b.readingStatus || 'WANT_TO_READ'] ?? 3);
                else if (sort === 'OLDEST') result = Number(a.id || 0) - Number(b.id || 0);
                return result || Number(b.id || 0) - Number(a.id || 0);
            });
    }
    globalThis.PageTurnerBookshelf = {select};
})();
