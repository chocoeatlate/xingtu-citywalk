import { byId, type Lang, type Interest } from './data'

type RecordInput = {
  lang: Lang; demoMode: boolean; visited: string[]; spentMinutes: number; travelMeters: number
  answers: { placeId: string; interest: Interest; label: string; note?: string }[]
}

export function formatRecord(session: RecordInput): string {
  const zh = session.lang === 'zh'
  const lines = [zh ? '星途智旅 · 我的街区发现' : 'Startrail · My neighborhood discoveries',
    zh ? '上海武康路—安福路' : 'Wukang–Anfu, Shanghai',
    ...(session.demoMode ? [zh ? '演示场景：以下记录为模拟数据' : 'Demo scenario: simulated records'] : []),
    zh ? `预计用时 ${session.spentMinutes} 分钟，预计步行 ${session.travelMeters} 米` : `Estimated time: ${session.spentMinutes} min. Estimated walking: ${session.travelMeters} m.`, '']
  session.visited.forEach((id, index) => {
    const place = byId[id]
    const answer = session.answers.find((item) => item.placeId === id)
    const choice = answer && place.choices.find((item) => item.label.zh === answer.label || item.label.en === answer.label)
    lines.push(`${index + 1}. ${place.name[session.lang]}`, answer ? choice?.label[session.lang] || answer.label : zh ? '自由探索' : 'Explored freely')
    if (answer?.note) lines.push((zh ? '我的观察：' : 'My observation: ') + answer.note)
    lines.push((zh ? '资料来源：' : 'Source: ') + place.source, '')
  })
  if (!session.visited.length) lines.push(zh ? '尚无地点记录。' : 'No places recorded yet.')
  lines.push(zh ? '本记录按手动确认与计划估算整理，非定位轨迹或实测耗时。' : 'This record uses manual confirmations and planning estimates, not location tracking or measured time.')
  return lines.join('\n')
}

export function downloadRecord(content: string) {
  const url = URL.createObjectURL(new Blob(['\ufeff', content], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'Startrail-walk.txt'
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
