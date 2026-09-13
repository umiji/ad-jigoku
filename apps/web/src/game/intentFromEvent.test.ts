import { describe, expect, it } from 'vitest'
import { intentFromElement, intentFromEvent, scrollIntentFromDelta, targetRefFromElement } from './intentFromEvent'

function dom(html: string): HTMLElement {
  const root = document.createElement('div')
  root.innerHTML = html
  document.body.appendChild(root)
  return root
}

describe('intentFromEvent（座標を使わない）', () => {
  it('maps data-target + data-instance to an ad TargetRef (walking up from a nested child)', () => {
    const root = dom(`<div data-instance="ad-7"><button data-target="close"><span id="x">×</span></button></div>`)
    const span = root.querySelector('#x')!
    expect(targetRefFromElement(span)).toEqual({ kind: 'ad', instanceId: 'ad-7', part: 'close' })
    expect(intentFromEvent({ target: span })).toEqual({ t: 'point', target: { kind: 'ad', instanceId: 'ad-7', part: 'close' } })
  })

  it('maps fake-close / cta / decoy parts', () => {
    const root = dom(`<div data-instance="a"><button data-target="fake-close" id="f"></button><button data-target="cta" id="c"></button><span data-target="decoy" id="d"></span></div>`)
    expect(targetRefFromElement(root.querySelector('#f'))).toMatchObject({ part: 'fake-close' })
    expect(targetRefFromElement(root.querySelector('#c'))).toMatchObject({ part: 'cta' })
    expect(targetRefFromElement(root.querySelector('#d'))).toMatchObject({ part: 'decoy' })
  })

  it('returns null for ad parts without an instance, unknown targets, and plain elements', () => {
    const root = dom(`<button data-target="close" id="orphan"></button><button data-target="teleport" id="u"></button><p id="p">text</p>`)
    expect(targetRefFromElement(root.querySelector('#orphan'))).toBeNull()
    expect(targetRefFromElement(root.querySelector('#u'))).toBeNull()
    expect(intentFromElement(root.querySelector('#p'))).toBeNull()
    expect(intentFromEvent({ target: null })).toBeNull()
  })

  it('maps content and chrome targets', () => {
    const root = dom(`<article data-target="content" data-content-id="p3" id="a"></article><button data-target="chrome" data-chrome-id="back" id="b"></button>`)
    expect(targetRefFromElement(root.querySelector('#a'))).toEqual({ kind: 'content', id: 'p3' })
    expect(targetRefFromElement(root.querySelector('#b'))).toEqual({ kind: 'chrome', id: 'back' })
  })

  it('maps data-action to an action intent, with or without an instance', () => {
    const root = dom(`<button data-action="SMASH" id="s"></button><div data-instance="z"><button data-action="REPORT" id="r"></button></div><button data-action="JUMP" id="j"></button>`)
    expect(intentFromElement(root.querySelector('#s'))).toEqual({ t: 'action', action: 'SMASH' })
    expect(intentFromElement(root.querySelector('#r'))).toEqual({ t: 'action', action: 'REPORT', target: { kind: 'ad', instanceId: 'z', part: 'body' } })
    expect(intentFromElement(root.querySelector('#j'))).toBeNull()
  })

  it('normalizes wheel deltas to logical lines', () => {
    expect(scrollIntentFromDelta(100)).toEqual({ t: 'scroll', deltaLines: 4 })
    expect(scrollIntentFromDelta(-30)).toEqual({ t: 'scroll', deltaLines: -1 })
    expect(scrollIntentFromDelta(5)).toBeNull()
  })
})
