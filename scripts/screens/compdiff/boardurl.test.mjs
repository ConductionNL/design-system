import { test } from 'node:test'
import assert from 'node:assert/strict'
import { boardUrl } from './boardurl.mjs'

test('a board without language or design system opens as the plain file', () => {
	assert.equal(boardUrl('/x/boards/NcLogin.html'), 'file:///x/boards/NcLogin.html')
})

test('the language and the design system go into the query the board reads', () => {
	assert.equal(boardUrl('/x/boards/NcLogin.html', { lang: 'en', ds: 'zuiddrecht' }), 'file:///x/boards/NcLogin.html?lang=en&ds=zuiddrecht')
	assert.equal(boardUrl('/x/boards/NcLogin.html', { lang: 'nl' }), 'file:///x/boards/NcLogin.html?lang=nl')
})

test('a language the boards are not drawn in, or a malformed design system, is refused', () => {
	assert.throws(() => boardUrl('/x/b.html', { lang: 'de' }), /--lang de/)
	assert.throws(() => boardUrl('/x/b.html', { ds: '../evil' }), /--ds/)
})
