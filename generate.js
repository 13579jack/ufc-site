const fs = require('fs');

const UFC_LOGO = 'https://a.espncdn.com/i/teamlogos/leagues/500/ufc.png';

const BASE_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600;700&display=swap');
  *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
  :root{
    --red:#D20A0A;--red2:#ff1a1a;--gold:#F5C518;
    --bg:#070707;--bg2:#0d0d0d;--bg3:#111;
    --card:rgba(255,255,255,.03);
    --border:rgba(255,255,255,.07);--border2:rgba(255,255,255,.14);
    --text:#f0f0f0;--text2:#999;--text3:#444;
  }
  html[data-theme="light"]{
    --bg:#f0f0f0;--bg2:#e5e5e5;--bg3:#d8d8d8;
    --card:rgba(0,0,0,.04);
    --border:rgba(0,0,0,.09);--border2:rgba(0,0,0,.18);
    --text:#111;--text2:#555;--text3:#999;
  }
  html{scroll-behavior:smooth;}
  body{
    font-family:'Barlow','Segoe UI',system-ui,sans-serif;
    background:var(--bg);color:var(--text);
    min-height:100vh;overflow-x:hidden;
    animation:pgIn .38s cubic-bezier(.22,1,.36,1) both;
    transition:background .25s,color .25s;
  }
  @keyframes pgIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
  @keyframes pgOut{from{opacity:1}to{opacity:0;transform:scale(.97) translateY(-8px)}}
  body.leaving{animation:pgOut .22s ease both;pointer-events:none;}

  nav{
    position:sticky;top:0;z-index:500;height:80px;
    background:rgba(7,7,7,.97);border-bottom:2px solid var(--red);
    display:flex;align-items:center;padding:0 40px;gap:20px;
    backdrop-filter:blur(24px) saturate(1.4);
    box-shadow:0 4px 60px rgba(0,0,0,.8),0 1px 0 rgba(210,10,10,.3);
    transition:background .25s;
  }
  html[data-theme="light"] nav{background:rgba(240,240,240,.97);box-shadow:0 2px 20px rgba(0,0,0,.12);}
  @media(max-width:640px){
    nav{height:60px;padding:0 14px;gap:10px;}
    .nav-logo-img{height:38px;}
    .nav-title,.nav-date{display:none;}
    .nav-link{font-size:11px;padding:5px 10px;letter-spacing:.5px;}
    .nav-back{font-size:12px;padding:6px 12px;}
    footer{padding:24px 16px;}
  }
  .nav-logo-wrap{display:flex;align-items:center;text-decoration:none;}
  .nav-logo-img{
    height:58px;width:auto;
    filter:drop-shadow(0 0 14px rgba(210,10,10,.7)) brightness(1.15);
    transition:filter .3s;
  }
  .nav-logo-wrap:hover .nav-logo-img{filter:drop-shadow(0 0 22px rgba(210,10,10,1)) brightness(1.25);}
  .nav-divider{width:1px;height:36px;background:rgba(255,255,255,.1);flex-shrink:0;}
  html[data-theme="light"] .nav-divider{background:rgba(0,0,0,.12);}
  .nav-title{font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:700;color:var(--text2);letter-spacing:3px;text-transform:uppercase;}
  .nav-right{margin-left:auto;display:flex;align-items:center;gap:12px;}
  .nav-date{font-size:11px;color:var(--text3);letter-spacing:.5px;}
  .nav-back{
    display:flex;align-items:center;gap:8px;text-decoration:none;color:var(--text2);
    font-size:13px;font-weight:600;letter-spacing:.5px;
    padding:7px 16px;border-radius:6px;border:1px solid var(--border2);transition:all .2s;
  }
  .nav-back:hover{color:#fff;border-color:var(--red);background:rgba(210,10,10,.12);}
  .nav-event-name{
    font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:600;color:var(--text3);
    text-transform:uppercase;letter-spacing:1.5px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:280px;
  }
  .nav-link{
    display:flex;align-items:center;gap:6px;text-decoration:none;color:var(--text2);
    font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;
    padding:6px 14px;border-radius:6px;border:1px solid var(--border2);transition:all .2s;white-space:nowrap;
  }
  .nav-link:hover{color:#fff;border-color:var(--red);background:rgba(210,10,10,.12);}
  .theme-toggle{
    background:none;border:1px solid var(--border2);border-radius:8px;
    color:var(--text2);cursor:pointer;padding:6px 11px;font-size:16px;
    transition:all .2s;line-height:1;flex-shrink:0;
  }
  .theme-toggle:hover{border-color:var(--red);}
  footer{
    text-align:center;padding:52px 24px;
    color:var(--text3);font-size:11px;letter-spacing:.8px;
    border-top:1px solid rgba(255,255,255,.04);background:var(--bg2);
  }
`;

const TRANSITION_JS = `
  function navigate(url){
    document.body.classList.add('leaving');
    setTimeout(()=>window.location.href=url,260);
  }
  document.querySelectorAll('[data-nav]').forEach(el=>{
    el.addEventListener('click',e=>{e.preventDefault();navigate(el.dataset.nav);});
  });
  (function(){
    const saved=localStorage.getItem('ufc-theme')||'dark';
    document.documentElement.dataset.theme=saved==='light'?'light':'';
    const btn=document.getElementById('theme-toggle');
    if(!btn)return;
    btn.textContent=saved==='light'?'🌙':'☀️';
    btn.addEventListener('click',()=>{
      const isLight=document.documentElement.dataset.theme==='light';
      document.documentElement.dataset.theme=isLight?'':'light';
      localStorage.setItem('ufc-theme',isLight?'dark':'light');
      btn.textContent=isLight?'☀️':'🌙';
    });
  })();
  function updateCountdowns(){
    document.querySelectorAll('[data-countdown]').forEach(el=>{
      const t=new Date(el.dataset.countdown)-Date.now();
      if(t<=0){el.textContent='BAŞLADI';el.style.color='var(--red)';return;}
      const d=Math.floor(t/86400000),h=Math.floor((t%86400000)/3600000),
            m=Math.floor((t%3600000)/60000),s=Math.floor((t%60000)/1000);
      el.textContent=d>0?d+'G '+h+'S '+m+'D':h+'S '+m+'D '+s+'sn';
    });
  }
  if(document.querySelector('[data-countdown]')){updateCountdowns();setInterval(updateCountdowns,1000);}
`;

// ── INDEX ─────────────────────────────────────────────────────────────────────
function generateIndex(data) {
  const weights = [...new Set(
    data.events.flatMap(e=>e.fights.map(f=>f.weightClass)).filter(Boolean)
  )].sort();

  const eventsHtml = data.events.map((event,ei)=>{
    const isPast = event.status==='past';
    const dateStr = event.date
      ? new Date(event.date).toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})
      : '';
    if(!event.fights.length) return '';

    const fightsHtml = event.fights.map((fight,fi)=>{
      const isWin1=isPast&&fight.winner===fight.fighter1;
      const isWin2=isPast&&fight.winner===fight.fighter2;
      const searchVal=(fight.fighter1+' '+fight.fighter2).toLowerCase();
      const weightVal=(fight.weightClass||'').toLowerCase();

      const countdownHtml=!isPast&&event.date?`
      <div class="fcard-countdown">
        <span class="fcd-label">BAŞLAMAYA</span>
        <span class="fcd-val" data-countdown="${event.date}">...</span>
        <span class="fcd-label">KALDI</span>
      </div>`:'';

      const vk=`v${ei}_${fi}`;
      const voteHtml=!isPast?`
      <div class="fcard-vote" data-vkey="${vk}" data-f1="${esc(fight.fighter1)}" data-f2="${esc(fight.fighter2)}">
        <div class="fv-label">Kim kazanır?</div>
        <div class="fv-btns">
          <button class="fv-btn" onclick="castVote('${vk}','f1',event)">${esc(fight.fighter1.split(' ').pop())}</button>
          <button class="fv-btn" onclick="castVote('${vk}','f2',event)">${esc(fight.fighter2.split(' ').pop())}</button>
        </div>
        <div class="fv-result"></div>
      </div>`:'';

      return `
      <a class="fcard" href="fight-${ei}-${fi}.html" data-nav="fight-${ei}-${fi}.html"
         data-search="${esc(searchVal)}" data-weight="${esc(weightVal)}">
        <div class="fcard-top">
          <div class="fcard-weight">${esc(fight.weightClass||'')}</div>
          ${isPast?`<div class="fcard-status past">Tamamlandı</div>`:`<div class="fcard-status upcoming">Yaklaşan</div>`}
        </div>
        <div class="fcard-body">
          <div class="fcard-fighter ${isWin1?'win':''}">
            <div class="fcard-photo-wrap">
              ${fight.fighter1Photo?`<img class="fcard-photo" src="${fight.fighter1Photo}" alt="${esc(fight.fighter1)}" loading="lazy" onerror="this.closest('.fcard-photo-wrap').style.display='none'">`:`<div class="fcard-photo-empty"></div>`}
              ${isWin1?'<div class="fcard-win-ring"></div>':''}
            </div>
            <div class="fcard-finfo">
              ${fight.fighter1Flag?`<img class="fcard-flag" src="${fight.fighter1Flag}" alt="${esc(fight.fighter1Country||'')}">`:``}
              <span class="fcard-fname">${esc(fight.fighter1||'?')}</span>
              ${fight.fighter1Record?`<span class="fcard-rec">${fight.fighter1Record}</span>`:''}
              ${isWin1?'<span class="fcard-winner-label">● KAZANAN</span>':''}
            </div>
          </div>
          <div class="fcard-middle">
            <div class="fcard-vs">VS</div>
            ${isPast&&fight.method?`<div class="fcard-method">${esc(fight.method)}</div>${fight.round?`<div class="fcard-rnd">R${fight.round}${fight.time?' · '+fight.time:''}</div>`:''}` : ''}
          </div>
          <div class="fcard-fighter right ${isWin2?'win':''}">
            <div class="fcard-photo-wrap">
              ${fight.fighter2Photo?`<img class="fcard-photo" src="${fight.fighter2Photo}" alt="${esc(fight.fighter2)}" loading="lazy" onerror="this.closest('.fcard-photo-wrap').style.display='none'">`:`<div class="fcard-photo-empty"></div>`}
              ${isWin2?'<div class="fcard-win-ring"></div>':''}
            </div>
            <div class="fcard-finfo right">
              ${fight.fighter2Flag?`<img class="fcard-flag" src="${fight.fighter2Flag}" alt="${esc(fight.fighter2Country||'')}">`:``}
              <span class="fcard-fname">${esc(fight.fighter2||'?')}</span>
              ${fight.fighter2Record?`<span class="fcard-rec">${fight.fighter2Record}</span>`:''}
              ${isWin2?'<span class="fcard-winner-label">● KAZANAN</span>':''}
            </div>
          </div>
        </div>
        ${countdownHtml}
        ${voteHtml}
        <div class="fcard-footer">Detaylar için tıkla →</div>
      </a>`;
    }).join('');

    return `
    <section class="ev" id="ev-${ei}" data-status="${event.status||'past'}"${event.poster?` style="--poster:url('${event.poster}')"`:''}>
      <div class="ev-bg"></div>
      <div class="ev-inner">
        <div class="ev-head">
          <span class="ev-badge ${isPast?'past':'upcoming'}">${isPast?'GEÇMİŞ MAÇ':'YAKLAŞAN'}</span>
          <h2 class="ev-name">${esc(event.name)}</h2>
          <div class="ev-meta">
            ${dateStr?`<span>${dateStr}</span>`:''}
            ${event.venue?`<span class="ev-meta-sep">·</span><span>${esc(event.venue)}</span>`:''}
            ${event.city?`<span class="ev-meta-sep">·</span><span>${esc(event.city)}</span>`:''}
          </div>
        </div>
        <div class="ev-fights">${fightsHtml}</div>
      </div>
    </section>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>UFC Maç Merkezi</title>
<style>
${BASE_STYLE}
.filter-bar{
  position:sticky;top:80px;z-index:400;
  background:var(--bg2);border-bottom:1px solid var(--border);
  padding:0 40px;display:flex;align-items:center;gap:14px;height:56px;
}
.tab-group{display:flex;gap:4px;}
.tab-btn{
  background:none;border:1px solid transparent;border-radius:6px;
  color:var(--text2);cursor:pointer;
  font-family:'Barlow Condensed',sans-serif;
  font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;
  padding:6px 14px;transition:all .18s;
}
.tab-btn.active{background:var(--red);color:#fff;border-color:var(--red);box-shadow:0 0 16px rgba(210,10,10,.3);}
.tab-btn:not(.active):hover{border-color:var(--border2);color:var(--text);}
.fsep{width:1px;height:24px;background:var(--border);flex-shrink:0;}
.search-wrap{position:relative;}
.search-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;pointer-events:none;color:var(--text3);}
.search-input{
  width:220px;background:var(--card);border:1px solid var(--border2);
  border-radius:8px;color:var(--text);font-size:13px;
  padding:7px 12px 7px 32px;outline:none;transition:border-color .2s;
}
.search-input:focus{border-color:var(--red);}
.weight-select{
  background:var(--card);border:1px solid var(--border2);color:var(--text2);
  border-radius:8px;padding:7px 12px;
  font-size:11px;font-family:'Barlow Condensed',sans-serif;
  font-weight:700;letter-spacing:.5px;cursor:pointer;outline:none;transition:border-color .2s;
}
.weight-select:focus{border-color:var(--red);}
.filter-count{margin-left:auto;font-size:11px;color:var(--text3);letter-spacing:.5px;}
.no-results{text-align:center;padding:80px 40px;color:var(--text3);font-size:15px;font-style:italic;display:none;}

.ev{position:relative;padding:80px 40px 90px;overflow:hidden;}
.ev+.ev{border-top:1px solid rgba(255,255,255,.03);}
.ev-bg{
  position:absolute;inset:0;
  background:var(--poster,none) center/cover no-repeat;
  filter:brightness(.08) blur(6px) saturate(.4);
  z-index:0;transform:scale(1.06);
}
.ev:not([style*="--poster"]) .ev-bg{background:linear-gradient(160deg,#1a0000 0%,var(--bg) 55%);filter:none;transform:none;}
.ev-inner{position:relative;z-index:1;max-width:1160px;margin:0 auto;}
.ev.hidden,.fcard.hidden{display:none;}
.ev-head{margin-bottom:36px;}
.ev-badge{
  display:inline-flex;align-items:center;gap:7px;
  padding:5px 16px;border-radius:4px;margin-bottom:14px;
  font-family:'Barlow Condensed',sans-serif;
  font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;
}
.ev-badge.past{background:#181818;color:#555;border:1px solid #252525;}
.ev-badge.upcoming{background:var(--red);color:#fff;box-shadow:0 0 24px rgba(210,10,10,.5);}
.ev-badge.upcoming::before{content:'●';font-size:8px;animation:blink 1.4s infinite;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
.ev-name{
  font-family:'Barlow Condensed',sans-serif;
  font-size:clamp(26px,4vw,52px);font-weight:900;text-transform:uppercase;
  letter-spacing:1px;line-height:1;margin-bottom:10px;
  text-shadow:0 4px 30px rgba(0,0,0,.9);
}
.ev-meta{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--text3);flex-wrap:wrap;}
.ev-meta-sep{color:#222;}
.ev-fights{display:flex;flex-direction:column;gap:10px;}

.fcard:first-child{border-color:rgba(210,10,10,.2);}
.fcard:first-child .fcard-photo{height:150px;width:116px;}
.fcard:first-child .fcard-fname{font-size:clamp(15px,2vw,21px);}
.fcard{
  display:block;text-decoration:none;color:inherit;
  background:rgba(255,255,255,.025);border:1px solid var(--border);
  border-radius:14px;overflow:hidden;position:relative;
  transition:transform .18s cubic-bezier(.34,1.56,.64,1),border-color .2s,box-shadow .2s,background .2s;
}
.fcard:hover{
  transform:translateY(-4px) scale(1.005);
  border-color:rgba(210,10,10,.55);background:rgba(255,255,255,.045);
  box-shadow:0 12px 50px rgba(0,0,0,.6),0 0 0 1px rgba(210,10,10,.12),inset 0 1px 0 rgba(255,255,255,.06);
}
.fcard-top{display:flex;align-items:center;justify-content:space-between;padding:13px 22px 4px;}
.fcard-weight{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:var(--red);}
.fcard-status{font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;padding:3px 10px;border-radius:4px;}
.fcard-status.past{color:#444;background:#0e0e0e;border:1px solid #1c1c1c;}
.fcard-status.upcoming{color:var(--red);background:rgba(210,10,10,.08);border:1px solid rgba(210,10,10,.2);}
.fcard-body{display:grid;grid-template-columns:1fr 76px 1fr;align-items:center;padding:14px 22px 16px;gap:6px;}
.fcard-fighter{display:flex;align-items:center;gap:14px;}
.fcard-fighter.right{flex-direction:row-reverse;}
.fcard-photo-wrap{position:relative;flex-shrink:0;}
.fcard-photo{width:96px;height:124px;object-fit:cover;object-position:top center;border-radius:8px;background:#0e0e0e;border:1px solid rgba(255,255,255,.06);display:block;transition:box-shadow .2s;}
.fcard:hover .fcard-photo{border-color:rgba(255,255,255,.12);}
.fcard-photo-empty{width:96px;height:124px;border-radius:8px;background:#0e0e0e;border:1px dashed #1a1a1a;}
.fcard-fighter.win .fcard-photo{box-shadow:0 0 0 2px var(--red),0 0 24px rgba(210,10,10,.35);border-color:var(--red);}
.fcard-win-ring{position:absolute;inset:-3px;border-radius:10px;border:2px solid var(--red);box-shadow:0 0 18px rgba(210,10,10,.5);pointer-events:none;}
.fcard-finfo{display:flex;flex-direction:column;gap:5px;}
.fcard-finfo.right{align-items:flex-end;}
.fcard-flag{width:30px;height:20px;object-fit:cover;border-radius:3px;border:1px solid rgba(255,255,255,.15);}
.fcard-fname{font-family:'Barlow Condensed',sans-serif;font-size:clamp(14px,1.6vw,18px);font-weight:800;text-transform:uppercase;letter-spacing:.5px;line-height:1.1;}
.fcard-fighter.win .fcard-fname{color:var(--red);}
.fcard-rec{font-size:11px;color:var(--text3);}
.fcard-winner-label{font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:800;letter-spacing:1.5px;color:var(--red);text-transform:uppercase;}
.fcard-middle{display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center;}
.fcard-vs{font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:900;color:#222;letter-spacing:4px;}
.fcard-method{font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:800;color:var(--red);letter-spacing:1px;text-transform:uppercase;}
.fcard-rnd{font-size:10px;color:var(--text3);}

.fcard-countdown{
  display:flex;align-items:center;justify-content:center;gap:10px;
  padding:10px 22px;background:rgba(210,10,10,.05);
  border-top:1px solid rgba(210,10,10,.12);
}
.fcd-label{font-size:9px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--text3);}
.fcd-val{font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:900;color:var(--red);min-width:90px;text-align:center;}

.fcard-vote{padding:12px 22px;border-top:1px solid var(--border);background:rgba(255,255,255,.015);}
.fv-label{font-size:9px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--text3);margin-bottom:8px;text-align:center;}
.fv-btns{display:flex;gap:8px;}
.fv-btn{
  flex:1;padding:9px;border-radius:8px;border:1px solid var(--border2);
  background:var(--card);color:var(--text2);cursor:pointer;
  font-family:'Barlow Condensed',sans-serif;
  font-size:14px;font-weight:800;letter-spacing:1px;text-transform:uppercase;
  transition:all .18s;
}
.fv-btn:hover{border-color:var(--red);color:#fff;background:rgba(210,10,10,.15);}
.fv-btn.voted{background:var(--red);border-color:var(--red);color:#fff;box-shadow:0 0 18px rgba(210,10,10,.4);}
.fv-result{margin-top:10px;}
.fvr-row{display:flex;align-items:center;gap:10px;margin-bottom:5px;}
.fvr-name{font-size:11px;font-weight:700;color:var(--text2);width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:0;}
.fvr-track{flex:1;height:5px;background:var(--border);border-radius:3px;overflow:hidden;}
.fvr-fill{height:100%;background:var(--red);border-radius:3px;transition:width .6s cubic-bezier(.22,1,.36,1);}
.fvr-pct{font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:800;color:var(--text3);width:32px;text-align:right;flex-shrink:0;}

.fcard-footer{padding:9px 22px;border-top:1px solid rgba(255,255,255,.04);font-size:11px;color:#222;text-align:right;letter-spacing:.5px;transition:color .2s;}
.fcard:hover .fcard-footer{color:var(--text3);}
@media(max-width:680px){
  /* Filter bar */
  .filter-bar{top:60px;height:auto;padding:8px 12px;gap:6px;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;}
  .fsep{display:none;}
  .tab-btn{font-size:11px;padding:5px 10px;}
  .search-input{width:130px;font-size:12px;}
  .weight-select{font-size:10px;padding:6px 8px;max-width:120px;}
  .filter-count{display:none;}

  /* Event section */
  .ev{padding:24px 12px 32px;}
  .ev-head{margin-bottom:18px;}
  .ev-name{font-size:clamp(18px,5.5vw,32px)!important;}
  .ev-meta{font-size:11px;gap:6px;}
  .ev-badge{font-size:10px;padding:4px 12px;}

  /* Fight card: stack fighters vertically */
  .fcard-body{
    display:flex;flex-direction:column;
    padding:0;gap:0;
  }
  .fcard-fighter{
    display:flex;flex-direction:row!important;
    align-items:center;gap:12px;
    padding:12px 16px;
  }
  .fcard-fighter.right{
    flex-direction:row!important;
    border-top:1px solid var(--border);
  }
  .fcard-fighter.right .fcard-finfo{align-items:flex-start!important;}
  .fcard-middle{
    flex-direction:row;justify-content:center;
    gap:16px;padding:6px 16px;
    border-top:1px solid rgba(255,255,255,.04);
    border-bottom:1px solid rgba(255,255,255,.04);
    background:rgba(255,255,255,.015);
  }
  .fcard-photo,.fcard-photo-empty{width:56px;height:72px;border-radius:6px;flex-shrink:0;}
  .fcard:first-child .fcard-photo{width:60px;height:78px;}
  .fcard-fname{font-size:15px!important;line-height:1.15;}
  .fcard-rec{font-size:11px;}
  .fcard-flag{width:22px;height:15px;}
  .fcard-winner-label{font-size:9px;}
  .fcard-vs{font-size:11px;letter-spacing:2px;}
  .fcard-method{font-size:11px;}
  .fcard-rnd{font-size:9px;}
  .fcard-top{padding:10px 16px 4px;}
  .fcard-countdown{padding:8px 16px;gap:8px;}
  .fcd-val{font-size:18px;min-width:65px;}
  .fcd-label{font-size:8px;}
  .fcard-vote{padding:10px 16px;}
  .fv-btn{font-size:13px;padding:8px;}
  .fvr-name{width:70px;}
  .fcard-footer{padding:7px 16px;font-size:10px;}
}
</style>
</head>
<body>
<nav>
  <a class="nav-logo-wrap" href="index.html" data-nav="index.html">
    <img class="nav-logo-img" src="${UFC_LOGO}" alt="UFC">
  </a>
  <div class="nav-divider"></div>
  <span class="nav-title">Maç Merkezi</span>
  <div class="nav-right">
    <a class="nav-link" href="compare.html" data-nav="compare.html">⚔ Karşılaştır</a>
    <button class="theme-toggle" id="theme-toggle" title="Tema">☀️</button>
    <span class="nav-date">Son güncelleme: ${new Date().toLocaleString('tr-TR')}</span>
  </div>
</nav>

<div style="background:var(--red);padding:10px 40px;display:flex;align-items:center;gap:16px;overflow-x:auto;white-space:nowrap;border-bottom:1px solid rgba(0,0,0,.3)">
  ${data.events.slice(0,8).map((e,i)=>`<a href="#ev-${i}" style="color:rgba(255,255,255,.85);font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-decoration:none;flex-shrink:0;padding:2px 0;border-bottom:2px solid transparent;transition:all .2s" onmouseover="this.style.color='#fff';this.style.borderColor='#fff'" onmouseout="this.style.color='rgba(255,255,255,.85)';this.style.borderColor='transparent'">${esc(e.name.replace('UFC Fight Night: ','').replace('UFC ',''))}</a>`).join('<span style="color:rgba(255,255,255,.2);font-size:10px">|</span>')}
</div>

<div class="filter-bar">
  <div class="tab-group">
    <button class="tab-btn active" data-tab="all">Tümü</button>
    <button class="tab-btn" data-tab="upcoming">Yaklaşan</button>
    <button class="tab-btn" data-tab="past">Geçmiş</button>
  </div>
  <div class="fsep"></div>
  <div class="search-wrap">
    <span class="search-icon">🔍</span>
    <input class="search-input" id="search-input" type="text" placeholder="Dövüşçü ara...">
  </div>
  <select class="weight-select" id="weight-select">
    <option value="">Tüm Sikletler</option>
    ${weights.map(w=>`<option value="${esc(w.toLowerCase())}">${esc(w)}</option>`).join('')}
  </select>
  <span class="filter-count" id="filter-count"></span>
</div>
<div id="no-results" class="no-results">Arama kriterlerine uygun maç bulunamadı.</div>

${eventsHtml}

<footer>ESPN · ${new Date().toLocaleString('tr-TR')}</footer>
<script>${TRANSITION_JS}</script>
<script>
const tabs=document.querySelectorAll('.tab-btn');
const si=document.getElementById('search-input');
const ws=document.getElementById('weight-select');
const nr=document.getElementById('no-results');
const fc=document.getElementById('filter-count');
let at='all',sv='',wv='';
function applyFilters(){
  let n=0;
  document.querySelectorAll('.ev').forEach(ev=>{
    const st=ev.dataset.status||'past';
    if(at!=='all'&&st!==at){ev.classList.add('hidden');return;}
    let hv=false;
    ev.querySelectorAll('.fcard').forEach(card=>{
      const ok=(!sv||card.dataset.search.includes(sv))&&(!wv||card.dataset.weight.includes(wv));
      card.classList.toggle('hidden',!ok);
      if(ok){hv=true;n++;}
    });
    ev.classList.toggle('hidden',!hv);
  });
  nr.style.display=n===0?'block':'none';
  fc.textContent=n+' maç';
}
tabs.forEach(btn=>btn.addEventListener('click',()=>{
  tabs.forEach(b=>b.classList.remove('active'));btn.classList.add('active');
  at=btn.dataset.tab;applyFilters();
}));
si.addEventListener('input',()=>{sv=si.value.toLowerCase().trim();applyFilters();});
ws.addEventListener('change',()=>{wv=ws.value.toLowerCase();applyFilters();});
applyFilters();

function castVote(key,fighter,e){
  e.stopPropagation();e.preventDefault();
  const votes=JSON.parse(localStorage.getItem('ufc_votes')||'{}');
  if(votes[key])return;
  votes[key]=fighter;
  localStorage.setItem('ufc_votes',JSON.stringify(votes));
  renderVote(key);
}
function renderVote(key){
  const wrap=document.querySelector('[data-vkey="'+key+'"]');
  if(!wrap)return;
  const votes=JSON.parse(localStorage.getItem('ufc_votes')||'{}');
  const my=votes[key];if(!my)return;
  wrap.querySelectorAll('.fv-btn').forEach((b,i)=>{
    if((i===0&&my==='f1')||(i===1&&my==='f2'))b.classList.add('voted');
  });
  const f1p=my==='f1'?65:35,f2p=100-f1p;
  const n1=wrap.dataset.f1.split(' ').pop(),n2=wrap.dataset.f2.split(' ').pop();
  const res=wrap.querySelector('.fv-result');
  res.innerHTML=
    '<div class="fvr-row"><span class="fvr-name">'+n1+'</span><div class="fvr-track"><div class="fvr-fill" style="width:'+f1p+'%"></div></div><span class="fvr-pct">'+f1p+'%</span></div>'+
    '<div class="fvr-row"><span class="fvr-name">'+n2+'</span><div class="fvr-track"><div class="fvr-fill" style="width:'+f2p+'%"></div></div><span class="fvr-pct">'+f2p+'%</span></div>';
}
const stored=JSON.parse(localStorage.getItem('ufc_votes')||'{}');
Object.keys(stored).forEach(k=>renderVote(k));
</script>
</body>
</html>`;
}

// ── FIGHT DETAIL PAGE ─────────────────────────────────────────────────────────
function generateFightPage(fight, ei, fi, eventName, eventStatus, eventDate, eventVenue, eventCity) {
  const isPast = eventStatus==='past';
  const isWin1 = isPast&&fight.winner===fight.fighter1;
  const isWin2 = isPast&&fight.winner===fight.fighter2;
  const dateStr = eventDate
    ? new Date(eventDate).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})
    : '';

  const videoHtml = fight.youtubeVideoId ? `
    <div class="dsec">
      <div class="dsec-title">Video</div>
      <a class="yt-thumb-link" href="https://www.youtube.com/watch?v=${fight.youtubeVideoId}" target="_blank" rel="noopener">
        <div class="yt-wrap">
          <img src="https://img.youtube.com/vi/${fight.youtubeVideoId}/maxresdefault.jpg"
               onerror="this.src='https://img.youtube.com/vi/${fight.youtubeVideoId}/hqdefault.jpg'"
               alt="${esc(fight.fighter1)} vs ${esc(fight.fighter2)}" class="yt-thumb-img">
          <div class="yt-play-btn">
            <svg viewBox="0 0 68 48" width="68" height="48"><path d="M66.5 7.8a8.5 8.5 0 0 0-6-6C56 0 34 0 34 0S12 0 7.5 1.8a8.5 8.5 0 0 0-6 6C0 12.3 0 24 0 24s0 11.7 1.5 16.2a8.5 8.5 0 0 0 6 6C12 48 34 48 34 48s22 0 26.5-1.8a8.5 8.5 0 0 0 6-6C68 35.7 68 24 68 24s0-11.7-1.5-16.2z" fill="#ff0000"/><path d="M45 24 27 14v20z" fill="#fff"/></svg>
          </div>
          <div class="yt-overlay-label">YouTube'da İzle</div>
        </div>
      </a>
    </div>` : '';

  const oddsHtml = (()=>{
    if(!fight.odds||(!fight.odds.fighter1Odds&&!fight.odds.fighter2Odds))
      return `<p class="no-data">Oran bilgisi bulunamadı</p>`;
    const item=(name,flag,val)=>{
      if(!val) return `<div class="odds-row"><div class="or-fighter"><span class="or-name">${esc(name)}</span></div><span class="or-val">—</span></div>`;
      const cls=parseFloat(val)<0?'fav':'dog';
      return `<div class="odds-row"><div class="or-fighter">${flag?`<img class="or-flag" src="${flag}" alt="">`:''}<span class="or-name">${esc(name)}</span>${parseFloat(val)<0?'<span class="or-label fav">FAVORİ</span>':'<span class="or-label dog">UNDERDOG</span>'}</div><span class="or-val ${cls}">${val}</span></div>`;
    };
    return item(fight.fighter1,fight.fighter1Flag,fight.odds.fighter1Odds)
          +item(fight.fighter2,fight.fighter2Flag,fight.odds.fighter2Odds);
  })();

  const judgeHtml = (()=>{
    if(!fight.judgeScores?.length) return '';
    const tot1=fight.judgeScores.reduce((a,j)=>a+j.score1,0);
    const tot2=fight.judgeScores.reduce((a,j)=>a+j.score2,0);
    return `<div class="dsec">
      <div class="dsec-title">Jüri Kartları</div>
      <div class="scorecard">
        <div class="sc-head">
          <span class="sc-hname">${esc(fight.fighter1)}</span>
          <span class="sc-hmid">JÜRİ</span>
          <span class="sc-hname r">${esc(fight.fighter2)}</span>
        </div>
        ${fight.judgeScores.map(j=>`
        <div class="sc-row">
          <span class="sc-score ${j.score1>j.score2?'w':''}">${j.score1}</span>
          <span class="sc-mid-label">${j.judge}. Jüri</span>
          <span class="sc-score ${j.score2>j.score1?'w':''}">${j.score2}</span>
        </div>`).join('')}
        <div class="sc-total-row">
          <span class="sc-total ${tot1>tot2?'w':''}">${tot1}</span>
          <span class="sc-total-label">TOPLAM</span>
          <span class="sc-total ${tot2>tot1?'w':''}">${tot2}</span>
        </div>
      </div>
    </div>`;
  })();

  const keyEventsHtml = (()=>{
    if(!fight.keyEvents?.length) return '';
    const counts={};
    fight.keyEvents.forEach(e=>counts[e]=(counts[e]||0)+1);
    return `<div class="key-events">${Object.entries(counts).map(([k,v])=>`<span class="ke-tag">${k}${v>1?' ×'+v:''}</span>`).join('')}</div>`;
  })();

  const roundsHtml = (()=>{
    if(!fight.rounds?.length) return '';
    return `<div class="dsec">
      <div class="dsec-title">Round Analizi</div>
      ${fight.rounds.map(r=>`
      <div class="rnd-row">
        <div class="rnd-num">R${r.round}</div>
        <div class="rnd-notes">${(r.notes||[]).map(n=>esc(n)).join('<br>')}</div>
      </div>`).join('')}
    </div>`;
  })();

  const tweetsHtml = (()=>{
    if(!fight.tweets?.length) return '';
    return `<div class="dsec">
      <div class="dsec-title">Viral Tweetler</div>
      <div class="tweets-grid">
        ${fight.tweets.map(t=>`
        <div class="tweet-card">
          <div class="tw-user">@${esc(t.user)}</div>
          <div class="tw-text">${esc(t.text)}</div>
          <div class="tw-likes">❤ ${(t.likes||0).toLocaleString('tr-TR')}</div>
        </div>`).join('')}
      </div>
    </div>`;
  })();

  const vk=`v${ei}_${fi}`;
  const voteHtml = !isPast ? `
  <div class="dsec">
    <div class="dsec-title">Tahminini Ver</div>
    <div class="detail-vote" data-vkey="${vk}" data-f1="${esc(fight.fighter1)}" data-f2="${esc(fight.fighter2)}">
      <div class="dv-btns">
        <button class="dv-btn" onclick="detailVote('${vk}','f1',event)">
          ${fight.fighter1Photo?`<img src="${fight.fighter1Photo}" class="dv-photo" onerror="this.style.display='none'">`:''}
          <span class="dv-name">${esc(fight.fighter1)}</span>
          <span class="dv-sub">Kazanır</span>
        </button>
        <div class="dv-sep">VS</div>
        <button class="dv-btn" onclick="detailVote('${vk}','f2',event)">
          ${fight.fighter2Photo?`<img src="${fight.fighter2Photo}" class="dv-photo" onerror="this.style.display='none'">`:''}
          <span class="dv-name">${esc(fight.fighter2)}</span>
          <span class="dv-sub">Kazanır</span>
        </button>
      </div>
      <div class="dv-result"></div>
    </div>
  </div>` : '';

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(fight.fighter1)} vs ${esc(fight.fighter2)} · UFC</title>
<style>
${BASE_STYLE}
.hero{position:relative;overflow:hidden;background:#050000;padding-bottom:0;}
.hero-bg{
  position:absolute;inset:0;
  background:
    radial-gradient(ellipse 100% 80% at 20% 50%,rgba(210,10,10,.12) 0%,transparent 55%),
    radial-gradient(ellipse 100% 80% at 80% 50%,rgba(210,10,10,.12) 0%,transparent 55%),
    linear-gradient(180deg,#0c0000 0%,#070707 100%);
}
.hero-inner{
  position:relative;z-index:1;max-width:1100px;margin:0 auto;
  display:grid;grid-template-columns:1fr auto 1fr;
  align-items:flex-end;min-height:460px;padding:0 32px;
}
.hf{display:flex;flex-direction:column;align-items:center;padding-bottom:0;position:relative;}
.hf-img-wrap{position:relative;width:100%;display:flex;justify-content:center;}
.hf-img{
  width:min(240px,38vw);aspect-ratio:3/4;
  object-fit:cover;object-position:top center;
  display:block;background:#0e0e0e;
  mask-image:linear-gradient(to bottom,black 60%,transparent 100%);
  -webkit-mask-image:linear-gradient(to bottom,black 60%,transparent 100%);
}
.hf.win .hf-img{filter:drop-shadow(0 -4px 40px rgba(210,10,10,.45));}
.hf-info{padding:20px 16px 32px;display:flex;flex-direction:column;align-items:center;gap:6px;width:100%;}
.hf-name{
  font-family:'Barlow Condensed',sans-serif;
  font-size:clamp(26px,4vw,48px);font-weight:900;text-transform:uppercase;
  letter-spacing:1.5px;text-align:center;line-height:1;
}
.hf.win .hf-name{color:var(--red);text-shadow:0 0 40px rgba(210,10,10,.35);}
.hf-meta{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text3);}
.hf-flag{width:26px;height:17px;object-fit:cover;border-radius:2px;border:1px solid rgba(255,255,255,.15);}
.hf-rec{font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:700;color:var(--text2);letter-spacing:1px;}
.hf-win-badge{
  font-family:'Barlow Condensed',sans-serif;
  font-size:13px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;
  color:#fff;background:var(--red);padding:5px 18px;border-radius:3px;
  box-shadow:0 0 24px rgba(210,10,10,.6);
}
.hm{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:56px;gap:10px;flex-shrink:0;width:80px;}
.hm-vs{font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:900;color:#1e1e1e;letter-spacing:5px;}
.hm-wt{font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--red);text-align:center;line-height:1.3;}
.hm-rnd{font-size:10px;color:#252525;letter-spacing:1px;}
.result-bar{
  display:flex;align-items:stretch;justify-content:center;
  background:#0a0000;
  border-top:1px solid rgba(210,10,10,.25);border-bottom:1px solid rgba(210,10,10,.15);
}
.rb-cell{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 40px;gap:4px;flex:1;max-width:200px;}
.rb-cell+.rb-cell{border-left:1px solid rgba(255,255,255,.05);}
.rb-lbl{font-size:9px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:var(--text3);}
.rb-val{font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:900;line-height:1;}
.rb-val.red{color:var(--red);}
.info-bar{
  background:var(--bg2);border-bottom:1px solid var(--border);
  padding:13px 40px;display:flex;align-items:center;gap:28px;flex-wrap:wrap;
}
.ib{display:flex;flex-direction:column;gap:2px;}
.ib-l{font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:2px;}
.ib-v{font-size:13px;font-weight:600;color:var(--text2);}
.ib-sep{width:1px;height:30px;background:var(--border);}
.dbody{max-width:960px;margin:0 auto;padding:44px 40px 100px;}
.compare-table{display:grid;grid-template-columns:1fr auto 1fr;background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden;margin-bottom:40px;}
.ct-header{grid-column:1/-1;display:grid;grid-template-columns:1fr auto 1fr;background:rgba(255,255,255,.03);border-bottom:1px solid var(--border);padding:12px 24px;}
.ct-hname{font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:var(--text2);}
.ct-hname.right{text-align:right;}
.ct-hmid{font-size:9px;color:var(--text3);text-align:center;letter-spacing:2px;text-transform:uppercase;}
.ct-row{grid-column:1/-1;display:grid;grid-template-columns:1fr auto 1fr;padding:11px 24px;border-bottom:1px solid rgba(255,255,255,.04);align-items:center;}
.ct-row:last-child{border-bottom:none;}
.ct-val{font-size:15px;font-weight:700;color:var(--text);}
.ct-val.right{text-align:right;}
.ct-val.win{color:var(--red);}
.ct-label{font-size:10px;color:var(--text3);text-align:center;text-transform:uppercase;letter-spacing:1.5px;}
.key-events{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:36px;}
.ke-tag{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:6px 14px;font-size:12px;color:var(--text2);font-weight:600;}
.dsec{margin-bottom:44px;}
.dsec-title{font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:var(--text3);padding-bottom:12px;margin-bottom:18px;border-bottom:2px solid rgba(255,255,255,.06);}
.odds-row{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-radius:12px;margin-bottom:8px;background:var(--card);border:1px solid var(--border);}
.or-fighter{display:flex;align-items:center;gap:12px;}
.or-flag{width:30px;height:20px;object-fit:cover;border-radius:3px;border:1px solid rgba(255,255,255,.12);}
.or-name{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:800;text-transform:uppercase;}
.or-label{font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;padding:2px 8px;border-radius:3px;}
.or-label.fav{color:#22c55e;background:rgba(34,197,94,.1);}
.or-label.dog{color:#f59e0b;background:rgba(245,158,11,.1);}
.or-val{font-family:'Barlow Condensed',sans-serif;font-size:36px;font-weight:900;}
.or-val.fav{color:#22c55e;}.or-val.dog{color:#f59e0b;}
.no-data{font-size:14px;color:var(--text3);font-style:italic;}
.scorecard{border-radius:14px;overflow:hidden;border:1px solid var(--border);}
.sc-head{display:grid;grid-template-columns:1fr 120px 1fr;background:rgba(255,255,255,.04);border-bottom:1px solid var(--border);padding:12px 28px;}
.sc-hname{font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:var(--text2);}
.sc-hname.r{text-align:right;}
.sc-hmid{font-size:9px;color:var(--text3);text-align:center;letter-spacing:2px;text-transform:uppercase;}
.sc-row{display:grid;grid-template-columns:1fr 120px 1fr;align-items:center;padding:16px 28px;border-bottom:1px solid rgba(255,255,255,.04);background:var(--card);}
.sc-score{font-family:'Barlow Condensed',sans-serif;font-size:36px;font-weight:900;color:#2a2a2a;}
.sc-score.w{color:#fff;}
.sc-mid-label{font-size:10px;color:var(--text3);text-align:center;letter-spacing:1.5px;}
.sc-total-row{display:grid;grid-template-columns:1fr 120px 1fr;align-items:center;padding:18px 28px;background:rgba(255,255,255,.03);}
.sc-total{font-family:'Barlow Condensed',sans-serif;font-size:44px;font-weight:900;color:#222;}
.sc-total.w{color:var(--red);}
.sc-total-label{font-size:9px;color:var(--text3);text-align:center;letter-spacing:2px;text-transform:uppercase;}
.yt-thumb-link{display:block;text-decoration:none;}
.yt-wrap{position:relative;width:100%;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#000;border:1px solid var(--border);cursor:pointer;transition:transform .2s,box-shadow .2s;}
.yt-thumb-link:hover .yt-wrap{transform:scale(1.01);box-shadow:0 8px 40px rgba(255,0,0,.3);}
.yt-thumb-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.yt-play-btn{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transition:transform .2s;}
.yt-thumb-link:hover .yt-play-btn{transform:scale(1.12);}
.yt-overlay-label{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.75);color:#fff;font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:600;letter-spacing:.5px;padding:5px 14px;border-radius:20px;white-space:nowrap;}
.rnd-row{display:flex;gap:20px;padding:16px 22px;background:var(--card);border:1px solid var(--border);border-radius:10px;margin-bottom:8px;}
.rnd-num{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:900;color:var(--red);letter-spacing:1px;flex-shrink:0;min-width:36px;}
.rnd-notes{font-size:14px;color:var(--text2);line-height:1.7;}
.tweets-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;}
.tweet-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;transition:border-color .2s;}
.tweet-card:hover{border-color:rgba(29,155,240,.3);}
.tw-user{font-size:13px;font-weight:800;color:#1d9bf0;margin-bottom:8px;}
.tw-text{font-size:14px;color:var(--text2);line-height:1.6;margin-bottom:10px;}
.tw-likes{font-size:12px;color:var(--text3);}
/* Vote (detail page) */
.detail-vote{background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden;}
.dv-btns{display:grid;grid-template-columns:1fr auto 1fr;}
.dv-btn{
  display:flex;flex-direction:column;align-items:center;gap:10px;
  background:none;border:none;cursor:pointer;color:var(--text);
  padding:28px 20px;transition:background .2s;
}
.dv-btn:hover{background:rgba(210,10,10,.08);}
.dv-btn.voted{background:rgba(210,10,10,.15);}
.dv-photo{width:100px;height:130px;object-fit:cover;object-position:top center;border-radius:8px;border:2px solid var(--border2);}
.dv-btn.voted .dv-photo{border-color:var(--red);box-shadow:0 0 20px rgba(210,10,10,.4);}
.dv-name{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:900;text-transform:uppercase;letter-spacing:.5px;}
.dv-btn.voted .dv-name{color:var(--red);}
.dv-sub{font-size:11px;color:var(--text3);letter-spacing:1px;text-transform:uppercase;}
.dv-sep{display:flex;align-items:center;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:900;color:#1e1e1e;letter-spacing:4px;}
.dv-result{padding:16px 24px;border-top:1px solid var(--border);display:none;}
.dvr-row{display:flex;align-items:center;gap:12px;margin-bottom:6px;}
.dvr-name{font-size:12px;font-weight:700;color:var(--text2);width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:0;}
.dvr-track{flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden;}
.dvr-fill{height:100%;background:var(--red);border-radius:3px;transition:width .7s cubic-bezier(.22,1,.36,1);}
.dvr-pct{font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:800;color:var(--text3);width:36px;text-align:right;flex-shrink:0;}
/* Countdown (detail) */
.detail-countdown{
  display:flex;align-items:center;justify-content:center;gap:40px;
  background:rgba(210,10,10,.06);border-top:1px solid rgba(210,10,10,.15);
  padding:20px;
}
.dc-unit{display:flex;flex-direction:column;align-items:center;gap:4px;}
.dc-val{font-family:'Barlow Condensed',sans-serif;font-size:42px;font-weight:900;color:var(--red);line-height:1;}
.dc-label{font-size:9px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--text3);}
@media(max-width:680px){
  /* Hero: stack fighters vertically */
  .hero-inner{
    display:flex;flex-direction:column;
    min-height:unset;padding:0;
    align-items:stretch;
  }
  .hf{flex-direction:row;align-items:center;padding:16px 16px 0;}
  .hf-img-wrap{width:auto;flex-shrink:0;}
  .hf-img{width:90px;aspect-ratio:unset;height:116px;}
  .hf-info{padding:0 0 0 14px;align-items:flex-start;gap:4px;}
  .hf-name{font-size:clamp(18px,6vw,28px)!important;text-align:left;}
  .hf-meta{font-size:11px;}
  .hf-rec{font-size:15px;}
  .hf-win-badge{font-size:11px;padding:4px 12px;}
  /* Second fighter below */
  .hf:last-of-type{flex-direction:row;border-top:1px solid rgba(255,255,255,.06);padding-top:16px;padding-bottom:16px;}
  .hm{
    flex-direction:row;justify-content:center;
    padding:10px 16px;width:auto;
    border-top:1px solid rgba(210,10,10,.15);
    border-bottom:1px solid rgba(210,10,10,.15);
    background:rgba(210,10,10,.04);
  }
  .hm-vs{font-size:13px;letter-spacing:3px;}
  .hm-wt{font-size:9px;}
  .hm-rnd{font-size:9px;}

  /* Result / info bars */
  .result-bar{overflow-x:auto;-webkit-overflow-scrolling:touch;}
  .rb-cell{padding:12px 16px;min-width:70px;}
  .rb-val{font-size:20px;}
  .rb-lbl{font-size:8px;}
  .info-bar{overflow-x:auto;flex-wrap:nowrap;padding:10px 14px;gap:14px;-webkit-overflow-scrolling:touch;}
  .ib-v{font-size:11px;white-space:nowrap;}
  .ib-l{font-size:8px;}

  /* Body */
  .dbody{padding:20px 14px 60px;}
  .ct-header,.ct-row{padding:10px 12px;}
  .ct-val{font-size:13px;}
  .ct-label{font-size:9px;padding:0 6px;}
  .sc-head,.sc-row,.sc-total-row{grid-template-columns:1fr 80px 1fr;padding:10px 12px;}
  .sc-score{font-size:24px;}
  .sc-total{font-size:28px;}
  .sc-mid-label{font-size:9px;}
  .odds-row{padding:12px 12px;}
  .or-name{font-size:15px;}
  .or-val{font-size:24px;}
  .dv-btn{padding:16px 10px;gap:6px;}
  .dv-photo{width:64px;height:82px;}
  .dv-name{font-size:15px;}
  .detail-countdown{gap:16px;padding:14px;}
  .dc-val{font-size:28px;}
}
</style>
</head>
<body>
<nav>
  <a class="nav-back" href="index.html" data-nav="index.html">← Tüm Maçlar</a>
  <div class="nav-divider"></div>
  <a class="nav-logo-wrap" href="index.html" data-nav="index.html">
    <img class="nav-logo-img" src="${UFC_LOGO}" alt="UFC">
  </a>
  <span class="nav-event-name">${esc(eventName)}</span>
  <div class="nav-right">
    <a class="nav-link" href="compare.html" data-nav="compare.html">⚔ Karşılaştır</a>
    <button class="theme-toggle" id="theme-toggle" title="Tema">☀️</button>
  </div>
</nav>

<div class="hero">
  <div class="hero-bg"></div>
  <div class="hero-inner">
    <div class="hf ${isWin1?'win':''}">
      <div class="hf-img-wrap">
        ${fight.fighter1Photo?`<img class="hf-img" src="${fight.fighter1Photo}" alt="${esc(fight.fighter1)}" onerror="this.style.visibility='hidden'">`:`<div class="hf-img"></div>`}
      </div>
      <div class="hf-info">
        <div class="hf-name">${esc(fight.fighter1||'?')}</div>
        <div class="hf-meta">
          ${fight.fighter1Flag?`<img class="hf-flag" src="${fight.fighter1Flag}" alt="">`:''}
          <span>${esc(fight.fighter1Country||'')}</span>
        </div>
        <div class="hf-rec">${fight.fighter1Record||''}</div>
        ${isWin1?'<div class="hf-win-badge">● KAZANAN</div>':''}
      </div>
    </div>
    <div class="hm">
      <div class="hm-vs">VS</div>
      <div class="hm-wt">${esc(fight.weightClass||'')}</div>
      <div class="hm-rnd">${fight.scheduledRounds||3} Round</div>
    </div>
    <div class="hf ${isWin2?'win':''}">
      <div class="hf-img-wrap">
        ${fight.fighter2Photo?`<img class="hf-img" src="${fight.fighter2Photo}" alt="${esc(fight.fighter2)}" onerror="this.style.visibility='hidden'">`:`<div class="hf-img"></div>`}
      </div>
      <div class="hf-info">
        <div class="hf-name">${esc(fight.fighter2||'?')}</div>
        <div class="hf-meta">
          ${fight.fighter2Flag?`<img class="hf-flag" src="${fight.fighter2Flag}" alt="">`:''}
          <span>${esc(fight.fighter2Country||'')}</span>
        </div>
        <div class="hf-rec">${fight.fighter2Record||''}</div>
        ${isWin2?'<div class="hf-win-badge">● KAZANAN</div>':''}
      </div>
    </div>
  </div>
</div>

${!isPast&&eventDate?`
<div class="detail-countdown" id="dc-wrap">
  <div class="dc-unit"><div class="dc-val" id="dc-d">--</div><div class="dc-label">Gün</div></div>
  <div class="dc-unit"><div class="dc-val" id="dc-h">--</div><div class="dc-label">Saat</div></div>
  <div class="dc-unit"><div class="dc-val" id="dc-m">--</div><div class="dc-label">Dakika</div></div>
  <div class="dc-unit"><div class="dc-val" id="dc-s">--</div><div class="dc-label">Saniye</div></div>
</div>
<script>
(function(){
  function tick(){
    const t=new Date('${eventDate}')-Date.now();
    if(t<=0){document.getElementById('dc-wrap').style.display='none';return;}
    document.getElementById('dc-d').textContent=Math.floor(t/86400000);
    document.getElementById('dc-h').textContent=String(Math.floor((t%86400000)/3600000)).padStart(2,'0');
    document.getElementById('dc-m').textContent=String(Math.floor((t%3600000)/60000)).padStart(2,'0');
    document.getElementById('dc-s').textContent=String(Math.floor((t%60000)/1000)).padStart(2,'0');
  }
  tick();setInterval(tick,1000);
})();
</script>
`:''}

${isPast&&fight.method?`
<div class="result-bar">
  <div class="rb-cell"><div class="rb-lbl">Sonuç</div><div class="rb-val red">${esc(fight.method)}</div></div>
  ${fight.round?`<div class="rb-cell"><div class="rb-lbl">Round</div><div class="rb-val">R${fight.round}</div></div>`:''}
  ${fight.time?`<div class="rb-cell"><div class="rb-lbl">Süre</div><div class="rb-val">${fight.time}</div></div>`:''}
  ${fight.winner?`<div class="rb-cell"><div class="rb-lbl">Kazanan</div><div class="rb-val red">${esc(fight.winner.split(' ').pop())}</div></div>`:''}
</div>`:''}

<div class="info-bar">
  <div class="ib"><div class="ib-l">Etkinlik</div><div class="ib-v">${esc(eventName)}</div></div>
  ${dateStr?`<div class="ib-sep"></div><div class="ib"><div class="ib-l">Tarih</div><div class="ib-v">${dateStr}</div></div>`:''}
  ${eventVenue?`<div class="ib-sep"></div><div class="ib"><div class="ib-l">Arena</div><div class="ib-v">${esc(eventVenue)}</div></div>`:''}
  ${eventCity?`<div class="ib-sep"></div><div class="ib"><div class="ib-l">Şehir</div><div class="ib-v">${esc(eventCity)}</div></div>`:''}
  <div class="ib-sep"></div>
  <div class="ib"><div class="ib-l">Siklet</div><div class="ib-v">${esc(fight.weightClass||'-')}</div></div>
  <div class="ib-sep"></div>
  <div class="ib"><div class="ib-l">Format</div><div class="ib-v">${fight.scheduledRounds||3} Round</div></div>
</div>

<div class="dbody">
  <div class="compare-table">
    <div class="ct-header">
      <div class="ct-hname">${esc(fight.fighter1)}</div>
      <div class="ct-hmid">KARŞILAŞTIRMA</div>
      <div class="ct-hname right">${esc(fight.fighter2)}</div>
    </div>
    <div class="ct-row">
      <div class="ct-val">${esc(fight.fighter1Country||'—')}</div>
      <div class="ct-label">Ülke</div>
      <div class="ct-val right">${esc(fight.fighter2Country||'—')}</div>
    </div>
    <div class="ct-row">
      <div class="ct-val">${fight.fighter1Record||'—'}</div>
      <div class="ct-label">Rekoru</div>
      <div class="ct-val right">${fight.fighter2Record||'—'}</div>
    </div>
    ${isPast&&fight.winner?`<div class="ct-row">
      <div class="ct-val ${isWin1?'win':''}">${isWin1?'✓ KAZANDI':'✗'}</div>
      <div class="ct-label">Sonuç</div>
      <div class="ct-val right ${isWin2?'win':''}">${isWin2?'✓ KAZANDI':'✗'}</div>
    </div>`:''}
  </div>
  ${keyEventsHtml}
  ${voteHtml}
  ${videoHtml}
  <div class="dsec">
    <div class="dsec-title">Bahis Oranları</div>
    ${oddsHtml}
  </div>
  ${judgeHtml}
  ${roundsHtml}
  ${tweetsHtml}
</div>
<footer>ESPN · bestfightodds.com · nitter</footer>
<script>${TRANSITION_JS}</script>
<script>
function detailVote(key,fighter,e){
  e.stopPropagation();e.preventDefault();
  const votes=JSON.parse(localStorage.getItem('ufc_votes')||'{}');
  if(votes[key])return;
  votes[key]=fighter;
  localStorage.setItem('ufc_votes',JSON.stringify(votes));
  renderDetailVote(key);
}
function renderDetailVote(key){
  const wrap=document.querySelector('.detail-vote[data-vkey="'+key+'"]');
  if(!wrap)return;
  const votes=JSON.parse(localStorage.getItem('ufc_votes')||'{}');
  const my=votes[key];if(!my)return;
  const btns=wrap.querySelectorAll('.dv-btn');
  btns.forEach((b,i)=>{if((i===0&&my==='f1')||(i===1&&my==='f2'))b.classList.add('voted');});
  const f1p=my==='f1'?65:35,f2p=100-f1p;
  const n1=wrap.dataset.f1,n2=wrap.dataset.f2;
  const res=wrap.querySelector('.dv-result');
  res.style.display='block';
  res.innerHTML=
    '<div class="dvr-row"><span class="dvr-name">'+n1.split(' ').pop()+'</span><div class="dvr-track"><div class="dvr-fill" style="width:'+f1p+'%"></div></div><span class="dvr-pct">'+f1p+'%</span></div>'+
    '<div class="dvr-row"><span class="dvr-name">'+n2.split(' ').pop()+'</span><div class="dvr-track"><div class="dvr-fill" style="width:'+f2p+'%"></div></div><span class="dvr-pct">'+f2p+'%</span></div>';
}
renderDetailVote('${vk}');
</script>
</body>
</html>`;
}

// ── COMPARE PAGE ──────────────────────────────────────────────────────────────
function generateComparePage(data) {
  const fighterMap = {};
  data.events.forEach((event,ei)=>{
    event.fights.forEach((fight,fi)=>{
      const add = (name,photo,flag,country,record,wc,opponent,isWinner,completed)=>{
        if(!name||name==='?'||name.startsWith('TBA')||name.startsWith('Opponent')) return;
        if(!fighterMap[name]) fighterMap[name]={name,photo,flag,country,record,weightClass:wc,fights:[]};
        if(photo) fighterMap[name].photo=photo;
        if(flag)  fighterMap[name].flag=flag;
        if(country) fighterMap[name].country=country;
        if(record)  fighterMap[name].record=record;
        fighterMap[name].fights.push({
          opponent,
          result:!completed?'upcoming':(isWinner?'W':'L'),
          method:fight.method||'',
          round:fight.round,
          event:event.name,
          date:event.date,
          url:`fight-${ei}-${fi}.html`
        });
      };
      add(fight.fighter1,fight.fighter1Photo,fight.fighter1Flag,fight.fighter1Country,fight.fighter1Record,fight.weightClass,fight.fighter2,fight.winner===fight.fighter1,fight.completed);
      add(fight.fighter2,fight.fighter2Photo,fight.fighter2Flag,fight.fighter2Country,fight.fighter2Record,fight.weightClass,fight.fighter1,fight.winner===fight.fighter2,fight.completed);
    });
  });

  const fighters = Object.values(fighterMap).sort((a,b)=>a.name.localeCompare(b.name));
  const fightersJson = JSON.stringify(fighters);

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Dövüşçü Karşılaştırma · UFC</title>
<style>
${BASE_STYLE}
.cmp-hero{
  background:linear-gradient(180deg,#0c0000 0%,var(--bg) 100%);
  padding:50px 40px 0;text-align:center;
  border-bottom:1px solid var(--border);
}
.cmp-title{font-family:'Barlow Condensed',sans-serif;font-size:clamp(28px,5vw,56px);font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;}
.cmp-sub{font-size:13px;color:var(--text3);margin-bottom:40px;}

.sel-wrap{
  display:grid;grid-template-columns:1fr auto 1fr;
  gap:0;max-width:1100px;margin:0 auto;
  background:var(--bg2);border-radius:16px 16px 0 0;
  border:1px solid var(--border);border-bottom:none;overflow:hidden;
}
.sel-panel{padding:24px;}
.sel-panel+.sel-panel{border-left:1px solid var(--border);}
.sel-vs{display:flex;align-items:center;justify-content:center;padding:24px 8px;background:rgba(210,10,10,.04);}
.sel-vs-txt{font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:900;color:#1e1e1e;letter-spacing:4px;}
.sel-label{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--text3);margin-bottom:10px;}
.sel-search{
  width:100%;background:var(--card);border:1px solid var(--border2);
  border-radius:8px;color:var(--text);font-size:14px;
  padding:10px 14px;outline:none;transition:border-color .2s;margin-bottom:10px;
}
.sel-search:focus{border-color:var(--red);}
.sel-list{
  height:260px;overflow-y:auto;
  background:var(--card);border:1px solid var(--border);border-radius:8px;
}
.sel-list::-webkit-scrollbar{width:4px;}
.sel-list::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px;}
.sel-item{
  display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;
  border-bottom:1px solid rgba(255,255,255,.04);transition:background .15s;
}
.sel-item:hover{background:rgba(210,10,10,.08);}
.sel-item.selected{background:rgba(210,10,10,.15);border-left:3px solid var(--red);}
.sel-item-photo{width:36px;height:46px;object-fit:cover;object-position:top;border-radius:4px;background:#0e0e0e;flex-shrink:0;}
.sel-item-flag{width:20px;height:13px;object-fit:cover;border-radius:2px;flex-shrink:0;}
.sel-item-name{font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:800;text-transform:uppercase;letter-spacing:.3px;flex:1;}
.sel-item-rec{font-size:10px;color:var(--text3);}

.cmp-result{
  max-width:1100px;margin:0 auto;
  background:var(--bg2);border:1px solid var(--border);
  border-radius:0 0 16px 16px;border-top:2px solid var(--red);
  overflow:hidden;
}
.cmp-fighter-header{
  display:grid;grid-template-columns:1fr auto 1fr;
  background:linear-gradient(180deg,#0c0000,var(--bg2));
}
.cmp-fh{display:flex;flex-direction:column;align-items:center;padding:30px 20px;}
.cmp-fh-photo{width:min(160px,20vw);aspect-ratio:3/4;object-fit:cover;object-position:top;border-radius:10px;border:2px solid var(--border2);margin-bottom:14px;}
.cmp-fh-name{font-family:'Barlow Condensed',sans-serif;font-size:clamp(18px,2.5vw,28px);font-weight:900;text-transform:uppercase;letter-spacing:.5px;text-align:center;margin-bottom:6px;}
.cmp-fh-meta{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text3);}
.cmp-fh-flag{width:20px;height:13px;object-fit:cover;border-radius:2px;}
.cmp-fh-rec{font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:700;color:var(--text2);margin-top:6px;}
.cmp-vs-col{display:flex;align-items:center;justify-content:center;padding:20px 12px;font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:900;color:#1e1e1e;letter-spacing:4px;}

.cmp-rows{}
.cmp-row{display:grid;grid-template-columns:1fr auto 1fr;border-top:1px solid var(--border);align-items:center;}
.cmp-row:last-child{border-bottom:none;}
.cmp-val{font-size:15px;font-weight:700;color:var(--text);padding:13px 24px;}
.cmp-val.right{text-align:right;}
.cmp-val.better{color:var(--red);font-size:16px;}
.cmp-stat-label{font-size:9px;color:var(--text3);text-align:center;letter-spacing:2px;text-transform:uppercase;padding:0 8px;white-space:nowrap;}

.cmp-fights-grid{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--border);}
.cmp-fights-col{padding:20px 24px;}
.cmp-fights-col+.cmp-fights-col{border-left:1px solid var(--border);}
.cmp-fights-title{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:var(--text3);margin-bottom:12px;}
.cmp-fight-row{
  display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;
  background:var(--card);border:1px solid var(--border);margin-bottom:6px;cursor:pointer;
  text-decoration:none;color:inherit;transition:border-color .15s;
}
.cmp-fight-row:hover{border-color:rgba(210,10,10,.3);}
.cfr-result{
  font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:900;
  width:22px;text-align:center;flex-shrink:0;
}
.cfr-result.W{color:#22c55e;}.cfr-result.L{color:var(--red);}.cfr-result.upcoming{color:var(--gold);}
.cfr-info{flex:1;min-width:0;}
.cfr-opp{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.cfr-det{font-size:10px;color:var(--text3);}

.cmp-placeholder{text-align:center;padding:60px 20px;color:var(--text3);font-size:14px;font-style:italic;}
@media(max-width:680px){
  .cmp-hero{padding:20px 12px 0;}
  .cmp-sub{margin-bottom:20px;font-size:12px;}
  /* Stack selectors vertically */
  .sel-wrap{grid-template-columns:1fr;border-radius:12px 12px 0 0;}
  .sel-panel+.sel-panel{border-left:none;border-top:1px solid var(--border);}
  .sel-vs{padding:10px 8px;background:rgba(210,10,10,.06);}
  .sel-vs-txt{font-size:14px;}
  .sel-list{height:180px;}
  /* Fighter header */
  .cmp-fh-photo{width:min(70px,18vw);}
  .cmp-fh{padding:12px 8px;}
  .cmp-fh-name{font-size:clamp(13px,3.5vw,20px)!important;}
  .cmp-vs-col{font-size:13px;}
  /* Stats rows */
  .cmp-val{padding:9px 10px;font-size:12px;}
  .cmp-stat-label{font-size:8px;padding:0 4px;}
  /* Fight history: stack vertically */
  .cmp-fights-grid{grid-template-columns:1fr;}
  .cmp-fights-col+.cmp-fights-col{border-left:none;border-top:1px solid var(--border);}
  .cmp-outer{padding:0 12px 60px!important;}
}
</style>
</head>
<body>
<nav>
  <a class="nav-back" href="index.html" data-nav="index.html">← Tüm Maçlar</a>
  <div class="nav-divider"></div>
  <a class="nav-logo-wrap" href="index.html" data-nav="index.html">
    <img class="nav-logo-img" src="${UFC_LOGO}" alt="UFC">
  </a>
  <span class="nav-event-name">Dövüşçü Karşılaştırma</span>
  <div class="nav-right">
    <button class="theme-toggle" id="theme-toggle" title="Tema">☀️</button>
  </div>
</nav>

<div class="cmp-hero">
  <div class="cmp-title">Dövüşçü Karşılaştırma</div>
  <div class="cmp-sub">İki dövüşçü seç ve istatistiklerini karşılaştır</div>

  <div class="sel-wrap">
    <div class="sel-panel">
      <div class="sel-label">Dövüşçü 1</div>
      <input class="sel-search" id="s1-input" type="text" placeholder="İsim ara...">
      <div class="sel-list" id="s1-list"></div>
    </div>
    <div class="sel-vs"><div class="sel-vs-txt">VS</div></div>
    <div class="sel-panel">
      <div class="sel-label">Dövüşçü 2</div>
      <input class="sel-search" id="s2-input" type="text" placeholder="İsim ara...">
      <div class="sel-list" id="s2-list"></div>
    </div>
  </div>
</div>

<div class="cmp-outer" style="max-width:1100px;margin:0 auto;padding:0 40px 100px;">
  <div class="cmp-result" id="cmp-result">
    <div class="cmp-placeholder" id="cmp-ph">İki dövüşçü seçerek karşılaştırmayı başlat</div>
    <div id="cmp-content" style="display:none"></div>
  </div>
</div>

<footer>UFC Maç Merkezi</footer>
<script>${TRANSITION_JS}</script>
<script>
const FIGHTERS = ${fightersJson};
let sel=[null,null];

function renderList(listEl,query,side){
  const q=query.toLowerCase().trim();
  const filtered=FIGHTERS.filter(f=>!q||f.name.toLowerCase().includes(q)).slice(0,40);
  listEl.innerHTML=filtered.map(f=>{
    const isSel=sel[side]&&sel[side].name===f.name;
    return '<div class="sel-item'+(isSel?' selected':'')+'" onclick="selectFighter('+side+',\''+f.name.replace(/'/g,"\\'")+'\')">'
      +(f.photo?'<img class="sel-item-photo" src="'+f.photo+'" onerror="this.style.display=\'none\'">':'')
      +(f.flag?'<img class="sel-item-flag" src="'+f.flag+'" onerror="this.style.display=\'none\'">':'')
      +'<div><div class="sel-item-name">'+f.name+'</div>'
      +(f.record?'<div class="sel-item-rec">'+f.record+'</div>':'')
      +'</div></div>';
  }).join('');
}

function selectFighter(side, name){
  sel[side]=FIGHTERS.find(f=>f.name===name)||null;
  renderList(document.getElementById('s'+(side+1)+'-list'),document.getElementById('s'+(side+1)+'-input').value,side);
  renderComparison();
}

function renderComparison(){
  const ph=document.getElementById('cmp-ph');
  const ct=document.getElementById('cmp-content');
  if(!sel[0]||!sel[1]){ph.style.display='block';ct.style.display='none';return;}
  ph.style.display='none';ct.style.display='block';
  const a=sel[0],b=sel[1];
  const aW=a.fights.filter(f=>f.result==='W').length;
  const aL=a.fights.filter(f=>f.result==='L').length;
  const bW=b.fights.filter(f=>f.result==='W').length;
  const bL=b.fights.filter(f=>f.result==='L').length;
  const aWinR=aW+aL>0?Math.round(aW/(aW+aL)*100):0;
  const bWinR=bW+bL>0?Math.round(bW/(bW+bL)*100):0;

  function fightRows(f){
    return f.fights.slice(-4).reverse().map(fight=>{
      const rc=fight.result==='W'?'W':fight.result==='L'?'L':'upcoming';
      const det=fight.result==='upcoming'?'Yaklaşan':((fight.method||'')+(fight.round?' R'+fight.round:''));
      return '<a class="cmp-fight-row" href="'+fight.url+'" data-nav="'+fight.url+'">'
        +'<span class="cfr-result '+rc+'">'+(fight.result==='upcoming'?'?':fight.result)+'</span>'
        +'<div class="cfr-info"><div class="cfr-opp">vs '+fight.opponent+'</div>'
        +(det?'<div class="cfr-det">'+det+'</div>':'')+'</div></a>';
    }).join('');
  }

  ct.innerHTML=
    '<div class="cmp-fighter-header">'
    +'<div class="cmp-fh">'
    +(a.photo?'<img class="cmp-fh-photo" src="'+a.photo+'" onerror="this.style.display=\'none\'">':'')
    +'<div class="cmp-fh-name">'+a.name+'</div>'
    +'<div class="cmp-fh-meta">'+(a.flag?'<img class="cmp-fh-flag" src="'+a.flag+'">':'')+'<span>'+a.country+'</span></div>'
    +'<div class="cmp-fh-rec">'+a.record+'</div>'
    +'</div>'
    +'<div class="cmp-vs-col">VS</div>'
    +'<div class="cmp-fh">'
    +(b.photo?'<img class="cmp-fh-photo" src="'+b.photo+'" onerror="this.style.display=\'none\'">':'')
    +'<div class="cmp-fh-name">'+b.name+'</div>'
    +'<div class="cmp-fh-meta">'+(b.flag?'<img class="cmp-fh-flag" src="'+b.flag+'">':'')+'<span>'+b.country+'</span></div>'
    +'<div class="cmp-fh-rec">'+b.record+'</div>'
    +'</div>'
    +'</div>'

    +'<div class="cmp-rows">'
    +'<div class="cmp-row"><div class="cmp-val'+(aW>bW?' better':'')+'">'+aW+'</div><div class="cmp-stat-label">Galibiyet</div><div class="cmp-val right'+(bW>aW?' better':'')+'">'+bW+'</div></div>'
    +'<div class="cmp-row"><div class="cmp-val'+(aL<bL?' better':'')+'">'+aL+'</div><div class="cmp-stat-label">Mağlubiyet</div><div class="cmp-val right'+(bL<aL?' better':'')+'">'+bL+'</div></div>'
    +'<div class="cmp-row"><div class="cmp-val'+(aWinR>bWinR?' better':'')+'">%'+aWinR+'</div><div class="cmp-stat-label">Galibiyet Oranı</div><div class="cmp-val right'+(bWinR>aWinR?' better':'')+'">%'+bWinR+'</div></div>'
    +'<div class="cmp-row"><div class="cmp-val">'+a.weightClass+'</div><div class="cmp-stat-label">Siklet</div><div class="cmp-val right">'+b.weightClass+'</div></div>'
    +'<div class="cmp-row"><div class="cmp-val">'+a.country+'</div><div class="cmp-stat-label">Ülke</div><div class="cmp-val right">'+b.country+'</div></div>'
    +'</div>'

    +'<div class="cmp-fights-grid">'
    +'<div class="cmp-fights-col"><div class="cmp-fights-title">'+a.name.split(' ').pop()+'\'ın Son Maçları</div>'+fightRows(a)+'</div>'
    +'<div class="cmp-fights-col"><div class="cmp-fights-title">'+b.name.split(' ').pop()+'\'ın Son Maçları</div>'+fightRows(b)+'</div>'
    +'</div>';

  // Re-attach nav listeners for new links
  ct.querySelectorAll('[data-nav]').forEach(el=>{
    el.addEventListener('click',e=>{e.preventDefault();navigate(el.dataset.nav);});
  });
}

['s1','s2'].forEach((pfx,i)=>{
  const inp=document.getElementById(pfx+'-input');
  const list=document.getElementById(pfx+'-list');
  renderList(list,'',i);
  inp.addEventListener('input',()=>renderList(list,inp.value,i));
});
</script>
</body>
</html>`;
}

function esc(s){
  if(!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
const data = JSON.parse(fs.readFileSync('ufc_data.json','utf8'));
fs.writeFileSync('index.html', generateIndex(data));
data.events.forEach((event,ei)=>{
  event.fights.forEach((fight,fi)=>{
    fs.writeFileSync(`fight-${ei}-${fi}.html`,
      generateFightPage(fight,ei,fi,event.name,event.status,event.date,event.venue,event.city));
  });
});
fs.writeFileSync('compare.html', generateComparePage(data));
console.log('✅ Sayfalar oluşturuldu.');
