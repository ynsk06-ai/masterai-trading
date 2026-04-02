    if(gnn){safeSetText('gnn-top',gnn.topCorr+' ('+gnn.sector+')');safeSetText('gnn-sector',gnn.sectorScore+'%');safeSetText('gnn-beta',gnn.beta);drawGNNGraph(currentSym||'XU100');}
    updateModelSelectorUI();
    updateFeedbackUI();
    updateCurrentParamsDisplay();
  } catch(e) { console.warn('updateMLPanels error:', e); }
}

function updateModelSelectorUI() {
  try {
    const sel=document.getElementById('modelSelector');if(!sel)return;
    sel.innerHTML=Object.values(ML.models).map(m=>`<div class="model-chip ${m.trained?'active':''}"><div class="model-chip-name">${m.name}</div><div class="model-chip-acc" style="color:${m.acc>0.65?'var(--green)':'var(--orange)'};">${m.trained?Math.round(m.acc*100)+'%':'—'}</div></div>`).join('');
  } catch(e) {}
}

/* ═══════════════════════════════════════════════════════
   PANEL UPDATES
   ═══════════════════════════════════════════════════════ */
function updateAllPanels(sym, r) {
  if (!r) return;
  try {
    const lc=r.closes[r.closes.length-1],pc=r.closes[r.closes.length-2]||lc,chg=(lc-pc)/pc*100;
    liveSymbolPrices[sym] = lc;
    safeSetText('hdr-ticker',sym);safeSetText('hdr-price',lc.toFixed(2));
    const hp=document.getElementById('hdr-price');if(hp)hp.className='ticker-price '+(chg>=0?'price-up':'price-dn');
    safeSetText('hdr-change',(chg>=0?'+':'')+fmt(chg)+'%');
    const hc=document.getElementById('hdr-change');if(hc)hc.className='ticker-change '+(chg>=0?'price-up':'price-dn');
    const m=r.master;
    safeSetText('mt-ticker',sym);
    safeSetHTML('mt-cbuy',`<span class="${badgeClass(m.buyConsensus-0.5)}">${(m.buyConsensus*100).toFixed(0)}%</span>`);
    safeSetHTML('mt-csell',`<span class="${badgeClass(-(m.sellConsensus-0.5))}">${(m.sellConsensus*100).toFixed(0)}%</span>`);
    safeSetText('mt-dbt',fmt(m.dynBuyTh));safeSetText('mt-dst',fmt(m.dynSellTh));
    safeSetHTML('mt-pnl',`<span class="${pnlClass(m.masterPnL)}">${fmt(m.masterPnL)}%</span>`);
    const mPosEl=document.getElementById('masterPosBadge');
    if(mPosEl){if(m.inMaster){const op=(lc-m.masterEntry)/m.masterEntry*100;mPosEl.textContent='AÇIK %'+fmt(op);mPosEl.className='badge '+badgeClass(op);}else{mPosEl.textContent='YOK';mPosEl.className='badge badge-gray';}}
    const buyBarEl=document.getElementById('buyConsBar'),selBarEl=document.getElementById('sellConsBar');
    if(buyBarEl)buyBarEl.style.width=Math.min(100,m.buyConsensus*100)+'%';
    if(selBarEl)selBarEl.style.width=Math.min(100,m.sellConsensus*100)+'%';
    const ps=r.priceState,psBig=document.getElementById('priceStateBig');
    if(psBig){psBig.textContent=ps.text;psBig.style.background=ps.color+'25';psBig.style.color=ps.color;psBig.style.border='1px solid '+ps.color+'50';}
    safeSetHTML('priceStateBadge',`<span class="badge ${ps.cls}">${ps.text}</span>`);
    safeSetText('chartTitle',`${sym} — ${document.getElementById('tfSelect')?.value||''}`);
    const s1=r.sys1;safeSetText('s1-ticker',sym);safeSetText('s1-al',s1.buyCount1);safeSetText('s1-sat',s1.sellCount1);safeSetText('s1-kz',s1.winCount1+'/'+s1.lossCount1);safeSetHTML('s1-pnl',`<span class="${pnlClass(s1.totalPnL1)}">${fmt(s1.totalPnL1)}%</span>`);safeSetHTML('s1-fd',`<span class="badge ${ps.cls}">${ps.text}</span>`);
    const s1pos=document.getElementById('sys1PosBadge');if(s1pos){if(s1.inTrade1){const op=(lc-s1.buyPrice1)/s1.buyPrice1*100;s1pos.textContent='AÇIK %'+fmt(op);s1pos.className='badge '+badgeClass(op);}else{s1pos.textContent='YOK';s1pos.className='badge badge-gray';}}
    const s2=r.sys2;safeSetText('s2-ticker',sym);safeSetText('s2-al',s2.buyCount2);safeSetText('s2-sat',s2.sellCount2);safeSetText('s2-kz',s2.winCount2+'/'+s2.lossCount2);safeSetHTML('s2-pnl',`<span class="${pnlClass(s2.totalPnL2)}">${fmt(s2.totalPnL2)}%</span>`);safeSetText('s2-score',s2.score2);
    const s2pos=document.getElementById('sys2PosBadge');if(s2pos){if(s2.inTrade2){const op=(lc-s2.entry2)/s2.entry2*100;s2pos.textContent='AÇIK %'+fmt(op);s2pos.className='badge '+badgeClass(op);}else{s2pos.textContent='YOK';s2pos.className='badge badge-gray';}}
    const fs=r.fusion;safeSetText('fs-ticker',sym);safeSetText('fs-al',fs.fusionBuyCnt);safeSetText('fs-sat',fs.fusionSellCnt);safeSetText('fs-kz',fs.fusionWinCnt+'/'+fs.fusionLossCnt);safeSetHTML('fs-pnl',`<span class="${pnlClass(fs.fusionTotalPnL)}">${fmt(fs.fusionTotalPnL)}%</span>`);safeSetHTML('fs-fd',`<span class="badge ${ps.cls}">${ps.text}</span>`);
    const fspos=document.getElementById('fusionPosBadge');if(fspos){if(fs.inFusion){const op=(lc-fs.fusionEntry)/fs.fusionEntry*100;fspos.textContent='AÇIK %'+fmt(op);fspos.className='badge '+badgeClass(op);}else{fspos.textContent='YOK';fspos.className='badge badge-gray';}}
    const q=r.quantum;
    for(let i=0;i<5;i++){const qb=document.getElementById('qb'+i);if(qb)qb.style.width=(q.qs[i]*100).toFixed(0)+'%';safeSetText('qv'+i,(q.qs[i]*100).toFixed(0)+'%');}
    safeSetText('q-prob',fmt(q.quantumProb*100)+'%');safeSetText('q-nn',fmt(q.nnForecast));safeSetText('q-fused',fmt(q.fusedProb*100)+'%');safeSetText('q-adx',fmt(r.adxLast));safeSetText('q-zscore',fmt(q.zScore));
    const ag=r.agents;const agIds=['ag-60','ag-61','ag-62','ag-81','ag-120'];
    for(let i=0;i<5;i++){const el=document.getElementById(agIds[i]);if(el){el.textContent=fmt(ag.agPnL[i])+'%';el.className='agent-pnl '+(ag.agPnL[i]>=0?'price-up':'price-dn');}}
    let bI=0,bPnL=-Infinity;for(let i=0;i<5;i++)if(ag.agPnL[i]>bPnL){bPnL=ag.agPnL[i];bI=i;}
    const aN=['A60','A61','A62','A81','A120'];
    safeSetText('ba-name',aN[bI]);safeSetText('ba-als',ag.agBuyCnt[bI]+'/'+ag.agSellCnt[bI]);safeSetText('ba-kz',ag.agWinCnt[bI]+'/'+ag.agLossCnt[bI]);safeSetHTML('ba-pnl',`<span class="${pnlClass(bPnL)}">${fmt(bPnL)}%</span>`);
    const bIT=ag.agStates[bI],bOP=bIT?(lc-ag.agEntries[bI])/ag.agEntries[bI]*100:null;
    safeSetHTML('ba-pos',bIT?`<span class="badge ${badgeClass(bOP)}">AÇIK %${fmt(bOP)}</span>`:'<span class="badge badge-gray">YOK</span>');
    safeSetText('ba-rep',fmt(ag.agRep[bI]));
    // Sync open positions from result
    syncOpenPositionsFromResult(sym, r, lc);
    renderSignalLog(r.signals, sym);
    updateOpenPositionsPanel(r, lc);
    updateKVStats();
  } catch(e) { console.warn('updateAllPanels error:', e); }
}

function syncOpenPositionsFromResult(sym, r, lc) {
  // Sync result-based positions into openPositions store
  // and detect newly closed positions for auto-learning
  const tf = currentTF;
  const systems = [
    { key: `${sym}-${tf}-master`, inTrade: r.master.inMaster, entry: r.master.masterEntry, sys: 'Master AI' },
    { key: `${sym}-${tf}-sys1`,   inTrade: r.sys1.inTrade1,   entry: r.sys1.buyPrice1,     sys: 'Sistem 1' },
    { key: `${sym}-${tf}-sys2`,   inTrade: r.sys2.inTrade2,   entry: r.sys2.entry2,         sys: 'PRO' },
    { key: `${sym}-${tf}-fusion`, inTrade: r.fusion.inFusion, entry: r.fusion.fusionEntry,  sys: 'Fusion' },
  ];
  const aN = ['A60','A61','A62','A81','A120'];
  for (let i=0;i<5;i++) {
    systems.push({ key:`${sym}-${tf}-${aN[i]}`, inTrade:r.agents.agStates[i], entry:r.agents.agEntries[i], sys:aN[i] });
  }
  for (const s of systems) {
    if (s.inTrade && s.entry > 0) {
      if (!openPositions[s.key]) {
        openPositions[s.key] = { sym, tf, sys:s.sys, entry:s.entry, entryTime:Date.now() - 3600000, highest:s.entry };
      }
    } else {
      if (openPositions[s.key]) {
        closePosition(s.key, lc, Date.now());
      }
    }
  }
}

function updateOpenPositionsPanel(r, lc) {
  const table=document.getElementById('openPosTable');if(!table)return;
  const aN=['A60','A61','A62','A81','A120'];
  let rows=`<tr><td style="color:var(--muted);font-size:10px;">Sistem</td><td style="color:var(--muted);font-size:10px;">Giriş</td><td style="color:var(--muted);font-size:10px;">PnL %</td></tr>`;
  let has=false;
  const addRow=(name,entry)=>{has=true;const p=(lc-entry)/entry*100;rows+=`<tr><td>${name}</td><td>${entry.toFixed(2)}</td><td class="${pnlClass(p)}">${p.toFixed(2)}%</td></tr>`;};
  if(r.master.inMaster)addRow('👑 Master',r.master.masterEntry);
  if(r.sys1.inTrade1)addRow('🔷 Sys1',r.sys1.buyPrice1);
  if(r.sys2.inTrade2)addRow('🔵 Sys2',r.sys2.entry2);
  if(r.fusion.inFusion)addRow('⚡ Fusion',r.fusion.fusionEntry);
  for(let i=0;i<5;i++)if(r.agents.agStates[i])addRow('🤖 '+aN[i],r.agents.agEntries[i]);
  if(!has)rows+=`<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:16px;">Açık pozisyon yok</td></tr>`;
  table.innerHTML=rows;
}

/* ── Signal Log ─────────────────────────────────────── */
function renderSignalLog(signals, sym) {
  const log=document.getElementById('signalLog');if(!log)return;
  if(!signals||!signals.length){log.innerHTML='<div style="padding:20px;text-align:center;color:var(--muted);">Bu sembol için sinyal bulunamadı.</div>';return;}
  const recent=[...signals].reverse().slice(0,50);
  log.innerHTML=recent.map(s=>{
    const d=new Date(s.t),ts=d.toLocaleDateString('tr-TR',{month:'short',day:'numeric'})+' '+d.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
    const cls=s.type==='AL'?'sig-buy':(s.sys==='Master AI'?'sig-master':'sig-sell'),ic=s.type==='AL'?'▲':'▼';
    let detail='';
    if(s.type==='SAT'&&s.pnl!==undefined)detail=`PnL: <span class="${pnlClass(s.pnl)}">${fmt(s.pnl)}%</span>`;
    else if(s.consensus!==undefined)detail=`Consensus: ${(s.consensus*100).toFixed(0)}%`;
    else if(s.score!==undefined)detail=`Score: ${s.score}`;
    else if(s.prob!==undefined)detail=`Prob: ${(s.prob*100).toFixed(0)}%`;
    const border=s.type==='AL'?'sig-item-buy':(s.sys==='Master AI'?'sig-item-master':'sig-item-sell');
    return`<div class="signal-item ${border}"><div class="signal-time">${ts}</div><div class="signal-body"><div class="signal-title ${cls}">${ic} ${s.sys} ${s.type} @ ${fmt(s.price)}</div>${detail?`<div class="signal-detail">${detail}</div>`:''}</div></div>`;
  }).join('');
}

function clearSignals() {
  const sym=document.getElementById('symbolInput')?.value?.trim()?.toUpperCase(),tf=document.getElementById('tfSelect')?.value,key=`${sym}-${tf}`;
  if(allSignals[key])delete allSignals[key];
  saveAllSignals();
  const log=document.getElementById('signalLog');if(log)log.innerHTML='<div style="padding:20px;text-align:center;color:var(--muted);">Temizlendi.</div>';
}

function saveAllSignals() {
  saveLocal('masterai_signals',allSignals);
  kvPush('signals',allSignals).catch(()=>{});
}

/* ── Background Scan ─────────────────────────────────── */
async function backgroundScan() {
  for(const sym of CFG.watchlist){
    for(const tf of LIVE_TFS){
      try{
        const bars=await fetchOHLCV(sym,tf);if(!bars||bars.length<60)continue;
        const result=runIndicators(bars,{...CFG});if(!result)continue;
        liveSymbolPrices[sym] = bars[bars.length-1].c;
        const key=`${sym}-${tf}`,hist=allSignals[key]||[],maxT=hist.length?Math.max(...hist.map(s=>s.t||0)):0;
        const newSigs=result.signals.filter(s=>(s.t||0)>maxT);
        if(newSigs.length){
          allSignals[key]=[...hist,...newSigs];saveAllSignals();
          for(const sig of newSigs){
            const ts=new Date(sig.t).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
            const tvLink=`https://www.tradingview.com/symbols/BIST-${sym}/`;
            const msgBody=`${sig.sys} ${sig.type} → ${sym}(${tf}) @ ${sig.price.toFixed(2)}`;
            const notifItem={time:ts,sym,tf,sys:sig.sys,type:sig.type,price:sig.price,pnl:sig.pnl,t:sig.t,tvLink};
            notificationLog.unshift(notifItem);if(notificationLog.length>300)notificationLog.pop();
            if(new Date(sig.t).toDateString()===new Date().toDateString()){dailySignals.unshift(notifItem);if(dailySignals.length>100)dailySignals.pop();}
            if(sig.type==='AL'){
              showToast(`${sig.sys} AL`,`${sym}(${tf}) @ ${sig.price.toFixed(2)}`,sig.sys==='Master AI'?'master':'buy');
              sendTelegram(`🚨 ${msgBody}\n📊 ${tvLink}`);
              addOpenPosition(key, sym, tf, sig.sys, sig.price, sig.t);
            } else if(sig.type==='SAT'&&sig.pnl!==undefined){
              showToast(`${sig.sys} SAT`,`${sym}(${tf}) PnL: ${fmt(sig.pnl)}%`,sig.pnl>=0?'buy':'sell');
              if(openPositions[key]){
                sendTelegram(`✅ ${sym}(${tf}) KAPANDI\nSistem: ${sig.sys}\nPnL: %${fmt(sig.pnl)}\n📊 ${tvLink}`);
                closePosition(key, sig.price, sig.t);
              }
            }
            if(CFG.notifications&&'Notification'in window&&Notification.permission==='granted')
              new Notification(`⚡ ${sig.sys} ${sig.type}`,{body:msgBody,icon:'/favicon.ico'});
          }
          if(activeTab===1)renderPositionsTab();
          if(activeTab===2)renderNotificationLog();
          if(activeTab===3)renderDailySignals();
        }
      }catch(e){ console.log('bgScan skip:',sym,tf,e.message); }
    }
  }
}

/* ── Main Analyze ─────────────────────────────────────── */
async function analyzeSymbol() {
  const sym=document.getElementById('symbolInput')?.value?.trim()?.toUpperCase(),tf=document.getElementById('tfSelect')?.value;
  if(!sym)return;
  const btn=document.getElementById('analyzeBtn'),loading=document.getElementById('chartLoading'),loadingText=document.getElementById('loadingText');
  if(btn){btn.disabled=true;btn.textContent='⏳ Yükleniyor...';}
  if(loading)loading.style.display='flex';
  if(loadingText)loadingText.textContent=`${sym} verisi çekiliyor...`;
  try{
    document.getElementById('statusDot').className='status-dot';
    const bars=await fetchOHLCV(sym,tf);
    if(loadingText)loadingText.textContent='İndikatörler + ML hesaplanıyor...';
    const result=runIndicators(bars,{...CFG});if(!result)throw new Error('Hesaplama başarısız');
    currentResult=result;currentSym=sym;currentTF=tf;
    liveSymbolPrices[sym]=bars[bars.length-1].c;
    let mlResult=null;
    if(CFG.enableML){try{mlResult=runMLEngine(bars,result);}catch(e){console.warn('ML:',e);}}
    const key=`${sym}-${tf}`,hist=allSignals[key]||[],maxT=hist.length?Math.max(...hist.map(s=>s.t||0)):0;
    const newSigs=result.signals.filter(s=>(s.t||0)>maxT);
    if(newSigs.length){
      allSignals[key]=[...hist,...newSigs];saveAllSignals();
      for(const sig of newSigs){
        const ts=new Date(sig.t).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
        const notifItem={time:ts,sym,tf,sys:sig.sys,type:sig.type,price:sig.price,pnl:sig.pnl,t:sig.t};
        notificationLog.unshift(notifItem);if(new Date(sig.t).toDateString()===new Date().toDateString())dailySignals.unshift(notifItem);
        if(sig.type==='AL'){
          showToast(`${sig.sys} AL`,`${sym} @ ${sig.price.toFixed(2)}`,sig.sys==='Master AI'?'master':'buy');
          if(sig.sys==='Master AI')sendTelegram(`🚨 Master AI AL\n${sym}(${tf}) @ ${sig.price.toFixed(2)}\nConsensus: ${(sig.consensus*100).toFixed(0)}%\nML Conf: ${Math.round(ML.confidence*100)}%`);
        } else if(sig.type==='SAT'&&sig.pnl!==undefined)
          showToast(`${sig.sys} SAT`,`${sym} PnL: ${fmt(sig.pnl)}%`,sig.pnl>=0?'buy':'sell');
      }
    }
    updateAllPanels(sym,result);
    if(mlResult)updateMLPanels(mlResult);
    drawChart(sym,tf,bars,result,mlResult);
    safeSetText('lastUpdate','Son: '+new Date().toLocaleTimeString('tr-TR'));
    document.getElementById('statusDot').className='status-dot';
    showToast('Analiz Tamam',`${sym} ${tf} — ${result.signals.length} sinyal | ML: ${Math.round(ML.confidence*100)}%`,'info');
    if(activeTab===1)renderPositionsTab();
  }catch(e){
    document.getElementById('statusDot').className='status-dot offline';
    showToast('❌ Hata',e.message,'sell');
    console.error(e);
  }
  if(btn){btn.disabled=false;btn.textContent='▶ Analiz Et';}
  if(loading)loading.style.display='none';
}

/* ── Live Scanner ─────────────────────────────────────── */
async function toggleLiveScan() {
  const btn=document.getElementById('liveScanBtn');
  if(isLiveScanning){
    isLiveScanning=false;btn.textContent='🔄 Canlı Tara';btn.style.background='';
    safeSetText('lastUpdate','🛑 Tarayıcı durduruldu');return;
  }
  isLiveScanning=true;btn.textContent='⏹ DURDUR';btn.style.background='rgba(255,23,68,0.2)';
  if(CFG.notifications&&'Notification'in window&&Notification.permission==='default')await Notification.requestPermission();
  let sI=0,tI=0;
  const scanNext=async()=>{
    if(!isLiveScanning)return;
    if(sI>=CFG.watchlist.length){
      safeSetText('lastUpdate','✅ Tur tamamlandı. Bekleniyor...');
      setTimeout(()=>{if(isLiveScanning){sI=0;tI=0;scanNext();}},CFG.refreshSec*1000);return;
    }
    const sym=CFG.watchlist[sI],tf=LIVE_TFS[tI];
    const symInp=document.getElementById('symbolInput');if(symInp)symInp.value=sym;
    const tfSel=document.getElementById('tfSelect');if(tfSel)tfSel.value=tf;
    renderWatchlist();
    const lu=document.getElementById('lastUpdate');if(lu)lu.innerHTML=`🔴 <strong>CANLI</strong> → ${sym}(${tf}) (${sI+1}/${CFG.watchlist.length})`;
    try{
      const loading=document.getElementById('chartLoading');if(loading)loading.style.display='flex';
      const bars=await fetchOHLCV(sym,tf);
      const result=runIndicators(bars,{...CFG});
      if(result){
        currentResult=result;currentSym=sym;currentTF=tf;
        liveSymbolPrices[sym]=bars[bars.length-1].c;
        let mlResult=null;if(CFG.enableML)try{mlResult=runMLEngine(bars,result);}catch{}
        updateAllPanels(sym,result);if(mlResult)updateMLPanels(mlResult);
        drawChart(sym,tf,bars,result,mlResult);
        const key=`${sym}-${tf}`,hist=allSignals[key]||[],maxT=hist.length?Math.max(...hist.map(s=>s.t||0)):0;
        const newSigs=result.signals.filter(s=>(s.t||0)>maxT);
        if(newSigs.length){
          allSignals[key]=[...hist,...newSigs];saveAllSignals();
          newSigs.forEach(sig=>{
            const ts=new Date(sig.t).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
            const ni={time:ts,sym,tf,sys:sig.sys,type:sig.type,price:sig.price,pnl:sig.pnl,t:sig.t};
            notificationLog.unshift(ni);if(new Date(sig.t).toDateString()===new Date().toDateString())dailySignals.unshift(ni);
            if(sig.type==='AL'){
              showToast(`🔔 ${sig.sys} AL`,`${sym}(${tf}) @ ${sig.price.toFixed(2)}`,sig.sys==='Master AI'?'master':'buy');
              sendTelegram(`🚨 ${sig.sys} AL\n${sym}(${tf}) @ ${sig.price.toFixed(2)}`);
              addOpenPosition(key,sym,tf,sig.sys,sig.price,sig.t);
            } else if(sig.type==='SAT'&&sig.pnl!==undefined){
              showToast(`${sig.sys} SAT`,`${sym}(${tf}) PnL: ${fmt(sig.pnl)}%`,sig.pnl>=0?'buy':'sell');
              if(openPositions[key])closePosition(key,sig.price,sig.t);
            }
            if(activeTab===2)renderNotificationLog();
            if(activeTab===3)renderDailySignals();
            if(activeTab===1)renderPositionsTab();
          });
        }
      }
    }catch(e){console.log('Tarama atlandı:',sym,tf,e.message);}
    finally{const loading=document.getElementById('chartLoading');if(loading)loading.style.display='none';}
    tI++;if(tI>=LIVE_TFS.length){tI=0;sI++;}
    setTimeout(scanNext,900);
  };
  scanNext();
}

/* ── Tab Control ─────────────────────────────────────── */
function switchTab(n) {
  activeTab=n;
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('tab'+n)?.classList.add('active');
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
  document.getElementById('content'+n)?.classList.add('active');
  if(n===1)renderPositionsTab();
  if(n===2)renderNotificationLog();
  if(n===3)renderDailySignals();
  if(n===4){
    if(currentResult?.bars){const mlR=runMLEngine(currentResult.bars,currentResult);if(mlR)updateMLPanels(mlR);}
    updateModelSelectorUI();drawGNNGraph(currentSym||'XU100');updateCurrentParamsDisplay();
    renderAutoFeedbackLog();renderSysLearnGrid();
  }
  if(n===6){
    const wUrl=document.getElementById('workerUrlInput');if(wUrl)wUrl.value=CFG.workerUrl||WORKER_URL;
    const uid=document.getElementById('uidInput');if(uid)uid.value=deviceUID;
    safeSetText('currentUID',deviceUID);updateKVStats();
  }
}

function renderNotificationLog() {
  const el=document.getElementById('notificationLog');if(!el)return;
  if(!notificationLog.length){el.innerHTML='<div style="padding:20px;text-align:center;color:var(--muted);">Henüz bildirim yok</div>';return;}
  el.innerHTML=notificationLog.slice(0,200).map(n=>{
    const cls=n.type==='AL'?'sig-buy':'sig-sell';const icon=n.type==='AL'?'▲':'▼';
    const tv=n.tvLink?`<a href="${n.tvLink}" target="_blank" style="color:var(--cyan);font-size:10px;">TradingView</a>`:'';
    const pnlStr=n.pnl!==undefined?` — PnL: <span class="${pnlClass(n.pnl)}">${fmtPct(n.pnl)}</span>`:'';
    return`<div class="signal-item ${n.type==='AL'?'sig-item-buy':'sig-item-sell'}"><div class="signal-time">${n.time}</div><div class="signal-body"><div class="signal-title ${cls}">${icon} ${n.sys} ${n.type} — ${n.sym}(${n.tf||''}) @ ${n.price?.toFixed(2)||'—'}${pnlStr}</div><div class="signal-detail">${tv}</div></div></div>`;
  }).join('');
}

function renderDailySignals() {
  const el=document.getElementById('dailySignalLog'),countEl=document.getElementById('dailyCount');if(!el)return;
  const today=dailySignals.filter(n=>!n.t||new Date(n.t).toDateString()===new Date().toDateString());
  if(countEl)countEl.textContent=today.length+' sinyal bugün';
  if(!today.length){el.innerHTML='<div style="padding:20px;text-align:center;color:var(--muted);">Bugün henüz sinyal oluşmadı</div>';return;}
  el.innerHTML=today.map(n=>{
    const cls=n.type==='AL'?'sig-buy':'sig-sell';const icon=n.type==='AL'?'▲':'▼';
    const ps=n.pnl!==undefined?` PnL: <span class="${pnlClass(n.pnl)}">${fmtPct(n.pnl)}</span>`:'';
    return`<div class="signal-item ${n.type==='AL'?'sig-item-buy':'sig-item-sell'}"><div class="signal-time">${n.time}</div><div class="signal-body"><div class="signal-title ${cls}">${icon} ${n.sys} ${n.type} — ${n.sym}(${n.tf||''}) @ ${n.price?.toFixed(2)||'—'}${ps}</div></div></div>`;
  }).join('');
}

function clearNotifications(){notificationLog=[];renderNotificationLog();}

/* ── Toast ───────────────────────────────────────────── */
function showToast(title, body, type='buy') {
  try {
    const c=document.getElementById('toastContainer');if(!c)return;
    const t=document.createElement('div');t.className=`toast ${type}`;
    t.innerHTML=`<div class="toast-title">${title}</div><div class="toast-body">${body}</div>`;
    c.appendChild(t);setTimeout(()=>{try{t.remove();}catch(e){}},5000);
  } catch(e) {}
}

/* ── Telegram ────────────────────────────────────────── */
function sendTelegram(msg) {
  if(!CFG.tgToken||!CFG.tgChatId)return;
  fetch(`https://api.telegram.org/bot${CFG.tgToken}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:CFG.tgChatId,text:msg,parse_mode:'HTML'})}).catch(()=>{});
}
async function testTelegram() {
  if(!CFG.tgToken||!CFG.tgChatId){alert('Token ve Chat ID giriniz!');return;}
  const r=await fetch(`https://api.telegram.org/bot${CFG.tgToken}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:CFG.tgChatId,text:'✅ Master AI v4.1 AETHER EDITION — Test!'})});
  alert(r.ok?'✅ Telegram başarılı!':'❌ Hata: '+r.status);
}
async function sendPeriodicSummary() {
  if(!CFG.tgToken||!CFG.tgChatId)return;
  const now=Date.now();if(now-lastSummaryTime<CFG.summaryInterval*1000)return;
  lastSummaryTime=now;
  const keys=Object.keys(openPositions);
  let msg=`📊 <b>Master AI v4.1 Özet</b> — ${new Date().toLocaleTimeString('tr-TR')}\nML Conf: ${Math.round(ML.confidence*100)}%\n`;
  if(!keys.length)msg+='Açık pozisyon yok.\n';
  else keys.forEach(k=>{const pos=openPositions[k];const lp=getLatestPrice(pos.sym||k.split('-')[0]);const pnl=lp&&pos.entry?(lp-pos.entry)/pos.entry*100:null;msg+=`• ${k} | ${pos.sys} | PnL: ${pnl!==null?fmtPct(pnl):'—'}\n`;});
  msg+=`Toplam: ${keys.length} açık, ${closedPositions.length} kapalı`;
  sendTelegram(msg);
}

/* ── Watchlist ───────────────────────────────────────── */
function renderWatchlist() {
  const grid=document.getElementById('watchlistGrid');if(!grid)return;
  grid.innerHTML=CFG.watchlist.map(s=>`<div class="watch-chip${currentSym===s?' active':''}" onclick="selectSymbol('${s}')">${s}</div>`).join('');
}
function selectSymbol(s){document.getElementById('symbolInput').value=s;currentSym=s;renderWatchlist();analyzeSymbol();}
function saveInitialWatchlist() {
  const val=document.getElementById('initialWatchlist')?.value?.trim();
  const wUrl=document.getElementById('initialWorkerUrl')?.value?.trim();
  if(val)CFG.watchlist=val.split(',').map(s=>s.trim().toUpperCase()).filter(Boolean);
  if(wUrl)CFG.workerUrl=wUrl;
  saveLocal('masterai_cfg',CFG);localStorage.setItem('masterai_firstlaunch','true');
  document.getElementById('watchlistModal')?.classList.remove('open');
  renderWatchlist();
  if(CFG.notifications&&'Notification'in window)Notification.requestPermission();
  kvPullAll().then(()=>{renderWatchlist();analyzeSymbol();});
}

/* ── Settings ────────────────────────────────────────── */
function loadSettings() {
  const s=loadLocal('masterai_cfg')||{};Object.assign(CFG,s);
  document.getElementById('s_workerUrl').value=CFG.workerUrl||WORKER_URL;
  document.getElementById('tgToken').value=CFG.tgToken||'';
  document.getElementById('tgChatId').value=CFG.tgChatId||'';
  document.getElementById('groqApiKey').value=CFG.groqApiKey||'';
  document.getElementById('refreshSec').value=CFG.refreshSec||60;
  document.getElementById('s_masterBuyTh').value=CFG.masterBuyTh||0.7;
  document.getElementById('s_masterSellTh').value=CFG.masterSellTh||0.3;
  document.getElementById('s_fusionBuyTh').value=CFG.fusionBuyTh||0.8;
  document.getElementById('s_adxMin').value=CFG.adxMin||25;
  document.getElementById('s_notifications').checked=CFG.notifications!==false;
  document.getElementById('enableSys1').checked=CFG.enableSys1!==false;
  document.getElementById('enableSys2').checked=CFG.enableSys2!==false;
  document.getElementById('enableFusion').checked=CFG.enableFusion!==false;
  document.getElementById('enableMaster').checked=CFG.enableMaster!==false;
  document.getElementById('enableAgents').checked=CFG.enableAgents!==false;
  const mlEl=document.getElementById('enableML');if(mlEl)mlEl.checked=CFG.enableML!==false;
  document.getElementById('s_summaryInterval').value=CFG.summaryInterval||1800;
  document.getElementById('s_watchlist').value=CFG.watchlist.join(',');
  currentTheme=CFG.theme||'dark';applyTheme();
}
function saveSettings() {
  CFG.workerUrl=document.getElementById('s_workerUrl').value.trim()||WORKER_URL;
  CFG.tgToken=document.getElementById('tgToken').value.trim();
  CFG.tgChatId=document.getElementById('tgChatId').value.trim();
  CFG.groqApiKey=document.getElementById('groqApiKey').value.trim();
  CFG.refreshSec=Math.max(30,+document.getElementById('refreshSec').value);
  CFG.masterBuyTh=+document.getElementById('s_masterBuyTh').value;
  CFG.masterSellTh=+document.getElementById('s_masterSellTh').value;
  CFG.fusionBuyTh=+document.getElementById('s_fusionBuyTh').value;
  CFG.adxMin=+document.getElementById('s_adxMin').value;
  CFG.notifications=document.getElementById('s_notifications').checked;
  CFG.enableSys1=document.getElementById('enableSys1').checked;
  CFG.enableSys2=document.getElementById('enableSys2').checked;
  CFG.enableFusion=document.getElementById('enableFusion').checked;
  CFG.enableMaster=document.getElementById('enableMaster').checked;
  CFG.enableAgents=document.getElementById('enableAgents').checked;
  const mlEl=document.getElementById('enableML');if(mlEl)CFG.enableML=mlEl.checked;
  CFG.summaryInterval=+document.getElementById('s_summaryInterval').value;
  CFG.watchlist=document.getElementById('s_watchlist').value.split(',').map(s=>s.trim().toUpperCase()).filter(Boolean);
  CFG.theme=currentTheme;
  saveLocal('masterai_cfg',CFG);kvPush('settings',CFG).catch(()=>{});
  document.getElementById('settingsMsg').innerHTML='<span style="color:var(--green)">✓ Kaydedildi</span>';
  renderWatchlist();
  if(summaryIntervalTimerId)clearInterval(summaryIntervalTimerId);
  summaryIntervalTimerId=setInterval(sendPeriodicSummary,CFG.summaryInterval*1000);
  setTimeout(closeSettings,1000);
}
function openSettings(){loadSettings();document.getElementById('settingsOverlay')?.classList.add('open');}
function closeSettings(){document.getElementById('settingsOverlay')?.classList.remove('open');}
function exportSettings(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(CFG,null,2)],{type:'application/json'}));a.download='masterai_v41_settings.json';a.click();}
function importSettings(){const inp=document.createElement('input');inp.type='file';inp.accept='.json';inp.onchange=e=>{const r=new FileReader();r.onload=ev=>{try{Object.assign(CFG,JSON.parse(ev.target.result));saveLocal('masterai_cfg',CFG);loadSettings();renderWatchlist();alert('✅ Yüklendi!');}catch(e){alert('❌ Geçersiz dosya');}};r.readAsText(e.target.files[0]);};inp.click();}

/* ── Theme ───────────────────────────────────────────── */
function toggleTheme(){currentTheme=currentTheme==='dark'?'light':'dark';CFG.theme=currentTheme;applyTheme();}
function applyTheme(){if(currentTheme==='light'){document.body.className='theme-light';const btn=document.getElementById('themeBtn');if(btn)btn.innerHTML='☀️';}else{document.body.className='';const btn=document.getElementById('themeBtn');if(btn)btn.innerHTML='🌙';}}

/* ── Extras ──────────────────────────────────────────── */
function screenshotChart(){const c=document.getElementById('mainChart');const a=document.createElement('a');a.download=`masterai-${currentSym||'chart'}.png`;a.href=c.toDataURL();a.click();}
function exportSignalsCSV(){
  let csv='Tarih,Sembol,TF,Sistem,Tür,Fiyat,PnL\n';
  for(const key of Object.keys(allSignals)){const[sym,...tfParts]=key.split('-');const tf=tfParts.join('-');for(const s of allSignals[key])csv+=`${new Date(s.t).toLocaleString('tr-TR')},${sym},${tf},${s.sys},${s.type},${s.price},${s.pnl||''}\n`;}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='masterai_v41_signals.csv';a.click();
}

/* ── Groq AI ─────────────────────────────────────────── */
async function sendToGroq() {
  const input=document.getElementById('aiInput')?.value?.trim();if(!input)return;
  if(!CFG.groqApiKey){alert('Ayarlar → Groq API Key giriniz!');return;}
  addAIMessage(input,'user');document.getElementById('aiInput').value='';
  try{
    const mlCtx=`ML Confidence: ${Math.round(ML.confidence*100)}%, Tahmin: ${ML.predictions.h1d?.dir>0?'YUKARI':ML.predictions.h1d?.dir<0?'AŞAĞI':'YATAY'}`;
    const ctx=currentResult?`Analiz: ${currentSym}(${currentTF}) Fiyat:${currentResult.closes[currentResult.closes.length-1].toFixed(2)} ADX:${currentResult.adxLast?.toFixed(1)} Durum:${currentResult.priceState?.text}. ${mlCtx}`:'';
    const openCount=Object.keys(openPositions).length;
    const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'Authorization':`Bearer ${CFG.groqApiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:'llama-3.3-70b-versatile',messages:[{role:'system',content:`Sen profesyonel bir BIST hisse senedi trading AI asistanısın. Kısa, net, teknik analiz odaklı Türkçe cevap ver. ${ctx}. Şu an ${openCount} açık pozisyon var.`},{role:'user',content:input}],temperature:0.7,max_tokens:512})});
    const d=await r.json();if(d.error)throw new Error(d.error.message);
    addAIMessage(d.choices[0].message.content,'ai');
  }catch(e){addAIMessage('Groq hatası: '+e.message,'ai');}
}
function addAIMessage(text,from){
  const c=document.getElementById('aiMessages');if(!c)return;
  const d=document.createElement('div');d.className=from==='user'?'ai-msg-user':'ai-msg-bot';
  d.innerHTML=text.replace(/\n/g,'<br>');c.appendChild(d);c.scrollTop=c.scrollHeight;
}

/* ── PWA ─────────────────────────────────────────────── */
let pwaPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();pwaPrompt=e;
  document.getElementById('pwaBanner')?.classList.add('show');
  const installBtn=document.getElementById('pwaInstallBtn');
  if(installBtn)installBtn.onclick=()=>{pwaPrompt.prompt();pwaPrompt.userChoice.then(r=>{document.getElementById('pwaBanner')?.classList.remove('show');if(r.outcome==='accepted')showToast('PWA Kuruldu','Ana ekrana eklendi!','info');});};
});
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));

/* ── INIT ────────────────────────────────────────────── */
(function init(){
  try{
    const savedCfg=loadLocal('masterai_cfg');if(savedCfg)Object.assign(CFG,savedCfg);
    if(!CFG.workerUrl||CFG.workerUrl.includes('render.com'))CFG.workerUrl=WORKER_URL;
    if(!CFG.stMultiplier)CFG.stMultiplier=3.0;
    if(!CFG.stPeriod)CFG.stPeriod=30;
    const savedSig=loadLocal('masterai_signals');if(savedSig)allSignals=savedSig;
    const savedPos=loadLocal('masterai_positions');
    if(savedPos){if(savedPos.open)openPositions=savedPos.open;if(savedPos.closed)closedPositions=savedPos.closed;}
    const savedML=loadLocal('masterai_ml');
    if(savedML){if(savedML.feedback)ML.feedback=savedML.feedback;if(savedML.adaptWeight)ML.adaptWeight=savedML.adaptWeight;if(savedML.equityHistory)ML.equityHistory=savedML.equityHistory;if(savedML.sysLearnStats)Object.assign(sysLearnStats,savedML.sysLearnStats);}
    const savedAgentParams=loadLocal('masterai_agentParams');
    if(savedAgentParams)Object.assign(agentOptParams,savedAgentParams);
    deviceUID=getDeviceUID();currentTheme=CFG.theme||'dark';
    applyTheme();renderWatchlist();updateModelSelectorUI();updateCurrentParamsDisplay();
    if(!localStorage.getItem('masterai_firstlaunch')){
      document.getElementById('watchlistModal')?.classList.add('open');
    } else {
      kvPullAll().then(()=>{renderWatchlist();updateKVStats();});
      setTimeout(()=>{
        const sym=CFG.watchlist[0]||'XU100';
        const symInp=document.getElementById('symbolInput');if(symInp)symInp.value=sym;
        analyzeSymbol();
      },600);
    }
    setTimeout(()=>{fetch(workerBase()+'/').then(r=>r.json()).then(()=>setKVDot('ok')).catch(()=>setKVDot('error'));},1500);
    backgroundIntervalId=setInterval(backgroundScan,30000);
    summaryIntervalTimerId=setInterval(sendPeriodicSummary,CFG.summaryInterval*1000);
    window.addEventListener('resize',()=>{if(currentResult&&currentSym)drawChart(currentSym,currentTF,currentResult.bars,currentResult,null);});
    console.log('%c✅ Master AI Trading v4.1 — AETHER ML EDITION','color:#ffd700;font-weight:bold;font-size:14px');
    console.log('%cML Engine: LSTM + TFT + XGBoost + DQN + MoE + Auto Learning + Strategy Optimizer','color:#00e5ff;font-size:11px');
    console.log('%cWorker: https://masterai-proxy.ynsk06.workers.dev','color:#b040ff;font-size:11px');
  }catch(e){console.error('Init error:',e);}
})();
</script>
</body>
</html>
