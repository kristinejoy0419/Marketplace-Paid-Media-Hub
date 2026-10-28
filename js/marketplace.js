/* ==================== MARKETPLACE ADDITIONS ====================
   Loaded after js/hub.js. Adds what a two-sided marketplace needs on top of the Paid Media Hub:
   the JD-based budget split (section 2), a two-sided Growth Plan, Channel Incrementality,
   Retargeting & Win-back, International, Budget Governance, Operating Rhythm and Measurement tabs, summary tiles and PDF export.
   The response curves and unit economics come from js/model.js (window.HubModel). */
(function(){
'use strict';
const M=window.HubModel,D=M.DEFAULTS;
const SPLIT_DEF={brand:0.2,winback:0.1};
const SIDE_NAME={retailer:'Retailers',brand:'Brands',winback:'Win-back'};
const mp=()=>S.mp=S.mp||{};
const n0=v=>isFinite(v)?Math.round(v).toLocaleString('en-US'):'—';
const usd=v=>isFinite(v)&&v>0?money(v):'—';
const x1=v=>isFinite(v)?(+v.toFixed(1))+'×':'—';
const mo=v=>isFinite(v)&&v>0?Math.round(v)+' mo':'—';

// Response curve per channel and side: platform CAC at a reference spend, how fast CAC climbs, and the incrementality reads.
// Planning assumptions for a wholesale marketplace; edit them on the Channel Incrementality tab.
const CURVE={
 'google|retailer':{baseCAC:140,refSpend:8.5e6,elasticity:0.45,mmm:0.62,lift:0.6,liftSrc:'Geo holdout (non-brand + PMax)'},
 'meta|retailer':{baseCAC:175,refSpend:8.5e6,elasticity:0.35,mmm:0.6,lift:0.65,liftSrc:'Conversion Lift study'},
 'tiktok|retailer':{baseCAC:200,refSpend:3e6,elasticity:0.5,mmm:0.6,lift:null},
 'pinterest|retailer':{baseCAC:190,refSpend:3e6,elasticity:0.5,mmm:0.55,lift:null},
 'youtube|retailer':{baseCAC:300,refSpend:3e6,elasticity:0.3,mmm:0.8,lift:null},
 'ctv|retailer':{baseCAC:340,refSpend:3e6,elasticity:0.3,mmm:0.85,lift:null},
 'affiliates|retailer':{baseCAC:130,refSpend:2.5e6,elasticity:0.6,mmm:0.45,lift:0.5,liftSrc:'Partner holdout'},
 'creators|retailer':{baseCAC:220,refSpend:1.5e6,elasticity:0.5,mmm:0.7,lift:null},
 'trade|retailer':{baseCAC:260,refSpend:1e6,elasticity:0.5,mmm:0.75,lift:null},
 'events|retailer':{baseCAC:240,refSpend:1.5e6,elasticity:0.5,mmm:0.8,lift:null},
 'google|brand':{baseCAC:450,refSpend:1.7e6,elasticity:0.5,mmm:0.7,lift:null},
 'meta|brand':{baseCAC:550,refSpend:2.4e6,elasticity:0.4,mmm:0.6,lift:0.6,liftSrc:'Conversion Lift study'},
 'tiktok|brand':{baseCAC:600,refSpend:1.4e6,elasticity:0.5,mmm:0.6,lift:null},
 'linkedin|brand':{baseCAC:950,refSpend:2.3e6,elasticity:0.4,mmm:0.7,lift:null},
 'reddit|brand':{baseCAC:700,refSpend:1.2e6,elasticity:0.5,mmm:0.65,lift:null},
 'creators|brand':{baseCAC:800,refSpend:800000,elasticity:0.4,mmm:0.75,lift:null}};
const curveDef=(id,side)=>CURVE[id]||(side==='brand'?{baseCAC:800,refSpend:1e6,elasticity:0.45,mmm:0.65,lift:null}:{baseCAC:250,refSpend:1e6,elasticity:0.45,mmm:0.65,lift:null});
// Market multipliers: CAC and order size relative to North America
const MKT={NA:{cac:1,aov:1,stage:'Core'},EMEA:{cac:1.25,aov:0.88,stage:'Scaling'},ANZ:{cac:1.2,aov:0.95,stage:'Test'}};
const mktDef=id=>MKT[id]||{cac:1.4,aov:0.85,stage:'Test'};
const CUR={NA:'USD, CAD',EMEA:'GBP, EUR, SEK',ANZ:'AUD, NZD',CN:'CNY',JP:'JPY',KR:'KRW',SEA:'SGD and local',LATAM:'BRL, MXN'};

/* ---------- model input from the hub's media lines ---------- */
function chRows(R){const sp={};
 R.lines.forEach(l=>{if(l.side==='winback')return;const k=l.c.id+'|'+l.side;(sp[k]=sp[k]||{k,cid:l.c.id,side:l.side,c:l.c,spend:0}).spend+=l.budget});
 const both=id=>Object.values(sp).filter(x=>x.cid===id).length>1;
 return Object.values(sp).map(x=>({...curveDef(x.k,x.side),...((mp().ch||{})[x.k]||{}),id:x.k,cid:x.cid,side:x.side,name:x.c.name+(both(x.cid)?' · '+SIDE_NAME[x.side].toLowerCase():''),mix:x.spend,spend:x.spend}))}
function mkts(){return S.markets.filter(m=>m.on&&+m.weight>0).map(m=>({...mktDef(m.id),...((mp().mk||{})[m.id]||{}),id:m.id,name:m.name,lang:m.lang,weight:+m.weight}))}
function segs(){return D.winback.map(s=>({...s,...((mp().wb||{})[s.id]||{})}))}
function input(R){
 const side=k=>sum(R.lines.filter(l=>l.side===k).map(l=>l.budget)),ret=side('retailer'),br=side('brand'),wb=side('winback'),total=ret+br+wb;
 return {...M.clone(D),version:'plan',budgets:{plan:total},supplyShare:ret+br?br/(ret+br):0,winbackShare:total?wb/total:0,
  channels:chRows(R),markets:mkts(),winback:segs(),
  retailer:{...D.retailer,...(mp().retailer||{})},brand:{...D.brand,...(mp().brand||{})},network:{...D.network,...(mp().network||{})},balance:{...D.balance,...(mp().balance||{})}}}
const planOf=R=>M.plan(input(R));
window.mpPlan=planOf;

// Hover definitions for the growth metrics (how the model computes each one)
const TIP={
 budget:'Total paid media spend for this version: retailer acquisition + brand acquisition + retargeting & win-back.',
 retailers:'Incremental new retailers: shops that sign up and place a first order because of paid media. Platform-reported customers × incrementality (lift test read where one exists, otherwise MMM), with CAC rising as spend grows.',
 rICAC:'Retailer incremental CAC = retailer acquisition spend ÷ incremental new retailers.',
 brands:'Incremental new brands: brands onboarded and activated because of paid media, discounted for incrementality the same way.',
 bICAC:'Brand incremental CAC = brand acquisition spend ÷ incremental new brands.',
 gmv:'First-year GMV: wholesale order value in the first 12 months from new retailers (first order + reorders), net-new GMV from new brands, retailers those brands bring, and incremental win-back reorders.',
 payback:'Retailer payback = retailer iCAC ÷ monthly first-year contribution per retailer (take rate × GMV × contribution margin ÷ 12). Months until a new retailer pays back what it cost to acquire.',
 roi:'Contribution per $ = lifetime contribution (take rate × GMV × contribution margin, over the LTV horizon) from incremental retailers, brands and win-back, per $1 of media. Above 1× the media pays for itself over that horizon.'};
/* ---------- small builders ---------- */
const tile=(v,k,cls='',tip='')=>`<div class="tile ${cls}"${tip?` title="${esc(tip)}"`:''}><span class="v">${v}</span><span class="k">${k}</span></div>`;
// editable number: path = "retailer.firstAOV" etc.; kind: pct (stored 0–1, shown %), m ($M), raw
function num(path,val,kind='raw',w=84){const shown=val==null||val===''?'':kind==='pct'?+(val*100).toFixed(1):kind==='m'?+(val/1e6).toFixed(2):+(+val).toFixed(3);
 return `<input class="rate mp-in" type="number" min="0" step="any" style="width:${w}px!important" data-mp="${path}" data-kind="${kind}" value="${shown}">`}
const fld=(label,path,val,kind,unit='')=>`<label class="mp-f">${label} ${num(path,val,kind)}${unit}</label>`;
const balChip=t=>`<span class="chip ${t.kpi.balance==='balanced'?'mp-ok':'flag'}">${t.kpi.balance}</span>`;
const evid=r=>r.lift!=null&&r.lift!==''?`<span class="chip mp-ok" title="${esc(r.liftSrc||'Lift test')}">lift test</span>`:`<span class="chip">MMM</span>`;

/* ---------- Summary tiles ---------- */
window.mpSummaryTiles=function(R){const t=planOf(R),k=t.kpi;
 return tile(n0(k.newRetailers),'Incremental new retailers · iCAC '+usd(k.rICAC))
  +tile(n0(k.newBrands),'Incremental new brands · iCAC '+usd(k.bICAC))
  +tile('$'+compact(k.gmvY1),'First-year GMV · '+(+k.gmvPerDollar.toFixed(1))+'× per media $')
  +tile(isFinite(k.ratio)?Math.round(k.ratio)+' : 1':'—','New retailers per new brand · '+k.balance,k.balance==='balanced'?'':'warn','Healthy band '+t.p.balance.min+'–'+t.p.balance.max+' : 1')
  +tile(x1(k.rLtvCac),'Retailer LTV : iCAC · payback '+mo(k.rPayback),k.rLtvCac<3?'warn':'')
  +tile(n0(k.wbIncr),'Incremental win-back orders · see Win-back tab')};

/* ---------- Growth Plan (two-sided) ---------- */
function renderGrowth(R){const t=planOf(R),k=t.kpi,P=t.p,best=M.bestSupplyShare(t.p),nd=M.nextDollar(t),cur=P.supplyShare;
 const tiers=[0,1,2].map(i=>{const Ri=compute(i),ti=planOf(Ri);return {i,b:sum(Ri.lines.map(l=>l.budget)),k:ti.kpi}});
 return `<div class="panel mp" style="display:flex;flex-direction:column;gap:18px">
 <div><div class="eyebrow">${esc(TIERNAME[R.tier])} version · two-sided growth plan</div><h2 style="font-size:20px;margin-top:2px">${money(t.total)} buys ${n0(k.newRetailers)} incremental retailers and ${n0(k.newBrands)} brands</h2>
 <div class="note">Spend comes straight from the media lines in this plan, split by marketplace side. Each channel's platform-reported customers are discounted to incremental ones (lift test where there is one, MMM otherwise), and CAC climbs as spend grows. Supply makes demand cheaper: ${n0(k.newBrands)} new brands on ${n0(P.network.activeBrands)} active lowers retailer CAC by ${pct(1-t.netMult)}.</div></div>
 <div class="tiles">
  ${tile(n0(k.newRetailers),'Incremental new retailers','',TIP.retailers)}${tile(usd(k.rICAC),'Retailer incremental CAC','',TIP.rICAC)}${tile(x1(k.rLtvCac)+' · '+mo(k.rPayback),'Retailer LTV : iCAC · payback',k.rLtvCac<3?'warn':'')}
  ${tile(n0(k.newBrands),'Incremental new brands','',TIP.brands)}${tile(usd(k.bICAC),'Brand incremental CAC','',TIP.bICAC)}${tile(x1(k.bLtvCac)+' · '+mo(k.bPayback),'Brand LTV : iCAC · payback',k.bLtvCac<3?'warn':'')}
  ${tile('$'+compact(k.gmvY1),'First-year GMV (incl. win-back, referred retailers)','',TIP.gmv)}${tile(x1(k.roi),'Lifetime contribution per media $',k.roi<1?'warn':'',TIP.roi)}${tile((isFinite(k.ratio)?Math.round(k.ratio)+' : 1':'—'),'New retailers per new brand · '+k.balance,k.balance==='balanced'?'':'warn')}
 </div>
 <div class="cols">
  <div class="mp-card"><h3>Retailer vs brand split</h3><p>You are putting <strong>${pct(cur)}</strong> of acquisition into brands. The split that returns the most lifetime contribution at this budget is <strong>${pct(best.share)}</strong>${Math.abs(best.share-cur)<0.015?', so the split is already close to best.':'.'}</p>
   ${Math.abs(best.share-cur)>=0.015?`<button class="btn sm" id="mp-best" data-v="${best.share}">Use ${pct(best.share)} brands</button>`:''}
   <p class="note">Network health: ${balChip(t)} ${isFinite(k.ratio)?Math.round(k.ratio):'—'} new retailers per new brand (healthy band ${P.balance.min}–${P.balance.max}). Too few brands and new retailers find thin assortments; too many and brands churn without orders.</p></div>
  <div class="mp-card"><h3>Where the next $1M goes</h3><ul class="assump">
   ${nd.retailer?`<li>Retailers: <strong>${esc(nd.retailer.name)}</strong>, marginal iCAC ${usd(nd.retailer.marginal)} against ${usd(nd.retailer.ltv)} LTV.</li>`:''}
   ${nd.brand?`<li>Brands: <strong>${esc(nd.brand.name)}</strong>, marginal iCAC ${usd(nd.brand.marginal)} against ${usd(nd.brand.ltv)} LTV.</li>`:''}
   <li>Win-back returns ${x1(k.wbGMV/Math.max(1,t.winbackBudget))} GMV per $ on incremental reorders only (holdout-read).</li></ul>
   <p class="note">Marginal iCAC = the cost of the last customer, not the average. Shift budget until marginal iCAC ÷ LTV is equal across channels; the Channel Incrementality tab does this for you.</p></div>
 </div>
 <div><h3 style="font-size:14px;margin-bottom:6px">Low vs Medium vs High</h3><div class="tscroll"><table><thead><tr><th>Version</th>${[['Budget','budget'],['New retailers','retailers'],['Retailer iCAC','rICAC'],['New brands','brands'],['Brand iCAC','bICAC'],['First-year GMV','gmv'],['Retailer payback','payback'],['Contribution per $','roi']].map(([n,k])=>`<th class="n"><span class="mp-tip" title="${esc(TIP[k])}">${n}</span></th>`).join('')}</tr></thead><tbody>
  ${tiers.map(x=>`<tr${x.i===R.tier?' class="mp-cur"':''}><td>${TIERNAME[x.i]}</td><td class="n">${money(x.b)}</td><td class="n">${n0(x.k.newRetailers)}</td><td class="n">${usd(x.k.rICAC)}</td><td class="n">${n0(x.k.newBrands)}</td><td class="n">${usd(x.k.bICAC)}</td><td class="n">$${compact(x.k.gmvY1)}</td><td class="n">${mo(x.k.rPayback)}</td><td class="n">${x1(x.k.roi)}</td></tr>`).join('')}</tbody></table></div>
  <div class="note" style="margin-top:6px">Doubling spend never doubles customers: CAC rises on every channel as it scales. Read the gap between versions as the cost of growth.</div></div>
 <div><h3 style="font-size:14px;margin-bottom:6px">Unit economics <span class="sub2">(edit to match your cohorts)</span></h3>
  <div class="mp-grid">
   <fieldset><legend>Retailer (demand)</legend>${fld('First order AOV $','retailer.firstAOV',P.retailer.firstAOV)}${fld('Repeat AOV $','retailer.repeatAOV',P.retailer.repeatAOV)}${fld('Reorder within 12 mo','retailer.reorder12',P.retailer.reorder12,'pct','%')}${fld('Repeat orders, year 1','retailer.repeatOrders',P.retailer.repeatOrders)}${fld('Yearly retention','retailer.retention',P.retailer.retention,'pct','%')}${fld('Take rate, first order','retailer.takeFirst',P.retailer.takeFirst,'pct','%')}${fld('Take rate, repeat','retailer.takeRepeat',P.retailer.takeRepeat,'pct','%')}${fld('Contribution margin','retailer.margin',P.retailer.margin,'pct','%')}
    <div class="note">LTV ${usd(t.R.ltv)} over ${P.retailer.years} years · first-year GMV ${usd(t.R.gmvY1)}</div></fieldset>
   <fieldset><legend>Brand (supply)</legend>${fld('Year-1 GMV per brand $','brand.gmvY1',P.brand.gmvY1)}${fld('Net-new share of that GMV','brand.incrShare',P.brand.incrShare,'pct','%')}${fld('Take rate','brand.take',P.brand.take,'pct','%')}${fld('Yearly retention','brand.retention',P.brand.retention,'pct','%')}${fld('Retailers each brand brings','brand.referredRetailers',P.brand.referredRetailers)}
    <div class="note">LTV ${usd(t.B.ltv)}, incl. ${usd(t.B.referred)} from retailers the brand brings</div></fieldset>
   <fieldset><legend>Network</legend>${fld('Active brands today','network.activeBrands',P.network.activeBrands)}${fld('Supply → demand effect','network.effect',P.network.effect)}${fld('Healthy band, min','balance.min',P.balance.min)}${fld('Healthy band, max','balance.max',P.balance.max)}
    <div class="note">Effect 0.5 means 10% more brands cuts retailer CAC by about 5%.</div></fieldset>
  </div>
  <div class="btns" style="margin-top:8px"><button class="btn sm ghost" id="mp-reset-econ">Reset unit economics</button></div></div>
 </div>`}
window.renderGrowth=renderGrowth;
window.growthAOA=function(R){const t=planOf(R),k=t.kpi,P=t.p;return [['GROWTH PLAN · '+TIERNAME[R.tier]+' · two-sided marketplace'],[],
 ['Media spend',Math.round(t.total)],['Retailer acquisition',Math.round(t.sideBudget.retailer)],['Brand acquisition',Math.round(t.sideBudget.brand)],['Win-back',Math.round(t.winbackBudget)],[],
 ['Incremental new retailers',Math.round(k.newRetailers)],['Retailer incremental CAC',Math.round(k.rICAC)],['Retailer LTV',Math.round(t.R.ltv)],['Retailer LTV : iCAC',+k.rLtvCac.toFixed(2)],['Retailer payback (months)',Math.round(k.rPayback)],
 ['Incremental new brands',Math.round(k.newBrands)],['Brand incremental CAC',Math.round(k.bICAC)],['Brand LTV',Math.round(t.B.ltv)],['Brand LTV : iCAC',+k.bLtvCac.toFixed(2)],
 ['New retailers per new brand',+k.ratio.toFixed(1)],['Network balance',k.balance],['First-year GMV',Math.round(k.gmvY1)],['Lifetime contribution per media $',+k.roi.toFixed(2)],[],
 ['Assumptions'],['First order AOV',P.retailer.firstAOV],['Repeat AOV',P.retailer.repeatAOV],['Reorder within 12 months',P.retailer.reorder12],['Take rate first / repeat',P.retailer.takeFirst+' / '+P.retailer.takeRepeat],['Brand year-1 GMV',P.brand.gmvY1],['Active brands',P.network.activeBrands],['Network effect',P.network.effect]]};

/* ---------- Channel Incrementality ---------- */
function optimized(t){let p=t.p;['retailer','brand'].forEach(s=>{if(p.channels.some(c=>c.side===s))p=M.optimizeMix(p,s,300)});const o=M.plan(p);return {o,mix:Object.fromEntries(o.rows.map(r=>[r.id,r.spend]))}}
function renderMix(R){const t=planOf(R),O=optimized(t),rows=t.rows.slice().sort((a,b)=>a.side.localeCompare(b.side)*-1||b.spend-a.spend),byId=Object.fromEntries(t.p.channels.map(c=>[c.id,c]));
 const gainR=O.o.kpi.newRetailers-t.kpi.newRetailers,gainB=O.o.kpi.newBrands-t.kpi.newBrands,untested=rows.filter(r=>byId[r.id].lift==null&&r.spend>=1e6);
 return `<div class="panel mp" style="display:flex;flex-direction:column;gap:18px">
 <div><div class="eyebrow">${esc(TIERNAME[R.tier])} version · incrementality</div><h2 style="font-size:20px;margin-top:2px">What each channel really adds</h2>
 <div class="note">Platforms report attributed customers. Incremental = attributed × incrementality (the lift test read when there is one, otherwise the MMM read). CAC at a spend = base CAC × (spend ÷ reference spend)<sup>elasticity</sup>, so the last dollar always costs more than the average. Spend per channel comes from the media lines; win-back lines are on their own tab.</div></div>
 <div class="tscroll"><table><thead><tr><th>Channel</th><th>Side</th><th class="n">Plan spend</th><th class="n">Base CAC $</th><th class="n">Ref. spend $M</th><th class="n">Elasticity</th><th class="n">MMM %</th><th class="n">Lift %</th><th>Read</th><th class="n">Platform CAC</th><th class="n">Incremental</th><th class="n">iCAC</th><th class="n">Marginal iCAC</th><th class="n">LTV : iCAC</th><th class="n">Optimized spend</th></tr></thead><tbody>
 ${rows.map(r=>{const c=byId[r.id],p='ch.'+r.id.replace('|','~'),d=(O.mix[r.id]||0)-r.spend;return `<tr><td>${esc(r.name)}</td><td>${SIDE_NAME[r.side]}</td><td class="n">${money(r.spend)}</td>
  <td class="n">${num(p+'.baseCAC',c.baseCAC,'raw',72)}</td><td class="n">${num(p+'.refSpend',c.refSpend,'m',64)}</td><td class="n">${num(p+'.elasticity',c.elasticity,'raw',60)}</td><td class="n">${num(p+'.mmm',c.mmm,'pct',58)}</td><td class="n">${num(p+'.lift',c.lift,'pct',58)}</td><td>${evid(c)}</td>
  <td class="n">${usd(r.cac)}</td><td class="n">${n0(r.incremental)}</td><td class="n">${usd(r.iCAC)}</td><td class="n">${usd(r.marginal)}</td><td class="n ${r.ltvCac<3?'mp-bad':''}">${x1(r.ltvCac)}</td>
  <td class="n">${money(O.mix[r.id]||0)} <span class="sub2">${d>=0?'+':'−'}${compact(Math.abs(d))}</span></td></tr>`}).join('')}</tbody></table></div>
 <div class="cols">
  <div class="mp-card"><h3>Equalize marginal returns</h3><p>Moving the same ${money(t.acq)} between channels until the last dollar costs the same everywhere adds <strong>${n0(gainR)}</strong> retailers and <strong>${n0(gainB)}</strong> brands, with no new budget. The Optimized spend column shows where it moves (capped at 3× each channel's reference spend, where the curve is still credible).</p>
   <p class="note">To apply it, change the channel weights in section 7 or type channel budgets on the Buy Details tab.</p></div>
  <div class="mp-card"><h3>Measurement plan</h3><ul class="assump">
   ${untested.length?`<li>Run a lift test before scaling: ${untested.map(r=>esc(r.name)).join(', ')} spend $1M+ on an MMM read only.</li>`:'<li>Every channel spending $1M+ has a lift test read.</li>'}
   <li>Geo holdouts for search, PMax and CTV (no user-level holdout possible); platform conversion lift for Meta and TikTok; partner holdouts for affiliates.</li>
   <li>Re-fit the MMM quarterly and calibrate it to the lift tests, then refresh base CAC and elasticity here.</li>
   <li>Brand search: hold out a small share of geos once a year to size how much is truly incremental.</li></ul></div>
 </div>
 <div class="btns"><button class="btn sm ghost" id="mp-reset-ch">Reset channel curves</button></div></div>`}
function mixAOA(R){const t=planOf(R),O=optimized(t);return [['CHANNEL INCREMENTALITY · '+TIERNAME[R.tier]],['Channel','Side','Plan spend','Platform CAC','Incrementality','Incremental customers','iCAC','Marginal iCAC','LTV : iCAC','Optimized spend'],
 ...t.rows.map(r=>[r.name,SIDE_NAME[r.side],Math.round(r.spend),Math.round(r.cac),+r.incrFactor.toFixed(2),Math.round(r.incremental),Math.round(r.iCAC),Math.round(r.marginal),+r.ltvCac.toFixed(2),Math.round(O.mix[r.id]||0)])]}

/* ---------- Retargeting & Win-back ---------- */
function renderWinback(R){const t=planOf(R),wl=R.lines.filter(l=>l.side==='winback'),S0=segs(),waves=S.moments.filter(m=>m.month&&/win-?back|reorder|restock|reactivat/i.test(m.name));
 return `<div class="panel mp" style="display:flex;flex-direction:column;gap:18px">
 <div><div class="eyebrow">${esc(TIERNAME[R.tier])} version · retention</div><h2 style="font-size:20px;margin-top:2px">${money(t.winbackBudget)} on retargeting and win-back buys ${n0(t.kpi.wbIncr)} incremental orders</h2>
 <div class="note">Only orders above the holdout count. Every audience below keeps a holdout that sees no ads; incremental orders = people reached × (exposed order rate − holdout order rate). Reach saturates, so each extra dollar finds fewer new people.</div></div>
 <div class="tscroll"><table><thead><tr><th>Segment</th><th class="n">Audience size</th><th class="n">Reachable %</th><th class="n">Cost per person reached $</th><th class="n">Exposed order rate %</th><th class="n">Holdout order rate %</th><th class="n">GMV per order $</th><th class="n">Share of win-back $ %</th><th class="n">Spend</th><th class="n">Reached</th><th class="n">Incremental orders</th><th class="n">Cost per incr. order</th><th class="n">iROAS (GMV)</th></tr></thead><tbody>
 ${t.wb.map((w,i)=>{const s=S0[i],p='wb.'+s.id;return `<tr><td>${esc(s.name)}${s.side==='brand'?' <span class="chip">brands</span>':''}</td><td class="n">${num(p+'.size',s.size,'raw',84)}</td><td class="n">${num(p+'.reach',s.reach,'pct',56)}</td><td class="n">${num(p+'.costPerReach',s.costPerReach,'raw',56)}</td><td class="n">${num(p+'.exposed',s.exposed,'pct',56)}</td><td class="n">${num(p+'.holdout',s.holdout,'pct',56)}</td><td class="n">${num(p+'.gmv',s.gmv,'raw',64)}</td><td class="n">${num(p+'.share',s.share,'pct',56)}</td>
  <td class="n">${money(w.spend)}</td><td class="n">${n0(w.reached)}</td><td class="n">${n0(w.incr)}</td><td class="n">${usd(w.costPerIncr)}</td><td class="n ${w.iROAS<1?'mp-bad':''}">${x1(w.iROAS)}</td></tr>`}).join('')}</tbody></table></div>
 <div class="cols">
  <div class="mp-card"><h3>Media lines on the win-back side</h3>${wl.length?`<ul class="assump">${Object.values(wl.reduce((a,l)=>{const k=l.p.id;(a[k]=a[k]||{n:l.channel+' · '+l.placement,b:0,m:new Set()}).b+=l.budget;a[k].m.add(l.market);return a},{})).map(x=>`<li>${esc(x.n)}: <strong>${money(x.b)}</strong> <span class="sub2">${esc([...x.m].join(', '))}</span></li>`).join('')}</ul>`:'<p class="note">No win-back lines yet. Turn on Retargeting & CRM audiences in section 7, or raise the win-back share in section 2.</p>'}
   <p class="note">They flow into the BOM, Spec Sheet, Buy Details and Tagging tabs like every other line.</p></div>
  <div class="mp-card"><h3>Rules of the road</h3><ul class="assump">
   <li>Keep a 10% holdout on every CRM audience, all year. Without it, retargeting takes credit for orders that would have happened anyway.</li>
   <li>Exclude anyone who ordered in the last 30 days from acquisition and win-back lines alike.</li>
   <li>Cap frequency at 3 a week; lapsed retailers tune out fast.</li>
   <li>Lead with what's new from brands they bought before, then with terms (net 60, free returns); discounts last.</li>
   ${waves.length?`<li>Burst around ${waves.map(w=>esc(w.name)+' ('+monthLabel(w.month)+')').join(', ')}.</li>`:''}</ul></div>
 </div>
 <div class="btns"><button class="btn sm ghost" id="mp-reset-wb">Reset segments</button></div></div>`}
function wbAOA(R){const t=planOf(R),S0=segs();return [['RETARGETING & WIN-BACK · '+TIERNAME[R.tier]],['Segment','Audience size','Spend','Reached','Exposed rate','Holdout rate','Incremental orders','Cost per incremental order','iROAS (GMV)'],
 ...t.wb.map((w,i)=>[S0[i].name,S0[i].size,Math.round(w.spend),Math.round(w.reached),S0[i].exposed,S0[i].holdout,Math.round(w.incr),Math.round(w.costPerIncr),+w.iROAS.toFixed(2)])]}

/* ---------- International ---------- */
function renderIntl(R){const t=planOf(R),mm=mkts(),byM=Object.fromEntries(t.markets.map(m=>[m.id,m]));
 const lines=id=>R.lines.filter(l=>l.m.id===id),masters=lang=>R.masters.filter(m=>m.langs.includes(lang)).length;
 return `<div class="panel mp" style="display:flex;flex-direction:column;gap:18px">
 <div><div class="eyebrow">${esc(TIERNAME[R.tier])} version · international</div><h2 style="font-size:20px;margin-top:2px">${mm.length} markets · ${pct(1-(mm.find(m=>m.id==='NA')?.weight||0)/Math.max(1,sum(mm.map(m=>m.weight))))} of budget outside North America</h2>
 <div class="note">Market weight sets each market's budget (the same weights as section 3; change them here or there). The CAC multiplier says how much more a customer costs than in North America; the order size multiplier scales GMV. New markets start with a geo holdout so the first read is incremental.</div></div>
 <div class="tscroll"><table><thead><tr><th>Market</th><th>Stage</th><th class="n">Weight %</th><th class="n">CAC ×</th><th class="n">Order size ×</th><th class="n">Acquisition spend</th><th class="n">New retailers</th><th class="n">New brands</th><th class="n">Retailer iCAC</th><th class="n">First-year GMV</th><th class="n">Payback</th></tr></thead><tbody>
 ${mm.map(m=>{const r=byM[m.id]||{};return `<tr><td>${esc(m.name)}</td><td><select class="mp-in" data-mp="mk.${m.id}.stage" data-kind="txt">${['Core','Scaling','Test'].map(x=>`<option ${x===m.stage?'selected':''}>${x}</option>`).join('')}</select></td>
  <td class="n"><input class="rate mp-in" type="number" min="0" step="1" style="width:58px!important" data-mp="weight.${m.id}" data-kind="raw" value="${m.weight}"></td><td class="n">${num('mk.'+m.id+'.cac',m.cac,'raw',58)}</td><td class="n">${num('mk.'+m.id+'.aov',m.aov,'raw',58)}</td>
  <td class="n">${money(r.spend||0)}</td><td class="n">${n0(r.retailers)}</td><td class="n">${n0(r.brands)}</td><td class="n">${usd(r.iCAC)}</td><td class="n">$${compact(r.gmvY1||0)}</td><td class="n">${mo(r.payback)}</td></tr>`}).join('')}</tbody></table></div>
 <div><h3 style="font-size:14px;margin-bottom:6px">Launch checklist by market</h3><div class="tscroll"><table><thead><tr><th>Market</th><th>Language</th><th>Currency</th><th class="n">Media lines</th><th>Channels running</th><th class="n">BOM masters in this language</th><th>Trade press</th><th>Measurement</th></tr></thead><tbody>
 ${mm.map(m=>{const ls=lines(m.id);return `<tr><td>${esc(m.name)}</td><td>${esc(m.lang)}</td><td>${esc(CUR[m.id]||'Local')}</td><td class="n">${ls.length}</td><td>${esc([...new Set(ls.map(l=>l.channel))].join(', '))||'—'}</td><td class="n">${masters(m.lang)}</td><td>${esc(TRADE_PUB[m.id]||'—')}</td><td>${m.stage==='Core'?'MMM + lift tests':m.stage==='Scaling'?'Geo holdout per quarter; fold into MMM':'Geo holdout before scaling'}</td></tr>`}).join('')}</tbody></table></div></div>
 <ul class="assump"><li>Localize copy and landing pages per language, show prices and terms in local currency, and check VAT and duty messaging for cross-border orders.</li><li>Follow each market's trade-show calendar (Spring Fair and Ambiente in Europe, Reed Gift Fairs in Australia) for bursts.</li><li>Scale a Test market only after its geo holdout shows incremental first orders at a payback inside the target.</li></ul>
 <div class="btns"><button class="btn sm ghost" id="mp-reset-mk">Reset market multipliers</button></div></div>`}
function intlAOA(R){const t=planOf(R);return [['INTERNATIONAL · '+TIERNAME[R.tier]],['Market','Stage','Weight','CAC multiplier','Order size multiplier','Acquisition spend','New retailers','New brands','Retailer iCAC','First-year GMV','Payback (months)'],
 ...t.markets.map(m=>[m.name,m.stage,m.weight,m.cac,m.aov,Math.round(m.spend),Math.round(m.retailers),Math.round(m.brands),Math.round(m.iCAC),Math.round(m.gmvY1),Math.round(m.payback)])]}


/* ---------- Budget governance, operating rhythm and measurement: how the plan is run once it is live ---------- */
const GOV_DEF={ltvTarget:2,reserve:0.05,tol:0.1,testShare:0.1};
const gov=()=>({...GOV_DEF,...(mp().gov||{})});
const SIDES=['retailer','brand','winback'];
// planned spend per month and side: each line follows its channel's flighting curve
function monthlyPlan(R){const fr=Object.fromEntries(R.flightRows.map(f=>[f.c.id,f])),out=R.months.map(m=>({m,retailer:0,brand:0,winback:0,total:0}));
 R.lines.forEach(l=>{const f=fr[l.c.id];R.months.forEach((_,i)=>{const v=l.budget*(f&&f.total?f.months[i]/f.total:1/R.months.length);out[i][l.side]+=v;out[i].total+=v})});return out}
const actOf=R=>((mp().act||{})[TIERS[R.tier]]||{});
function pacing(R){const P=monthlyPlan(R),A=actOf(R),G=gov();let cumP=0,cumA=0,planToDate=0,actToDate=0,last=-1;
 P.forEach((r,i)=>{if(A[r.m]!=null){last=i}});
 const rows=P.map((r,i)=>{cumP+=r.total;const a=A[r.m];if(a!=null)cumA+=a;if(i<=last){planToDate+=r.total;actToDate+=a||0}
  const v=a!=null&&r.total?a/r.total-1:null,st=v==null?'':Math.abs(v)<=G.tol/2?'On pace':Math.abs(v)<=G.tol?'Watch':v>0?'Ahead of plan':'Behind plan';
  return {...r,act:a,v,st,cumP,cumA:i<=last?cumA:null}});
 const total=sum(P.map(r=>r.total)),remaining=sum(P.slice(last+1).map(r=>r.total)),runRate=planToDate?actToDate/planToDate:1;
 return {rows,total,last,planToDate,actToDate,landPlan:actToDate+remaining,landRun:actToDate+remaining*runRate,runRate}}
// scale / hold / trim: the LTV each channel's next dollar buys (LTV ÷ marginal iCAC)
function signals(t){const G=gov();return t.rows.filter(r=>r.spend>0).map(r=>{const mr=r.marginal?r.ltv/r.marginal:0;
 return {...r,mr,call:mr>=1.25?'Scale':mr>=0.8?'Hold':'Trim'}}).sort((a,b)=>a.side.localeCompare(b.side)*-1||b.mr-a.mr)}
const stChip=s=>!s?'':`<span class="chip ${s==='On pace'||s==='Scale'?'mp-ok':''}">${s}</span>`;
function renderGov(R){const t=planOf(R),G=gov(),pc=pacing(R),T=TIERS[R.tier],sg=signals(t),tot=t.total;
 const mAvg=tot/Math.max(1,R.months.length),side=k=>t.sideBudget?.[k]??(k==='winback'?t.winbackBudget:0);
 const sideM=k=>(k==='winback'?t.winbackBudget:side(k))/Math.max(1,R.months.length);
 const hasAct=pc.last>=0;
 return `<div class="panel mp" style="display:flex;flex-direction:column;gap:18px">
 <div><div class="eyebrow">${esc(TIERNAME[R.tier])} version · budget governance</div><h2 style="font-size:20px;margin-top:2px">${money(tot)} managed through monthly pacing, a ${pct(G.reserve)} reserve and clear decision rights</h2>
 <div class="note">Plan by month comes from the Flighting tab. Enter actual spend as each month closes (in $M) to see the variance, the forecast to land and what to do about it. The guardrails below are editable and drive the scale / hold / trim calls.</div></div>
 <div class="tiles">${tile(hasAct?pct(pc.actToDate/Math.max(1,pc.planToDate)):'—','Spend vs plan to date',hasAct&&Math.abs(pc.runRate-1)>G.tol?'flag':'','Actual spend ÷ planned spend for the months with actuals entered.')}${tile(money(pc.landRun),'Forecast to land (run rate)',Math.abs(pc.landRun/tot-1)>G.tol?'flag':'','Actual spend to date + the remaining plan scaled by the run rate so far (at plan: '+money(pc.landPlan)+'). This is the number Finance accrues against.')}${tile(money(tot*G.reserve),'Reserve held back','','Unallocated at the start of each quarter; released at the monthly business review to the channels with the lowest marginal iCAC.')}</div>
 <div><h3 style="font-size:14px;margin-bottom:6px">Pacing: plan vs actual by month</h3><div class="tscroll"><table><thead><tr><th>Month</th><th class="n">Retailers</th><th class="n">Brands</th><th class="n">Win-back</th><th class="n">Plan</th><th class="n">Actual $M</th><th class="n">Variance</th><th>Status</th><th class="n">Cumulative plan</th><th class="n">Cumulative actual</th></tr></thead><tbody>
 ${pc.rows.map(r=>`<tr${r.act!=null?'':' style="color:var(--muted)"'}><td>${monthLabel(r.m)}</td><td class="n">${money(r.retailer)}</td><td class="n">${money(r.brand)}</td><td class="n">${money(r.winback)}</td><td class="n"><strong>${money(r.total)}</strong></td><td class="n">${num('act.'+T+'.'+r.m,r.act,'m',72)}</td><td class="n ${r.v!=null&&Math.abs(r.v)>G.tol?'mp-bad':''}">${r.v==null?'':(r.v>0?'+':'')+pct(r.v)}</td><td>${stChip(r.st)}</td><td class="n">${money(r.cumP)}</td><td class="n">${r.cumA==null?'':money(r.cumA)}</td></tr>`).join('')}</tbody></table></div>
 <div class="btns" style="margin-top:8px"><button class="btn sm ghost" id="mp-ex-act">Fill example actuals (first 3 months)</button><button class="btn sm ghost" id="mp-reset-act">Clear actuals</button></div></div>
 <div class="cols">
  <div class="mp-card"><h3>Guardrails</h3>
   <div class="mp-f"><span>Target LTV : iCAC (both sides)</span>${num('gov.ltvTarget',G.ltvTarget,'raw',58)}</div>
   <div class="mp-f"><span>Pacing tolerance ± %</span>${num('gov.tol',G.tol,'pct',58)}</div>
   <div class="mp-f"><span>Quarterly reserve %</span>${num('gov.reserve',G.reserve,'pct',58)}</div>
   <div class="mp-f"><span>Test & learn share %</span>${num('gov.testShare',G.testShare,'pct',58)}</div>
   <p class="note">Test & learn: ${money(tot*G.testShare)} for new channels and the Test Plan. A test graduates to core budget only when its lift read clears the LTV : iCAC target.</p></div>
  <div class="mp-card"><h3>Finance partnership</h3><ul class="assump">
   <li>Accrue platform and agency spend by business day 3, by cost center (the Tagging tab carries the codes).</li>
   <li>Refresh the forecast to land monthly; explain any variance above ${pct(G.tol/2)} in writing.</li>
   <li>Report incremental customers and contribution, not platform ROAS, so Finance and Marketing share one number.</li>
   <li>Agree in advance where unspent budget goes: back to the reserve for the next monthly review.</li></ul></div>
 </div>
 <div><h3 style="font-size:14px;margin-bottom:6px">Decision rights: who can move money, how much, and when</h3><div class="tscroll"><table><thead><tr><th>Move</th><th>Limit</th><th>Who decides</th><th>When</th><th>Trigger</th></tr></thead><tbody>
  <tr><td>Inside a channel (campaigns, bids, audiences)</td><td>Up to 20% of the channel's month</td><td>Channel lead or agency</td><td>Any day; logged weekly</td><td>Platform CAC × incrementality factor drifts from plan</td></tr>
  <tr><td>Across channels on one side</td><td>Up to 10% of the side's month (${money(sideM('retailer')*0.1)} retailers, ${money(sideM('brand')*0.1)} brands)</td><td>Head of Paid Marketing</td><td>Monthly business review</td><td>Marginal iCAC gap above 25% between channels</td></tr>
  <tr><td>Release the reserve</td><td>${money(tot*G.reserve)} a quarter</td><td>Head of Paid + Finance partner</td><td>Monthly business review</td><td>A channel marked Scale below, with a lift or MMM read behind it</td></tr>
  <tr><td>Change the marketplace split</td><td>Any move between retailers, brands and win-back</td><td>Head of Paid, Finance, Supply GM</td><td>QBR</td><td>Network balance outside the band, or an MMM refresh</td></tr>
  <tr><td>Change the total</td><td>Above ${money(tot)} or a cut of more than ${pct(G.tol)}</td><td>CMO + CFO</td><td>QBR or off-cycle</td><td>Forecast to land outside tolerance two months running</td></tr>
 </tbody></table></div></div>
 <div><h3 style="font-size:14px;margin-bottom:6px">Scale, hold or trim: what the next dollar buys</h3><div class="tscroll"><table><thead><tr><th>Channel</th><th>Side</th><th class="n">Plan spend</th><th class="n">Average iCAC</th><th class="n">Marginal iCAC</th><th class="n">LTV : marginal iCAC</th><th>Call</th></tr></thead><tbody>
 ${sg.map(r=>`<tr><td>${esc(r.name)}</td><td>${SIDE_NAME[r.side]}</td><td class="n">${money(r.spend)}</td><td class="n">${usd(r.iCAC)}</td><td class="n">${usd(r.marginal)}</td><td class="n">${isFinite(r.mr)?r.mr.toFixed(2)+'×':'—'}</td><td>${stChip(r.call)}</td></tr>`).join('')}</tbody></table></div>
 <p class="note" style="margin-top:6px">The plan's average has to clear ${x1(G.ltvTarget)}; each channel's next dollar is judged against break-even. Scale = clear headroom (1.25× or better). Hold = near break-even, keep at plan. Trim = past the efficient point: shift 10–20% to a Scale channel on the same side at the next monthly review. Calls refresh with every MMM and lift read.</p></div>
 <div class="btns"><button class="btn sm ghost" id="mp-reset-gov">Reset guardrails</button></div></div>`}
function govAOA(R){const t=planOf(R),pc=pacing(R),G=gov();return [['BUDGET GOVERNANCE · '+TIERNAME[R.tier]],['Target LTV : iCAC',G.ltvTarget],['Pacing tolerance',G.tol],['Reserve',G.reserve],['Test & learn share',G.testShare],['Forecast to land (plan)',Math.round(pc.landPlan)],['Forecast to land (run rate)',Math.round(pc.landRun)],[],
 ['Month','Retailers','Brands','Win-back','Plan','Actual','Variance','Status'],...pc.rows.map(r=>[monthLabel(r.m),Math.round(r.retailer),Math.round(r.brand),Math.round(r.winback),Math.round(r.total),r.act==null?'':Math.round(r.act),r.v==null?'':+r.v.toFixed(3),r.st]),[],
 ['Channel','Side','Plan spend','Average iCAC','Marginal iCAC','LTV : marginal iCAC','Call'],...signals(t).map(r=>[r.name,SIDE_NAME[r.side],Math.round(r.spend),Math.round(r.iCAC),Math.round(r.marginal),+r.mr.toFixed(2),r.call])]}

/* ---------- Operating rhythm ---------- */
const RHYTHM=[
 ['Daily','Spend and anomaly alerts (automated)','Channel leads, agency','Platform spend, CPA, delivery','Pause or fix anything pacing ±15% for the day','Alert in the team channel'],
 ['Weekly · Mon','Pacing & performance','Head of Paid, channel leads, agency, analytics','Pacing vs plan, incrementality-adjusted CAC by channel, creative fatigue','Moves inside a channel (up to 20%)','One-page scorecard'],
 ['Every 2 weeks','Creative & test review','Channel leads, creative studio','Test readouts (Test Plan tab), fatigue, new BOM round','Scale winners, brief the next round','Creative brief'],
 ['Monthly','Business review with Finance','Head of Paid, Finance partner, analytics','Actuals vs plan, forecast to land, marginal iCAC by channel','Moves across channels (up to 10%), release the reserve','Reforecast + variance memo'],
 ['Monthly','Marketplace balance review','Head of Paid, Supply / brand team, Sales','New brands vs new retailers, category gaps, win-back reads','Brand targeting by category; win-back audiences','Balance note'],
 ['Quarterly','Business review (QBR) with execs','CMO, CFO, marketplace GM, Head of Paid','MMM refresh, lift results, LTV cohorts, network balance','Next quarter’s split, total and test roadmap','QBR deck'],
 ['Annually','Planning','CMO, CFO, Head of Paid','Year’s MMM, cohort LTV, market expansion','Budget envelope, goals, markets','Annual plan (this hub)']];
function rhythmCal(R){const TP=(()=>{try{return testPlan(R).tests}catch(e){return []}})(),M0=R.months;
 return [['Monthly business review',M0.map(()=>'●')],['QBR',M0.map((_,i)=>i%3===2||i===M0.length-1?'●':'')],['MMM refresh',M0.map((_,i)=>i%3===1?'●':'')],
  ['Test readouts',M0.map(m=>TP.filter(t=>t.month===m).map(t=>t.id).join(' '))],['Launch moments',M0.map(m=>S.moments.filter(x=>x.month===m).map(x=>x.name).join(', '))]]}
function scorecard(R){const t=planOf(R),k=t.kpi,G=gov();
 return [['Spend vs plan','Within ±'+pct(G.tol),'Actual ÷ planned spend, month to date','Platforms + finance accruals','Weekly'],
  ['Incremental new retailers',n0(k.newRetailers),'Platform first orders × incrementality factor','Calibrated MTA, MMM','Weekly / monthly'],
  ['Retailer iCAC',usd(k.rICAC),'Retailer acquisition spend ÷ incremental new retailers','Calibrated MTA, MMM','Weekly / monthly'],
  ['Incremental new brands',n0(k.newBrands),'Activated brands × incrementality factor','CRM + MMM','Monthly'],
  ['Brand iCAC',usd(k.bICAC),'Brand acquisition spend ÷ incremental new brands','CRM + MMM','Monthly'],
  ['Network balance',k.balance,'New retailers per new brand, against the band','Growth Plan','Monthly'],
  ['First-year GMV from media','$'+compact(k.gmvY1),'Incremental retailers, brands and win-back reorders','Cohort GMV','Monthly'],
  ['LTV : iCAC',x1(k.rLtvCac)+' / '+x1(k.bLtvCac),'Retailers / brands, against the '+x1(G.ltvTarget)+' guardrail','Cohort LTV','Quarterly'],
  ['Retailer payback',mo(k.rPayback),'Months of contribution to repay iCAC','Finance','Quarterly'],
  ['Win-back iROAS',x1(k.wbGMV/Math.max(1,t.winbackBudget)),'Incremental GMV over holdout ÷ win-back spend','Holdouts','Monthly']]}
function renderRhythm(R){const cal=rhythmCal(R);
 return `<div class="panel mp" style="display:flex;flex-direction:column;gap:18px">
 <div><div class="eyebrow">${esc(TIERNAME[R.tier])} version · operating rhythm</div><h2 style="font-size:20px;margin-top:2px">Who meets when, what they look at, and what they are allowed to decide</h2>
 <div class="note">Each forum has one job and one output. Budget moves follow the decision rights on the Budget Governance tab; the numbers come from the Measurement tab.</div></div>
 <div class="tscroll"><table><thead><tr><th>Cadence</th><th>Forum</th><th>Who</th><th>Looks at</th><th>Decides</th><th>Output</th></tr></thead><tbody>
 ${RHYTHM.map(r=>`<tr><td><strong>${esc(r[0])}</strong></td>${r.slice(1).map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
 <div><h3 style="font-size:14px;margin-bottom:6px">Calendar for this flight</h3><div class="tscroll"><table><thead><tr><th></th>${R.months.map(m=>`<th style="text-align:center">${monthLabel(m)}</th>`).join('')}</tr></thead><tbody>
 ${cal.map(([n,c])=>`<tr><td style="white-space:nowrap">${esc(n)}</td>${c.map(x=>`<td style="font-size:11px;min-width:84px;text-align:center">${esc(x).replace(/, /g,'<br>')}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
 <div><h3 style="font-size:14px;margin-bottom:6px">Exec scorecard: the ten numbers every review starts with</h3><div class="tscroll"><table><thead><tr><th>Metric</th><th class="n">Plan</th><th>Definition</th><th>Source</th><th>Reviewed</th></tr></thead><tbody>
 ${scorecard(R).map(r=>`<tr><td>${esc(r[0])}</td><td class="n"><strong>${esc(r[1])}</strong></td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td>${esc(r[4])}</td></tr>`).join('')}</tbody></table></div>
 <p class="note" style="margin-top:6px">Exec numbers are incremental; platform-reported metrics stay in the channel teams' day-to-day optimization.</p></div></div>`}
function rhythmAOA(R){return [['OPERATING RHYTHM · '+TIERNAME[R.tier]],['Cadence','Forum','Who','Looks at','Decides','Output'],...RHYTHM,[],['Calendar',...R.months.map(monthLabel)],...rhythmCal(R).map(([n,c])=>[n,...c]),[],['Metric','Plan','Definition','Source','Reviewed'],...scorecard(R)]}

/* ---------- Measurement: MTA, MMM and lift, and which one decides what ---------- */
const STACK=[
 ['Platform attribution & MTA','Which ad, audience and keyword drove a sign-up or first order','Daily to weekly','Bids, creative and audiences inside a channel','Tends to credit retargeting and branded search generously, and sees each walled garden separately, so it is read with the incrementality factor applied.'],
 ['Marketing mix model (MMM)','How much each channel adds at the margin, and where the curve flattens','Refreshed quarterly on weekly data','The mix across channels and the split between retailers, brands and win-back','Reads slowly and leans on its priors, so each lift test feeds back into it.'],
 ['Incrementality tests (lift & geo holdouts)','Did this channel cause orders that would not have happened anyway','2–4 tests a quarter; always-on win-back holdouts','Whether a channel works at all; the MMM priors; scale-up of new markets','Holds back some reach while running and reads one channel at a time, so tests are scheduled through the year.']];
const DECIDE=[['Bids, budgets inside a campaign','Platform / MTA','Daily'],['Which channel gets next month’s money','MMM marginal iCAC, calibrated by lift','Monthly'],['Split between retailers, brands and win-back','MMM + cohort LTV','Quarterly'],['Keep, scale or kill a channel','Lift test or geo holdout','Per test'],['Win-back and retargeting spend','Always-on holdout','Monthly'],['Launch or scale a market','Geo holdout','Per market']];
function measRows(t){const byId=Object.fromEntries(t.p.channels.map(c=>[c.id,c]));
 const rows=t.rows.filter(r=>r.spend>0).map(r=>{const c=byId[r.id]||{};const gap=c.lift!=null&&c.mmm?Math.abs(c.lift/c.mmm-1):null;
  return {...r,mmm:c.mmm,lift:c.lift,src:c.liftSrc||'',gap,used:c.lift!=null?'Lift':'MMM'}}).sort((a,b)=>b.spend-a.spend);
 let q=0;const Q=['Q1','Q1','Q2','Q2','Q3','Q3','Q4','Q4'];rows.forEach(r=>{r.next=r.lift==null?(q<Q.length?`${/search|google/i.test(r.name)?'Geo holdout':/meta|tiktok|pinterest|reddit|linkedin/i.test(r.name)?'Conversion lift':'Geo holdout'} · ${Q[q++]}`:'Next year'):r.gap>0.15?'Re-weight the MMM prior':'Re-test in 12 months'});
 return rows}
function renderMeas(R){const t=planOf(R),rows=measRows(t),cov=sum(rows.filter(r=>r.lift!=null).map(r=>r.spend))/Math.max(1,sum(rows.map(r=>r.spend))),attr=sum(rows.map(r=>r.attributed||0)),inc=sum(rows.map(r=>r.incremental));
 return `<div class="panel mp" style="display:flex;flex-direction:column;gap:18px">
 <div><div class="eyebrow">${esc(TIERNAME[R.tier])} version · measurement</div><h2 style="font-size:20px;margin-top:2px">Three reads, one number per decision: ${n0(inc)} incremental new customers from ${n0(attr)} platform-reported</h2>
 <div class="note">MTA is fast, MMM sees the whole mix, and lift tests give the cleanest read on one channel at a time. Lift calibrates the MMM, and the MMM's incrementality factor corrects MTA, so every forum works from the same number.</div></div>
 <div class="tiles">${tile(pct(inc/Math.max(1,attr)),'Incremental share of platform-reported','','Incremental new customers ÷ platform-attributed new customers, across acquisition channels.')}${tile(pct(cov),'Spend with a lift read','','Share of acquisition spend in channels with a lift test or geo holdout behind the incrementality factor.')}${tile(String(rows.filter(r=>r.lift==null).length),'Channels to test','','Channels running on an MMM read only. The roadmap below schedules a test for each, biggest spend first.')}</div>
 <div class="mp-grid">${STACK.map(s=>`<div class="mp-card"><h3>${esc(s[0])}</h3><p><strong>Answers:</strong> ${esc(s[1])}</p><p><strong>Cadence:</strong> ${esc(s[2])}</p><p><strong>Decides:</strong> ${esc(s[3])}</p><p class="note">${esc(s[4])}</p></div>`).join('')}</div>
 <div><h3 style="font-size:14px;margin-bottom:6px">Which read decides what</h3><div class="tscroll"><table><thead><tr><th>Decision</th><th>Source of truth</th><th>Cadence</th></tr></thead><tbody>${DECIDE.map(d=>`<tr>${d.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
 <div><h3 style="font-size:14px;margin-bottom:6px">Triangulation and test roadmap by channel</h3><div class="tscroll"><table><thead><tr><th>Channel</th><th>Side</th><th class="n">Spend</th><th class="n">Platform-reported</th><th class="n">MMM factor</th><th class="n">Lift read</th><th>Lift source</th><th>Factor used</th><th class="n">Incremental</th><th class="n">iCAC</th><th>Next calibration</th></tr></thead><tbody>
 ${rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${SIDE_NAME[r.side]}</td><td class="n">${money(r.spend)}</td><td class="n">${n0(r.attributed)}</td><td class="n">${pct(r.mmm||0)}</td><td class="n">${r.lift!=null?pct(r.lift):'—'}</td><td>${esc(r.src)||'—'}</td><td>${r.used}</td><td class="n">${n0(r.incremental)}</td><td class="n">${usd(r.iCAC)}</td><td>${esc(r.next)}</td></tr>`).join('')}</tbody></table></div>
 <p class="note" style="margin-top:6px">Edit the MMM and lift reads on the Channel Incrementality tab; this table and every iCAC update with them.</p></div>
 <div class="mp-card"><h3>Data foundations</h3><ul class="assump">
  <li>Server-side conversions: Meta Conversions API, Google enhanced conversions, TikTok Events API.</li>
  <li>Import approved retailers and first orders back to the platforms, so they optimize to buyers and not sign-ups.</li>
  <li>One naming and UTM taxonomy across agencies (the Tagging tab), so MTA, MMM and finance join on the same keys.</li>
  <li>A weekly spend and outcome feed by channel and market for the MMM, plus a holdout registry so tests never overlap.</li></ul></div></div>`}
function measAOA(R){const t=planOf(R);return [['MEASUREMENT · '+TIERNAME[R.tier]],['Method','Answers','Cadence','Decides','Limits'],...STACK,[],['Decision','Source of truth','Cadence'],...DECIDE,[],
 ['Channel','Side','Spend','Platform-reported','MMM factor','Lift read','Lift source','Factor used','Incremental','iCAC','Next calibration'],...measRows(t).map(r=>[r.name,SIDE_NAME[r.side],Math.round(r.spend),Math.round(r.attributed),r.mmm,r.lift??'',r.src,r.used,Math.round(r.incremental),Math.round(r.iCAC),r.next])]}

/* ---------- Setup wizard: what the plan still needs, section by section ---------- */
// Each step points at a section of the inputs pane (or a tab) and returns what is still missing ('' = done).
function setupSteps(){const R=compute(UI.tier===3?1:UI.tier),sp=splitOf(),on=S.markets.filter(m=>m.on&&+m.weight>0),P=S.personas||{};
 const sideHas=k=>R.lines.some(l=>l.side===k),C=S.copy||{},cIni=C.ini||[];
 const inFlight=m=>m.month&&m.month>=String(S.start).slice(0,7)&&m.month<=String(S.end).slice(0,7);
 const list=a=>a.filter(Boolean).join(', ');
 return [
  ['brief','d-brief','GTM brief',()=>list([!S.name&&'a plan name',!S.product&&'the product',!(S.brief||'').trim()&&'the GTM brief (upload or paste it)'])],
  ['budget','d-budget','Budget & flight',()=>{const b=TIERS.map(t=>+S.budgets[t]||0);return list([b.some(x=>!(x>0))&&'a budget for Low, Medium and High',b[0]>b[1]||b[1]>b[2]?'Low ≤ Medium ≤ High':'',!(parseD(S.end)>parseD(S.start))&&'flight dates (end after start)'])}],
  ['markets','d-mkt','Markets',()=>!on.length?'at least one market with a weight':Math.abs(sum(on.map(m=>+m.weight))-100)>1?'market weights add to '+Math.round(sum(on.map(m=>+m.weight)))+'%, not 100%':''],
  ['audiences','d-aud','Audiences',()=>list([!(P.dm?.on&&P.dm.label)&&'a retailer (demand) audience',!(P.tech?.on&&P.tech.label)&&sp.brand>0&&'a brand (supply) audience',!(P.user?.on&&P.user.label)&&sp.winback>0&&'an existing / lapsed retailer audience for win-back'])],
  ['initiatives','d-ini','Initiatives & pillars',()=>!S.initiatives.length?'the initiatives and their message pillars':S.initiatives.some(i=>!i.pillar)?'a message pillar for every initiative':sideHas('winback')&&!S.initiatives.some(i=>i.stage==='Conversion')?'a Conversion-stage initiative for the win-back lines':''],
  ['moments','d-mom','Launch moments',()=>{if(!S.moments.length)return 'market weeks, trade shows, launches or seasons';const n=S.moments.filter(m=>!inFlight(m)).length;return n?n+' moment'+(n>1?'s fall':' falls')+' outside the flight':''}],
  ['channels','d-ch','Channels',()=>{if(!CH.some(c=>S.channels[c.id]?.on))return 'the channels you will run';return list([!sideHas('retailer')&&'a retailer-acquisition channel',sp.brand>0&&!sideHas('brand')&&'a brand-acquisition channel (LinkedIn, Meta lead ads, search…)',sp.winback>0&&!sideHas('winback')&&'a win-back channel (Retargeting & CRM audiences)'])}],
  ['volume','d-vol','Creative volume',()=>TIERS.some(t=>!(+S.concepts[t]>0)||!(+S.refresh[t]>0))?'concepts and refresh weeks for every version':''],
  ['units','d-units','Creative units',()=>{const miss=CH.filter(c=>S.channels[c.id]?.on&&on.some(m=>eligible(c,m))&&!R.lines.some(l=>l.c.id===c.id)).map(c=>c.name);return miss.length?'ad units for '+miss.join(', '):''}],
  ['copy','d-copy','Messaging & ad copy',()=>{const n=S.initiatives.filter((x,i)=>!(cIni[i]&&linesOf(cIni[i].h).length&&linesOf(cIni[i].b).length)).length;return list([n&&'headlines and body copy for '+n+' initiative'+(n>1?'s':''),!linesOf(C.ctas).length&&'CTAs'])}],
  ['economics','tab:growth','Unit economics (Growth Plan)',()=>S.name!==EX_NAME&&!mp().retailer?'your own AOV, reorder and take rates (still on planning defaults)':'']
 ].map(([id,card,label,f])=>({id,card,label,gap:f()}))}
function wizardHtml(compact){const st=setupSteps(),done=st.filter(x=>!x.gap).length,next=st.find(x=>x.gap),su=S.setup||{},qs=(su.missing||[]).map((m,i)=>({...m,i})).filter(m=>!m.done);
 const head=`<div class="wz-head"><b>${done} of ${st.length} ready</b><div class="wz-bar"><i style="width:${(done/st.length*100).toFixed(1)}%"></i></div></div>`;
 const nextBox=next?`<div class="wz-next"><span class="wz-k">Next</span><b>${esc(next.label)}</b><span>Needs ${esc(next.gap)}.</span>${qs.filter(m=>m.step===next.id).slice(0,2).map(m=>`<span class="note">${esc(su.how||'The AI')} asks: ${esc(m.question)}</span>`).join('')}<button type="button" class="btn sm primary" data-wz-open="${next.card}">Open ${esc(next.label)}</button></div>`:'<div class="wz-next ok"><b>Every section has what it needs.</b></div>';
 if(compact)return head+nextBox;
 const lst=`<ol class="wz-list">${st.map(x=>`<li class="${x.gap?'':'ok'}"><button type="button" class="lnk" data-wz-open="${x.card}">${esc(x.label)}</button>${x.gap?`<span>${esc(x.gap)}</span>`:''}</li>`).join('')}</ol>`;
 const ask=qs.length?`<div class="wz-qs"><b>Questions from ${esc(su.how||'the AI')}</b><p class="note">Answer what you can, then send. It re-reads the brief with your answers and refills the inputs.</p>${qs.map(m=>`<label class="f">${esc(m.question)}<input type="text" data-wz-q="${m.i}" value="${esc(m.answer||'')}"></label>`).join('')}<div class="btns"><button type="button" class="btn sm primary" id="btn-wz-send">Send answers</button><button type="button" class="lnk" id="btn-wz-clear">Dismiss questions</button></div></div>`:'';
 const assumed=(su.assumed||[]).length?`<div class="wz-sub"><b>What ${esc(su.how||'the AI')} assumed</b><ul class="wz-as">${su.assumed.map(a=>`<li>${esc(a)}</li>`).join('')}</ul></div>`:'';
 const from=su.at?`<p class="note">Filled from the brief by ${esc(su.how||'the AI')} on ${esc(su.at)}.</p>`:'';
 return `<div class="wz-title">Setup checklist</div>`+head+from+nextBox+ask+assumed+lst}
function renderWizard(){const w=$('#setup-wizard');if(!w)return;if(w.contains(document.activeElement)&&document.activeElement.dataset.wzQ!=null)return;w.innerHTML=wizardHtml(false)}
function openStep(card){if(card.startsWith('tab:')){UI.tab=card.slice(4);if(UI.tier===3)UI.tier=1;save();renderOut();$('#view').scrollIntoView({behavior:'smooth',block:'start'});return}
 const d=document.getElementById(card);if(!d)return;d.open=true;if(innerWidth<=980&&$('.rail'))$('.rail').scrollIntoView();d.scrollIntoView({behavior:'smooth',block:'start'});d.classList.remove('wz-flash');void d.offsetWidth;d.classList.add('wz-flash');
 const f=d.querySelector('input:not([type=checkbox]):not([type=hidden]),textarea,select');if(f)setTimeout(()=>f.focus({preventScroll:true}),350)}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-wz-open]');if(b){e.preventDefault();openStep(b.dataset.wzOpen);return}
 if(e.target.id==='btn-wz-send'){const a=(S.setup?.missing||[]).filter(m=>!m.done&&(m.answer||'').trim());if(!a.length)return setStatus('#extract-status','Answer at least one question first.',true);
  if(typeof window.runExtractFor!=='function')return;window.runExtractFor(a.map(m=>'Q: '+m.question+'\nA: '+m.answer).join('\n\n'))}
 if(e.target.id==='btn-wz-clear'){(S.setup?.missing||[]).forEach(m=>m.done=true);save();renderWizard()}});
document.addEventListener('input',e=>{const i=e.target.dataset&&e.target.dataset.wzQ;if(i==null||!S.setup)return;S.setup.missing[+i].answer=e.target.value;save()});
// the inputs pane changes without a re-render of the plan on some fields: refresh the checklist after any edit there
document.addEventListener('change',e=>{if(e.target.closest&&e.target.closest('.rail')&&!e.target.closest('#setup-wizard'))setTimeout(renderWizard,150)});

window.MP_TABS={mpmix:renderMix,winback:renderWinback,intl:renderIntl,gov:renderGov,rhythm:renderRhythm,meas:renderMeas};
window.MP_AOA={mpmix:mixAOA,winback:wbAOA,intl:intlAOA,gov:govAOA,rhythm:rhythmAOA,meas:measAOA};
window.MP_NAMES={mpmix:'Channel Incrementality',winback:'Win-back',intl:'International',gov:'Budget Governance',rhythm:'Operating Rhythm',meas:'Measurement'};

/* ---------- wiring ---------- */
function setPath(path,v){const ks=path.split('.').map(k=>k.replace('~','|')),o=mp();let x=o;
 for(let i=0;i<ks.length-1;i++)x=x[ks[i]]=x[ks[i]]||{};x[ks[ks.length-1]]=v}
function wireInputs(){$('#view').querySelectorAll('.mp-in').forEach(el=>el.onchange=()=>{const path=el.dataset.mp,kind=el.dataset.kind;
 if(path.startsWith('weight.')){const m=S.markets.find(x=>x.id===path.slice(7));if(m)m.weight=Math.max(0,+el.value||0);if(typeof renderInputs==='function')renderInputs();return changed()}
 let v=el.value;if(kind!=='txt'){if(v===''){v=path.endsWith('.lift')?null:undefined}else{v=Math.max(0,+v);if(kind==='pct')v/=100;if(kind==='m')v*=1e6}}
 if(v===undefined)return;setPath(path,v);changed()})}
window.mpWire=function(tab){wireInputs();
 const b=$('#mp-best');if(b)b.onclick=()=>{S.split={...splitOf(),brand:+b.dataset.v};syncSplit();changed()};
 const r=(id,k)=>{const e=$(id);if(e)e.onclick=()=>{k.forEach(x=>delete mp()[x]);changed()}};
 r('#mp-reset-econ',['retailer','brand','network','balance']);r('#mp-reset-ch',['ch']);r('#mp-reset-wb',['wb']);r('#mp-reset-mk',['mk']);r('#mp-reset-gov',['gov']);
 const ra=$('#mp-reset-act');if(ra)ra.onclick=()=>{const R=compute(UI.tier);delete (mp().act||{})[TIERS[R.tier]];changed()};
 const ea=$('#mp-ex-act');if(ea)ea.onclick=()=>{const R=compute(UI.tier),P=monthlyPlan(R),T=TIERS[R.tier];mp().act=mp().act||{};const a=mp().act[T]={};[0.98,1.04,0.96].forEach((f,i)=>{if(P[i])a[P[i].m]=Math.round(P[i].total*f)});changed()}};

/* ---------- JD-based split sliders (section 2) ---------- */
const splitOf=()=>({...SPLIT_DEF,...(S.split||{})});
function syncSplit(){const sp=splitOf(),b=$('#sp-brand'),w=$('#sp-wb');if(!b)return;
 b.value=Math.round(sp.brand*100);w.value=Math.round(sp.winback*100);$('#sp-brand-o').textContent=b.value+'%';$('#sp-wb-o').textContent=w.value+'%';
 const T=TIERS[UI.tier===3?1:UI.tier],tot=+S.budgets[T]||0,wb=tot*sp.winback,br=(tot-wb)*sp.brand,re=tot-wb-br;
 $('#sp-note').innerHTML=`${esc(TIERNAME[UI.tier===3?1:UI.tier])} version: retailers <strong>${money(re)}</strong> (${pct(re/(tot||1))}) · brands <strong>${money(br)}</strong> (${pct(br/(tot||1))}) · win-back <strong>${money(wb)}</strong> (${pct(wb/(tot||1))}). Every media line is rescaled to land on this split; channel weights decide the mix inside each side.`}
function wireSplit(){const b=$('#sp-brand'),w=$('#sp-wb');if(!b)return;
 const live=()=>{S.split={brand:+b.value/100,winback:+w.value/100};syncSplit()};
 b.oninput=live;w.oninput=live;b.onchange=w.onchange=()=>{live();changed()};
 $('#sp-reset').onclick=()=>{S.split={...SPLIT_DEF};syncSplit();changed()};syncSplit()}
if(!S.split)S.split={...SPLIT_DEF};
const _renderOut=window.renderOut;window.renderOut=function(){_renderOut();syncSplit();renderWizard();
 // on the Summary, a compact "finish setting up" box until every section is ready (not on the example)
 if(UI.tier!==3&&UI.tab==='summary'&&S.name!==EX_NAME&&setupSteps().some(x=>x.gap)){const p=$('#view .panel');if(p)p.insertAdjacentHTML('afterbegin',`<div class="wz-op">${'<h3 style="font-size:14px;margin:0">Finish setting up the plan</h3>'+wizardHtml(true)}</div>`)}};

/* ---------- PDF export: every tab, landscape A4 ---------- */
const LIBS=['https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js','https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'];
const loadScript=src=>new Promise((ok,fail)=>{if(document.querySelector(`script[src="${src}"]`))return ok();const el=document.createElement('script');el.src=src;el.onload=ok;el.onerror=()=>fail(new Error('could not load '+src));document.head.appendChild(el)});
// html2canvas cannot parse color-mix() / color(): bake those into plain rgba on the cloned page
const COLOR_PROPS=['color','background-color','border-top-color','border-right-color','border-bottom-color','border-left-color','outline-color','text-decoration-color'];
function fixColors(doc){const cv=document.createElement('canvas');cv.width=cv.height=1;const cx=cv.getContext('2d',{willReadFrequently:true});
 const rgba=v=>{cx.clearRect(0,0,1,1);cx.fillStyle='#000';cx.fillStyle=v;cx.fillRect(0,0,1,1);const d=cx.getImageData(0,0,1,1).data;return `rgba(${d[0]},${d[1]},${d[2]},${(d[3]/255).toFixed(3)})`};
 doc.querySelectorAll('*').forEach(el=>{const cs=doc.defaultView.getComputedStyle(el);COLOR_PROPS.forEach(p=>{const v=cs.getPropertyValue(p);if(/color\(|color-mix|oklch|oklab|lab\(|lch\(/.test(v))el.style.setProperty(p,rgba(v),'important')});
  ['box-shadow','background-image'].forEach(p=>{const v=cs.getPropertyValue(p);if(/color\(|color-mix|oklch|oklab/.test(v))el.style.setProperty(p,'none','important')})})}
async function exportPDF(btn){const label=btn.textContent,root=document.documentElement,theme=root.getAttribute('data-theme'),was={tab:UI.tab,tier:UI.tier};
 btn.disabled=true;btn.textContent='Building PDF…';
 try{for(const s of LIBS)await loadScript(s);
  const pdf=new window.jspdf.jsPDF({orientation:'landscape',unit:'pt',format:'a4'}),W=pdf.internal.pageSize.getWidth(),H=pdf.internal.pageSize.getHeight(),m=24;
  root.setAttribute('data-theme','light');document.body.classList.add('exporting');if(UI.tier===3)UI.tier=1;
  const bg=getComputedStyle(document.body).backgroundColor,rgb=(bg.match(/\d+/g)||[255,255,255]).slice(0,3).map(Number),main=document.querySelector('.wrap');let first=true;
  for(const [k,name] of TABS){UI.tab=k;renderOut();await new Promise(r=>setTimeout(r,80));
   const canvas=await window.html2canvas(main,{scale:1.5,backgroundColor:bg,windowWidth:1400,onclone:fixColors});
   const pxPerPt=canvas.width/(W-m*2),sliceH=Math.floor((H-m*2-10)*pxPerPt);
   for(let y=0;y<canvas.height;y+=sliceH){const part=document.createElement('canvas');part.width=canvas.width;part.height=Math.min(sliceH,canvas.height-y);
    part.getContext('2d').drawImage(canvas,0,y,canvas.width,part.height,0,0,canvas.width,part.height);
    if(!first)pdf.addPage();first=false;pdf.setFillColor(rgb[0],rgb[1],rgb[2]);pdf.rect(0,0,W,H,'F');
    pdf.addImage(part.toDataURL('image/jpeg',0.92),'JPEG',m,m,W-m*2,part.height/pxPerPt);
    pdf.setFontSize(8);pdf.setTextColor(125,116,105);pdf.text(`${S.name||'Paid media plan'} · ${TIERNAME[UI.tier]} · ${name} · illustrative`,m,H-10)}}
  pdf.save(`${slugU(S.name||'paid-media-plan')}-${TIERS[UI.tier]}.pdf`);setStatus('#x-status','PDF downloaded: every tab, landscape A4.')}
 catch(e){setStatus('#x-status','The PDF could not be built ('+e.message+'). Check the connection and try again.',true)}
 finally{document.body.classList.remove('exporting');if(theme==null)root.removeAttribute('data-theme');else root.setAttribute('data-theme',theme);
  UI.tab=was.tab;UI.tier=was.tier;renderOut();btn.disabled=false;btn.textContent=label}}
const pb=$('#x-pdf');if(pb)pb.onclick=()=>exportPDF(pb);
wireSplit();
})();
