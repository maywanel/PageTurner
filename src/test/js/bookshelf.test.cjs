const {test} = require('node:test');
const assert = require('node:assert/strict');
require('../../main/resources/static/js/bookshelf.js');
const books = [
 {id: 1, title: 'Émile', author: 'Zola', readingStatus: 'FINISHED'},
 {id: 3, title: 'Alpha', author: 'Writer B', readingStatus: 'READING'},
 {id: 2, title: 'Beta', author: 'Writer A', readingStatus: 'WANT_TO_READ'}
];
const select = PageTurnerBookshelf.select;
test('search combines title and author, ignores case and accents', () => {
 assert.deepEqual(select(books, {query: 'EMILE zola'}).map(b => b.id), [1]);
 assert.deepEqual(select(books, {query: 'writer', status: 'READING'}).map(b => b.id), [3]);
 assert.deepEqual(select(books, {query: 'missing'}), []);
});
test('all sort modes have deterministic order without mutating source', () => {
 for (const [sort, expected] of Object.entries({NEWEST:[3,2,1], OLDEST:[1,2,3], TITLE_ASC:[3,2,1], TITLE_DESC:[1,2,3], AUTHOR:[2,3,1], STATUS:[2,3,1]})) {
  assert.deepEqual(select(books, {sort}).map(b => b.id), expected);
 }
 assert.deepEqual(books.map(b => b.id), [1,3,2]);
});
test('missing status behaves as want to read', () => {
 assert.equal(select([{id: 9, title: 'Legacy'}], {status:'WANT_TO_READ'}).length, 1);
});
