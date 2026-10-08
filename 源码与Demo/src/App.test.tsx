// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState({}, '', '/')
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ mode: 'estimate' }) }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('visitor journey', () => {
  it('starts, answers a place task, and changes to a recommended next stop', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '开启街区探索' }))
    expect(screen.getByRole('heading', { name: '武康大楼' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /转角的建筑轮廓/ }))
    expect(screen.getByRole('heading', { name: '接下来去哪里？' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '前往武康路旅游咨询中心' }))
    expect(screen.getByRole('heading', { name: '武康路旅游咨询中心' })).toBeTruthy()
    await waitFor(() => expect(JSON.parse(localStorage.getItem('xingtu-citywalk-session-v2')!).currentId).toBe('info'))
  })

  it('can shorten time and report an unavailable place', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '开启街区探索' }))
    fireEvent.click(screen.getByRole('button', { name: '行程设置' }))
    fireEvent.click(screen.getByRole('button', { name: '只剩 20 分钟' }))
    expect(screen.getByText('已按剩余 20 分钟重新选择地点。')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '地点无法观察' }))
    expect(screen.getByRole('heading', { name: '换一个方向继续。' })).toBeTruthy()
  })

  it('offers a complete English experience and an ending', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(screen.getByRole('heading', { name: /Let the city answer/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Start exploring' }))
    fireEvent.click(screen.getByRole('button', { name: 'Walk settings' }))
    fireEvent.click(screen.getByRole('button', { name: 'Finish now' }))
    expect(screen.getByRole('heading', { name: /The city you noticed/ })).toBeTruthy()
  })
})


describe('recovery and accurate records', () => {
  it('includes a visitor observation in the recap and clears it for the next task', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '开启街区探索' }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '阳台沿着街角展开。' } })
    fireEvent.click(screen.getByRole('button', { name: /转角的建筑轮廓/ }))
    fireEvent.click(screen.getByRole('button', { name: '前往武康路旅游咨询中心' }))
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('')
    fireEvent.click(screen.getByRole('button', { name: '行程设置' }))
    fireEvent.click(screen.getByRole('button', { name: '现在结束' }))
    expect(screen.getByText('阳台沿着街角展开。')).toBeTruthy()
    expect(screen.getByRole('button', { name: '下载探索记录' })).toBeTruthy()
  })
  it('recovers from malformed stored sessions', () => {
    localStorage.setItem('xingtu-citywalk-session-v2', JSON.stringify({ currentId: 'mansion', finishId: 'anfu', visited: [null], preference: null }))
    render(<App />)
    expect(screen.getByRole('button', { name: '开启街区探索' })).toBeTruthy()
  })
  it('keeps shortened time separate from estimated time spent', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '开启街区探索' }))
    fireEvent.click(screen.getByRole('button', { name: /转角的建筑轮廓/ }))
    fireEvent.click(screen.getByRole('button', { name: '行程设置' }))
    fireEvent.click(screen.getByRole('button', { name: '只剩 20 分钟' }))
    const session = JSON.parse(localStorage.getItem('xingtu-citywalk-session-v2')!)
    expect(session.remaining).toBe(20)
    expect(session.spentMinutes).toBe(5)
  })
  it('skips without claiming a discovery or spending the full dwell time', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '开启街区探索' }))
    fireEvent.click(screen.getByRole('button', { name: '暂时跳过' }))
    expect(screen.getByText('已跳过任务，继续自由探索')).toBeTruthy()
    const session = JSON.parse(localStorage.getItem('xingtu-citywalk-session-v2')!)
    expect(session.answers).toHaveLength(0)
    expect(session.remaining).toBe(60)
    expect(session.preference.life).toBe(0)
  })
  it('does not replace a saved walk with demo data, and can exit the demo', () => {
    localStorage.setItem('xingtu-citywalk-session-v2', 'existing record')
    window.history.replaceState({}, '', '/?demo=summary')
    render(<App />)
    expect(localStorage.getItem('xingtu-citywalk-session-v2')).toBe('existing record')
    fireEvent.click(screen.getByRole('button', { name: '重新探索' }))
    expect(window.location.search).toBe('')
    expect(screen.queryByText(/演示场景 ·/)).toBeNull()
  })
  it('remains usable when browser storage is blocked', () => {
    const getter = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    const setter = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    try {
      render(<App />)
      fireEvent.click(screen.getByRole('button', { name: '开启街区探索' }))
      expect(screen.getByRole('heading', { name: '武康大楼' })).toBeTruthy()
    } finally { getter.mockRestore(); setter.mockRestore() }
  })
  it('translates previously selected answers in the English recap', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '开启街区探索' }))
    fireEvent.click(screen.getByRole('button', { name: /转角的建筑轮廓/ }))
    fireEvent.click(screen.getByRole('button', { name: '结束本次探索' }))
    fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(screen.getByText('The corner silhouette')).toBeTruthy()
  })
})
