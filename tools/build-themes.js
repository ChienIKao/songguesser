/* 金曲猜歌王 — 從 Apple Music 歌單建主題曲庫
 *
 * 讀 Apple Music 台灣區的公開歌單網頁,取出每首歌的商店編號,
 * 再用 iTunes Lookup API 查試聽網址、年份、曲風,寫進 themes.js。
 * 用編號查,不靠歌名比對 —— 不會配到綜藝版或卡拉OK版。
 *
 *   node tools/build-themes.js
 *
 * 產出 themes.js:
 *   EXTRA_SONGS    songs.js 以外、只從歌單來的歌
 *   SONG_META      每首歌(含 songs.js 裡的)的 year、tags 與熱門度 pop
 *   SONG_PREVIEWS  EXTRA_SONGS 的試聽網址,併進 previews.js 那一份
 *
 * 要加歌單就加在下面的 SOURCES。歌單網址最後那段 pl.xxxx 就是 id。
 */

const fs = require('fs');
const path = require('path');

global.window = {};
require('../songs.js');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'themes.js');

/* lang   這張歌單的歌預設是什麼語言(genre),auto 就看歌名文字和 Apple 標的曲風
 * tags   這張歌單的歌要掛上哪些主題標籤
 * chart  這是照播放量排的排行榜 —— 名次會算進熱門度 */
const SOURCES = [
  // 排行榜:Apple Music 台灣區照播放量排的
  { id: 'pl.741ff34016704547853b953ec5181d83', name: 'Top 100：台灣',        lang: 'auto',  tags: [], chart: true },
  { id: 'pl.28293286194748d1b5147078e8bd22bd', name: '2025 百大熱播歌曲：台灣', lang: 'auto', tags: [], chart: true },
  { id: 'pl.189b882612364948b8d0579bea8acbb2', name: '2024 百大熱門歌曲：台灣', lang: 'auto', tags: [], chart: true },
  { id: 'pl.2a0a202d08c3439e95d22a73126f4417', name: '網路熱播：C-Pop',       lang: 'auto',  tags: [] },

  // 抖音:Douyin Music 官方的熱歌榜(大多是 2025 之後的歌)
  { id: 'pl.35323002b653460090e3d1b9a9707482', name: '2025 年度抖音熱歌榜',  lang: 'auto',  tags: ['tiktok'], chart: true },
  { id: 'pl.a190706eaa40419cb944554c75b3a781', name: '2026 新年抖音熱歌榜',  lang: 'auto',  tags: ['tiktok'], chart: true },
  { id: 'pl.6192bc79a8424912ade5636870eb76b8', name: '抖音熱歌榜 2025-03',   lang: 'auto',  tags: ['tiktok'], chart: true },
  { id: 'pl.2fe411b73b5b4c7bbb4909f1e6a3663a', name: '抖音熱歌榜 2025-04',   lang: 'auto',  tags: ['tiktok'], chart: true },
  { id: 'pl.ba4f6a4642664fbc8c9c8889d2cb1784', name: '抖音熱歌榜 2025-05',   lang: 'auto',  tags: ['tiktok'], chart: true },
  { id: 'pl.4f67d7c0419546188877f9559e09a6ad', name: '抖音熱歌榜 2025-06',   lang: 'auto',  tags: ['tiktok'], chart: true },
  { id: 'pl.8fa73cfc0004438e896fcc2437e50898', name: '抖音熱歌榜 2025-07',   lang: 'auto',  tags: ['tiktok'], chart: true },
  { id: 'pl.2606f770f0144408afa224ecdc6663c4', name: '抖音熱歌榜 2025-08',   lang: 'auto',  tags: ['tiktok'], chart: true },
  { id: 'pl.6ad2cf84ab1f450e829bd5a47938a8ae', name: '抖音熱歌榜 2025-09',   lang: 'auto',  tags: ['tiktok'], chart: true },
  { id: 'pl.884c65afab13491e9ee64daf97c799a4', name: '抖音熱歌榜 2025-10',   lang: 'auto',  tags: ['tiktok'], chart: true },
  { id: 'pl.0a0967b18cf54e378db361f5f32e562d', name: '抖音熱歌榜 2026-01',   lang: 'auto',  tags: ['tiktok'], chart: true },
  { id: 'pl.969ee046f5f848849d985c8988e390c0', name: '抖音熱歌榜 2026-02',   lang: 'auto',  tags: ['tiktok'], chart: true },
  { id: 'pl.70df13bf5a244b919d6ddcf90bc51d35', name: '抖音熱歌榜 2026-03',   lang: 'auto',  tags: ['tiktok'], chart: true },
  { id: 'pl.aa15bae942474d8fa3ddbe9fc5f7c9e4', name: '抖音熱歌榜 2026-04',   lang: 'auto',  tags: ['tiktok'], chart: true },
  { id: 'pl.3cb847c91abe4b20af277e2572217364', name: '抖音熱歌榜 2026-05',   lang: 'auto',  tags: ['tiktok'], chart: true },
  { id: 'pl.7e26c83059cf411b9cb18f5286945d3a', name: '抖音熱歌榜 2026-06',   lang: 'auto',  tags: ['tiktok'], chart: true },
  { id: 'pl.3060910a5fbd4762a11c8a07129c0a0f', name: '抖音熱歌榜 2026-08',   lang: 'auto',  tags: ['tiktok'], chart: true },

  // 抖音經典神曲:沒有歌單收這一批,所以直接列歌名,逐首去商店搜。
  // 歌名歌手對不上的會被丟掉,不會硬塞一個相近的。
  { name: '抖音經典神曲', lang: 'mando', tags: ['tiktok'], songs: [
    ['學貓叫', '小潘潘'], ['綠色', '陳雪凝'], ['你的酒館對我打了烊', '陳雪凝'], ['芒種', '音闕詩聽'],
    ['少年', '夢然'], ['大田後生仔', '林啟得'], ['野狼disco', '寶石Gem'], ['漠河舞廳', '柳爽'],
    ['孤勇者', '陳奕迅'], ['起風了', '買辣椒也用券'], ['下山', '要不要買菜'], ['燕無歇', '蔣雪兒'],
    ['生僻字', '陳柯宇'], ['沙漠駱駝', '展展與羅羅'], ['桃花諾', '鄧紫棋'], ['可可托海的牧羊人', '王琪'],
    ['世間美好與你環環相扣', '柏松'], ['飛鳥和蟬', '任然'], ['踏山河', '是七叔呢'], ['白月光與硃砂痣', '大籽'],
    ['錯位時空', '艾辰'], ['一路生花', '溫奕心'], ['星辰大海', '黃霄雲'], ['麻雀', '李榮浩'],
    ['囂張', 'en'], ['探窗', '國風堂'], ['酒醉的蝴蝶', '崔偉立'], ['卡路里', '火箭少女101'],
    ['往後餘生', '馬良'], ['讓酒', '劉宇寧'], ['我曾', '隔壁老樊'], ['多想在平庸的生活擁抱你', '隔壁老樊'],
    ['關山酒', '等什麼君'], ['醜八怪', '薛之謙'], ['演員', '薛之謙'], ['年少有為', '李榮浩'],
    ['體面', '于文文'], ['像魚', '王貳浪'], ['嘴巴嘟嘟', '劉思鑒'], ['你笑起來真好看', '李昕融'],
    ['刪了吧', '煙把兒'], ['四季予你', '程響'], ['盜將行', '花粥'], ['萬疆', '李玉剛'],
    ['紅昭願', '音闕詩聽'], ['心如止水', 'Ice Paper'], ['世界這麼大還是遇見你', '程響'], ['你的答案', '阿冗'],
    ['我們不一樣', '大壯'], ['一百萬個可能', 'Christine Welch'], ['雲與海', '阿YueYue'], ['若月亮沒來', '王宇宙Leto'],
    ['半生雪', '是七叔呢'], ['大魚', '周深'], ['達拉崩吧', '周深'], ['左手指月', '薩頂頂'],
    ['牽絲戲', '銀臨'], ['海底', '一支榴蓮'], ['滿天星辰不及你', 'ycccc'], ['愛丫愛丫', 'By2'],
    ['精衛', '30年前,50年後'], ['一笑江湖', '聞人聽書'], ['我走後', '小咪'], ['走馬', '陳粒'],
    ['奢香夫人', '鳳凰傳奇'], ['最炫民族風', '鳳凰傳奇'], ['月亮之上', '鳳凰傳奇'], ['愛你', '王心凌'],
    ['光年之外', '鄧紫棋'], ['說好不哭', '周杰倫'], ['跳樓機', 'LBI利比'], ['嘉賓', '張遠'],
    ['水星記', '郭頂'], ['消愁', '毛不易'], ['像我這樣的人', '毛不易'], ['紙短情長', '煙把兒'],
    ['處處吻', '楊千嬅'], ['少年中國說', '張杰'], ['惡作劇', '王藍茵'], ['不如', '秦海清'],
  ] },

  // 台灣獨立樂團:歌單很少,主要靠列樂團名單,抓每團 Apple 上最熱門的幾首
  { id: 'pl.b362446682f543a3bfb40305ebb69e99', name: '破格之聲',             lang: 'auto',  tags: [] },
  { id: 'pl.ac38fdf2344841a497040d6d03b501db', name: '金曲37 最佳樂團獎入圍', lang: 'auto',  tags: ['indie'] },
  { name: '台灣獨立樂團', lang: 'mando', tags: ['indie'], perArtist: 15, artists: [
    '告五人', '草東沒有派對', '落日飛車', '傷心欲絕', '拍謝少年', '茄子蛋', '美秀集團', '甜約翰',
    '老王樂隊', 'deca joins', '康士坦的變化球', '滅火器', '大象體操', '溫蒂漫步', '淺堤', '椅子樂團',
    '理想混蛋', '宇宙人', '麋先生', '八三夭', '旺福', '1976', '透明雜誌', '回聲樂團',
    '圖騰樂團', '珂拉琪', '血肉果汁機', '生祥樂隊', '庸俗救星', '恐龍的皮', '好樂團', '傻子與白痴',
    'icyball 冰球樂團', '無妄合作社', '漂流出口', '海豚刑警', '南西肯恩', '午夜乒乓', '棉花糖', '自由發揮',
    '四分衛', '董事長樂團',
  ] },

  // 華語
  { id: 'pl.6d8228f57b864a4296dc02d9761a0d9b', name: '華語流行樂：重溫熱播', lang: 'mando', tags: [], chart: true },
  { id: 'pl.4a2675e2e5724648a753c4083677df1a', name: '抖音華語熱歌精選',     lang: 'auto',  tags: [] },
  { id: 'pl.abcdea5ae83c4d75874e1650267a2ba3', name: '超洗腦抖音神曲精選',   lang: 'auto',  tags: [] },
  { id: 'pl.1635e168c51a4d348a25ae6a5a107004', name: '滾石 抖音熱歌',        lang: 'auto',  tags: [] },
  { id: 'pl.3c940066ea8d47adb2d317c492a981fe', name: '卡拉永遠 OK',          lang: 'mando', tags: [] },
  { id: 'pl.7094457cee324d6ebb28388ccaeca7f3', name: '開唱：國語流行樂',     lang: 'mando', tags: [] },
  { id: 'pl.06aa95b127ca48319a1f0b86f10479c0', name: 'KTV熱門點播必聽歌曲',  lang: 'mando', tags: [] },
  { id: 'pl.5ed96d329c8d4d2097affb00b9d0383d', name: '90 年代華語情歌',      lang: 'mando', tags: [] },
  { id: 'pl.8bcc62c87ed3496ea55bde3a44711527', name: '80 年代華語情歌',      lang: 'mando', tags: [] },

  // 台語
  { id: 'pl.7403563b0a3946d3a5d8baf69fce0842', name: '台語歌代表作品',       lang: 'tw',    tags: [] },
  { id: 'pl.09337fc7f4af42128534ec5effbe3dcc', name: '台語金曲 GMA',         lang: 'tw',    tags: [] },

  // 日文
  { id: 'pl.06ee5aa067e0424ba983744b684dc059', name: '日本流行樂：重溫熱播', lang: 'jp',    tags: [], chart: true },
  { id: 'pl.433c8f0315104be1b2c102be93046715', name: '90 年代日本熱門金曲',  lang: 'jp',    tags: [] },
  { id: 'pl.5170745af11847a9aab7745a343ac200', name: '2000 日本流行樂金曲',  lang: 'jp',    tags: [] },

  // 韓文
  { id: 'pl.fa1e4b518c7244a086390d49aeb65d1e', name: '韓國流行樂：重溫熱播', lang: 'kpop',  tags: [], chart: true },
  { id: 'pl.c43266de1cc742f39c91d6b1f7c9fd88', name: '韓國流行樂經典回顧',   lang: 'kpop',  tags: [] },

  // 西洋
  { id: 'pl.ea279df83e2148918bd5931cd118ae5e', name: '西洋熱門',             lang: 'west',  tags: [] },
  { id: 'pl.207ed0217b134cbd93a72940ccb236b2', name: 'TikTok瘋傳西洋歌曲',   lang: 'auto',  tags: [] },
  { id: 'pl.fd06425fad934dcf9ac0fde49fd0a425', name: '網路熱播：流行樂',     lang: 'auto',  tags: [] },
  { id: 'pl.e50ccee7318043eaaf8e8e28a2a55114', name: '2000 年代熱門歌曲',    lang: 'auto',  tags: [] },
  { id: 'pl.6b1b5dfda067443481265436811002f1', name: '2010 年代熱門歌曲',    lang: 'auto',  tags: [] },

  // 動漫
  { id: 'pl.cc0d3b8092354e1da8cff6a0d8ca9f38', name: '開唱：動漫音樂',       lang: 'jp',    tags: ['anime'] },
  { id: 'pl.91aa9e8d66484504a49ff923a5f91b97', name: '90 年代動畫金曲',      lang: 'jp',    tags: ['anime'] },
  { id: 'pl.80708b2d660f4d848f2154d845320b17', name: '2000 年代動畫金曲',    lang: 'jp',    tags: ['anime'] },
  { id: 'pl.407f5703ceb14a53a720d0fc5a3e4f3c', name: '2010 年代動畫金曲',    lang: 'jp',    tags: ['anime'] },

  // 影視(另外,商店曲名或專輯寫著主題曲 / 插曲 / 原聲帶的歌也會自動標成 drama)
  { id: 'pl.243f4762e0044ef18392e4a231e801ae', name: '那些年追的偶像劇',     lang: 'mando', tags: ['drama'] },
  { id: 'pl.6aa75ab6e7ed4dd4a659abb687584d2e', name: '熱門韓劇主題曲',       lang: 'kpop',  tags: ['drama'] },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- 歌單網頁 ---------- */
async function playlistTrackIds(id) {
  const res = await fetch(`https://music.apple.com/tw/playlist/x/${id}`, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'zh-TW' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const m = html.match(/<script type="application\/json" id="serialized-server-data"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('網頁裡找不到歌單資料');
  const ids = new Set();
  (function walk(o) {
    if (!o || typeof o !== 'object') return;
    const cd = o.contentDescriptor;
    if (cd && cd.kind === 'song' && cd.identifiers && cd.identifiers.storeAdamID) ids.add(cd.identifiers.storeAdamID);
    for (const k in o) walk(o[k]);
  })(JSON.parse(m[1]));
  return [...ids];
}

/* ---------- iTunes API ---------- */
// 被限速(403 / 429)就等一下再試,越等越久
async function itunes(pathAndQuery, attempt = 1) {
  const res = await fetch('https://itunes.apple.com/' + pathAndQuery, { headers: { 'User-Agent': 'songguesser/1.0' } });
  if (res.ok) return res.json();
  if (attempt <= 4 && [403, 429, 500, 502, 503].includes(res.status)) {
    console.log(`   HTTP ${res.status},等 ${15 * attempt} 秒重試⋯`);
    await sleep(15000 * attempt);
    return itunes(pathAndQuery, attempt + 1);
  }
  throw new Error(`HTTP ${res.status}`);
}

async function lookupAll(ids) {
  const out = new Map();
  for (let i = 0; i < ids.length; i += 150) {
    const data = await itunes(`lookup?id=${ids.slice(i, i + 150).join(',')}&country=TW`);
    for (const r of data.results || []) if (r.kind === 'song') out.set(String(r.trackId), r);
    await sleep(1500);
  }
  return out;
}

/* ---------- 列歌名的來源:逐首搜尋 ----------
   歌名要完全一樣。歌手對得上的優先;都對不上就拿同名的最早版本。 */
async function searchSong(title, artist) {
  const data = await itunes('search?' + new URLSearchParams({ term: `${title} ${artist}`, media: 'music', entity: 'song', country: 'TW', limit: '15' }));
  const t = norm(title), a = norm(artist);
  const hits = (data.results || []).filter(r =>
    r.previewUrl && norm(cleanTitle(r.trackName)) === t &&
    !BAD.test(r.trackName) && !BAD_ALBUM.test(r.collectionName || ''));
  // 同一首有好幾個版本時,挑最早發行的 —— 通常就是原版專輯
  hits.sort((x, y) => String(x.releaseDate).localeCompare(String(y.releaseDate)));
  const sameArtist = hits.filter(r => norm(r.artistName).includes(a) || a.includes(norm(r.artistName)));
  return sameArtist[0] || hits[0] || null;
}

/* ---------- 熱門度 ----------
   Apple 不公開播放次數。但「歌手的熱門歌曲」是照熱門度排的 ——
   一首歌在自己歌手的前幾名,加上它上過幾張排行榜、歌手在曲庫裡有多少首歌,
   合起來當成熱門度。遊戲只從每個主題熱門度前 20% 的歌出答案。
   查過的歌手存在 tools/.cache/,重跑不用重查。 */
const CACHE = path.join(__dirname, '.cache', 'artist-top.json');
const TOP_N = 25;

function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch (e) { return { byId: {}, byName: {} }; }
}
function saveCache(cache) {
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  fs.writeFileSync(CACHE, JSON.stringify(cache));
}

// 歌手的熱門歌曲(照熱門度排)
async function artistSongs(artistId) {
  const data = await itunes(`lookup?id=${artistId}&entity=song&limit=${TOP_N}&country=TW`);
  await sleep(700);
  return (data.results || []).filter(r => r.kind === 'song');
}

// 同上,只要正規化過的歌名(算熱門度用),查過就記在快取
async function artistTop(artistId, cache) {
  if (cache.byId[artistId]) return cache.byId[artistId];
  const titles = [];
  for (const r of await artistSongs(artistId)) {
    const k = norm(cleanTitle(r.trackName));
    if (!titles.includes(k)) titles.push(k);
  }
  cache.byId[artistId] = titles;
  return titles;
}

// 用歌手名字查 artistId。strict 的時候名字要完全對上,不拿搜尋的第一筆湊數
async function artistIdByName(name, cache, strict = false) {
  const key = (strict ? 'strict:' : '') + name;
  if (key in cache.byName) return cache.byName[key];
  const data = await itunes('search?' + new URLSearchParams({ term: name, entity: 'musicArtist', country: 'TW', limit: '5' }));
  const hit = (data.results || []).find(r => norm(r.artistName) === norm(name) || norm(r.artistName).includes(norm(name)))
    || (strict ? null : (data.results || [])[0]);
  cache.byName[key] = hit ? hit.artistId : null;
  await sleep(1500);
  return cache.byName[key];
}

/* ---------- 比對與分類 ---------- */
function norm(s) {
  return String(s || '')
    .replace(/[！-～]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .toLowerCase()
    .replace(/[\s　]/g, '')
    .replace(/[（）()\[\]【】「」『』、・·,，.。!！?？\-—_'"'’]/g, '');
}

// 跟 index.html 的 cleanTitle 同一套:去掉「(電影⋯主題曲)」「 - From THE FIRST TAKE」
function cleanTitle(t) {
  const s = String(t || '')
    .replace(/\s*[（(【\[].*$/, '')
    .replace(/\s+[-–—]\s+.*$/, '')
    .trim();
  return s || String(t || '');
}

// 抖音榜常見的改編版:加速、慢速混響、女版男版、DJ 版 —— 跟原曲聽起來不一樣
const BAD = /live|instrumental|karaoke|remix|伴奏|現場|演唱會|純音樂|acoustic|inst\.|slowed|reverb|sped up|加速|女版|男版|dj版|\bdj\b/i;
const BAD_ALBUM = /第\s*\d+\s*期|演唱會|跨年|卡拉|karaoke|オルゴール|音樂盒|instrumental|伴奏/i;

const KANA = /[぀-ヿ]/, HANGUL = /[가-힯]/, HAN = /[一-鿿]/;

// 電影、電視劇、影集的歌。「動畫」不在裡面 —— 動畫歌來自動漫歌單,標 anime
const DRAMA = /主題曲|插曲|片頭曲|片尾曲|推廣曲|原聲帶|電影|電視劇|影集|劇集|偶像劇|韓劇|\bOST\b|soundtrack/i;

function guessLang(item, hint) {
  const t = item.trackName || '';
  const g = item.primaryGenreName || '';
  if (KANA.test(t)) return 'jp';
  if (HANGUL.test(t)) return 'kpop';
  if (hint !== 'auto') return hint;
  if (/韓國/.test(g)) return 'kpop';
  if (/日本|動畫/.test(g)) return 'jp';
  if (/台灣/.test(g)) return 'tw';
  if (HAN.test(t) || /華語|粵語/.test(g)) return 'mando';
  return 'west';
}

function yearOf(item) {
  const y = parseInt(String(item.releaseDate || '').slice(0, 4), 10);
  return y >= 1950 ? y : null;   // 商店偶爾會填 1900 這種假日期
}

/* ---------- 主流程 ---------- */
(async () => {
  const core = window.SONGS || [];
  const coreByKey = core.map(s => ({ s, t: norm(s.title), a: norm(s.artist) }));
  const findCore = (title, artist) => {
    const t = norm(cleanTitle(title)), a = norm(artist);
    const hit = coreByKey.find(c => c.t === t && (c.a === a || a.includes(c.a) || c.a.includes(a)));
    return hit && hit.s;
  };

  // 1. 讀所有歌單;列歌名的來源逐首搜尋
  const fromSource = new Map();   // trackId → Map(source index → 在歌單裡的位置,0 是第一名、接近 1 是最後)
  const addFrom = (id, i, rank = 0.5) => {
    if (!fromSource.has(id)) fromSource.set(id, new Map());
    if (!fromSource.get(id).has(i)) fromSource.get(id).set(i, rank);
  };
  const searched = new Map();     // trackId → 搜尋結果(跟 lookup 回來的欄位一樣)
  const cache = loadCache();
  for (let i = 0; i < SOURCES.length; i++) {
    const src = SOURCES[i];
    if (src.artists) {
      const miss = [];
      let got = 0;
      for (const name of src.artists) {
        try {
          const id = await artistIdByName(name, cache, true);
          if (!id) { miss.push(name); continue; }
          const songs = (await artistSongs(id)).filter(r => r.previewUrl).slice(0, src.perArtist || 15);
          songs.forEach((r, pos) => { searched.set(String(r.trackId), r); addFrom(String(r.trackId), i, pos / songs.length); });
          got += songs.length;
        } catch (e) { miss.push(`${name}(${e.message})`); }
      }
      saveCache(cache);
      console.log(`樂團 ${src.name}:${src.artists.length - miss.length} 團、${got} 首`);
      if (miss.length) console.log(`   沒找到:${miss.join('、')}`);
      continue;
    }
    if (src.songs) {
      const miss = [];
      for (const [title, artist] of src.songs) {
        try {
          const hit = await searchSong(title, artist);
          if (hit) { searched.set(String(hit.trackId), hit); addFrom(String(hit.trackId), i); }
          else miss.push(`${title}/${artist}`);
        } catch (e) { miss.push(`${title}/${artist}(${e.message})`); }
        await sleep(3000);
      }
      console.log(`清單 ${src.name}:找到 ${src.songs.length - miss.length} / ${src.songs.length} 首`);
      if (miss.length) console.log(`   沒找到:${miss.join('、')}`);
      continue;
    }
    try {
      const ids = await playlistTrackIds(src.id);
      ids.forEach((id, pos) => addFrom(id, i, pos / ids.length));
      console.log(`歌單 ${src.name}:${ids.length} 首`);
    } catch (e) {
      console.log(`歌單 ${src.name} 讀取失敗:${e.message}`);
    }
    await sleep(1000);
  }

  // 2. 查試聽網址與年份
  const items = await lookupAll([...fromSource.keys()].filter(id => !searched.has(id)));
  for (const [id, hit] of searched) items.set(id, hit);
  console.log(`\n查到 ${items.size} / ${fromSource.size} 首的商店資料`);

  // 3. 分類、去重、併進既有題庫
  const extras = new Map();       // norm key → song
  const meta = {};                // song id → { year, tags }
  const signals = {};             // song id → { artistId, chart, lists, title }
  const previews = {};
  const skipped = { noPreview: 0, bad: 0 };

  for (const [trackId, srcRank] of fromSource) {
    const item = items.get(trackId);
    if (!item) continue;
    if (!item.previewUrl) { skipped.noPreview++; continue; }
    if (BAD.test(item.trackName) || BAD_ALBUM.test(item.collectionName || '')) { skipped.bad++; continue; }

    const sources = [...srcRank.keys()].map(i => SOURCES[i]);
    const tags = [...new Set(sources.flatMap(s => s.tags))];
    // 商店曲名常帶「(電影《⋯》主題曲)」—— 動畫歌單來的不算,那些歸動漫
    if (!tags.includes('anime') && DRAMA.test(`${item.trackName} ${item.collectionName || ''}`)) tags.push('drama');
    const year = yearOf(item);
    const hint = (sources.find(s => s.lang !== 'auto') || { lang: 'auto' }).lang;
    // 排行榜上越前面分數越高;同一首上多張榜就疊加
    const chart = [...srcRank].reduce((sum, [i, rank]) => sum + (SOURCES[i].chart ? 1 - rank : 0), 0);

    const addMeta = (id) => {
      const m = meta[id] || (meta[id] = { year: null, tags: [] });
      if (year && (!m.year || year < m.year)) m.year = year;   // 同一首出現多次,取最早的年份
      m.tags = [...new Set(m.tags.concat(tags))];
      const sg = signals[id] || (signals[id] = { artistId: item.artistId, chart: 0, lists: 0, title: norm(cleanTitle(item.trackName)) });
      sg.chart += chart;
      sg.lists += sources.length;
    };

    const coreSong = findCore(item.trackName, item.artistName);
    if (coreSong) { addMeta(coreSong.id); continue; }

    const key = norm(cleanTitle(item.trackName)) + '|' + norm(item.artistName);
    let song = extras.get(key);
    if (!song) {
      let genre = guessLang(item, hint);
      if (genre === 'mando' && year && year < 2000) genre = 'classic';
      song = { id: 'am' + trackId, title: cleanTitle(item.trackName), artist: item.artistName, genre };
      extras.set(key, song);
      previews[song.id] = {
        url: item.previewUrl, title: item.trackName, artist: item.artistName,
        album: item.collectionName || '', offset: 0, conf: 'high'
      };
    }
    addMeta(song.id);
  }

  // 4. 熱門度
  const list = [...extras.values()];
  const everyone = core.concat(list);
  const artistCount = {};   // 歌手在整個曲庫裡有幾首 —— 越多代表越紅
  everyone.forEach(s => { const k = norm(s.artist); artistCount[k] = (artistCount[k] || 0) + 1; });

  const todo = new Set(everyone.map(s => (signals[s.id] && signals[s.id].artistId) || `name:${s.artist}`));
  console.log(`\n查 ${todo.size} 位歌手的熱門歌曲(已快取 ${Object.keys(cache.byId).length} 位)⋯`);
  let done = 0;
  for (const s of everyone) {
    const sg = signals[s.id] || (signals[s.id] = { chart: 0, lists: 0, title: norm(s.title) });
    try {
      if (!sg.artistId) sg.artistId = await artistIdByName(s.artist, cache);
      sg.top = sg.artistId ? await artistTop(sg.artistId, cache) : [];
    } catch (e) {
      sg.top = [];
    }
    if (++done % 200 === 0) { saveCache(cache); console.log(`   ${done} / ${everyone.length}`); }
  }
  saveCache(cache);

  const isCore = new Set(core.map(s => s.id));
  for (const s of everyone) {
    const sg = signals[s.id];
    const idx = sg.top.indexOf(sg.title);
    const pop =
        1.0 * (idx >= 0 ? 1 - idx / TOP_N : 0)                  // 在自己歌手的熱門歌曲排第幾
      + 0.7 * Math.min(artistCount[norm(s.artist)], 10) / 10    // 歌手在曲庫裡有幾首
      + 1.0 * Math.min(sg.chart, 1.5)                          // 排行榜名次
      + 0.5 * Math.min(sg.lists, 3) / 3                        // 被幾張歌單收
      + (isCore.has(s.id) ? 1.0 : 0);                           // songs.js 是手挑的
    (meta[s.id] || (meta[s.id] = { tags: [] })).pop = Math.round(pop * 100) / 100;
  }

  // 沒有年份也沒有標籤的 meta 不用寫
  for (const id of Object.keys(meta)) {
    if (!meta[id].year) delete meta[id].year;
    if (!meta[id].tags || !meta[id].tags.length) delete meta[id].tags;
    if (!Object.keys(meta[id]).length) delete meta[id];
  }

  const header = `/* 自動產生,請勿手動編輯 —— 由 tools/build-themes.js 產出\n`
    + ` * 產生時間:${new Date().toISOString()}\n`
    + ` * 來源:Apple Music 台灣區 ${SOURCES.length} 張歌單。year 是商店標的發行年,只是大概。\n`
    + ` */\n`;
  // 一首一行,diff 才看得懂
  const lines = entries => entries.map(e => '  ' + e).join(',\n');
  fs.writeFileSync(OUT, header
    + 'window.EXTRA_SONGS = [\n' + lines(list.map(s => JSON.stringify(s))) + '\n];\n\n'
    + 'window.SONG_META = {\n' + lines(Object.entries(meta).map(([id, m]) => `${JSON.stringify(id)}: ${JSON.stringify(m)}`)) + '\n};\n\n'
    + 'window.SONG_PREVIEWS = Object.assign(window.SONG_PREVIEWS || {}, ' + JSON.stringify(previews, null, 2) + ');\n');

  const count = {};
  list.forEach(s => count[s.genre] = (count[s.genre] || 0) + 1);
  console.log(`\n新增 ${list.length} 首(songs.js 以外):`, count);
  console.log(`songs.js 裡被歌單標到的:${Object.keys(meta).filter(id => !id.startsWith('am')).length} 首`);
  console.log(`略過:沒有試聽 ${skipped.noPreview} 首、現場版/伴奏等 ${skipped.bad} 首`);
  console.log(`已寫入 ${path.relative(ROOT, OUT)}\n`);
})();
