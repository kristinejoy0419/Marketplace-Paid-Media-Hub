/* ==================== MARKETPLACE ADDITIONS ====================
   Loaded after js/hub.js. Adds what a two-sided marketplace needs on top of the Paid Media Hub:
   the JD-based budget split (section 2), a two-sided Growth Plan, Channel Incrementality,
   Retargeting & Win-back and International tabs, summary tiles and PDF export.
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

window.MP_TABS={mpmix:renderMix,winback:renderWinback,intl:renderIntl};
window.MP_AOA={mpmix:mixAOA,winback:wbAOA,intl:intlAOA};
window.MP_NAMES={mpmix:'Channel Incrementality',winback:'Win-back',intl:'International'};

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
 r('#mp-reset-econ',['retailer','brand','network','balance']);r('#mp-reset-ch',['ch']);r('#mp-reset-wb',['wb']);r('#mp-reset-mk',['mk'])};

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
