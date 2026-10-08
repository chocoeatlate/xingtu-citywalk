import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown, Clock3, Compass, ExternalLink, Flag, Globe2, Heart, MapPin, Navigation2, RotateCcw, Route, Sparkles, X } from 'lucide-react'
import { byId, interests, places, type Interest, type Lang, type Place } from './data'
import { initialPreference, planPreview, suggestNext, updatePreference, type Preference, type Suggestion, type WalkMatrix, walkCost } from './route'
import './style.css'
import { downloadRecord, formatRecord } from './record'

type Stage = 'setup' | 'explore' | 'summary'
type Session = {
  stage: Stage
  lang: Lang
  duration: number
  remaining: number
  primary: Interest
  preference: Preference
  finishId: string
  currentId: string
  visited: string[]
  unavailable: string[]
  taskDone: boolean
  answers: { placeId: string; interest: Interest; label: string; note?: string }[]
  spentMinutes: number
  travelMeters: number
  demoMode: boolean
}

const STORAGE = 'xingtu-citywalk-session-v2'
const defaultSession: Session = {
  stage: 'setup', lang: 'zh', duration: 60, remaining: 60,
  primary: 'architecture', preference: initialPreference('architecture'),
  finishId: 'anfu', currentId: 'mansion', visited: [], unavailable: [],
  taskDone: false, answers: [], spentMinutes: 0, travelMeters: 0, demoMode: false,
}

function loadSession(): Session {
  const scenario = new URLSearchParams(window.location.search).get('demo')
  if (scenario === 'task') return { ...defaultSession, stage: 'explore', demoMode: true }
  if (scenario === 'choice') return { ...defaultSession, stage: 'explore', demoMode: true, taskDone: true, visited: ['mansion'], answers: [{ placeId: 'mansion', interest: 'architecture', label: '转角的建筑轮廓' }], remaining: 55, spentMinutes: 5 }
  if (scenario === 'summary') return { ...defaultSession, stage: 'summary', demoMode: true, currentId: 'bajin', remaining: 32, spentMinutes: 28, visited: ['mansion', 'info', 'ferguson', 'bajin'], answers: [{ placeId: 'mansion', interest: 'architecture', label: '转角的建筑轮廓' }, { placeId: 'info', interest: 'stories', label: '一栋楼不同时期的变化' }, { placeId: 'ferguson', interest: 'life', label: '小店构成的街区日常' }] }
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE) || 'null')
    const ids = (value: unknown) => Array.isArray(value) && value.every((id) => typeof id === 'string' && Object.hasOwn(byId, id))
    const validInterest = (value: unknown) => interests.some((item) => item.id === value)
    const nonNegative = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0
    const valid = parsed && ['setup', 'explore', 'summary'].includes(parsed.stage)
      && ['zh', 'en'].includes(parsed.lang) && [45, 60, 90].includes(parsed.duration)
      && nonNegative(parsed.remaining) && parsed.remaining <= parsed.duration
      && nonNegative(parsed.spentMinutes) && nonNegative(parsed.travelMeters)
      && Object.hasOwn(byId, parsed.currentId) && ['anfu', 'mansion'].includes(parsed.finishId)
      && validInterest(parsed.primary) && ids(parsed.visited) && ids(parsed.unavailable)
      && typeof parsed.taskDone === 'boolean' && typeof parsed.demoMode === 'boolean'
      && parsed.preference && interests.every(({ id }) => nonNegative(parsed.preference[id]) && parsed.preference[id] <= 12)
      && Array.isArray(parsed.answers) && parsed.answers.every((a: { placeId?: string; interest?: string; label?: string; note?: string } | null) => a && Object.hasOwn(byId, a.placeId || '') && validInterest(a.interest) && typeof a.label === 'string' && (a.note === undefined || (typeof a.note === 'string' && a.note.length <= 200)))
    return valid ? { ...defaultSession, ...parsed } : defaultSession
  } catch { return defaultSession }
}

const t = (lang: Lang, zh: string, en: string) => lang === 'zh' ? zh : en
const txt = (lang: Lang, value: { zh: string; en: string }) => value[lang]
const interestName = (interest: Interest, lang: Lang) => txt(lang, interests.find((item) => item.id === interest)!.label)

function navigationUrl(place: Place) {
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(place.name.zh)}&city=上海&src=xingtu-citywalk&callnative=0`
}

function NeighborhoodMap({ lang, currentId, visited, suggested, finishId, onSelect }: {
  lang: Lang; currentId: string; visited: string[]; suggested: string[]; finishId: string; onSelect: (id: string) => void
}) {
  const selected = new Set(suggested)
  const current = byId[currentId]
  return <div className="map-card">
    <div className="map-head"><span><MapPin size={16} /> {t(lang, '武康路 · 安福路', 'Wukang · Anfu')}</span><span className="map-caption">{t(lang, '街区示意图', 'Neighborhood sketch')}</span></div>
    <div className="map-graphic" role="group" aria-label={t(lang, '武康路街区地点示意图', 'Sketch of the Wukang neighborhood')}>
      <svg viewBox="0 0 100 110" preserveAspectRatio="none" aria-hidden="true">
        <defs><pattern id="grain" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="2" r=".18" fill="#c4c4ac" /></pattern></defs>
        <rect width="100" height="110" fill="#ebece2"/><rect width="100" height="110" fill="url(#grain)" />
        <path d="M0 95 L100 95 M0 15 L100 15 M0 54 L100 54 M25 0 L31 110 M45 0 L52 110 M77 0 L63 110 M6 0 L18 110" stroke="#faf9f3" strokeWidth="6" fill="none" />
        <path d="M48 88 L54 75 L62 67 L48 56 L54 43 L55 21" stroke="#bd7452" strokeWidth=".75" strokeDasharray="2 2" fill="none" opacity=".8"/>
        <path d="M48 88 L48 56 L54 43 L55 21" stroke="#7e947e" strokeWidth="1.1" strokeDasharray="3 2" fill="none" opacity=".5"/>
      </svg>
      <span className="street-label street-anfu">ANFU RD.</span><span className="street-label street-wukang">WUKANG RD.</span><span className="street-label street-huaihai">HUAIHAI RD.</span>
      {places.map((place, index) => <button key={place.id} className={`map-pin ${place.id === currentId ? 'active' : ''} ${visited.includes(place.id) ? 'visited' : ''} ${selected.has(place.id) ? 'suggested' : ''}`} style={{ left: `${place.map[0]}%`, top: `${place.map[1] / 110 * 100}%`, ['--pin-accent' as string]: place.accent }} onClick={() => onSelect(place.id)} title={txt(lang, place.name)} aria-label={txt(lang, place.name)}>{visited.includes(place.id) ? <Check size={12} /> : index + 1}</button>)}
      <div className="map-current-label" style={{ left: `${Math.min(current.map[0] + 5, 61)}%`, top: `${current.map[1] / 110 * 100 - 5}%` }}>{t(lang, '当前', 'NOW')} · {txt(lang, current.name)}</div>
    </div>
    <div className="map-footer"><span><span className="legend-dot current" />{t(lang, '当前', 'Current')}</span><span><span className="legend-dot future" />{t(lang, '可探索', 'Explore')}</span><span><Flag size={13}/>{t(lang, '终点', 'Finish')}：{txt(lang, byId[finishId].name)}</span></div>
  </div>
}

export default function App() {
  const [session, setSession] = useState<Session>(loadSession)
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null)
  const [showTools, setShowTools] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [observationNote, setObservationNote] = useState('')
  const [walkingMatrix, setWalkingMatrix] = useState<WalkMatrix>({})
  const [routingStatus, setRoutingStatus] = useState<'estimate' | 'loading' | 'amap'>('estimate')
  const lang = session.lang
  const current = byId[session.currentId]

  useEffect(() => { document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en' }, [lang])
  useEffect(() => { try { if (!session.demoMode) localStorage.setItem(STORAGE, JSON.stringify(session)) } catch { /* Storage may be disabled; the current walk stays usable. */ } }, [session])
  useEffect(() => {
    if (!selectedPlace) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedPlace(null) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [selectedPlace])
  useEffect(() => {
    if (session.stage !== 'explore') return
    if (window.location.protocol === 'file:') { setRoutingStatus('estimate'); return }
    let cancelled = false
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 35000)
    async function loadWalkingRoutes() {
      try {
        const statusResponse = await fetch('./api/status', { signal: controller.signal })
        const status = await statusResponse.json()
        if (status.mode !== 'amap') { if (!cancelled) setRoutingStatus('estimate'); return }
        if (!cancelled) setRoutingStatus('loading')
        const candidates = places.filter((place) => place.id !== session.currentId && !session.visited.includes(place.id) && !session.unavailable.includes(place.id))
        const pairs = candidates.flatMap((place) => [
          { fromId: session.currentId, toId: place.id, from: byId[session.currentId].coordinate, to: place.coordinate },
          ...(place.id === session.finishId ? [] : [{ fromId: place.id, toId: session.finishId, from: place.coordinate, to: byId[session.finishId].coordinate }]),
        ])
        if (session.currentId !== session.finishId) pairs.push({ fromId: session.currentId, toId: session.finishId, from: byId[session.currentId].coordinate, to: byId[session.finishId].coordinate })
        const uniquePairs = [...new Map(pairs.map((pair) => [pair.fromId + '>' + pair.toId, pair])).values()]
        const response = await fetch('./api/walking', { signal: controller.signal, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pairs: uniquePairs }) })
        if (!response.ok) throw new Error('routing unavailable')
        const body = await response.json()
        const next: WalkMatrix = {}
        for (const result of body.results || []) {
          if (Number.isFinite(result.meters) && Number.isFinite(result.minutes) && result.minutes >= 0 && result.meters >= 0) next[result.id] = { meters: result.meters, minutes: result.minutes }
        }
        if (!cancelled) {
          setWalkingMatrix((old) => ({ ...old, ...next }))
          setRoutingStatus(Object.keys(next).length === uniquePairs.length ? 'amap' : 'estimate')
        }
      } catch { if (!cancelled) setRoutingStatus('estimate') } finally { clearTimeout(timeout) }
    }
    loadWalkingRoutes()
    return () => { cancelled = true; controller.abort(); clearTimeout(timeout) }
  }, [session.stage, session.currentId, session.finishId, session.visited, session.unavailable])

  const planInput = useMemo(() => ({ currentId: session.currentId, visited: session.visited, unavailable: session.unavailable, remainingMinutes: Math.max(0, session.remaining - (session.taskDone ? 0 : current.dwell)), preference: session.preference, finishId: session.finishId, maxWalkMeters: Math.max(0, 2600 - session.travelMeters), matrix: walkingMatrix }), [session, walkingMatrix])
  const suggestions = useMemo(() => suggestNext(planInput), [planInput])
  const preview = useMemo(() => planPreview(planInput, 1), [planInput])
  const finishCost = walkCost(current, byId[session.finishId], walkingMatrix)
  const viewing = selectedPlace ? byId[selectedPlace] : null

  function start() {
    setSession((old) => ({ ...old, stage: 'explore', remaining: old.duration, preference: initialPreference(old.primary), currentId: 'mansion', visited: [], unavailable: [], taskDone: false, answers: [], spentMinutes: 0, travelMeters: 0 }))
    setFeedback('')
  }

  function completeTask(interest?: Interest, answer?: string) {
    setSession((old) => old.taskDone ? old : ({
      ...old,
      visited: old.visited.includes(old.currentId) ? old.visited : [...old.visited, old.currentId],
      taskDone: true,
      remaining: Math.max(0, old.remaining - (interest ? current.dwell : 0)),
      spentMinutes: old.spentMinutes + (interest ? Math.min(old.remaining, current.dwell) : 0),
      preference: interest ? updatePreference(old.preference, interest) : old.preference,
      answers: interest ? [...old.answers, { placeId: old.currentId, interest, label: answer || interestName(interest, lang), note: observationNote.trim().slice(0, 200) }] : old.answers,
    }))
    setFeedback(interest ? t(lang, '好眼光！这会影响你的下一站。', 'Nice observation. Your next stop will reflect it.') : t(lang, '已跳过，接下来仍可继续探索。', 'Skipped. You can keep exploring.'))
    setObservationNote('')
  }

  function goTo(suggestion: Suggestion) {
    setSession((old) => !old.taskDone || old.visited.includes(suggestion.place.id) || old.unavailable.includes(suggestion.place.id) ? old : ({ ...old, currentId: suggestion.place.id, remaining: Math.max(0, old.remaining - suggestion.walkMinutes), travelMeters: old.travelMeters + suggestion.walkMeters, spentMinutes: old.spentMinutes + suggestion.walkMinutes, taskDone: false }))
    setFeedback('')
    setSelectedPlace(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function markClosed() {
    setSession((old) => ({ ...old, unavailable: [...new Set([...old.unavailable, old.currentId])], taskDone: true }))
    setFeedback(t(lang, '此地点已排除，正在寻找下一站。', 'This place is excluded. Looking for another stop.'))
    setObservationNote('')
  }

  function shorten(minutes: number) {
    setSession((old) => ({ ...old, remaining: Math.min(old.remaining, minutes) }))
    setShowTools(false)
    setFeedback(t(lang, `已按剩余 ${Math.min(session.remaining, minutes)} 分钟重新选择地点。`, `Route adjusted to ${Math.min(session.remaining, minutes)} minutes left.`))
  }

  function finish() { setSession((old) => ({ ...old, stage: 'summary' })); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function reset() { try { window.history.replaceState({}, '', window.location.pathname) } catch { /* Some local-file browsers restrict history changes. */ } setObservationNote(''); setSelectedPlace(null); setWalkingMatrix({}); setRoutingStatus('estimate'); setSession({ ...defaultSession, lang }); setFeedback(''); setShowTools(false); setShowAll(false) }

  return <div className="app-shell">
    <header className="site-header">
      <div className="brand"><span className="brand-symbol"><Compass size={22} strokeWidth={1.8} /></span><div><strong>星途智旅</strong><small>STARTRAIL · CITY DISCOVERY</small></div></div>
      <div className="header-actions"><span className="header-location"><MapPin size={14}/> SHANGHAI · XUHUI</span><button className="lang-switch" onClick={() => setSession((old) => ({ ...old, lang: old.lang === 'zh' ? 'en' : 'zh' }))}><Globe2 size={16}/>{lang === 'zh' ? 'EN' : '中文'}</button></div>
    </header>
    {session.demoMode && <div className="demo-banner">{t(lang, '演示场景 · 路线与访问记录为模拟数据', 'DEMO SCENARIO · Route and visit history are simulated')}</div>}

    {session.stage === 'setup' && <main className="setup-page">
      <div className="setup-copy">
        <div className="eyebrow"><span className="eyebrow-line" />{t(lang, '从一条街，读懂一座城', 'A CITY, ONE STREET AT A TIME')}</div>
        <h1>{t(lang, '让城市回应', 'Let the city answer')}<br/><em>{t(lang, '你的好奇。', 'your curiosity.')}</em></h1>
        <p className="lead">{t(lang, '从武康大楼出发，观察真实地点里的细节。你的每一次选择，都会让下一站更接近你想认识的上海。', 'Begin at Wukang Mansion. Notice details in real places. Every choice shapes what you discover next.')}</p>
        <div className="intro-pills"><span><Sparkles size={15}/>{t(lang, '现场观察任务', 'Observe on location')}</span><span><Route size={15}/>{t(lang, '随兴趣变换路线', 'A route that adapts')}</span><span><Clock3 size={15}/>{t(lang, '按时间探索', 'Walk on your time')}</span></div>
        <div className="hero-quote"><span>“</span><p>{t(lang, '下一个转角，藏着你会喜欢的上海。', 'The next corner may hold your kind of Shanghai.')}</p></div>
      </div>
      <div className="setup-card"><div className="card-top"><span>01 / YOUR WALK</span><Compass size={20}/></div>
        <h2>{t(lang, '定制这次探索', 'Shape your walk')}</h2><p>{t(lang, '选好兴趣、时间和终点，开始后可缩短时间。', 'Choose an interest, time and finish. You can shorten the walk later.')}</p>
        <div className="form-group"><label>{t(lang, '你想先看什么？', 'What draws you in?')}</label><div className="interest-grid">{interests.map((item) => <button key={item.id} className={`interest-option ${session.primary === item.id ? 'selected' : ''}`} onClick={() => setSession((old) => ({ ...old, primary: item.id }))}><span className="radio-mark"/><strong>{txt(lang, item.label)}</strong><small>{txt(lang, item.detail)}</small></button>)}</div></div>
        <div className="form-group"><label>{t(lang, '有多少时间？', 'How much time?')}</label><div className="segmented">{[45, 60, 90].map((minutes) => <button key={minutes} className={session.duration === minutes ? 'selected' : ''} onClick={() => setSession((old) => ({ ...old, duration: minutes, remaining: minutes }))}>{minutes} <small>MIN</small></button>)}</div></div>
        <div className="form-group"><label>{t(lang, '希望在哪里结束？', 'Where would you like to finish?')}</label><div className="end-choices"><button className={session.finishId === 'anfu' ? 'selected' : ''} onClick={() => setSession((old) => ({ ...old, finishId: 'anfu' }))}>{t(lang, '安福路一带', 'Anfu Road area')}</button><button className={session.finishId === 'mansion' ? 'selected' : ''} onClick={() => setSession((old) => ({ ...old, finishId: 'mansion' }))}>{t(lang, '回到起点', 'Return to start')}</button></div></div>
        <button className="primary-button" onClick={start}>{t(lang, '开启街区探索', 'Start exploring')}<ArrowRight size={19}/></button>
        <div className="form-note"><MapPin size={14}/>{t(lang, '从武康大楼出发 · 公共空间观察 · 无需消费', 'Start at Wukang Mansion · public spaces · no purchase needed')}</div>
      </div>
      <div className="setup-bottom"><span>31°12′ N · 121°26′ E</span><span>{t(lang, '一场由好奇心引路的城市漫游', 'AN EXPLORATION LED BY CURIOSITY')}</span></div>
    </main>}

    {session.stage === 'explore' && <main className="journey-page">
      <div className="journey-main">
        <div className="journey-topline"><button className="text-button" onClick={() => setShowTools(!showTools)}><ArrowLeft size={16}/>{t(lang, '行程设置', 'Walk settings')}</button><span className="journey-index">{t(lang, '街区探索', 'NEIGHBORHOOD WALK')} / {String(session.visited.length + (session.taskDone ? 0 : 1)).padStart(2, '0')}</span></div>
        <div className="journey-title-row"><div><div className="eyebrow small"><span className="eyebrow-line"/>{t(lang, '你的城市，正在展开', 'THE CITY IS UNFOLDING')}</div><h1>{session.taskDone ? t(lang, '下一站，跟着兴趣走。', 'Follow your curiosity.') : t(lang, '此刻，看看这里。', 'Take a closer look.')}</h1></div><div className="journey-number">{String(Math.max(1, session.visited.length + (session.taskDone ? 0 : 1))).padStart(2, '0')}<span> / 08</span></div></div>
        <div className="stat-strip"><div><Clock3 size={18}/><strong>{session.remaining}</strong><span>{t(lang, '分钟计划余量', 'min budget left')}</span></div><div><Route size={18}/><strong>{Math.round(session.travelMeters)}</strong><span>{t(lang, '米行程估计', 'm route estimate')}</span></div><div><Heart size={18}/><strong>{interestName((Object.entries(session.preference).sort((a, b) => b[1] - a[1])[0]?.[0] || session.primary) as Interest, lang)}</strong><span>{t(lang, '当前兴趣', 'your interest')}</span></div></div>
        {feedback && <div className="feedback" role="status"><Sparkles size={16}/>{feedback}<button aria-label={t(lang, '关闭提示', 'Close notice')} onClick={() => setFeedback('')}><X size={16}/></button></div>}
        {showTools && <div className="tools-panel"><div><h3>{t(lang, '调整探索节奏', 'Adjust your walk')}</h3><button onClick={() => setShowTools(false)} aria-label={t(lang, '关闭提示', 'Close notice')}><X size={17}/></button></div><p>{t(lang, '路线会按当前剩余时间重新选择下一站。', 'The next stop will adapt to your remaining time.')}</p><div className="tool-actions"><button onClick={() => shorten(20)}>{t(lang, '只剩 20 分钟', '20 min left')}</button><button onClick={() => shorten(35)}>{t(lang, '只剩 35 分钟', '35 min left')}</button><button onClick={finish}>{t(lang, '现在结束', 'Finish now')}</button></div></div>}

        {!session.taskDone ? <section className="task-card"><div className="task-card-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-main-shape"/><div className="art-label">{current.name.en.toUpperCase()}</div><span className="art-index">PLACE {String(places.indexOf(current) + 1).padStart(2, '0')}</span></div><div className="task-content"><div className="task-kicker"><span className="kicker-dot"/>{t(lang, '当前地点 · 观察任务', 'CURRENT STOP · FIELD NOTE')}<span>{current.dwell} MIN</span></div><h2>{txt(lang, current.name)}</h2><p className="address"><MapPin size={14}/>{txt(lang, current.address)}</p><div className="observation"><span>{t(lang, '先抬头看看', 'LOOK AROUND')}</span><p>{txt(lang, current.observation)}</p></div><label className="observation-note">{t(lang, '记下一个看到的细节（选填）', 'Note one detail you noticed (optional)')}<textarea value={observationNote} maxLength={200} onChange={(event) => setObservationNote(event.target.value)} placeholder={t(lang, '例如：转角的阳台顺着街道延伸。', 'For example: the balconies follow the street corner.')} /><small>{observationNote.length}/200</small></label><h3>{txt(lang, current.prompt)}</h3><div className="task-choices">{current.choices.map((choice, index) => <button key={index} onClick={() => completeTask(choice.interest, txt(lang, choice.label))}><span>0{index + 1}</span>{txt(lang, choice.label)}<ArrowUpRight size={16}/></button>)}</div><div className="task-bottom"><button onClick={() => completeTask()}>{t(lang, '暂时跳过', 'Skip for now')}<ArrowRight size={15}/></button><button onClick={markClosed}>{t(lang, '地点无法观察', 'Place unavailable')}</button></div></div></section> : <section className="result-panel"><div className="result-kicker"><span className="check-circle"><Check size={16}/></span>{session.unavailable.includes(current.id) ? t(lang, '已排除当前地点', 'Place excluded') : session.answers.some((a) => a.placeId === current.id) ? t(lang, '你发现了一个城市细节', 'A city detail discovered') : t(lang, '已跳过任务，继续自由探索', 'Task skipped; keep exploring freely')}</div><h2>{session.unavailable.includes(current.id) ? t(lang, '换一个方向继续。', 'Let’s take another path.') : txt(lang, current.name)}</h2>{!session.unavailable.includes(current.id) && <p>{txt(lang, current.fact)}</p>}<a href={current.source} target="_blank" rel="noreferrer">{t(lang, '查看地点资料来源', 'View place source')} <ExternalLink size={13}/></a></section>}

        {session.taskDone && <section className="next-section"><p className="journey-hint">{t(lang, '先查看下一站地图，到达后点击右侧箭头确认。演示时可直接确认；本页不自动定位或计时。', 'Open the next stop in Maps, then confirm arrival with the arrow. For a demo, confirm directly. Location and time are not tracked automatically.')}</p><div className="section-head"><div><span className="section-kicker">NEXT DISCOVERY</span><h2>{t(lang, '接下来去哪里？', 'Where next?')}</h2></div><span>{suggestions.length} {t(lang, '处可行地点', 'possible stops')}</span></div>{suggestions.length ? <div className="suggestion-list">{suggestions.slice(0, showAll ? 7 : 3).map((suggestion, index) => <div className={`suggestion-card ${index === 0 ? 'recommended' : ''}`} key={suggestion.place.id}><div className="suggestion-rank">{String(index + 1).padStart(2, '0')}</div><div className="suggestion-body"><div className="suggestion-top"><h3>{txt(lang, suggestion.place.name)}</h3>{index === 0 && <span className="rec-tag">{t(lang, '为你推荐', 'FOR YOU')}</span>}</div><p>{t(lang, `延续你对「${interestName(suggestion.reasonInterest, lang)}」的兴趣`, `Matches your interest in ${interestName(suggestion.reasonInterest, lang)}`)}</p><div className="suggestion-meta"><span><Navigation2 size={13}/>{suggestion.walkMinutes} MIN · {suggestion.walkMeters} M</span><span><Clock3 size={13}/>{t(lang, `观察约 ${suggestion.place.dwell} 分钟`, `about ${suggestion.place.dwell} min to explore`)}</span><a href={navigationUrl(suggestion.place)} target="_blank" rel="noreferrer">{t(lang, '查看地图', 'Open map')}<ExternalLink size={12}/></a></div></div><button title={t(lang, '确认已到达', 'Confirm arrival')} disabled={routingStatus === 'loading'} onClick={() => goTo(suggestion)} aria-label={t(lang, `前往${suggestion.place.name.zh}`, `Go to ${suggestion.place.name.en}`)}><ArrowRight size={19}/></button></div>)}</div> : <div className="empty-result"><Flag size={26}/><h3>{t(lang, '这段探索刚好到这里。', 'A good moment to finish.')}</h3><p>{t(lang, '当前没有同时满足兴趣、时间和步行预算的新地点。可以查看终点指引，或结束探索。', 'No new stop fits your interest, time and walking budget. Check the finish directions or end your walk.')}</p></div>}{suggestions.length > 3 && <button className="show-all" onClick={() => setShowAll(!showAll)}>{showAll ? t(lang, '收起地点', 'Show fewer') : t(lang, '查看更多可行地点', 'Show more options')}<ChevronDown size={16}/></button>}<button className="finish-link" onClick={finish}>{t(lang, '结束本次探索', 'Finish this walk')}<ArrowRight size={16}/></button></section>}
      </div>
      <aside className="journey-aside"><NeighborhoodMap lang={lang} currentId={session.currentId} visited={session.visited} suggested={preview.map((item) => item.place.id)} finishId={session.finishId} onSelect={setSelectedPlace}/><div className="route-card"><div className="route-card-head"><div><span>YOUR ROUTE</span><h3>{t(lang, '下一站参考', 'Next stop preview')}</h3></div><Route size={19}/></div><div className="route-timeline"><div className="route-step current"><span className="route-dot"/><div><strong>{txt(lang, current.name)}</strong><small>{t(lang, '当前地点', 'Current stop')}</small></div></div>{preview.slice(0, 3).map((item) => <div className="route-step" key={item.place.id}><span className="route-dot"/><div><strong>{txt(lang, item.place.name)}</strong><small>{t(lang, `约步行 ${item.walkMinutes} 分钟`, `about ${item.walkMinutes} min walk`)}</small></div></div>)}{session.currentId !== session.finishId && preview.slice(0, 3).at(-1)?.place.id !== session.finishId && <div className="route-step finish"><span className="route-dot"/><div><strong>{txt(lang, byId[session.finishId].name)}</strong><small>{t(lang, '计划终点', 'Planned finish')}</small></div></div>}</div><p className="estimate-note">{routingStatus === 'amap' ? t(lang, '步行时间与距离来自高德路径规划；街区图仍是示意图。请以现场情况为准。', 'Walking estimates come from Amap routing. The neighborhood graphic is a sketch; check conditions on site.') : routingStatus === 'loading' ? t(lang, '正在获取真实步行路线，请稍候。', 'Loading walking routes…') : t(lang, '未配置或无法获取地图路径规划，步行数值为演示估算；街区图不用于导航。', 'Live routing is unavailable. Walking figures are demo estimates; the sketch is not for navigation.')}</p><div className="finish-guidance"><strong>{t(lang, '计划终点', 'Planned finish')} · {txt(lang, byId[session.finishId].name)}</strong><p>{session.currentId === session.finishId ? t(lang, '你当前就在计划终点。', 'You are at the planned finish.') : t(lang, `从当前地点约 ${finishCost.minutes} 分钟 / ${finishCost.meters} 米；${finishCost.minutes > session.remaining || finishCost.meters + session.travelMeters > 2600 ? '已超出当前预算，请调整结束位置或另行安排返程。' : '已为推荐路线预留终点步行成本。'}`, `From here: about ${finishCost.minutes} min / ${finishCost.meters} m. ${finishCost.minutes > session.remaining || finishCost.meters + session.travelMeters > 2600 ? 'Beyond the current budget; arrange an alternative finish or return.' : 'This cost is reserved in recommendations.'}`)}</p><a href={navigationUrl(byId[session.finishId])} target="_blank" rel="noreferrer">{t(lang, '查看终点地图', 'Open finish in Maps')}<ExternalLink size={12}/></a></div><a className="nav-link" href={navigationUrl(current)} target="_blank" rel="noreferrer">{t(lang, '在高德地图中查看当前地点', 'Open current place in Amap')}<ExternalLink size={14}/></a></div></aside>
    </main>}

    {session.stage === 'summary' && <main className="summary-page"><div className="summary-top"><span className="eyebrow"><span className="eyebrow-line"/>{t(lang, '探索记录', 'YOUR WALK, YOUR STORY')}</span><button className="text-button" onClick={reset}><RotateCcw size={16}/>{t(lang, '重新探索', 'Start over')}</button></div><div className="summary-grid"><div className="summary-main"><div className="summary-star"><Sparkles size={29}/></div><h1>{t(lang, '你走过的，', 'The city you noticed')}<br/><em>{t(lang, '是属于你的上海。', 'is yours to remember.')}</em></h1><p className="lead">{t(lang, '一条街可以有很多种读法。今天，你从自己的好奇心出发，留下了这些发现。', 'There are many ways to read a street. Today, your curiosity led you to these discoveries.')}</p><div className="summary-stats"><div><strong>{session.visited.length}</strong><span>{t(lang, '处地点', 'places')}</span></div><div><strong>{session.answers.length}</strong><span>{t(lang, '次发现', 'discoveries')}</span></div><div><strong>{session.spentMinutes}</strong><span>{t(lang, '分钟预计用时', 'estimated minutes')}</span></div></div><h2>{t(lang, '你的探索足迹', 'Your discoveries')}</h2><div className="discovery-list">{!session.visited.length && <p>{t(lang, '尚未记录地点。可以重新开始一次探索。', 'No places recorded yet. Start a new walk when ready.')}</p>}{session.visited.map((id, index) => { const place = byId[id]; const answer = session.answers.find((item) => item.placeId === id); return <div key={id}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{txt(lang, place.name)}</strong><p>{answer ? (place.choices.find((choice) => choice.label.zh === answer.label || choice.label.en === answer.label)?.label[lang] || answer.label) : t(lang, '自由探索', 'Explored freely')}</p>{answer?.note && <p className="personal-note">{answer.note}</p>}</div><BookOpen size={17}/></div> })}</div><div className="summary-actions"><button className="primary-button" onClick={reset}>{t(lang, '再走一条新路线', 'Walk again')}<ArrowRight size={19}/></button><button className="secondary-button" onClick={() => downloadRecord(formatRecord(session))}>{t(lang, '下载探索记录', 'Download your record')}</button><button className="secondary-button" onClick={() => window.print()}>{t(lang, '打印回顾', 'Print recap')}</button></div></div><div className="summary-side"><NeighborhoodMap lang={lang} currentId={session.currentId} visited={session.visited} suggested={[]} finishId={session.finishId} onSelect={setSelectedPlace}/><p>{t(lang, '每一次选择都会让城市呈现不同的一面。', 'Every choice reveals a different side of the city.')}</p></div></div></main>}

    <footer className="site-footer"><span>© 2026 星途智旅 · STARTRAIL</span><span>{t(lang, '上海武康路—安福路试点 · 参赛演示版', 'Wukang–Anfu pilot · competition prototype')}</span></footer>

    {viewing && <div className="modal-backdrop" onMouseDown={() => setSelectedPlace(null)}><div className="place-modal" role="dialog" aria-modal="true" aria-label={txt(lang, viewing.name)} onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" aria-label={t(lang, '关闭地点详情', 'Close place details')} autoFocus onClick={() => setSelectedPlace(null)}><X size={19}/></button><span className="section-kicker">PLACE NOTE · {String(places.indexOf(viewing) + 1).padStart(2, '0')}</span><h2>{txt(lang, viewing.name)}</h2><p className="address"><MapPin size={15}/>{txt(lang, viewing.address)}</p><div className="modal-divider"/><h3>{t(lang, '现场可观察', 'WHAT TO NOTICE')}</h3><p>{txt(lang, viewing.observation)}</p><h3>{t(lang, '地点资料', 'PLACE STORY')}</h3><p>{txt(lang, viewing.fact)}</p><div className="modal-links"><a href={viewing.source} target="_blank" rel="noreferrer">{t(lang, '资料来源', 'Source')}<ExternalLink size={14}/></a><a href={navigationUrl(viewing)} target="_blank" rel="noreferrer">{t(lang, '查看地图位置', 'Open in map')}<ExternalLink size={14}/></a></div><small className="modal-status">{viewing.coordinateStatus === 'approximate' ? t(lang, '地图坐标为近似定位，出行前请核对门牌与现场。', 'Map position is approximate; check the address and surroundings.') : t(lang, '地理坐标有公开资料；观察点仍需现场核验。', 'Coordinates have a published source; observation spot still needs field checking.')}</small></div></div>}
  </div>
}
