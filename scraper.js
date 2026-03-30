const { chromium } = require('playwright');
const fs = require('fs');

async function fetchJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function getUFCEvents() {
  console.log('ESPN\'den etkinlik takvimi alınıyor...');
  const data = await fetchJson('https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?limit=50');
  if (!data) return [];

  const calendar = data.leagues?.[0]?.calendar || [];
  const now = new Date();
  const events = [];

  for (const item of calendar) {
    events.push({
      name: item.label,
      startDate: new Date(item.startDate),
      isPast: new Date(item.startDate) < now
    });
  }

  const past = events.filter(e => e.isPast).slice(-10).reverse();
  const upcoming = events.filter(e => !e.isPast).slice(0, 10);
  return [...past, ...upcoming].slice(0, 20);
}

async function getEventFights(eventDate) {
  // Use a 3-day range to handle UTC offset (events at 01:30Z fall on previous calendar day)
  const dayBefore = new Date(eventDate); dayBefore.setDate(dayBefore.getDate() - 1);
  const dayAfter = new Date(eventDate); dayAfter.setDate(dayAfter.getDate() + 1);
  const from = dayBefore.toISOString().slice(0, 10).replace(/-/g, '');
  const to = dayAfter.toISOString().slice(0, 10).replace(/-/g, '');
  const data = await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?dates=${from}-${to}`);
  if (!data?.events?.length) return null;

  const event = data.events[0];
  const fights = [];

  // Take only the last 6 competitions (main card — ESPN orders prelims first, main card last)
  // Reverse so main event (most popular) appears first
  const mainCard = (event.competitions || []).slice(-6).reverse();

  for (const comp of mainCard) {
    const c = comp.competitors || [];
    if (c.length < 2) continue;

    const f1 = c.find(x => x.order === 1) || c[0];
    const f2 = c.find(x => x.order === 2) || c[1];

    const f1Id = f1.id || '';
    const f2Id = f2.id || '';

    const fight = {
      fighter1: f1.athlete?.displayName || '?',
      fighter2: f2.athlete?.displayName || '?',
      fighter1Photo: f1Id ? `https://a.espncdn.com/i/headshots/mma/players/full/${f1Id}.png` : null,
      fighter2Photo: f2Id ? `https://a.espncdn.com/i/headshots/mma/players/full/${f2Id}.png` : null,
      fighter1Flag: f1.athlete?.flag?.href || null,
      fighter2Flag: f2.athlete?.flag?.href || null,
      fighter1Country: f1.athlete?.flag?.alt || '',
      fighter2Country: f2.athlete?.flag?.alt || '',
      fighter1Record: f1.records?.[0]?.summary || '',
      fighter2Record: f2.records?.[0]?.summary || '',
      weightClass: comp.type?.abbreviation || comp.type?.text || '',
      scheduledRounds: comp.format?.regulation?.periods || 3,
      completed: comp.status?.type?.completed || false,
      winner: null,
      method: comp.status?.type?.shortDetail || '',
      round: null,
      time: null,
      judgeScores: null,
      keyEvents: [],
      rounds: [],
      odds: null,
      tweets: []
    };

    if (fight.completed) {
      const winner = c.find(x => x.winner);
      fight.winner = winner?.athlete?.displayName || null;

      // Round/time
      const detail = comp.status?.type?.shortDetail || '';
      const rMatch = detail.match(/R(\d)/i);
      const tMatch = detail.match(/(\d+:\d+)/);
      fight.round = rMatch ? rMatch[1] : null;
      fight.time = tMatch ? tMatch[1] : null;

      // Judge scorecards (3 judges)
      const scores1 = f1.linescores?.[0]?.linescores || [];
      const scores2 = f2.linescores?.[0]?.linescores || [];
      if (scores1.length > 0 && scores2.length > 0) {
        fight.judgeScores = scores1.map((s, i) => ({
          judge: i + 1,
          score1: s.value,
          score2: scores2[i]?.value || 0
        }));
      }

      // Key fight events (takedowns, KO, etc.)
      const eventTypes = { '13': 'Takedown', '12': 'Takedown Denemesi', '7': 'Nakavt', '8': 'TKO', '14': 'Submission Denemesi' };
      fight.keyEvents = (comp.details || [])
        .filter(d => eventTypes[d.type?.id])
        .map(d => eventTypes[d.type?.id]);
    }

    // Odds
    const odds = comp.odds?.[0];
    if (odds) {
      fight.odds = {
        fighter1Odds: odds.homeTeamOdds?.moneyLine || null,
        fighter2Odds: odds.awayTeamOdds?.moneyLine || null
      };
    }

    fights.push(fight);
  }

  return {
    name: event.name || event.shortName,
    date: event.date,
    venue: event.competitions?.[0]?.venue?.fullName || '',
    city: event.competitions?.[0]?.venue?.address?.city || '',
    poster: event.links?.find(l => l.rel?.includes('event'))?.href || null,
    fights
  };
}

async function getOddsFromESPN(fighter1, fighter2) {
  // Basit arama
  try {
    const q = encodeURIComponent(`${fighter1.split(' ').pop()} ${fighter2.split(' ').pop()}`);
    const d = await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?limit=5`);
    return null; // ESPN odds genellikle olayda gömülü geliyor, yukarda aldık
  } catch { return null; }
}

async function scrapeOdds(page, fighter1, fighter2) {
  try {
    const f1Last = fighter1.split(' ').pop();
    const f2Last = fighter2.split(' ').pop();
    await page.goto(`https://www.bestfightodds.com/search?query=${encodeURIComponent(f1Last)}`, {
      waitUntil: 'domcontentloaded', timeout: 20000
    });
    await page.waitForTimeout(2000);

    return await page.evaluate((f1l, f2l) => {
      const result = {};
      document.querySelectorAll('tr').forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length < 2) return;
        const name = cells[0]?.innerText.trim().toLowerCase();
        const lastCell = cells[cells.length - 1]?.innerText.trim();
        if (!lastCell || !/[-+]\d+/.test(lastCell)) return;
        if (name.includes(f1l.toLowerCase())) result.fighter1Odds = lastCell;
        if (name.includes(f2l.toLowerCase())) result.fighter2Odds = lastCell;
      });
      return (result.fighter1Odds || result.fighter2Odds) ? result : null;
    }, f1Last, f2Last);
  } catch { return null; }
}

async function scrapeTweets(page, fighter1, fighter2) {
  const nitterInstances = [
    'https://nitter.poast.org',
    'https://nitter.privacydev.net',
    'https://nitter.1d4.us'
  ];
  const query = encodeURIComponent(`${fighter1} ${fighter2} UFC`);

  for (const base of nitterInstances) {
    try {
      await page.goto(`${base}/search?q=${query}&f=tweets`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);

      const tweets = await page.evaluate(() => {
        const results = [];
        document.querySelectorAll('.timeline-item').forEach(el => {
          const textEl = el.querySelector('.tweet-content');
          const userEl = el.querySelector('.username');
          const statEls = el.querySelectorAll('.tweet-stat');
          if (!textEl) return;
          const text = textEl.innerText.trim();
          if (text.length < 15) return;
          let likes = 0;
          statEls.forEach(s => {
            if (s.querySelector('.icon-heart')) {
              likes = parseInt(s.innerText.replace(/[^0-9]/g, '')) || 0;
            }
          });
          results.push({ text, user: userEl?.innerText.trim() || '', likes });
        });
        return results.sort((a, b) => b.likes - a.likes).slice(0, 5);
      });

      if (tweets.length > 0) return tweets;
    } catch { continue; }
  }
  return [];
}

async function getRoundDetails(page, fighter1, fighter2) {
  try {
    // ESPN maç özeti sayfası dene
    const query = encodeURIComponent(`${fighter1} vs ${fighter2} UFC fight recap`);
    await page.goto(`https://www.google.com/search?q=${query}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);

    const espnLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="espn.com/mma"]'));
      return links.map(a => a.href).find(h => h.includes('recap') || h.includes('fight')) || null;
    });

    if (!espnLink) return [];

    await page.goto(espnLink, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);

    return await page.evaluate(() => {
      const rounds = [];
      const headers = document.querySelectorAll('h2, h3');
      headers.forEach(h => {
        const txt = h.innerText.toLowerCase();
        if (!txt.includes('round')) return;
        const num = txt.match(/\d+/)?.[0];
        if (!num) return;
        let content = '';
        let next = h.nextElementSibling;
        while (next && !next.matches('h2, h3') && content.length < 500) {
          content += next.innerText.trim() + ' ';
          next = next.nextElementSibling;
        }
        if (content.trim()) rounds.push({ round: parseInt(num), notes: [content.trim().slice(0, 400)] });
      });
      return rounds;
    });
  } catch { return []; }
}

// UFC's official YouTube channel ID
const UFC_CHANNEL_ID = 'UCvgfXK4nTYKuef0n6C_OxsA';

async function getYoutubeVideo(fighter1, fighter2) {
  try {
    const f1Last = fighter1.split(' ').pop();
    const f2Last = fighter2.split(' ').pop();
    const query = encodeURIComponent(`${f1Last} ${f2Last} UFC`);

    const res = await fetch(`https://www.youtube.com/results?search_query=${query}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });
    const html = await res.text();

    // Parse ytInitialData from page source
    let contents = [];
    const dataMatch = html.match(/var ytInitialData\s*=\s*(\{[\s\S]+?\});\s*<\/script>/);
    if (dataMatch) {
      try {
        const yt = JSON.parse(dataMatch[1]);
        contents = yt?.contents?.twoColumnSearchResultsRenderer?.primaryContents
          ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
      } catch {}
    }

    // Priority 1: UFC official channel video with both fighter names in title
    for (const item of contents) {
      const vr = item.videoRenderer;
      if (!vr?.videoId) continue;
      const channelId = vr.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
      const title = vr.title?.runs?.[0]?.text?.toLowerCase() || '';
      if (channelId === UFC_CHANNEL_ID && title.includes(f1Last.toLowerCase()) && title.includes(f2Last.toLowerCase()))
        return vr.videoId;
    }
    // Priority 2: UFC official channel, either fighter name
    for (const item of contents) {
      const vr = item.videoRenderer;
      if (!vr?.videoId) continue;
      const channelId = vr.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
      const title = vr.title?.runs?.[0]?.text?.toLowerCase() || '';
      if (channelId === UFC_CHANNEL_ID && (title.includes(f1Last.toLowerCase()) || title.includes(f2Last.toLowerCase())))
        return vr.videoId;
    }
    // Priority 3: Any UFC channel video
    for (const item of contents) {
      const vr = item.videoRenderer;
      if (!vr?.videoId) continue;
      const channelId = vr.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
      if (channelId === UFC_CHANNEL_ID) return vr.videoId;
    }
    // Fallback: any video from search
    const allIds = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)];
    return allIds[0]?.[1] || null;

  } catch { return null; }
}

async function getEventPoster(page, eventName) {
  try {
    const query = encodeURIComponent(`${eventName} official poster`);
    await page.goto(`https://www.google.com/search?q=${query}&tbm=isch`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);

    return await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      for (const img of imgs) {
        const src = img.src || img.getAttribute('data-src') || '';
        if (src.startsWith('http') && !src.includes('google') && src.includes('ufc') || src.includes('mma')) {
          return src;
        }
      }
      // Fallback: ilk resim
      const first = document.querySelector('img[src^="http"]');
      return first?.src || null;
    });
  } catch { return null; }
}

async function getRankings() {
  console.log('Sıralamalar alınıyor...');
  const data = await fetchJson('https://site.api.espn.com/apis/site/v2/sports/mma/ufc/rankings');
  if (!data?.rankings) return [];
  return data.rankings.map(div => ({
    name: div.name || div.shortName,
    shortName: div.shortName,
    ranks: (div.ranks || []).map(r => ({
      current: r.current,
      previous: r.previous,
      name: r.athlete?.displayName || r.team?.displayName || '',
      photo: r.athlete?.headshot?.href || (r.athlete?.id ? `https://a.espncdn.com/i/headshots/mma/players/full/${r.athlete.id}.png` : null),
      flag: r.athlete?.flag?.href || null,
      country: r.athlete?.flag?.alt || '',
      record: r.athlete?.record || r.record || '',
      id: r.athlete?.id || null
    }))
  }));
}

async function main() {
  const events = await getUFCEvents();
  console.log(`${events.length} etkinlik bulundu`);

  const browser = await chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled'] });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'tr-TR'
  });
  const page = await context.newPage();

  const allData = { events: [], generatedAt: new Date().toISOString() };

  for (const event of events) {
    console.log(`\n📅 ${event.name} (${event.isPast ? 'Geçmiş' : 'Yaklaşan'})`);

    const details = await getEventFights(event.startDate);
    if (!details) {
      console.log('  Maç bilgisi bulunamadı');
      allData.events.push({ name: event.name, date: event.startDate.toISOString(), status: event.isPast ? 'past' : 'upcoming', fights: [], poster: null });
      continue;
    }

    details.status = event.isPast ? 'past' : 'upcoming';
    details.poster = await getEventPoster(page, event.name);

    for (const fight of details.fights.slice(0, 6)) {
      if (fight.fighter1 === '?' || !fight.fighter1) continue;
      console.log(`  ⚔️  ${fight.fighter1} vs ${fight.fighter2}`);

      fight.tweets = await scrapeTweets(page, fight.fighter1, fight.fighter2);
      console.log(`     ${fight.tweets.length} tweet`);

      if (!fight.odds) {
        fight.odds = await scrapeOdds(page, fight.fighter1, fight.fighter2);
      }

      if (event.isPast && fight.winner) {
        fight.rounds = await getRoundDetails(page, fight.fighter1, fight.fighter2);
      }

      fight.youtubeVideoId = await getYoutubeVideo(fight.fighter1, fight.fighter2);
      console.log(`     YouTube: ${fight.youtubeVideoId || 'bulunamadı'}`);
    }

    allData.events.push(details);
  }

  allData.rankings = await getRankings();
  console.log(`${allData.rankings.length} sıralama kategorisi alındı`);

  await browser.close();
  fs.writeFileSync('ufc_data.json', JSON.stringify(allData, null, 2));
  console.log('\n✅ Veri kaydedildi');
  require('./generate.js');
}

main().catch(console.error);
