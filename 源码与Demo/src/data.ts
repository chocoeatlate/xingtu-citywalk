export type Lang = 'zh' | 'en'
export type Interest = 'architecture' | 'stories' | 'life'
export type Localized = { zh: string; en: string }

export interface Place {
  id: string
  name: Localized
  address: Localized
  coordinate: [number, number]
  map: [number, number]
  accent: string
  interests: Interest[]
  dwell: number
  observation: Localized
  fact: Localized
  prompt: Localized
  choices: { label: Localized; interest: Interest }[]
  source: string
  coordinateStatus: 'published' | 'approximate'
  access: 'public-exterior'
}

const source = 'https://english.shanghai.gov.cn/en-ScenicSpots/20231218/596192f5f59048bbbc3fa54d92304e93.html'

export const interests: { id: Interest; label: Localized; detail: Localized }[] = [
  { id: 'architecture', label: { zh: '建筑细节', en: 'Architecture' }, detail: { zh: '从屋顶、入口和立面读懂街区', en: 'Read the neighborhood through roofs, entrances and facades' } },
  { id: 'stories', label: { zh: '地方故事', en: 'Local stories' }, detail: { zh: '发现建筑里的人与时间', en: 'Discover people and time behind the places' } },
  { id: 'life', label: { zh: '街巷生活', en: 'Street life' }, detail: { zh: '观察一条街如何被今天的人使用', en: 'Notice how people use these streets today' } },
]

export const places: Place[] = [
  {
    id: 'mansion', name: { zh: '武康大楼', en: 'Wukang Mansion' },
    address: { zh: '武康路与淮海中路交会处', en: 'Wukang Rd × Middle Huaihai Rd' },
    coordinate: [31.20627, 121.4337], map: [48, 88], accent: '#c47a58',
    interests: ['architecture', 'stories'], dwell: 5, access: 'public-exterior', coordinateStatus: 'published',
    observation: { zh: '从安全的人行道看整栋楼的轮廓，留意它如何顺着街道转角展开。', en: 'From a safe sidewalk, look at the building outline and how it follows the street corner.' },
    fact: { zh: '武康大楼是武康路一带的标志性建筑。这里的任务关注建筑与街道形状的关系，不需要进入楼内。', en: 'Wukang Mansion is a landmark of this area. This task focuses on the relationship between the building and the street; no entry is needed.' },
    prompt: { zh: '站在安全的位置观察：你最先注意到什么？', en: 'From a safe spot, what catches your eye first?' },
    choices: [
      { label: { zh: '转角的建筑轮廓', en: 'The corner silhouette' }, interest: 'architecture' },
      { label: { zh: '这栋楼背后的人和故事', en: 'The people and stories behind it' }, interest: 'stories' },
      { label: { zh: '街角的人流与日常', en: 'The life around the corner' }, interest: 'life' },
    ], source: 'https://english.shanghai.gov.cn/en-FAQs-StudyinShanghai/20251124/9f1658ae899240d19c52784bddfed782.html',
  },
  {
    id: 'info', name: { zh: '武康路旅游咨询中心', en: 'Wukang Road Visitor Centre' },
    address: { zh: '武康路 393 号附近', en: 'Near No. 393 Wukang Rd' },
    coordinate: [31.20768, 121.4345], map: [54, 75], accent: '#b77754',
    interests: ['architecture', 'stories'], dwell: 4, access: 'public-exterior', coordinateStatus: 'published',
    observation: { zh: '观察立面的横线、竖线，以及块状材料带来的节奏。', en: 'Look for the horizontal and vertical lines and the rhythm of the facade blocks.' },
    fact: { zh: '官方介绍称，武康路 393 号的建筑早期部分建于 1912 年，1933 年扩建时加入装饰艺术风格；现用作旅游咨询中心。', en: 'According to the city guide, parts of No. 393 date to 1912. A 1933 expansion introduced Art Deco elements; today it serves as a visitor centre.' },
    prompt: { zh: '立面上哪种线条更吸引你？', en: 'Which lines on the facade draw your eye?' },
    choices: [
      { label: { zh: '横向与纵向的线条', en: 'Horizontal and vertical lines' }, interest: 'architecture' },
      { label: { zh: '一栋楼不同时期的变化', en: 'Changes across time' }, interest: 'stories' },
      { label: { zh: '游客如何使用这条街', en: 'How visitors use this street' }, interest: 'life' },
    ], source,
  },
  {
    id: 'villa390', name: { zh: '武康路 390 号', en: 'No. 390 Wukang Road' },
    address: { zh: '武康路 390 号', en: 'No. 390 Wukang Rd' },
    coordinate: [31.2078, 121.4344], map: [39, 72], accent: '#9a876d',
    interests: ['architecture'], dwell: 4, access: 'public-exterior', coordinateStatus: 'approximate',
    observation: { zh: '从公共空间观察红瓦、白墙和圆拱的组合；如果被树木遮挡，可以只看可见部分。', en: 'From a public area, look for red roof tiles, pale walls and arches. Observe only what is visible.' },
    fact: { zh: '官方介绍将武康路 390 号描述为 1932 年建成的地中海式花园洋房，提到红瓦、白墙、柱廊和圆拱。', en: 'The city guide describes No. 390 as a Mediterranean-style garden villa built in 1932, with red tiles, pale walls, colonnades and arches.' },
    prompt: { zh: '你能看到哪种建筑元素？', en: 'Which architectural element can you see?' },
    choices: [
      { label: { zh: '红瓦与白墙', en: 'Red tiles and pale walls' }, interest: 'architecture' },
      { label: { zh: '圆拱或柱廊', en: 'Arches or colonnades' }, interest: 'architecture' },
      { label: { zh: '建筑与树荫的关系', en: 'The building and surrounding trees' }, interest: 'architecture' },
    ], source,
  },
  {
    id: 'ferguson', name: { zh: '武康庭', en: 'Ferguson Lane' },
    address: { zh: '武康路 376 号', en: 'No. 376 Wukang Rd' },
    coordinate: [31.2081, 121.43465], map: [62, 67], accent: '#8d9d77',
    interests: ['life', 'architecture'], dwell: 5, access: 'public-exterior', coordinateStatus: 'approximate',
    observation: { zh: '在入口附近寻找红砖建筑与当前店铺招牌并存的画面，不必进入商铺。', en: 'Near the entrance, notice how red-brick buildings and present-day shop signs share the scene; no purchase is needed.' },
    fact: { zh: '上海市官方介绍指出，武康庭位于武康路 376 号，汇集餐饮、服饰、画廊等多类业态，里面有高低不同的红砖建筑。', en: 'The city guide places Ferguson Lane at No. 376 Wukang Road and describes its varied businesses and red-brick buildings of different heights.' },
    prompt: { zh: '这个地方最吸引你的是什么？', en: 'What interests you most here?' },
    choices: [
      { label: { zh: '老建筑和新使用方式', en: 'Old buildings, new uses' }, interest: 'architecture' },
      { label: { zh: '小店构成的街区日常', en: 'The daily life around shops' }, interest: 'life' },
      { label: { zh: '建筑经历的变化', en: 'How the place changed' }, interest: 'stories' },
    ], source,
  },
  {
    id: 'midget', name: { zh: '武康路与湖南路转角公寓', en: 'Apartments at Wukang × Hunan' },
    address: { zh: '武康路与湖南路交会处', en: 'Wukang Rd × Hunan Rd' },
    coordinate: [31.2092, 121.4353], map: [48, 56], accent: '#b99b6c',
    interests: ['architecture', 'life'], dwell: 4, access: 'public-exterior', coordinateStatus: 'approximate',
    observation: { zh: '观察转角处建筑的几何装饰，以及它与道路交会处的关系。', en: 'Notice the geometric accents on the corner building and its relationship with the crossing.' },
    fact: { zh: '官方介绍提到，这处位于武康路与湖南路交会处的公寓有几何装饰和三角形平面，当地也有人叫它“象屋”。', en: 'The city guide notes geometric accents and a triangular form on the apartments at Wukang and Hunan roads, locally nicknamed the “elephant house”.' },
    prompt: { zh: '在这个转角，你更想比较什么？', en: 'At this corner, what would you like to compare?' },
    choices: [
      { label: { zh: '几何装饰', en: 'Geometric details' }, interest: 'architecture' },
      { label: { zh: '路口与建筑的形状', en: 'The crossing and building shape' }, interest: 'architecture' },
      { label: { zh: '路口的人来人往', en: 'People moving through the junction' }, interest: 'life' },
    ], source,
  },
  {
    id: 'bajin', name: { zh: '巴金旧居外侧', en: 'Outside Ba Jin’s Former Residence' },
    address: { zh: '武康路 113 号', en: 'No. 113 Wukang Rd' },
    coordinate: [31.2105, 121.4361], map: [54, 43], accent: '#918aa2',
    interests: ['stories', 'architecture'], dwell: 5, access: 'public-exterior', coordinateStatus: 'published',
    observation: { zh: '从街道可见处观察屋顶、墙面和绿色窗框；不需要进入馆内。', en: 'From the street, look at the roof, wall finish and green window frames; no museum entry is needed.' },
    fact: { zh: '上海市官方介绍指出，武康路 113 号是作家巴金的旧居，建筑有双坡屋顶、细卵石墙面和绿色木窗。', en: 'The city guide identifies No. 113 as the former residence of writer Ba Jin, noting its double-pitched roof, pebble walls and green wooden windows.' },
    prompt: { zh: '看到这栋房子，你更想追问哪件事？', en: 'What would you like to learn about this house?' },
    choices: [
      { label: { zh: '巴金在这里的生活与写作', en: 'Ba Jin’s life and writing here' }, interest: 'stories' },
      { label: { zh: '屋顶与窗的设计', en: 'Its roof and windows' }, interest: 'architecture' },
      { label: { zh: '这条街今天的节奏', en: 'Life on this street today' }, interest: 'life' },
    ], source,
  },
  {
    id: 'no99', name: { zh: '武康路 99 号', en: 'No. 99 Wukang Road' },
    address: { zh: '武康路 99 号', en: 'No. 99 Wukang Rd' },
    coordinate: [31.2107, 121.43625], map: [40, 37], accent: '#be836e',
    interests: ['architecture', 'stories'], dwell: 4, access: 'public-exterior', coordinateStatus: 'approximate',
    observation: { zh: '从公共道路寻找红砖、红瓦和屋顶上的烟囱，只观察能看见的部分。', en: 'From the public street, look for red brick, roof tiles and chimneys. Observe only what is visible.' },
    fact: { zh: '官方介绍记载，武康路 99 号建于 1928 年，为砖木结构，红瓦屋顶、红砖烟囱和外露木构件是其特征。', en: 'The city guide dates No. 99 to 1928 and describes its brick-and-wood structure, red-tiled roof, red-brick chimneys and exposed timber.' },
    prompt: { zh: '哪种材料让这栋建筑最容易辨认？', en: 'Which material makes this building easy to recognize?' },
    choices: [
      { label: { zh: '红砖和红瓦', en: 'Red brick and roof tiles' }, interest: 'architecture' },
      { label: { zh: '建筑经历的年代', en: 'The era it has lived through' }, interest: 'stories' },
      { label: { zh: '继续寻找街巷生活', en: 'Keep looking for street life' }, interest: 'life' },
    ], source,
  },
  {
    id: 'anfu', name: { zh: '安福路街角', en: 'Anfu Road Corner' },
    address: { zh: '武康路—安福路街区', en: 'Wukang–Anfu neighborhood' },
    coordinate: [31.2121, 121.437], map: [55, 21], accent: '#7e9b91',
    interests: ['life', 'stories'], dwell: 5, access: 'public-exterior', coordinateStatus: 'approximate',
    observation: { zh: '找一个不妨碍通行的位置，比较树荫、店面和行人的活动方式。', en: 'From a spot that keeps the walkway clear, compare the trees, storefronts and pedestrian movement.' },
    fact: { zh: '上海市政府将武康路—安福路列为旅游休闲街区。这里以开放式街景观察结束本次探索。', en: 'The Shanghai municipal government recognizes the Wukang–Anfu area as a leisure tourism neighborhood. End this walk by observing its open streetscape.' },
    prompt: { zh: '这条街让你最想记住什么？', en: 'What would you most like to remember here?' },
    choices: [
      { label: { zh: '街道中的日常场景', en: 'Everyday scenes' }, interest: 'life' },
      { label: { zh: '老建筑与新店面并置', en: 'Old buildings beside new shops' }, interest: 'architecture' },
      { label: { zh: '以后再找一个故事', en: 'A story to discover next time' }, interest: 'stories' },
    ], source: 'https://www.shanghai.gov.cn/citywalk/20260625/3492b1b945c146fc96c4585d7b04f00d.html',
  },
]

export const byId = Object.fromEntries(places.map((place) => [place.id, place])) as Record<string, Place>
