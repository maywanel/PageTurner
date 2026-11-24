import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectBooks, readingUrl, titleKey, bookHash } from '../lib/books.ts';
const books = [
  { id: 1, title: 'Émile', author: 'Zola', readingStatus: 'FINISHED' },
  { id: 3, title: 'Alpha', author: 'Writer B', readingStatus: 'READING' },
  { id: 2, title: 'Beta', author: 'Writer A', readingStatus: 'WANT_TO_READ' },
];
test('personal search combines title and author, ignores accents and case', () => {
  assert.deepEqual(selectBooks(books, { query:'EMILE zola' }).map(b=>b.id), [1]);
  assert.deepEqual(selectBooks(books, { query:'writer',status:'READING' }).map(b=>b.id), [3]);
  assert.deepEqual(selectBooks(books, { query:'missing' }), []);
});
test('sort preserves the input, with deterministic title, author and newest order', () => {
  for (const [sort,expected] of Object.entries({default:[3,2,1],oldest:[1,2,3],title:[3,2,1],"title-desc":[1,2,3],author:[2,3,1],status:[2,3,1]})) assert.deepEqual(selectBooks(books,{sort}).map(b=>b.id),expected);
  assert.deepEqual(books.map(b=>b.id),[1,3,2]);
  assert.deepEqual(selectBooks(books,{personal:false}).map(b=>b.id),[1,3,2]);
});
test('legacy saved books are included in want to read',()=>assert.equal(selectBooks([{id:9,title:'Legacy',author:'A'}],{status:'WANT_TO_READ'}).length,1));
test('reading links permit only HTTPS reading providers',()=>{
  assert.equal(readingUrl('https://openlibrary.org/books/OL1M'),'https://openlibrary.org/books/OL1M');
  for(const url of ['javascript:alert(1)','http://archive.org/details/test','https://evil.test','https://openlibrary.org.evil.test','https://user:pass@archive.org/test','/relative']) assert.equal(readingUrl(url),null);
});
test('book identity matches server title uniqueness and bindings stay stable',()=>{
  assert.equal(titleKey({title:'  Émile  ',author:'Zola'}),'émile');
  assert.equal(bookHash(books[0]),bookHash({...books[0]}));
});
