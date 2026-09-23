import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_STYLE,
  STYLES,
  STYLE_CLASSES,
  normalizeStyle,
  normalizeStyleChoice,
  resolveStyle
} from '../src/utils/styleChoice.js'

test('normalizeStyle 识别已知风格，不区分大小写并去掉空格', () => {
  assert.equal(normalizeStyle('XP'), 'xp')
  assert.equal(normalizeStyle(' win31 '), 'win31')
  assert.equal(normalizeStyle('win2000'), 'win2000')
})

test('normalizeStyle 对未知值返回 win2000', () => {
  for (const value of [undefined, null, '', 'vista', 1, {}, 'default']) {
    assert.equal(normalizeStyle(value), DEFAULT_STYLE)
  }
})

test('normalizeStyleChoice 对未知值返回 default', () => {
  assert.equal(normalizeStyleChoice('Xp'), 'xp')
  for (const value of [undefined, null, '', 'default', 'vista']) {
    assert.equal(normalizeStyleChoice(value), 'default')
  }
})

test('resolveStyle：访客选择优先于站点默认', () => {
  assert.equal(resolveStyle('win31', 'xp'), 'win31')
  assert.equal(resolveStyle('win2000', 'xp'), 'win2000')
})

test('resolveStyle：跟随站点默认，站点值无效时为 win2000', () => {
  assert.equal(resolveStyle('default', 'xp'), 'xp')
  assert.equal(resolveStyle('default', 'bogus'), 'win2000')
  assert.equal(resolveStyle('default', undefined), 'win2000')
})

test('每种风格都有对应的 body 类名，只有 win2000 为空', () => {
  assert.deepEqual(Object.keys(STYLE_CLASSES).sort(), [...STYLES].sort())
  assert.equal(STYLE_CLASSES.win2000, '')
  assert.equal(STYLE_CLASSES.xp, 'style-xp')
  assert.equal(STYLE_CLASSES.win31, 'style-win31')
})
