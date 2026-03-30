const fs = require('fs');

async function fetchJson(url) {
  try { const r = await fetch(url); if (!r.ok) return null; return await r.json(); }
  catch { return null; }
}

function inferMethod(details) {
  const ids = (details || []).map(d => String(d.type?.id));
  if (ids.includes('21')) return 'KO/TKO';
  if (ids.includes('22')) return 'Karar';
  if (ids.includes('20')) return 'Submission';
  return 'Karar';
}

function inferRound(details) {
  const roundStarts = (details || []).filter(d => String(d.type?.id) === '5').length;
  return roundStarts > 0 ? roundStarts : null;
}

async function main() {
  const data = JSON.parse(fs.readFileSync('ufc_data.json', 'utf8'));

  for (const event of data.events) {
    if (!event.fights.length) continue;
    const date = new Date(event.date);
    const d1 = new Date(date); d1.setDate(d1.getDate() - 1);
    const d2 = new Date(date); d2.setDate(d2.getDate() + 1);
    const from = d1.toISOString().slice(0,10).replace(/-/g,'');
    const to   = d2.toISOString().slice(0,10).replace(/-/g,'');

    const espn = await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?dates=${from}-${to}`);
    if (!espn?.events?.length) continue;

    const mainCard = (espn.events[0].competitions || []).slice(-6).reverse();

    event.fights.forEach((fight, fi) => {
      const comp = mainCard[fi];
      if (!comp) return;
      const c = comp.competitors || [];
      const f1 = c.find(x => x.order === 1) || c[0];
      const f2 = c.find(x => x.order === 2) || c[1];
      if (!f1 || !f2) return;

      fight.fighter1Country  = f1.athlete?.flag?.alt || '';
      fight.fighter2Country  = f2.athlete?.flag?.alt || '';
      fight.scheduledRounds  = comp.format?.regulation?.periods || 3;

      if (fight.completed) {
        // Better method inference
        fight.method = inferMethod(comp.details);
        fight.round  = inferRound(comp.details);

        // Time from clock (seconds remaining → elapsed)
        const clock = comp.status?.clock;
        if (clock != null && fight.round) {
          const roundDuration = 5 * 60;
          const elapsed = roundDuration - clock;
          const m = Math.floor(elapsed / 60);
          const s = Math.floor(elapsed % 60);
          fight.time = `${m}:${s.toString().padStart(2,'0')}`;
        }

        // Judge scorecards
        const s1 = f1.linescores?.[0]?.linescores || [];
        const s2 = f2.linescores?.[0]?.linescores || [];
        if (s1.length && s2.length) {
          fight.judgeScores = s1.map((s, i) => ({ judge: i+1, score1: s.value, score2: s2[i]?.value||0 }));
        }

        // Key events (with counts)
        const typeMap = { '17':'Knockdown', '13':'Takedown', '12':'Takedown Denemesi', '14':'Submission Denemesi' };
        fight.keyEvents = (comp.details || []).filter(d => typeMap[d.type?.id]).map(d => typeMap[d.type?.id]);
      }

      const d = comp.details || [];
      const ev = fight;
      console.log(`✓ ${ev.fighter1} vs ${ev.fighter2} | ${ev.method||'-'} R${ev.round||'?'} ${ev.time||''} | ${ev.fighter1Country}`);
    });
  }

  fs.writeFileSync('ufc_data.json', JSON.stringify(data, null, 2));
  console.log('\n✅ Veri güncellendi');
  require('./generate.js');
}

main().catch(console.error);
