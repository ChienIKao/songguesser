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
 *   SONG_META      每首歌(含 songs.js 裡的)的 year 與 tags
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

/* lang  這張歌單的歌預設是什麼語言(genre),auto 就看歌名文字和 Apple 標的曲風
 * tags  這張歌單的歌要掛上哪些主題標籤 */
const SOURCES = [
  // 抖音 / TikTok
  { id: 'pl.4a2675e2e5724648a753c4083677df1a', name: '抖音華語熱歌精選',     lang: 'auto',  tags: ['tiktok'] },
  { id: 'pl.207ed0217b134cbd93a72940ccb236b2', name: 'TikTok瘋傳西洋歌曲',   lang: 'auto',  tags: ['tiktok'] },
  { id: 'pl.fd06425fad934dcf9ac0fde49fd0a425', name: '網路熱播：流行樂',     lang: 'auto',  tags: ['tiktok'] },

  // 華語
  { id: 'pl.6d8228f57b864a4296dc02d9761a0d9b', name: '華語流行樂：重溫熱播', lang: 'mando', tags: [] },
  { id: 'pl.3c940066ea8d47adb2d317c492a981fe', name: '卡拉永遠 OK',          lang: 'mando', tags: [] },
  { id: 'pl.7094457cee324d6ebb28388ccaeca7f3', name: '開唱：國語流行樂',     lang: 'mando', tags: [] },
  { id: 'pl.06aa95b127ca48319a1f0b86f10479c0', name: 'KTV熱門點播必聽歌曲',  lang: 'mando', tags: [] },
  { id: 'pl.5ed96d329c8d4d2097affb00b9d0383d', name: '90 年代華語情歌',      lang: 'mando', tags: [] },
  { id: 'pl.8bcc62c87ed3496ea55bde3a44711527', name: '80 年代華語情歌',      lang: 'mando', tags: [] },

  // 台語
  { id: 'pl.7403563b0a3946d3a5d8baf69fce0842', name: '台語歌代表作品',       lang: 'tw',    tags: [] },
  { id: 'pl.09337fc7f4af42128534ec5effbe3dcc', name: '台語金曲 GMA',         lang: 'tw',    tags: [] },

  // 日文
  { id: 'pl.06ee5aa067e0424ba983744b684dc059', name: '日本流行樂：重溫熱播', lang: 'jp',    tags: [] },
  { id: 'pl.433c8f0315104be1b2c102be93046715', name: '90 年代日本熱門金曲',  lang: 'jp',    tags: [] },
  { id: 'pl.5170745af11847a9aab7745a343ac200', name: '2000 日本流行樂金曲',  lang: 'jp',    tags: [] },

  // 韓文
  { id: 'pl.fa1e4b518c7244a086390d49aeb65d1e', name: '韓國流行樂：重溫熱播', lang: 'kpop',  tags: [] },
  { id: 'pl.c43266de1cc742f39c91d6b1f7c9fd88', name: '韓國流行樂經典回顧',   lang: 'kpop',  tags: [] },

  // 西洋
  { id: 'pl.ea279df83e2148918bd5931cd118ae5e', name: '西洋熱門',             lang: 'west',  tags: [] },
  { id: 'pl.e50ccee7318043eaaf8e8e28a2a55114', name: '2000 年代熱門歌曲',    lang: 'auto',  tags: [] },
  { id: 'pl.6b1b5dfda067443481265436811002f1', name: '2010 年代熱門歌曲',    lang: 'auto',  tags: [] },

  // 動漫 / 影視
  { id: 'pl.cc0d3b8092354e1da8cff6a0d8ca9f38', name: '開唱：動漫音樂',       lang: 'jp',    tags: ['ost'] },
  { id: 'pl.91aa9e8d66484504a49ff923a5f91b97', name: '90 年代動畫金曲',      lang: 'jp',    tags: ['ost'] },
  { id: 'pl.80708b2d660f4d848f2154d845320b17', name: '2000 年代動畫金曲',    lang: 'jp',    tags: ['ost'] },
  { id: 'pl.407f5703ceb14a53a720d0fc5a3e4f3c', name: '2010 年代動畫金曲',    lang: 'jp',    tags: ['ost'] },
  { id: 'pl.243f4762e0044ef18392e4a231e801ae', name: '那些年追的偶像劇',     lang: 'mando', tags: ['ost'] },
  { id: 'pl.6aa75ab6e7ed4dd4a659abb687584d2e', name: '熱門韓劇主題曲',       lang: 'kpop',  tags: ['ost'] },
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

/* ---------- iTunes Lookup ---------- */
async function lookupAll(ids) {
  const out = new Map();
  for (let i = 0; i < ids.length; i += 150) {
    const batch = ids.slice(i, i + 150);
    const res = await fetch(`https://itunes.apple.com/lookup?id=${batch.join(',')}&country=TW`);
    if (!res.ok) throw new Error(`lookup HTTP ${res.status}`);
    const data = await res.json();
    for (const r of data.results || []) if (r.kind === 'song') out.set(String(r.trackId), r);
    await sleep(1500);
  }
  return out;
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

const BAD = /live|instrumental|karaoke|remix|伴奏|現場|演唱會|純音樂|acoustic|inst\./i;
const BAD_ALBUM = /第\s*\d+\s*期|演唱會|跨年|卡拉|karaoke|オルゴール|音樂盒|instrumental|伴奏/i;

const KANA = /[぀-ヿ]/, HANGUL = /[가-힯]/, HAN = /[一-鿿]/;

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

  // 1. 讀所有歌單
  const fromSource = new Map();   // trackId → Set(source index)
  for (let i = 0; i < SOURCES.length; i++) {
    const src = SOURCES[i];
    try {
      const ids = await playlistTrackIds(src.id);
      ids.forEach(id => { if (!fromSource.has(id)) fromSource.set(id, new Set()); fromSource.get(id).add(i); });
      console.log(`歌單 ${src.name}:${ids.length} 首`);
    } catch (e) {
      console.log(`歌單 ${src.name} 讀取失敗:${e.message}`);
    }
    await sleep(1000);
  }

  // 2. 查試聽網址與年份
  const items = await lookupAll([...fromSource.keys()]);
  console.log(`\n查到 ${items.size} / ${fromSource.size} 首的商店資料`);

  // 3. 分類、去重、併進既有題庫
  const extras = new Map();       // norm key → song
  const meta = {};                // song id → { year, tags }
  const previews = {};
  const skipped = { noPreview: 0, bad: 0 };

  for (const [trackId, srcIdx] of fromSource) {
    const item = items.get(trackId);
    if (!item) continue;
    if (!item.previewUrl) { skipped.noPreview++; continue; }
    if (BAD.test(item.trackName) || BAD_ALBUM.test(item.collectionName || '')) { skipped.bad++; continue; }

    const sources = [...srcIdx].map(i => SOURCES[i]);
    const tags = [...new Set(sources.flatMap(s => s.tags))];
    const year = yearOf(item);
    const hint = (sources.find(s => s.lang !== 'auto') || { lang: 'auto' }).lang;

    const addMeta = (id) => {
      const m = meta[id] || (meta[id] = { year: null, tags: [] });
      if (year && (!m.year || year < m.year)) m.year = year;   // 同一首出現多次,取最早的年份
      m.tags = [...new Set(m.tags.concat(tags))];
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

  // 沒有年份也沒有標籤的 meta 不用寫
  for (const id of Object.keys(meta)) {
    if (!meta[id].year) delete meta[id].year;
    if (!meta[id].tags.length) delete meta[id].tags;
    if (!Object.keys(meta[id]).length) delete meta[id];
  }

  const list = [...extras.values()];
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
