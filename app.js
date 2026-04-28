// ════════════════════════════════════════
// DATA & STORAGE (CSV backend via Flask)
// ════════════════════════════════════════
let D = {
  perfil:{pesoInicial:120,pesoMeta:80,altura:1.80},
  pesos:[], medidas:[], ejercicios:[], nutricion:[]
};

function coerceNum(v){const n=parseFloat(v);return isNaN(n)?null:n;}

async function loadData(){
  const r = await fetch('/api/data');
  const raw = await r.json();
  D.pesos = (raw.pesos||[]).map(p=>({...p, peso:coerceNum(p.peso), bmi:coerceNum(p.bmi)}));
  D.medidas = (raw.medidas||[]).map(m=>({
    fecha:m.fecha,
    cintura:coerceNum(m.cintura), cadera:coerceNum(m.cadera),
    pecho:coerceNum(m.pecho), brazo:coerceNum(m.brazo), muslo:coerceNum(m.muslo)
  }));
  D.ejercicios = (raw.ejercicios||[]).map(e=>({
    ...e,
    duracion:coerceNum(e.duracion)||0, calorias:coerceNum(e.calorias)||0,
    distancia:coerceNum(e.distancia)||0
  }));
  D.nutricion = (raw.nutricion||[]).map(n=>({
    ...n,
    kcal:coerceNum(n.kcal)||0, proteina:coerceNum(n.proteina)||0,
    carbs:coerceNum(n.carbs)||0, grasas:coerceNum(n.grasas)||0, agua:coerceNum(n.agua)||0
  }));
}

async function apiAdd(table, row){
  await fetch('/api/'+table, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(row)});
  await loadData();
}
async function apiDel(table, idx){
  await fetch('/api/'+table+'/'+idx, {method:'DELETE'});
  await loadData();
}

// ════════════════════════════════════════
// UTILS
// ════════════════════════════════════════
function today(){return new Date().toISOString().split('T')[0];}
function fmtDate(d){const[y,m,dy]=d.split('-');const ms=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];return `${dy} ${ms[+m-1]}`;}
function bmi(p){return(p/(D.perfil.altura**2)).toFixed(1);}
function bmiCat(b){b=+b;if(b<18.5)return{cat:'Bajo peso',col:'var(--blue)'};if(b<25)return{cat:'Normal',col:'var(--accent)'};if(b<30)return{cat:'Sobrepeso',col:'var(--amber)'};if(b<35)return{cat:'Obesidad I',col:'#f97316'};return{cat:'Obesidad II+',col:'var(--red)'};}
function bmiPos(b){return Math.min(Math.max(((+b-16)/24)*100,2),98);}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800);}
function setDateInputs(){const t=today();['inp-fecha-peso','inp-fecha-med','inp-fecha-ex','inp-fecha-nut','m-fecha'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=t;});}

// ════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════
const pageTitles={dashboard:'Dashboard',peso:'Registro de Peso',medidas:'Medidas Corporales',ejercicio:'Log de Entrenamiento',nutricion:'Nutrición',rutina:'Rutina & Ejercicios',plan_comida:'Plan de Comida',recetas:'Recetas & Cocina',compras:'Lista de Compras',logros:'Logros & Hitos'};
function showPage(page,el){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>{n.classList.remove('active','rutina-active');});
  document.getElementById('page-'+page).classList.add('active');
  if(el){el.classList.add(page==='rutina'||page==='plan_comida'||page==='compras'||page==='recetas'?'rutina-active':'active');}
  else{
    document.querySelectorAll('.nav-item').forEach(n=>{
      if(n.getAttribute('onclick')&&n.getAttribute('onclick').includes("'"+page+"'")){n.classList.add(page==='rutina'||page==='plan_comida'||page==='compras'||page==='recetas'?'rutina-active':'active');}
    });
  }
  document.getElementById('page-title').textContent=pageTitles[page]||page;
  const renders={dashboard:renderDashboard,peso:renderPeso,medidas:renderMedidas,ejercicio:renderEjercicio,nutricion:renderNutricion,rutina:renderRutina,plan_comida:renderPlanComida,recetas:renderRecetas,compras:renderCompras,logros:renderLogros};
  if(renders[page])renders[page]();
}
function openModal(id){document.getElementById('modal-'+id).classList.add('open');}
function closeModal(id){document.getElementById('modal-'+id).classList.remove('open');}

// ════════════════════════════════════════
// SAVE FUNCTIONS
// ════════════════════════════════════════
async function guardarPeso(){
  const p=parseFloat(document.getElementById('inp-peso').value);
  if(!p||p<30||p>300){toast('⚠ Ingresa un peso válido');return;}
  await apiAdd('pesos',{fecha:document.getElementById('inp-fecha-peso').value,peso:p,momento:document.getElementById('inp-momento').value,nota:document.getElementById('inp-nota-peso').value,bmi:+bmi(p)});
  document.getElementById('inp-peso').value='';document.getElementById('inp-nota-peso').value='';
  toast('✓ Pesaje guardado: '+p+' kg');renderPeso();renderDashboard();
}
async function guardarMedidas(){
  const e={fecha:document.getElementById('inp-fecha-med').value,cintura:+document.getElementById('inp-cintura').value||null,cadera:+document.getElementById('inp-cadera').value||null,pecho:+document.getElementById('inp-pecho').value||null,brazo:+document.getElementById('inp-brazo').value||null,muslo:+document.getElementById('inp-muslo').value||null};
  if(!e.cintura&&!e.cadera&&!e.pecho){toast('⚠ Ingresa al menos una medida');return;}
  await apiAdd('medidas',e);toast('✓ Medidas guardadas');renderMedidas();
}
async function guardarEjercicio(){
  await apiAdd('ejercicios',{fecha:document.getElementById('inp-fecha-ex').value,tipo:document.getElementById('inp-tipo-ex').value,duracion:+document.getElementById('inp-duracion').value||0,intensidad:document.getElementById('inp-intensidad').value,calorias:+document.getElementById('inp-kcal-ex').value||0,distancia:+document.getElementById('inp-dist').value||0,nota:document.getElementById('inp-nota-ex').value});
  document.getElementById('inp-nota-ex').value='';document.getElementById('inp-kcal-ex').value='';document.getElementById('inp-dist').value='';
  toast('✓ Entrenamiento registrado');renderEjercicio();renderDashboard();
}
async function guardarNutricion(){
  const k=+document.getElementById('inp-kcal-nut').value;
  if(!k){toast('⚠ Ingresa las calorías');return;}
  await apiAdd('nutricion',{fecha:document.getElementById('inp-fecha-nut').value,kcal:k,proteina:+document.getElementById('inp-prot').value||0,carbs:+document.getElementById('inp-carbs').value||0,grasas:+document.getElementById('inp-grasas').value||0,agua:+document.getElementById('inp-agua').value||0,nota:document.getElementById('inp-nota-nut').value});
  toast('✓ Nutrición guardada');renderNutricion();
}
async function guardarRapido(){
  const fecha=document.getElementById('m-fecha').value;
  const p=parseFloat(document.getElementById('m-peso').value);
  const ex=document.getElementById('m-ex').value;
  const nota=document.getElementById('m-nota').value;
  if(p&&p>30){await apiAdd('pesos',{fecha,peso:p,momento:'Mañana (en ayunas)',nota,bmi:+bmi(p)});}
  if(ex){await apiAdd('ejercicios',{fecha,tipo:ex,duracion:0,intensidad:'Moderada',calorias:0,distancia:0,nota});}
  closeModal('rapido');toast('✓ Registro guardado');renderDashboard();
}
async function eliminarPeso(i){if(!confirm('¿Eliminar?'))return;await apiDel('pesos',i);renderPeso();renderDashboard();}
async function eliminarMedida(i){if(!confirm('¿Eliminar?'))return;await apiDel('medidas',i);renderMedidas();}
async function eliminarEjercicio(i){if(!confirm('¿Eliminar?'))return;await apiDel('ejercicios',i);renderEjercicio();renderDashboard();}

// ════════════════════════════════════════
// CHARTS
// ════════════════════════════════════════
const charts={};
function mkChart(id,cfg){if(charts[id])charts[id].destroy();const el=document.getElementById(id);if(!el)return;charts[id]=new Chart(el.getContext('2d'),cfg);}
const gc='rgba(255,255,255,0.05)',tc='#7a82a0',bf={family:"'DM Sans',sans-serif",size:12};
function cOpts(u){return{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc,font:bf,boxWidth:12}},tooltip:{backgroundColor:'#1e2230',borderColor:'rgba(255,255,255,0.1)',borderWidth:1,titleColor:'#f0f2f8',bodyColor:'#7a82a0',padding:9}},scales:{x:{grid:{color:gc},ticks:{color:tc,font:bf,maxTicksLimit:8}},y:{grid:{color:gc},ticks:{color:tc,font:bf,callback:v=>v+' '+u}}}};}

// ════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════
function renderDashboard(){
  const pesos=D.pesos;
  const last=pesos.length?pesos[pesos.length-1].peso:D.perfil.pesoInicial;
  const perdido=Math.max(0,D.perfil.pesoInicial-last);
  const pct=Math.min(100,Math.round(perdido/40*100));
  document.getElementById('d-peso').innerHTML=last.toFixed(1)+' <span style="font-size:15px;color:var(--muted)">kg</span>';
  const pb=document.getElementById('d-perdido');
  if(perdido>0){pb.textContent='↓ '+perdido.toFixed(1)+' kg perdidos';pb.className='stat-badge badge-green';}
  else{pb.textContent='Sin cambios aún';pb.className='stat-badge badge-blue';}
  const b=bmi(last),bc=bmiCat(b);
  document.getElementById('d-bmi').innerHTML=b+' <span style="font-size:15px;color:var(--muted)">IMC</span>';
  document.getElementById('d-bmi-cat').textContent=bc.cat;
  document.getElementById('bmi-big').textContent=b;document.getElementById('bmi-big').style.color=bc.col;
  document.getElementById('bmi-cat-txt').textContent=bc.cat+' — Meta: 24.7 (Normal)';
  document.getElementById('bmi-marker').style.left=bmiPos(b)+'%';
  document.getElementById('d-faltan').textContent='Faltan '+Math.max(0,last-80).toFixed(1)+' kg';
  document.getElementById('d-pct').textContent=pct+'% completado';
  document.getElementById('d-dias').textContent=D.ejercicios.length;
  document.getElementById('d-racha').textContent=D.ejercicios.length?'🔥 '+D.ejercicios.length+' sesiones':'🔥 Comenzando';
  document.getElementById('pp-peso').textContent=perdido.toFixed(1)+'/40 kg';
  document.getElementById('pp-peso-bar').style.width=Math.min(100,perdido/40*100)+'%';
  const hc=getHitosPeso().filter(h=>h.done).length;
  document.getElementById('pp-hitos').textContent=hc+'/8';
  document.getElementById('pp-hitos-bar').style.width=(hc/8*100)+'%';
  const exw=exEstaSeamana();
  document.getElementById('pp-ex').textContent=exw+'/5';
  document.getElementById('pp-ex-bar').style.width=Math.min(100,exw/5*100)+'%';
  // últimos
  const ul=document.getElementById('d-ultimos');
  if(!pesos.length){ul.innerHTML='<div class="empty"><div class="empty-icon">⚖️</div><div class="empty-text">Sin registros aún</div></div>';}
  else{ul.innerHTML=[...pesos].reverse().slice(0,5).map((p,i)=>{const prev=pesos[pesos.length-2-i];const diff=prev?(p.peso-prev.peso).toFixed(1):null;const ds=diff===null?'—':diff<0?`<span style="color:var(--accent)">↓${Math.abs(diff)}</span>`:`<span style="color:var(--red)">↑${diff}</span>`;return`<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border);font-size:13.5px"><span style="color:var(--muted)">${fmtDate(p.fecha)}</span><span style="font-family:var(--font-head);font-weight:700">${p.peso} kg</span><span>${ds}</span></div>`;}).join('');}
  // hitos
  const hitos=getHitosPeso().filter(h=>!h.done).slice(0,4);
  const hEl=document.getElementById('d-hitos');
  if(!hitos.length){hEl.innerHTML='<div class="empty"><div class="empty-icon">🎯</div><div class="empty-text">¡Todos los hitos alcanzados!</div></div>';}
  else{hEl.innerHTML=hitos.map(h=>`<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)"><span style="font-size:18px">${h.icon}</span><div><div style="font-size:13px;font-weight:500">${h.nombre}</div><div style="font-size:11.5px;color:var(--muted)">${h.peso} kg — Faltan ${Math.max(0,last-h.peso).toFixed(1)} kg</div></div></div>`).join('');}
  // chart
  if(pesos.length>=2){
    document.getElementById('dash-empty').style.display='none';
    mkChart('chart-dash',{type:'line',data:{labels:pesos.map(p=>fmtDate(p.fecha)),datasets:[{label:'Peso',data:pesos.map(p=>p.peso),borderColor:'#6ee7b7',backgroundColor:'rgba(110,231,183,0.07)',borderWidth:2,pointRadius:4,pointBackgroundColor:'#6ee7b7',tension:0.4,fill:true},{label:'Meta',data:pesos.map(()=>80),borderColor:'rgba(96,165,250,0.4)',borderDash:[6,4],borderWidth:1.5,pointRadius:0}]},options:cOpts('kg')});
  } else {document.getElementById('dash-empty').style.display='block';}
}

// ════════════════════════════════════════
// PESO
// ════════════════════════════════════════
function renderPeso(){
  const pesos=D.pesos;
  const tb=document.getElementById('tabla-peso');
  if(!pesos.length){tb.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:28px">Sin registros</td></tr>';return;}
  tb.innerHTML=[...pesos].reverse().map((p,i)=>{const ri=pesos.length-1-i;const prev=ri>0?pesos[ri-1]:null;const diff=prev?(p.peso-prev.peso):null;const ds=diff===null?'—':diff<0?`<span style="color:var(--accent)">↓${Math.abs(diff.toFixed(1))}</span>`:diff>0?`<span style="color:var(--red)">↑${diff.toFixed(1)}</span>`:'= 0';const b=bmi(p.peso),bc=bmiCat(b);return`<tr><td>${fmtDate(p.fecha)}</td><td class="td-mono">${p.peso} kg</td><td>${ds}</td><td><span style="color:${bc.col}">${b}</span></td><td style="font-size:12px;color:var(--muted)">${p.momento}</td><td style="font-size:12px;color:var(--muted)">${p.nota||'—'}</td><td><button class="btn btn-ghost" style="padding:3px 9px;font-size:11px" onclick="eliminarPeso(${ri})">✕</button></td></tr>`;}).join('');
  if(pesos.length>=2){const d=(pesos[pesos.length-1].peso-pesos[0].peso).toFixed(1);document.getElementById('peso-tend').textContent=d<0?'↓ '+Math.abs(d)+' kg desde el inicio':'';}
  if(pesos.length>=2)mkChart('chart-peso',{type:'line',data:{labels:pesos.map(p=>fmtDate(p.fecha)),datasets:[{label:'Peso',data:pesos.map(p=>p.peso),borderColor:'#6ee7b7',backgroundColor:'rgba(110,231,183,0.07)',borderWidth:2,pointRadius:5,pointBackgroundColor:'#6ee7b7',tension:0.4,fill:true},{label:'Meta',data:pesos.map(()=>80),borderColor:'rgba(96,165,250,0.4)',borderDash:[6,4],borderWidth:1.5,pointRadius:0},{label:'Inicio',data:pesos.map(()=>120),borderColor:'rgba(251,191,36,0.3)',borderDash:[3,3],borderWidth:1,pointRadius:0}]},options:cOpts('kg')});
}

// ════════════════════════════════════════
// MEDIDAS
// ════════════════════════════════════════
function renderMedidas(){
  const m=D.medidas,tb=document.getElementById('tabla-medidas');
  if(!m.length){tb.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:28px">Sin medidas</td></tr>';return;}
  tb.innerHTML=[...m].reverse().map((e,i)=>`<tr><td>${fmtDate(e.fecha)}</td><td class="td-mono">${e.cintura||'—'} cm</td><td class="td-mono">${e.cadera||'—'} cm</td><td class="td-mono">${e.pecho||'—'} cm</td><td class="td-mono">${e.brazo||'—'} cm</td><td class="td-mono">${e.muslo||'—'} cm</td><td><button class="btn btn-ghost" style="padding:3px 9px;font-size:11px" onclick="eliminarMedida(${m.length-1-i})">✕</button></td></tr>`).join('');
  if(m.length>=2)mkChart('chart-medidas',{type:'line',data:{labels:m.map(e=>fmtDate(e.fecha)),datasets:[{label:'Cintura',data:m.map(e=>e.cintura),borderColor:'#f87171',borderWidth:2,tension:0.4,pointRadius:4,pointBackgroundColor:'#f87171'},{label:'Cadera',data:m.map(e=>e.cadera),borderColor:'#fbbf24',borderWidth:2,tension:0.4,pointRadius:4,pointBackgroundColor:'#fbbf24'},{label:'Pecho',data:m.map(e=>e.pecho),borderColor:'#60a5fa',borderWidth:2,tension:0.4,pointRadius:4,pointBackgroundColor:'#60a5fa'},{label:'Brazo',data:m.map(e=>e.brazo),borderColor:'#a78bfa',borderWidth:2,tension:0.4,pointRadius:4,pointBackgroundColor:'#a78bfa'}]},options:cOpts('cm')});
}

// ════════════════════════════════════════
// EJERCICIO LOG
// ════════════════════════════════════════
function renderEjercicio(){
  const ex=D.ejercicios,tb=document.getElementById('tabla-ejercicio');
  if(!ex.length){tb.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:28px">Sin entrenamientos</td></tr>';}
  else{tb.innerHTML=[...ex].reverse().map((e,i)=>{const ri=ex.length-1-i;const tc=e.tipo.includes('Gimnasio')?'tag-gym':e.tipo.includes('Cardio')||e.tipo.includes('Correr')||e.tipo.includes('Caminar')?'tag-cardio':'tag-rest';return`<tr><td>${fmtDate(e.fecha)}</td><td><span class="workout-tag ${tc}">${e.tipo}</span></td><td>${e.duracion?e.duracion+' min':'—'}</td><td style="color:var(--muted)">${e.intensidad}</td><td>${e.calorias?e.calorias+' kcal':'—'}</td><td style="font-size:12px;color:var(--muted)">${e.nota||'—'}</td><td><button class="btn btn-ghost" style="padding:3px 9px;font-size:11px" onclick="eliminarEjercicio(${ri})">✕</button></td></tr>`;}).join('');}
  document.getElementById('ex-total').textContent=ex.length;
  document.getElementById('ex-min').textContent=ex.reduce((s,e)=>s+(e.duracion||0),0);
  document.getElementById('ex-kcal').textContent=ex.reduce((s,e)=>s+(e.calorias||0),0);
  document.getElementById('ex-km').textContent=ex.reduce((s,e)=>s+(e.distancia||0),0).toFixed(1);
  const gym=ex.filter(e=>e.tipo.includes('Gimnasio')).length,cardio=ex.filter(e=>e.tipo.includes('Cardio')||e.tipo.includes('Correr')||e.tipo.includes('Caminar')).length,desc=ex.filter(e=>e.tipo.includes('Descanso')).length;
  mkChart('chart-tipos',{type:'doughnut',data:{labels:['Gimnasio','Cardio','Descanso','Otro'],datasets:[{data:[gym,cardio,desc,Math.max(0,ex.length-gym-cardio-desc)],backgroundColor:['#a78bfa','#6ee7b7','#60a5fa','#fbbf24'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{color:tc,font:bf,boxWidth:10,padding:10}},tooltip:{backgroundColor:'#1e2230',borderColor:'rgba(255,255,255,0.1)',borderWidth:1,titleColor:'#f0f2f8',bodyColor:'#7a82a0'}}}});
}

// ════════════════════════════════════════
// NUTRICION
// ════════════════════════════════════════
function renderNutricion(){
  const n=D.nutricion,tb=document.getElementById('tabla-nutricion');
  if(!n.length){tb.innerHTML='<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:28px">Sin registros</td></tr>';return;}
  tb.innerHTML=[...n].reverse().map(e=>{const d=1800-e.kcal,ds=d>=0?`<span style="color:var(--accent)">-${d}</span>`:`<span style="color:var(--red)">+${Math.abs(d)}</span>`;return`<tr><td>${fmtDate(e.fecha)}</td><td class="td-mono">${e.kcal} <span style="font-size:11px">${ds}</span></td><td>${e.proteina}g</td><td>${e.carbs}g</td><td>${e.grasas}g</td><td>${e.agua}L</td><td style="font-size:12px;color:var(--muted)">${e.nota||'—'}</td></tr>`;}).join('');
  const l=n.slice(-14);
  mkChart('chart-kcal',{type:'bar',data:{labels:l.map(e=>fmtDate(e.fecha)),datasets:[{label:'Calorías',data:l.map(e=>e.kcal),backgroundColor:l.map(e=>e.kcal<=1800?'rgba(110,231,183,0.6)':'rgba(248,113,113,0.6)'),borderRadius:4,borderSkipped:false},{label:'Meta (1800)',data:l.map(()=>1800),type:'line',borderColor:'rgba(251,191,36,0.6)',borderDash:[6,4],borderWidth:1.5,pointRadius:0}]},options:cOpts('kcal')});
}

// ════════════════════════════════════════
// LOGROS
// ════════════════════════════════════════
function getHitosPeso(){const l=D.pesos.length?D.pesos[D.pesos.length-1].peso:D.perfil.pesoInicial;return[{peso:115,nombre:'Primer paso',icon:'🌱',done:l<=115},{peso:110,nombre:'10 kg menos',icon:'⚡',done:l<=110},{peso:105,nombre:'25% del camino',icon:'🔥',done:l<=105},{peso:100,nombre:'Triple dígito roto',icon:'💯',done:l<=100},{peso:95,nombre:'Mitad del camino',icon:'🏃',done:l<=95},{peso:90,nombre:'30 kg perdidos',icon:'💪',done:l<=90},{peso:85,nombre:'Recta final',icon:'🦅',done:l<=85},{peso:80,nombre:'¡Meta alcanzada!',icon:'🏆',done:l<=80}];}
function exEstaSeamana(){const now=new Date(),ws=new Date(now);ws.setDate(now.getDate()-now.getDay()+1);const s=ws.toISOString().split('T')[0];return D.ejercicios.filter(e=>e.fecha>=s).length;}
function renderLogros(){
  const h=getHitosPeso(),l=D.pesos.length?D.pesos[D.pesos.length-1].peso:D.perfil.pesoInicial;
  document.getElementById('medals-peso').innerHTML=h.map(e=>`<div class="medal-card ${e.done?'earned':''}"><div class="medal-icon">${e.icon}</div><div class="medal-name">${e.nombre}</div><div class="medal-desc">${e.peso} kg${e.done?' ✓':''}</div></div>`).join('');
  const em=[{nombre:'Primera sesión',icon:'🎯',c:D.ejercicios.length>=1},{nombre:'10 entrenamientos',icon:'🔟',c:D.ejercicios.length>=10},{nombre:'25 sesiones',icon:'🌟',c:D.ejercicios.length>=25},{nombre:'50 sesiones',icon:'💎',c:D.ejercicios.length>=50},{nombre:'Primer km corrido',icon:'🏃',c:D.ejercicios.some(e=>e.distancia>=1)},{nombre:'5 km en sesión',icon:'🏅',c:D.ejercicios.some(e=>e.distancia>=5)},{nombre:'Semana completa',icon:'📆',c:exEstaSeamana()>=5},{nombre:'Constancia 30 días',icon:'🗓️',c:D.ejercicios.length>=30}];
  document.getElementById('medals-ex').innerHTML=em.map(m=>`<div class="medal-card ${m.c?'earned':''}"><div class="medal-icon">${m.icon}</div><div class="medal-name">${m.nombre}</div><div class="medal-desc">${m.c?'✓ Alcanzado':'Pendiente'}</div></div>`).join('');
  const ev=[];
  if(D.pesos.length)ev.push({fecha:D.pesos[0].fecha,text:'Inicio del seguimiento',detail:D.pesos[0].peso+' kg registrado',done:true});
  h.filter(e=>e.done).forEach(e=>{const p=D.pesos.find(pw=>pw.peso<=e.peso);if(p)ev.push({fecha:p.fecha,text:e.nombre,detail:e.peso+' kg '+e.icon,done:true});});
  ev.sort((a,b)=>a.fecha.localeCompare(b.fecha));
  h.filter(e=>!e.done).slice(0,2).forEach(e=>ev.push({fecha:null,text:'Próximo: '+e.nombre,detail:'Llegar a '+e.peso+' kg',done:false}));
  document.getElementById('timeline-logros').innerHTML=ev.length?ev.map(e=>`<div class="timeline-item"><div class="timeline-dot ${e.done?'completed':''}"></div><div class="timeline-date">${e.fecha?fmtDate(e.fecha):'Próximamente'}</div><div class="timeline-text">${e.text}</div><div class="timeline-detail">${e.detail}</div></div>`).join(''):'<div class="empty"><div class="empty-icon">🏆</div><div class="empty-text">¡Registra tu primer pesaje!</div></div>';
}

// ════════════════════════════════════════
// RUTINA DATA & RENDER
// ════════════════════════════════════════
const YT=`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.2 5 12 5 12 5s-4.2 0-7 .1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.2.9C6.8 19 12 19 12 19s4.2 0 7-.2c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM10 15V9l5.5 3-5.5 3z"/></svg>`;
function ytL(q){return'https://www.youtube.com/results?search_query='+encodeURIComponent(q+' tutorial español técnica correcta');}
const phases=[{label:'Sem 1-4',name:'Adaptación',cardioMin:25,cardioKcal:220},{label:'Sem 5-8',name:'Progresión',cardioMin:35,cardioKcal:320},{label:'Sem 9-12',name:'Intensidad',cardioMin:45,cardioKcal:420}];
const rutinaData=[
  {key:'lun',name:'Lunes',icon:'🏋️',type:'GYM',typeFull:'Gimnasio',title:'PIERNA + GLÚTEO',duration:'60-70 min',muscles_p:['Cuádriceps','Glúteos','Isquiotibiales'],muscles_s:['Core','Pantorrillas'],exercises:[{name:'Sentadilla libre',sets:3,reps:'12',rest:'90 seg',cat:'primary',tip:'Espalda recta, rodillas sobre los pies. Baja hasta 90°.',yt:'sentadilla libre técnica'},{name:'Prensa de pierna',sets:3,reps:'15',rest:'75 seg',cat:'primary',tip:'Pies al ancho de hombros. No bloquees las rodillas.',yt:'prensa de pierna técnica'},{name:'Hip Thrust (Glúteo)',sets:3,reps:'15',rest:'75 seg',cat:'primary',tip:'Apoya la parte alta de la espalda en el banco. Aprieta el glúteo.',yt:'hip thrust glúteo gimnasio'},{name:'Extensión cuádriceps',sets:3,reps:'12',rest:'60 seg',cat:'secondary',tip:'Movimiento controlado. No swingues el torso.',yt:'extensión cuádriceps máquina técnica'},{name:'Curl femoral',sets:3,reps:'12',rest:'60 seg',cat:'secondary',tip:'Contrae el isquiotibial. Baja lento (2 seg).',yt:'curl femoral máquina técnica'},{name:'Plancha abdominal',sets:3,reps:'30 seg',rest:'45 seg',cat:'core',tip:'Cuerpo en línea recta. No dejes caer las caderas.',yt:'plancha abdominal correcta principiantes'}]},
  {key:'mar',name:'Martes',icon:'🚶',type:'CARDIO',typeFull:'Cardio',title:'CAMINAR + TROTE',duration:'35-45 min',cardio:true,phases_cardio:[{label:'Calentamiento',val:'5 min',desc:'Caminata lenta · Prepara articulaciones'},{label:'Intervalo principal',val:'25-35 min',desc:'Sem 1-4: 2 min caminata / 1 min trote\nSem 5-8: 1 min caminar / 2 min trote\nSem 9-12: Trote continuo'},{label:'Enfriamiento',val:'5 min',desc:'Caminata tranquila'},{label:'Estiramiento',val:'10 min',desc:'Piernas · Espalda baja · Caderas'}],ytLink:'programa caminar correr principiantes C25K',tip:'Ritmo de conversación: debes poder hablar sin ahogarte.'},
  {key:'mie',name:'Miércoles',icon:'🏋️',type:'GYM',typeFull:'Gimnasio',title:'PECHO + TRÍCEPS',duration:'55-65 min',muscles_p:['Pectoral mayor','Tríceps'],muscles_s:['Hombro anterior','Core'],exercises:[{name:'Press de banca plano',sets:3,reps:'12',rest:'90 seg',cat:'primary',tip:'Pies en el suelo, escápulas retraídas. Barra desciende al pecho.',yt:'press de banca técnica correcta principiantes'},{name:'Press inclinado mancuernas',sets:3,reps:'12',rest:'75 seg',cat:'primary',tip:'Inclinación 30-45°. Baja las mancuernas al pecho.',yt:'press inclinado mancuernas técnica'},{name:'Aperturas (Fly)',sets:3,reps:'15',rest:'60 seg',cat:'secondary',tip:'Codos ligeramente flexionados. Siente el pecho.',yt:'aperturas mancuernas pecho técnica'},{name:'Fondos en paralelas',sets:3,reps:'10',rest:'90 seg',cat:'primary',tip:'Asistido si necesitas. Inclínate al frente para pecho.',yt:'fondos paralelas tríceps pecho técnica'},{name:'Extensión tríceps polea',sets:3,reps:'15',rest:'60 seg',cat:'secondary',tip:'Codos pegados al cuerpo. Extiende completamente.',yt:'extensión tríceps polea alta técnica'},{name:'Crunch abdominal',sets:3,reps:'20',rest:'45 seg',cat:'core',tip:'No jales el cuello. El movimiento viene del core.',yt:'crunch abdominal técnica correcta'}]},
  {key:'jue',name:'Jueves',icon:'🏃',type:'CARDIO',typeFull:'Cardio',title:'TROTE CONTINUO',duration:'35-50 min',cardio:true,phases_cardio:[{label:'Calentamiento',val:'5 min',desc:'Caminata rápida'},{label:'Trote continuo',val:'25-40 min',desc:'Sem 1-4: 25 min con caminatas\nSem 5-8: 30 min trote continuo\nSem 9-12: 40 min sostenido'},{label:'Enfriamiento',val:'5 min',desc:'Bajar frecuencia cardíaca'},{label:'Estiramiento',val:'10 min',desc:'Pantorrillas y cuádriceps'}],ytLink:'como empezar a correr desde cero consejos',tip:'La zancada cae bajo tu centro de masa. Evita zancadas largas.'},
  {key:'vie',name:'Viernes',icon:'🏋️',type:'GYM',typeFull:'Gimnasio',title:'ESPALDA + BÍCEPS',duration:'60-70 min',muscles_p:['Dorsal ancho','Bíceps','Romboides'],muscles_s:['Trapecio medio','Core'],exercises:[{name:'Jalón al pecho en polea',sets:3,reps:'12',rest:'90 seg',cat:'primary',tip:'Tira hacia el pecho. Mantén el pecho arriba.',yt:'jalón al pecho polea técnica correcta'},{name:'Remo con mancuerna',sets:3,reps:'12',rest:'75 seg',cat:'primary',tip:'Apoya rodilla y mano en banco. Tira con el codo.',yt:'remo mancuerna un brazo técnica'},{name:'Remo en máquina',sets:3,reps:'15',rest:'75 seg',cat:'secondary',tip:'Escápulas juntas en la contracción.',yt:'remo sentado máquina polea técnica'},{name:'Pull-over mancuerna',sets:3,reps:'15',rest:'60 seg',cat:'secondary',tip:'Movimiento en arco. Estiramiento del dorsal.',yt:'pullover mancuerna espalda técnica'},{name:'Curl de bíceps',sets:3,reps:'12',rest:'60 seg',cat:'primary',tip:'No swingues. Codos fijos. Contrae arriba.',yt:'curl bíceps mancuernas técnica correcta'},{name:'Curl martillo',sets:3,reps:'12',rest:'60 seg',cat:'secondary',tip:'Agarre neutro (pulgar arriba). Trabaja bíceps y braquial.',yt:'curl martillo mancuernas técnica'}]},
  {key:'sab',name:'Sábado',icon:'🚶',type:'CARDIO',typeFull:'Cardio',title:'CAMINATA LARGA',duration:'45-60 min',cardio:true,phases_cardio:[{label:'Caminata',val:'45-60 min',desc:'Ritmo moderado-rápido. Terreno variado.'},{label:'Intervalos opcionales',val:'Cada 10 min',desc:'Trota 2-3 min a mayor intensidad'},{label:'Terreno',val:'Variado',desc:'Subidas activan glúteos'},{label:'Movilidad final',val:'15 min',desc:'Estiramiento general'}],ytLink:'caminata para bajar peso técnica beneficios',tip:'Volumen > velocidad. Zona aeróbica para quemar grasa.'},
  {key:'dom',name:'Domingo',icon:'😴',type:'REST',typeFull:'Descanso',title:'DESCANSO ACTIVO',rest:true}
];
let curPhase=0,curDay=0;
function renderRutina(){
  renderWeekNav();updateWeekSummary();renderDayTabs();renderWorkout();
}
function renderWeekNav(){
  document.getElementById('week-nav').innerHTML=phases.map((p,i)=>`<button class="week-btn ${i===curPhase?'active':''}" onclick="setPhase(${i})">${p.label} — ${p.name}</button>`).join('');
}
function setPhase(i){curPhase=i;renderWeekNav();updateWeekSummary();}
function updateWeekSummary(){const p=phases[curPhase];document.getElementById('ws-min').textContent=(3*60)+(3*p.cardioMin);document.getElementById('ws-kcal').textContent='~'+((3*350)+(3*p.cardioKcal));}
function renderDayTabs(){
  document.getElementById('day-tabs').innerHTML=rutinaData.map((d,i)=>`<div class="day-tab ${d.rest?'d-rest':''} ${i===curDay?'d-active':''}" onclick="setDay(${i})"><div class="dt-name">${d.name}</div><div class="dt-icon">${d.icon}</div><div class="dt-type">${d.type}</div></div>`).join('');
}
function setDay(i){curDay=i;renderDayTabs();renderWorkout();}
function renderWorkout(){
  const d=rutinaData[curDay],ph=phases[curPhase],el=document.getElementById('workout-content');
  if(d.rest){
    el.innerHTML=`<div class="rest-block"><div class="rest-icon">🛌</div><div class="rest-title-big">DESCANSO ACTIVO</div><div class="rest-sub">El músculo crece mientras descansas, no mientras entrenas. Duerme 8 horas, hidrátate y planifica tu próxima semana.</div><div style="margin-top:22px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><a href="${ytL('yoga suave recuperación muscular')}" target="_blank" class="btn-yt">${YT} Yoga recuperación</a><a href="${ytL('movilidad articular completa rutina')}" target="_blank" class="btn-yt">${YT} Movilidad articular</a><a href="${ytL('stretching completo post entrenamiento')}" target="_blank" class="btn-yt">${YT} Stretching</a></div></div>`;
    return;
  }
  let h=`<div class="workout-header"><div>${d.muscles_p?`<div class="muscle-tags">${d.muscles_p.map(m=>`<span class="muscle-tag mt-primary">${m}</span>`).join('')}${(d.muscles_s||[]).map(m=>`<span class="muscle-tag mt-secondary">${m}</span>`).join('')}</div>`:''}<div class="workout-title">${d.title}</div></div><div class="workout-meta"><div class="meta-chip">⏱ ${d.duration}</div><div class="meta-chip">${d.icon} ${d.typeFull}</div><div class="meta-chip">📅 ${d.name}</div></div></div>`;
  if(d.cardio){
    h+=`<div class="cardio-block"><div class="cardio-title">🏃 Estructura del entrenamiento</div><div class="cardio-phases">${d.phases_cardio.map(cp=>`<div class="cardio-phase"><div class="cp-label">${cp.label}</div><div class="cp-val">${cp.val}</div><div class="cp-desc" style="white-space:pre-line">${cp.desc}</div></div>`).join('')}</div><div style="margin-top:14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap"><a href="${ytL(d.ytLink)}" target="_blank" class="btn-yt">${YT} Ver tutorial en YouTube</a><span style="font-size:12px;color:var(--muted);font-style:italic">${d.tip}</span></div></div><div class="tips-bar"><div class="tip-item"><div class="tip-dot" style="background:var(--amber)"></div><strong style="color:var(--text)">Fase ${ph.name}:</strong></div><div class="tip-item"><div class="tip-dot" style="background:var(--orange)"></div>${ph.label} · ${ph.cardioMin} min activo</div><div class="tip-item"><div class="tip-dot" style="background:var(--accent)"></div>~${ph.cardioKcal} kcal/sesión</div></div>`;
  }
  if(d.exercises){
    h+=`<div class="exercise-grid">${d.exercises.map((ex,i)=>`<div class="ex-card ${ex.cat}"><div class="ex-num">EJERCICIO ${i+1} · ${ex.cat==='core'?'CORE':ex.cat==='primary'?'PRINCIPAL':'COMPLEMENTARIO'}</div><div class="ex-name">${ex.name}</div><div class="ex-series"><span class="ex-badge badge-sets">📦 ${ex.sets} series</span><span class="ex-badge badge-reps">🔁 ${ex.reps} reps</span><span class="ex-badge badge-rest">⏸ ${ex.rest}</span></div><div class="ex-tip">${ex.tip}</div><a href="${ytL(ex.yt)}" target="_blank" class="btn-yt">${YT} Ver técnica en YouTube</a></div>`).join('')}</div><div class="tips-bar"><div class="tip-item"><div class="tip-dot" style="background:var(--orange)"></div><strong style="color:var(--text)">Fase ${ph.name}:</strong></div><div class="tip-item"><div class="tip-dot" style="background:var(--blue)"></div>Sem 1-4: técnica con peso ligero</div><div class="tip-item"><div class="tip-dot" style="background:var(--amber)"></div>Sem 5-8: +5-10% de peso</div><div class="tip-item"><div class="tip-dot" style="background:var(--accent)"></div>Sem 9-12: máxima carga</div></div>`;
  }
  el.innerHTML=h;
}

// ════════════════════════════════════════
// PLAN COMIDA
// ════════════════════════════════════════
const planComida=[
  {day:'Lunes',meals:[{tipo:'Desayuno',kcal:420,food:'Avena + proteína + fruta',detail:'80g avena, 1 scoop proteína, 1 banano, miel',p:30,c:55,g:8},{tipo:'Merienda AM',kcal:180,food:'Yogur griego + nueces',detail:'200g yogur 0%, 15g nueces mixtas',p:18,c:10,g:8},{tipo:'Almuerzo',kcal:520,food:'Pollo + arroz integral + ensalada',detail:'180g pechuga a la plancha, 150g arroz integral',p:45,c:55,g:10},{tipo:'Merienda PM',kcal:200,food:'Atún + galletas integrales',detail:'1 lata atún, 6 galletas, limón',p:25,c:20,g:4},{tipo:'Cena',kcal:480,food:'Salmón + vegetales + batata',detail:'160g salmón al horno, 150g batata, brócoli',p:38,c:40,g:12}]},
  {day:'Martes',meals:[{tipo:'Desayuno',kcal:400,food:'Huevos revueltos + pan integral',detail:'3 huevos, 2 rebanadas pan, 30g aguacate',p:28,c:35,g:14},{tipo:'Merienda AM',kcal:160,food:'Manzana + mantequilla de maní',detail:'1 manzana, 1 cda. maní natural',p:5,c:25,g:8},{tipo:'Almuerzo',kcal:540,food:'Res magra + papa + ensalada',detail:'160g bistec, 200g papa cocida, ensalada',p:40,c:50,g:13},{tipo:'Merienda PM',kcal:180,food:'Proteína + fruta',detail:'1 scoop proteína, 1 naranja',p:25,c:20,g:2},{tipo:'Cena',kcal:480,food:'Tilapia + quinoa + espinacas',detail:'180g tilapia, 120g quinoa, espinacas',p:42,c:42,g:10}]},
  {day:'Miércoles',meals:[{tipo:'Desayuno',kcal:420,food:'Smoothie proteico + tostadas',detail:'1 scoop proteína, banano, leche, 1 tostada',p:32,c:48,g:6},{tipo:'Merienda AM',kcal:170,food:'Cottage + pepino',detail:'150g queso cottage, pepino en rodajas',p:20,c:8,g:5},{tipo:'Almuerzo',kcal:520,food:'Pollo + pasta integral + vegetales',detail:'180g pollo, 120g pasta, vegetales asados',p:44,c:52,g:9},{tipo:'Merienda PM',kcal:190,food:'Huevo duro + fruta',detail:'2 huevos duros, 1 pera mediana',p:14,c:18,g:10},{tipo:'Cena',kcal:480,food:'Camarones + arroz + ensalada',detail:'200g camarones, 100g arroz, ensalada verde',p:38,c:40,g:10}]},
  {day:'Jueves',meals:[{tipo:'Desayuno',kcal:400,food:'Avena + frutos rojos + almendras',detail:'80g avena, 100g frutos rojos, 20g almendras',p:15,c:55,g:12},{tipo:'Merienda AM',kcal:190,food:'Yogur griego + granola',detail:'200g yogur, 30g granola sin azúcar',p:18,c:22,g:6},{tipo:'Almuerzo',kcal:530,food:'Pavo + lentejas + zanahoria',detail:'160g pechuga pavo, 150g lentejas',p:46,c:50,g:8},{tipo:'Merienda PM',kcal:180,food:'Atún + zanahoria',detail:'1 lata atún, bastones zanahoria',p:26,c:12,g:3},{tipo:'Cena',kcal:480,food:'Huevos + vegetales + papa',detail:'3 huevos al horno, 150g papa, espinacas',p:28,c:42,g:14}]},
  {day:'Viernes',meals:[{tipo:'Desayuno',kcal:430,food:'Pancakes proteicos',detail:'80g avena molida, 2 huevos, scoop proteína',p:35,c:45,g:9},{tipo:'Merienda AM',kcal:160,food:'Banano + proteína',detail:'1 banano, 1 scoop proteína',p:26,c:28,g:2},{tipo:'Almuerzo',kcal:540,food:'Salmón + arroz + aguacate',detail:'170g salmón, 130g arroz, 40g aguacate',p:42,c:44,g:16},{tipo:'Merienda PM',kcal:190,food:'Cottage + mango',detail:'150g cottage, 100g mango',p:18,c:22,g:4},{tipo:'Cena',kcal:480,food:'Pollo + papa + brócoli',detail:'180g pollo horneado, 150g papa, brócoli',p:44,c:40,g:8}]},
  {day:'Sábado',meals:[{tipo:'Desayuno',kcal:450,food:'Omelette + tostadas',detail:'3 huevos, champiñones, pimientos, espinacas',p:30,c:36,g:16},{tipo:'Merienda AM',kcal:200,food:'Smoothie bowl',detail:'Banano, frutos rojos, yogur, chía, granola',p:12,c:38,g:6},{tipo:'Almuerzo',kcal:550,food:'Res + quinoa + ensalada',detail:'160g res magra, 120g quinoa',p:42,c:50,g:12},{tipo:'Merienda PM',kcal:160,food:'Nueces + fruta seca',detail:'25g nueces, 2 dátiles',p:5,c:20,g:12},{tipo:'Cena libre',kcal:500,food:'Comida libre (controlada)',detail:'Disfruta algo. Mantén porciones, evita frituras.',p:30,c:50,g:15}]},
  {day:'Domingo',meals:[{tipo:'Desayuno',kcal:420,food:'Avena especial',detail:'80g avena, leche almendra, banano, nueces, cacao',p:16,c:58,g:12},{tipo:'Merienda AM',kcal:180,food:'Yogur + fresas',detail:'200g yogur griego, 100g fresas',p:18,c:16,g:2},{tipo:'Almuerzo',kcal:550,food:'Pollo + arroz + frijoles',detail:'180g pollo, 120g arroz, 80g frijoles',p:48,c:55,g:8},{tipo:'Merienda PM',kcal:160,food:'Manzana + proteína',detail:'1 manzana, 1 scoop proteína',p:25,c:25,g:2},{tipo:'Cena ligera',kcal:430,food:'Sopa de vegetales + tostadas',detail:'Sopa casera con pollo, 2 tostadas',p:32,c:40,g:8}]}
];
let mealDay=0;
function renderPlanComida(){
  const tabs=document.getElementById('meal-day-tabs');
  tabs.innerHTML=planComida.map((d,i)=>`<button class="btn ${i===mealDay?'btn-orange':'btn-ghost'}" onclick="setMealDay(${i})">${d.day}</button>`).join('');
  renderMealContent();
}
function setMealDay(i){mealDay=i;renderPlanComida();}
function renderMealContent(){
  const d=planComida[mealDay];
  document.getElementById('meal-content').innerHTML=d.meals.map(m=>`<div class="card" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted)">${m.tipo}</span><span style="background:var(--accent-dim);color:var(--accent);font-size:11.5px;font-weight:600;padding:3px 10px;border-radius:20px">${m.kcal} kcal</span></div><div style="font-size:15px;font-weight:600;margin-bottom:4px">${m.food}</div><div style="font-size:12.5px;color:var(--muted);margin-bottom:10px">${m.detail}</div><div style="display:flex;gap:7px;flex-wrap:wrap"><span style="background:var(--blue-dim);color:var(--blue);font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px">Proteína ${m.p}g</span><span style="background:var(--amber-dim);color:var(--amber);font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px">Carbs ${m.c}g</span><span style="background:var(--orange-dim);color:var(--orange);font-size:11px;font-weight:600;padding:3px 9px;border-radius:20px">Grasa ${m.g}g</span></div></div>`).join('');
}

// ════════════════════════════════════════
// LISTA DE COMPRAS
// ════════════════════════════════════════
const SHOP_KEY = 'fittracker_compras_v1';
let shopChecked = JSON.parse(localStorage.getItem(SHOP_KEY)||'{}');
function saveShop(){localStorage.setItem(SHOP_KEY,JSON.stringify(shopChecked));}

const shopCatImages = {
  proteinas: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=900&h=260&fit=crop&q=80',
  carbos: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&h=260&fit=crop&q=80',
  lacteos: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=900&h=260&fit=crop&q=80',
  verduras: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=900&h=260&fit=crop&q=80',
  frutas: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=900&h=260&fit=crop&q=80',
  grasas: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=900&h=260&fit=crop&q=80',
  extras: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=900&h=260&fit=crop&q=80'
};

const shopCats = [
  {
    id:'proteinas', label:'Proteínas', icon:'🥩', color:'var(--red)',
    items:[
      { id:'pollo', name:'Pechuga de pollo', qty:'1.5 kg / semana', rec:'✅ Recomendado: Pechugas frescas sin piel. Evita las procesadas o marinadas con sodio alto.', alts:[{label:'✔ Fresca',desc:'Lo mejor — sin aditivos, congela lo que no uses en 2 días'},{label:'⚠ Congelada',desc:'OK si es sin marinado — revisa que no tenga sal agregada'},{label:'❌ Frita/apanada',desc:'Alta en grasa trans — evitar'}], tip:'Compra 500g extra y congela en porciones de 180g listas para cocinar.' },
      { id:'salmon', name:'Salmón (filete)', qty:'500g / semana', rec:'✅ Recomendado: Salmón fresco o congelado sin salsas. Fuente clave de omega-3.', alts:[{label:'✔ Fresco',desc:'Lo ideal — cocinar en 1-2 días'},{label:'✔ Congelado al vacío',desc:'Igual de nutritivo, más económico'},{label:'⚠ En lata',desc:'Aceptable — revisar que sea en agua, no en aceite'}], tip:'Si el precio es alto, sustitúyelo por tilapia o atún en lata (agua).' },
      { id:'tilapia', name:'Tilapia / Corvina', qty:'500g / semana', rec:'✅ Recomendado: Pescado blanco magro, alto en proteína y bajo costo.', alts:[{label:'✔ Fresca',desc:'Ideal — sabor neutro, muy versátil'},{label:'✔ Congelada',desc:'Muy buena opción económica'}], tip:'Prepara al horno con limón y ajo. Rápido (15 min) y bajo en calorías.' },
      { id:'atun', name:'Atún en lata (agua)', qty:'4-5 latas', rec:'✅ Recomendado: En agua, no en aceite. Proteína rápida y económica.', alts:[{label:'✔ En agua',desc:'La opción correcta — ~25g proteína por lata'},{label:'❌ En aceite',desc:'Agrega ~100 kcal extra por lata — evitar'},{label:'⚠ Sabores/aderezos',desc:'Revisuar sodio — puede ser muy alto'}], tip:'Ideal para meriendas o cuando no tienes tiempo de cocinar proteína.' },
      { id:'pavo', name:'Pechuga de pavo', qty:'400g', rec:'✅ Recomendado: Pavo fresco o en lonchas naturales. Muy magro.', alts:[{label:'✔ Fresca',desc:'La mejor opción'},{label:'⚠ Embutido pavo',desc:'Revisar sodio — muchas marcas son altas en sal y conservantes'}], tip:'Sustituye la res los días que quieres menos grasa saturada.' },
      { id:'huevos', name:'Huevos', qty:'18-20 unidades', rec:'✅ Recomendado: Huevos de libre pastoreo si el presupuesto lo permite.', alts:[{label:'✔ Libre pastoreo',desc:'Más omega-3 y vitamina D — valen el precio'},{label:'✔ Convencionales',desc:'Nutricionalmente muy buenos igual'},{label:'⚠ Claras líquidas',desc:'Buena opción para aumentar proteína sin grasa'}], tip:'3 huevos = ~18g proteína. Revueltos, duros o en omelette. Muy versátil.' },
      { id:'res_magra', name:'Res magra (bistec/molida 90%)', qty:'300g', rec:'✅ Recomendado: Cortes magros como lomo, solomo o posta.', alts:[{label:'✔ Lomo / solomo',desc:'Magro y sabroso — ideal para bistec'},{label:'✔ Molida 90/10',desc:'Buena opción para porciones controladas'},{label:'❌ Costilla/chuleta grasa',desc:'Alta en grasa saturada — limitar a 1x/semana'}], tip:'Come res máximo 1-2 veces por semana. Prefiere horneado o plancha.' },
    ]
  },
  {
    id:'carbos', label:'Carbohidratos', icon:'🌾', color:'var(--amber)',
    items:[
      { id:'avena', name:'Avena en hojuelas', qty:'500g (1 bolsa)', rec:'✅ Recomendado: Avena tradicional en hojuelas, no instantánea con azúcar.', alts:[{label:'✔ Hojuelas tradicionales',desc:'Ideal — índice glucémico bajo, alta fibra'},{label:'⚠ Avena instantánea',desc:'Revisar que no tenga azúcar agregada'},{label:'❌ Avena sabores',desc:'Llena de azúcar — evitar completamente'}], tip:'Base del desayuno. 80g = ~300 kcal + 10g proteína. Prepare la noche anterior.' },
      { id:'arroz', name:'Arroz integral', qty:'1 kg', rec:'✅ Recomendado: Arroz integral. Más fibra y nutrientes que el blanco.', alts:[{label:'✔ Arroz integral',desc:'Lo mejor — fibra, magnesio, digestión más lenta'},{label:'⚠ Arroz blanco',desc:'Aceptable pero índice glucémico más alto'},{label:'✔ Arroz jazmín',desc:'Usado 1-2 días — OK en moderación'}], tip:'Cocina en lote (2 tazas) y guarda en nevera hasta 4 días.' },
      { id:'quinoa', name:'Quinoa', qty:'400g', rec:'✅ Recomendado: Quinoa blanca o tricolor. Proteína completa + carbohidrato.', alts:[{label:'✔ Blanca',desc:'La más común y económica'},{label:'✔ Tricolor',desc:'Un poco más de fibra y antioxidantes'},{label:'✔ Roja/negra',desc:'Más fibra, sabor a nuez — más difícil de conseguir'}], tip:'Contiene 8g proteína por 100g cocida. Ideal para reemplazar arroz 2x/semana.' },
      { id:'pasta_int', name:'Pasta integral', qty:'500g', rec:'✅ Recomendado: Pasta 100% integral, no mezclada.', alts:[{label:'✔ 100% integral',desc:'Revisa que el primer ingrediente sea "trigo integral"'},{label:'⚠ Enriquecida/multigrano',desc:'No es lo mismo que integral — revisar etiqueta'},{label:'✔ Pasta de legumbre',desc:'Chickpea/lentil pasta — más proteína, excelente opción'}], tip:'1 porción = 120g cocida (~180 kcal). Máximo 2-3 veces por semana.' },
      { id:'papa', name:'Papa / Batata', qty:'1.5 kg', rec:'✅ Recomendado: Batata (camote) para la cena — más nutrientes y fibra.', alts:[{label:'✔ Batata/camote',desc:'Vitamina A, fibra, índice glucémico moderado — la mejor opción'},{label:'✔ Papa blanca',desc:'Buena fuente de potasio — cocida/al horno'},{label:'❌ Papa frita',desc:'Evitar completamente — alta en grasa'}], tip:'Hornea las papas y bataas enteras. Más rápido y conserva nutrientes.' },
      { id:'pan_int', name:'Pan integral (100%)', qty:'1 barra / semana', rec:'✅ Recomendado: Pan cuyo primer ingrediente sea "harina integral de trigo".', alts:[{label:'✔ 100% integral',desc:'Primer ingrediente = harina integral — la única opción válida'},{label:'❌ Pan blanco "enriquecido"',desc:'Es básicamente azúcar — sin fibra real'},{label:'⚠ Pan multigrano',desc:'Muchas marcas son pan blanco con semillas — lee etiqueta'}], tip:'2 rebanadas = ~150 kcal + 6g proteína. Máximo 2 rebanadas por día.' },
      { id:'galletas_int', name:'Galletas integrales (sin azúcar)', qty:'1 paquete', rec:'✅ Recomendado: Galletas de arroz o galletas de trigo integral sin azúcar.', alts:[{label:'✔ Galletas de arroz',desc:'Muy bajas en calorías, neutras — perfectas con atún'},{label:'✔ Galletas trigo integral',desc:'Revisa que no tengan azúcar en los primeros 3 ingredientes'},{label:'❌ Galletas de soda / cream crackers',desc:'Alta en sodio y sin fibra'}], tip:'6 galletas = ~100 kcal. Perfectas para merienda con atún o cottage.' },
    ]
  },
  {
    id:'lacteos', label:'Lácteos y Huevos', icon:'🥛', color:'var(--blue)',
    items:[
      { id:'yogur', name:'Yogur griego (0% grasa)', qty:'1 kg (2 tubs 500g)', rec:'✅ Recomendado: Yogur griego natural sin azúcar, 0% o 2% grasa.', alts:[{label:'✔ Griego natural 0%',desc:'17g proteína por 170g — el campeón de los lácteos'},{label:'⚠ Griego con frutas',desc:'Revisar azúcar — muchas marcas tienen 20g+ de azúcar'},{label:'❌ Yogur regular endulzado',desc:'Mucho azúcar, poca proteína — evitar'}], tip:'Úsalo como base de desayuno, merienda o como sustituto de mayonesa/crema.' },
      { id:'cottage', name:'Queso Cottage', qty:'500g', rec:'✅ Recomendado: Cottage bajo en grasa. 14g proteína por 100g.', alts:[{label:'✔ Bajo en grasa (1-2%)',desc:'La opción ideal'},{label:'✔ Regular (4%)',desc:'Aceptable — más cremoso'},{label:'❌ Con crema/full fat',desc:'Puede tener el doble de calorías'}], tip:'Mezcla con mango, pepino o fresas. También funciona en recetas saladas.' },
      { id:'leche_desc', name:'Leche descremada o almendra', qty:'1 litro', rec:'✅ Recomendado: Descremada para proteína, almendra para smoothies.', alts:[{label:'✔ Descremada',desc:'9g proteína por taza — buena opción económica'},{label:'✔ Leche de almendra sin azúcar',desc:'Baja en calorías (~30 kcal/taza) — ideal para batidos'},{label:'⚠ Leche de avena',desc:'Buena pero más alta en carbohidratos'}], tip:'Para smoothies usa almendra. Para recetas con más proteína usa descremada.' },
      { id:'proteina_polvo', name:'Proteína en polvo (Whey/Vegana)', qty:'1 bolsa 1-2 lb', rec:'✅ Recomendado: Whey isolate o concentrada. Limpia, sin rellenos.', alts:[{label:'✔ Whey Isolate',desc:'Más pura, menos lactosa, se absorbe mejor — la mejor opción'},{label:'✔ Whey Concentrate',desc:'Más económica, pequeña cantidad de grasa — muy buena'},{label:'✔ Vegana (pea/rice)',desc:'Excelente si tienes intolerancia a lactosa'},{label:'❌ Gainers / Mass builders',desc:'Llenos de azúcar y maltodextrina — NO para pérdida de peso'}], tip:'1 scoop = ~25g proteína / ~120 kcal. Úsala como suplemento, no como base.' },
    ]
  },
  {
    id:'verduras', label:'Verduras', icon:'🥦', color:'var(--accent)',
    items:[
      { id:'brocoli', name:'Brócoli', qty:'500g', rec:'✅ Recomendado: Fresco o congelado. Uno de los vegetales más nutritivos.', alts:[{label:'✔ Fresco',desc:'Ideal — usa en 3-4 días'},{label:'✔ Congelado',desc:'Igual de nutritivo, más conveniente y económico'}], tip:'Al vapor 4 min o al horno con aceite de oliva. Agrega a cualquier plato.' },
      { id:'espinaca', name:'Espinacas / Kale', qty:'200g', rec:'✅ Recomendado: Espinaca tierna fresca o congelada. Alta en hierro y fibra.', alts:[{label:'✔ Espinaca fresca baby',desc:'Lista para usar, sin cocción necesaria'},{label:'✔ Congelada',desc:'Perfecta para omelet, sopas y salteados'},{label:'✔ Kale',desc:'Más densa en nutrientes pero más difícil de conseguir'}], tip:'Agrega al omelette o saltea con ajo como guarnición. Muy versátil.' },
      { id:'zanahoria', name:'Zanahoria', qty:'500g', rec:'✅ Recomendado: Zanahoria entera, no rallada en bolsa (pierde vitaminas).', alts:[{label:'✔ Entera fresca',desc:'La mejor opción — dura 2 semanas en nevera'},{label:'⚠ Baby carrots',desc:'OK para merienda, más costosas'}], tip:'Bastones de zanahoria + atún = merienda perfecta de 15g proteína y fibra.' },
      { id:'pimientos', name:'Pimientos (rojo/verde/amarillo)', qty:'3-4 unidades', rec:'✅ Recomendado: Pimientos frescos para omelette, ensaladas y salteados.', alts:[{label:'✔ Fresco',desc:'Vitamina C muy alta especialmente el rojo'},{label:'✔ Congelado en tiras',desc:'Práctico para cocinar rápido'}], tip:'El pimiento rojo tiene 3x más vitamina C que el verde.' },
      { id:'tomate', name:'Tomates', qty:'500g', rec:'✅ Recomendado: Tomates frescos o cherry para ensaladas.', alts:[{label:'✔ Frescos',desc:'Lo ideal para ensaladas crudas'},{label:'✔ Cherry',desc:'Prácticos, más dulces'},{label:'⚠ Enlatados',desc:'Para cocinar — revisar sodio agregado'}], tip:'Licopa del tomate se absorbe mejor cocido. Para ensalada, fresco.' },
      { id:'cebolla_ajo', name:'Cebolla y ajo', qty:'1 cebolla grande + 1 cabeza ajo', rec:'✅ Recomendado: Base de cocina, dan sabor sin calorías.', alts:[{label:'✔ Frescos',desc:'Siempre mejor que en polvo'},{label:'✔ Ajo en polvo',desc:'Opción rápida para sazonar'}], tip:'Saltea ajo en spray de aceite de oliva. Casi cero calorías, sabor máximo.' },
      { id:'pepino', name:'Pepino', qty:'2 unidades', rec:'✅ Recomendado: Pepino fresco para snacks y ensaladas.', alts:[{label:'✔ Fresco',desc:'Hidratante, casi sin calorías (15 kcal/taza)'}], tip:'Bastones de pepino + cottage = snack de 15g proteína y cero culpa.' },
      { id:'champinones', name:'Champiñones', qty:'250g', rec:'✅ Recomendado: Champiñones frescos para omelette y salteados.', alts:[{label:'✔ Frescos',desc:'Sabor superior'},{label:'✔ Enlatados en agua',desc:'Aceptable para cocinar'}], tip:'200g champiñones = solo 40 kcal + 4g proteína. Volumen por muy pocas calorías.' },
    ]
  },
  {
    id:'frutas', label:'Frutas', icon:'🍌', color:'var(--orange)',
    items:[
      { id:'banano', name:'Bananos / Plátano', qty:'7-10 unidades (1 por día)', rec:'✅ Recomendado: Bananos medianos. Carbohidrato de calidad pre-entreno.', alts:[{label:'✔ Maduro',desc:'Más azúcar natural, mejor para después del gym'},{label:'✔ Semi verde',desc:'Más almidón resistente — mejor para la microbiota'}], tip:'Come 1 banano antes del gym para energía rápida. Congela los maduros para batidos.' },
      { id:'manzana', name:'Manzanas', qty:'4-5 unidades', rec:'✅ Recomendado: Manzana entera, no en jugo.', alts:[{label:'✔ Roja (Fuji/Gala)',desc:'Más dulce, más antioxidantes'},{label:'✔ Verde (Granny Smith)',desc:'Menos azúcar, más fibra — mejor para pérdida de peso'}], tip:'La fibra de la manzana entera ralentiza la absorción del azúcar. Nunca en jugo.' },
      { id:'frutos_rojos', name:'Frutos rojos (fresa/mora/arándano)', qty:'300g', rec:'✅ Recomendado: Frutos rojos frescos o congelados. Los mejores para dieta.', alts:[{label:'✔ Frescos',desc:'Ideales cuando están en temporada'},{label:'✔ Congelados',desc:'Igual de nutritivos, disponibles siempre — perfectos para avena y batidos'},{label:'❌ En almíbar/mermelada',desc:'Llenos de azúcar — evitar'}], tip:'Los arándanos tienen el índice glucémico más bajo de todas las frutas.' },
      { id:'naranja', name:'Naranjas', qty:'4 unidades', rec:'✅ Recomendado: Naranja entera, no en jugo. Vitamina C y fibra.', alts:[{label:'✔ Valencia',desc:'Perfecta para comer'},{label:'❌ Jugo',desc:'Sin fibra, ~30g azúcar por vaso — casi igual que un refresco'}], tip:'1 naranja = 60 kcal + 3g fibra. El jugo = 120 kcal + 0 fibra. Come entera.' },
      { id:'mango', name:'Mango', qty:'2 unidades', rec:'✅ Recomendado: Mango fresco para meriendas. Alto en vitamina A y C.', alts:[{label:'✔ Fresco maduro',desc:'Lo mejor — ~100 kcal por 150g'},{label:'❌ Mango seco',desc:'Concentrado en azúcar — 8x más calorías'}], tip:'100g mango fresco + 150g cottage = merienda de 18g proteína y sabor increíble.' },
      { id:'aguacate', name:'Aguacate', qty:'2 unidades', rec:'✅ Recomendado: 1/4 aguacate por porción. Grasa saludable pero calórico.', alts:[{label:'✔ Hass',desc:'La variedad estándar — cremoso y nutritivo'}], tip:'40g aguacate (1/4) = 70 kcal + 6g grasa buena. No más de 1/3 por día.' },
      { id:'pera', name:'Pera', qty:'3 unidades', rec:'✅ Recomendado: Pera mediana para merienda. Alta en fibra.', alts:[{label:'✔ Pera amarilla',desc:'La más común — dulce y jugosa'},{label:'✔ Pera Bosc/Asian',desc:'Más crujiente, menos azúcar'}], tip:'1 pera = ~100 kcal + 5-6g fibra. De las frutas más saciantes.' },
    ]
  },
  {
    id:'grasas', label:'Grasas Saludables', icon:'🥑', color:'var(--purple)',
    items:[
      { id:'aceite_oliva', name:'Aceite de oliva extra virgen', qty:'1 botella pequeña', rec:'✅ Recomendado: AOVE (extra virgen). Para cocinar a baja-media temperatura.', alts:[{label:'✔ Extra virgen',desc:'Polifenoles y omega-9 — el más saludable'},{label:'✔ Spray de oliva',desc:'Controla las porciones perfectamente — muy recomendado'},{label:'⚠ Aceite de canola',desc:'OK para cocinar a alta temperatura'},{label:'❌ Aceite vegetal/palma',desc:'Alto en grasas saturadas y trans'}], tip:'Usa spray para el gym y la cocina diaria. 1 cucharada = 120 kcal.' },
      { id:'nueces', name:'Nueces mixtas (sin sal)', qty:'200g', rec:'✅ Recomendado: Nueces, almendras, marañones sin sal añadida.', alts:[{label:'✔ Sin sal, naturales',desc:'Lo mejor — omega-3, vitamina E'},{label:'⚠ Tostadas con sal',desc:'Aceptable si es poca sal'},{label:'❌ Nueces con azúcar/miel',desc:'Añade calorías vacías — evitar'}], tip:'Porción: 25-30g (un puño pequeño) = ~180 kcal. No comer del bolso sin medir.' },
      { id:'mani', name:'Mantequilla de maní (100% maní)', qty:'1 frasco pequeño', rec:'✅ Recomendado: Maní puro, sin azúcar ni aceite de palma.', alts:[{label:'✔ 100% maní (solo maní en ingredientes)',desc:'La única opción real'},{label:'⚠ "Natural" con sal',desc:'OK si solo tiene maní y sal'},{label:'❌ Skippy / Jif estilo americano',desc:'Llenas de azúcar y aceite de palma'}], tip:'1 cucharada = 90 kcal + 4g proteína. Perfecta con manzana o en avena.' },
      { id:'chia', name:'Semillas de chía', qty:'200g', rec:'✅ Recomendado: Chía en grano. Omega-3 y fibra excepcionales.', alts:[{label:'✔ Semilla entera',desc:'La forma estándar — hidratar antes de comer'}], tip:'2 cdas (25g) en yogur o avena = +5g fibra y omega-3. Hidrata antes de usar.' },
    ]
  },
  {
    id:'extras', label:'Condimentos y Extras', icon:'🧂', color:'var(--muted)',
    items:[
      { id:'canela', name:'Canela en polvo', qty:'1 frasco', rec:'✅ Recomendado: Canela de Ceilán (más fina, menos cumarina que la cassia).', alts:[{label:'✔ Ceilán (Ceylon)',desc:'La mejor — sabor más suave, más pura'},{label:'✔ Cassia',desc:'La más común, funciona bien en cantidades pequeñas'}], tip:'En avena o yogur. Mejora la sensibilidad a la insulina. 0 calorías.' },
      { id:'stevia', name:'Stevia (endulzante natural)', qty:'1 caja', rec:'✅ Recomendado: Stevia pura, sin mezcla con azúcar o maltodextrina.', alts:[{label:'✔ Stevia pura en polvo/líquida',desc:'0 calorías, natural'},{label:'⚠ Blend stevia + azúcar',desc:'Tiene calorías — revisar etiqueta'},{label:'❌ Splenda / sucralosa',desc:'Puede afectar microbiota intestinal'}], tip:'Usa para endulzar avena, yogur y batidos sin afectar tus calorías.' },
      { id:'limon', name:'Limones', qty:'6-8 unidades', rec:'✅ Recomendado: Limón natural. Vitamina C y saborizante sin calorías.', alts:[{label:'✔ Limón fresco',desc:'Lo mejor — vitamina C, ácido cítrico'},{label:'⚠ Limón embotellado',desc:'Funciona pero pierde vitamina C'}], tip:'Exprime sobre pescado, pollo, ensaladas. Da sabor sin agregar calorías.' },
      { id:'cilantro_perejil', name:'Cilantro / Perejil frescos', qty:'1 manojo', rec:'✅ Recomendado: Hierbas frescas para dar sabor sin salsas ni condimentos altos en sodio.', alts:[{label:'✔ Fresco',desc:'Mejor sabor'},{label:'✔ Seco/en polvo',desc:'Conveniente — funciona bien'}], tip:'Hierbas frescas = cero calorías, mucho sabor. Sustituye salsas procesadas.' },
      { id:'caldo_bajo', name:'Caldo bajo en sodio (pollo/vegetal)', qty:'1 litro / tetrapak', rec:'✅ Recomendado: Caldo con menos de 500mg sodio por porción.', alts:[{label:'✔ Bajo sodio certificado',desc:'Revisa etiqueta — menos de 500mg/250ml'},{label:'⚠ Caldo regular',desc:'Muy alto en sodio — puede inflamar'},{label:'✔ Casero',desc:'Lo mejor si tienes tiempo'}], tip:'Base para sopas y arroces. Mucho más sabor que agua sin calorías extra.' },
      { id:'especias', name:'Especias (comino, paprika, orégano, cúrcuma)', qty:'Surtido básico', rec:'✅ Recomendado: Especias puras, no mezclas con sal como "sazón completo".', alts:[{label:'✔ Especias puras',desc:'0 calorías, 0 sodio, sabor completo'},{label:'❌ Sazonadores tipo Maggi / Sazón',desc:'Muy alto en sodio y glutamato — evitar'}], tip:'La cúrcuma tiene efectos antiinflamatorios. Agrega a arroz y sopas.' },
    ]
  }
];

let activeShopCat = 'todas';

function renderCompras(){
  renderShopCatTabs();
  renderShopItems();
  updateShopProgress();
}

function renderShopCatTabs(){
  const total = shopCats.reduce((s,c)=>s+c.items.length,0);
  let html = `<button class="btn ${activeShopCat==='todas'?'btn-primary':'btn-ghost'}" style="font-size:12px" onclick="setShopCat('todas')">Todas (${total})</button>`;
  shopCats.forEach(c=>{
    const done = c.items.filter(i=>shopChecked[i.id]).length;
    html += `<button class="btn ${activeShopCat===c.id?'btn-primary':'btn-ghost'}" style="font-size:12px;display:inline-flex;align-items:center;gap:5px" onclick="setShopCat('${c.id}')">${c.icon} ${c.label} <span style="opacity:0.6;font-size:11px">${done}/${c.items.length}</span></button>`;
  });
  document.getElementById('shop-cat-tabs').innerHTML=html;
}

function setShopCat(id){activeShopCat=id;renderShopCatTabs();renderShopItems();}

function renderShopItems(){
  const cats = activeShopCat==='todas' ? shopCats : shopCats.filter(c=>c.id===activeShopCat);
  let html='';
  cats.forEach(cat=>{
    const img = shopCatImages[cat.id] || '';
    html+=`<div style="margin-bottom:28px">
      <div class="cat-header" style="background-image:linear-gradient(180deg, rgba(10,12,18,0.4) 0%, rgba(10,12,18,0.92) 100%), url('${img}')">
        <div class="cat-header-inner">
          <span class="cat-header-emoji">${cat.icon}</span>
          <div>
            <div class="cat-header-title">${cat.label}</div>
            <div class="cat-header-meta"><span class="cat-header-count">${cat.items.filter(i=>shopChecked[i.id]).length} de ${cat.items.length} comprados</span></div>
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:10px">`;
    cat.items.forEach(item=>{
      const done = !!shopChecked[item.id];
      html+=`<div style="background:var(--card);border:1px solid ${done?'rgba(110,231,183,0.25)':' var(--border)'};border-radius:var(--radius);padding:16px 18px;transition:all 0.2s;${done?'opacity:0.7':''}">
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px">
          <div onclick="toggleShop('${item.id}')" style="width:22px;height:22px;border-radius:6px;border:2px solid ${done?'var(--accent)':'var(--border2)'};background:${done?'var(--accent)':'transparent'};display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;margin-top:1px;transition:all 0.15s">
            ${done?'<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#0a1a12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>':''}
          </div>
          <div style="flex:1">
            <div style="font-size:14.5px;font-weight:600;${done?'text-decoration:line-through;color:var(--muted)':''}">${item.name}</div>
            <div style="font-size:11.5px;color:${cat.color};font-weight:600;margin-top:2px">📦 ${item.qty}</div>
          </div>
        </div>
        <div style="font-size:12px;color:var(--accent);background:var(--accent-dim2);border:1px solid rgba(110,231,183,0.1);border-radius:var(--radius-sm);padding:7px 10px;margin-bottom:10px;line-height:1.5">${item.rec}</div>
        <div style="margin-bottom:10px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted2);margin-bottom:6px">Opciones en el super</div>
          <div style="display:flex;flex-direction:column;gap:5px">
            ${item.alts.map(a=>`<div style="display:flex;align-items:flex-start;gap:8px;font-size:12px"><span style="font-weight:600;min-width:140px;flex-shrink:0;color:var(--text)">${a.label}</span><span style="color:var(--muted);line-height:1.4">${a.desc}</span></div>`).join('')}
          </div>
        </div>
        <div style="font-size:11.5px;color:var(--amber);background:var(--amber-dim);border-radius:var(--radius-sm);padding:6px 10px;line-height:1.5">💡 ${item.tip}</div>
      </div>`;
    });
    html+='</div></div>';
  });
  document.getElementById('shop-items-container').innerHTML=html;
}

function toggleShop(id){
  shopChecked[id]=!shopChecked[id];
  saveShop();
  renderShopItems();
  renderShopCatTabs();
  updateShopProgress();
}

function updateShopProgress(){
  const total=shopCats.reduce((s,c)=>s+c.items.length,0);
  const done=Object.values(shopChecked).filter(Boolean).length;
  const pct=total?Math.round(done/total*100):0;
  document.getElementById('shop-total-items').textContent=total;
  document.getElementById('shop-done-items').textContent=done;
  document.getElementById('shop-pct-txt').textContent=pct+'%';
  document.getElementById('shop-pct-bar').style.width=pct+'%';
}

function resetCompras(){
  if(!confirm('¿Reiniciar todos los checks de compras?'))return;
  shopChecked={};saveShop();renderCompras();toast('✓ Lista reiniciada');
}

function printCompras(){
  window.print();
}

const shopTips=[
  {icon:'🕐',title:'Compra 1 vez por semana',desc:'Haz una sola compra grande los domingos. Ahorra tiempo, dinero y evita compras impulsivas.'},
  {icon:'🧊',title:'Congela proteínas en porciones',desc:'Divide el pollo y pescado en porciones de 180g al llegar a casa. Congela lo que no usas en 2 días.'},
  {icon:'🏷️',title:'Lee siempre la etiqueta',desc:'Primer ingrediente = ingrediente principal. Si dice "harina enriquecida" en lugar de "integral", no es integral.'},
  {icon:'💰',title:'Prioridad de presupuesto',desc:'Si el presupuesto es ajustado: pollo > huevos > atún > tilapia. Son las proteínas más económicas.'},
  {icon:'🚫',title:'Evita el pasillo de snacks',desc:'No necesitas ir al pasillo de galletas, dulces ni bebidas azucaradas. Esos productos no están en tu plan.'},
  {icon:'🥡',title:'Prep dominical',desc:'El domingo: cocina arroz, lava verduras, divide proteínas. 1h de prep = semana sin excusas.'}
];

function renderShopTipsGrid(){
  document.getElementById('shop-tips-grid').innerHTML=shopTips.map(t=>`<div class="card"><div style="font-size:22px;margin-bottom:8px">${t.icon}</div><div style="font-size:13.5px;font-weight:600;margin-bottom:5px">${t.title}</div><div style="font-size:12.5px;color:var(--muted);line-height:1.6">${t.desc}</div></div>`).join('');
}

// ════════════════════════════════════════
// RECETAS & COCINA
// ════════════════════════════════════════
const recetas = [
  {
    id:'avena_proteica', cat:'desayuno', nombre:'Avena proteica con fruta',
    tiempo:'5 min', dificultad:'Fácil', kcal:420, p:30, c:55, g:8,
    emoji:'🥣', color:'var(--amber)',
    desc:'El desayuno base del plan. Te mantiene saciado hasta el almuerzo.',
    ingredientes:['80g avena en hojuelas','1 scoop proteína en polvo (vainilla)','1 banano mediano','1 cdita. miel o stevia','200ml agua o leche de almendra','Canela al gusto'],
    pasos:[
      'Calienta el agua o leche en una olla a fuego medio.',
      'Agrega la avena y cocina 3-4 min revolviendo constantemente.',
      'Retira del fuego. Espera 1 min y agrega el scoop de proteína (si está muy caliente desnaturaliza la proteína).',
      'Revuelve bien hasta integrar. Añade canela y stevia/miel.',
      'Sirve en un bowl y corona con el banano en rodajas.'
    ],
    tips:['Prepara la avena la noche anterior con leche fría (overnight oats) — sin cocción.','Si queda muy espesa, agrega más leche. Si muy líquida, más avena.','Sustituye el banano por frutos rojos para menos azúcar.'],
    variantes:[{nombre:'Overnight oats',desc:'Mezcla todo en frío la noche anterior. Refrigera. Lista al despertar.'}]
  },
  {
    id:'pancakes_proteicos', cat:'desayuno', nombre:'Pancakes proteicos de avena',
    tiempo:'15 min', dificultad:'Fácil', kcal:430, p:35, c:45, g:9,
    emoji:'🥞', color:'var(--amber)',
    desc:'Sin harina blanca. Esponjosos, altos en proteína y perfectos para el viernes.',
    ingredientes:['80g avena molida (licúa avena normal)','2 huevos completos','1 scoop proteína (vainilla o chocolate)','50ml leche descremada','1/2 cdita. polvo de hornear','Canela y stevia al gusto','Fresas frescas para decorar'],
    pasos:[
      'Licúa la avena en hojuelas hasta convertirla en harina fina.',
      'En un bowl mezcla: avena molida, proteína, polvo de hornear, canela.',
      'Agrega los huevos y la leche. Mezcla hasta obtener una masa sin grumos.',
      'Calienta una sartén antiadherente a fuego medio-bajo. Aplica spray de aceite.',
      'Vierte 1/4 taza de masa por pancake. Cocina 2-3 min hasta ver burbujas.',
      'Voltea y cocina 1-2 min más. Sirve con fresas y stevia.'
    ],
    tips:['La sartén debe estar a fuego BAJO-MEDIO. A fuego alto se queman por fuera y quedan crudos por dentro.','Si la masa está muy espesa, agrega leche de a poco.','Puedes congelar los pancakes ya cocinados y calentar en microondas 45 seg.'],
    variantes:[{nombre:'Versión chocolate',desc:'Usa scoop de chocolate + 1 cda. de cacao puro sin azúcar.'}]
  },
  {
    id:'omelette_completo', cat:'desayuno', nombre:'Omelette completo de vegetales',
    tiempo:'10 min', dificultad:'Fácil', kcal:400, p:28, c:12, g:24,
    emoji:'🍳', color:'var(--amber)',
    desc:'Proteína y vegetales en 10 minutos. El desayuno más versátil del plan.',
    ingredientes:['3 huevos','50g pimientos (rojo/verde picado fino)','50g champiñones laminados','30g espinacas','1/4 cebolla pequeña picada','Sal, pimienta, orégano','Spray aceite de oliva'],
    pasos:[
      'Bate los 3 huevos en un bowl con sal, pimienta y orégano. Reserva.',
      'Calienta sartén antiadherente a fuego medio con spray de aceite.',
      'Saltea cebolla y pimientos 2 min. Agrega champiñones, cocina 2 min más.',
      'Agrega espinacas, mezcla 30 seg hasta marchitar.',
      'Vierte los huevos sobre los vegetales. No revuelvas.',
      'Cuando los bordes estén sólidos, dobla el omelette a la mitad. Sirve.'
    ],
    tips:['La clave es temperatura media-baja. El huevo no debe dorarse.','Para un omelette perfecto, inclina la sartén y mueve los bordes con una espátula.','Agrega 2 claras extra para más proteína sin calorías.'],
    variantes:[{nombre:'Sin yemas',desc:'Usa 2 huevos completos + 3 claras = menos grasa, más proteína.'}]
  },
  {
    id:'pollo_plancha', cat:'almuerzo', nombre:'Pechuga de pollo a la plancha perfecta',
    tiempo:'15 min', dificultad:'Fácil', kcal:220, p:42, c:0, g:5,
    emoji:'🍗', color:'var(--orange)',
    desc:'La técnica correcta para que el pollo quede jugoso, no seco ni gomoso.',
    ingredientes:['180g pechuga de pollo sin piel','Jugo de 1 limón','2 dientes de ajo machacados','Orégano, comino, paprika al gusto','Sal y pimienta','Spray aceite de oliva'],
    pasos:[
      'CLAVE: Aplanar el pollo. Cubre con film y golpea con el fondo de una olla hasta grosor uniforme (~1.5cm). Cocina parejo.',
      'Marina 10 min mínimo en limón, ajo y especias.',
      'Calienta la sartén o plancha a fuego ALTO hasta que humee levemente.',
      'Aplica spray. Coloca el pollo. NO muevas por 4-5 min.',
      'Voltea una sola vez. Cocina 3-4 min más.',
      'Reposa 3 min antes de cortar. Esto retiene los jugos.'
    ],
    tips:['El mayor error: mover el pollo constantemente. Déjalo quieto para que se selle.','Temperatura interna ideal: 74°C. Sin termómetro: corta — debe estar blanco sin rosado.','Marina desde la noche anterior para más sabor con menos sodio.'],
    variantes:[{nombre:'Al horno',desc:'180°C, 20-25 min. Más fácil pero sin el sellado crujiente.'},{nombre:'Con curry',desc:'Agrega curry en polvo + yogur griego a la marinada. Excepcional.'}]
  },
  {
    id:'arroz_integral', cat:'almuerzo', nombre:'Arroz integral perfecto (método absorción)',
    tiempo:'30 min', dificultad:'Fácil', kcal:216, p:5, c:45, g:2,
    emoji:'🍚', color:'var(--blue)',
    desc:'La forma correcta de cocinar arroz integral. Muchos lo hacen mal y queda duro.',
    ingredientes:['1 taza arroz integral (200g seco)','2.5 tazas agua (nota: más agua que arroz blanco)','1/2 cdita. sal','Opcional: caldo bajo en sodio en lugar de agua'],
    pasos:[
      'CLAVE: Remoja el arroz 30 min en agua fría. Tira esa agua. Esto reduce cocción 10 min.',
      'En olla mediana agrega arroz remojado + 2.5 tazas agua + sal.',
      'Lleva a hervor a fuego alto.',
      'Cuando hierva, baja a fuego MUY bajo. Tapa herméticamente.',
      'Cocina 25-30 min sin abrir la tapa.',
      'Apaga, deja reposar 10 min tapado. Esponja con tenedor.'
    ],
    tips:['Usa caldo de pollo bajo en sodio en vez de agua — más sabor, mismas calorías.','Cocina 3 tazas el domingo — guarda en nevera hasta 5 días.','Si queda duro: agrega 2 cdas. agua, tapa y calienta 5 min.'],
    variantes:[{nombre:'Con vegetales',desc:'Saltea cebolla + ajo antes, agrega arroz + agua + zanahoria en cubos.'},{nombre:'Arroz blanco',desc:'Ratio 1:2, sin remojo, cocción 18-20 min. Más rápido pero menos fibra.'}]
  },
  {
    id:'salmon_horno', cat:'cena', nombre:'Salmón al horno con limón y ajo',
    tiempo:'20 min', dificultad:'Fácil', kcal:310, p:36, c:2, g:17,
    emoji:'🐟', color:'var(--blue)',
    desc:'El plato estrella del plan. Omega-3, proteína completa y listo en 20 minutos.',
    ingredientes:['160g filete de salmón','Jugo de 1 limón','3 dientes de ajo laminados','Eneldo seco o fresco (opcional)','Sal, pimienta','Spray aceite de oliva'],
    pasos:[
      'Precalienta el horno a 200°C (400°F).',
      'Coloca el salmón en papel aluminio o en molde antiadherente.',
      'Exprime limón sobre el salmón. Distribuye el ajo laminado encima.',
      'Añade sal, pimienta y eneldo. Aplica spray de aceite.',
      'Hornea 12-15 min. Estará listo cuando la carne se separe con tenedor.',
      'Opcional: los últimos 2 min en modo grill/broil para dorar la superficie.'
    ],
    tips:['No sobrecocines el salmón — el centro debe quedar ligeramente translúcido.','El salmón congelado debe descongelarse en nevera (no en agua caliente) para mantener textura.','Sustituye limón por naranja para un sabor diferente.'],
    variantes:[{nombre:'En sartén',desc:'Sella piel hacia abajo 4 min fuego alto, voltea, baja fuego, 3 min más.'},{nombre:'Con mostaza',desc:'Cubre con 1 cda. mostaza Dijon + ajo. Mucho sabor con pocas calorías.'}]
  },
  {
    id:'batata_horno', cat:'cena', nombre:'Batata al horno caramelizada',
    tiempo:'35 min', dificultad:'Muy fácil', kcal:180, p:3, c:42, g:0,
    emoji:'🍠', color:'var(--orange)',
    desc:'El carbohidrato de la cena. Naturalmente dulce, más nutritivo que la papa blanca.',
    ingredientes:['200g batata/camote','Canela en polvo','Spray aceite de oliva','Sal y pimienta opcional'],
    pasos:[
      'Precalienta horno a 200°C.',
      'Opción A (entera): Pínchala con tenedor 6-8 veces. Hornea 40-45 min directamente en la rejilla.',
      'Opción B (cubos): Pela y corta en cubos 2x2cm. Aplica spray y canela. Hornea en bandeja 25-30 min.',
      'Estará lista cuando la piel se arruge o los cubos estén dorados.',
      'Sirve así o con 1 cdita. de aceite de oliva y sal marina.'
    ],
    tips:['La batata entera en horno queda MÁS dulce que cortada — la humedad se concentra.','Prepara 3-4 batatas el domingo — se conservan 4 días en nevera.','El índice glucémico de la batata al horno es mayor que cocida — para pérdida de peso, prefiere cocida.'],
    variantes:[{nombre:'Cocida',desc:'En olla con agua hirviendo 20 min. Menor IG, más recomendada para dieta.'},{nombre:'Puré saludable',desc:'Aplasta con tenedor + 1 cda. yogur griego + canela. Sin mantequilla.'}]
  },
  {
    id:'quinoa_base', cat:'almuerzo', nombre:'Bowl de quinoa con pollo y aguacate',
    tiempo:'20 min', dificultad:'Fácil', kcal:520, p:44, c:45, g:14,
    emoji:'🥗', color:'var(--accent)',
    desc:'La comida más completa del plan. Proteína completa desde dos fuentes.',
    ingredientes:['120g quinoa seca (rinde ~240g cocida)','150g pechuga de pollo cocinada y desmenuzada','40g aguacate en cubos','100g tomates cherry','Espinacas o lechuga al gusto','Jugo de limón, sal, pimienta'],
    pasos:[
      'Quinoa: lava bien (quita amargura). Pon en olla con 1.5x su volumen de agua + sal.',
      'Hierve, baja fuego, tapa. Cocina 15 min. Esponja con tenedor.',
      'Mientras: prepara el pollo a la plancha o usa sobrante del día anterior.',
      'En un bowl base: coloca quinoa caliente + espinacas (se marchitan un poco).',
      'Agrega el pollo desmenuzado encima.',
      'Corona con aguacate, tomates cherry, limón y pimienta negra.'
    ],
    tips:['La quinoa tiene los 9 aminoácidos esenciales — es una proteína completa como la carne.','Lavar la quinoa es OBLIGATORIO — la saponina (recubrimiento amargo) arruina el sabor.','Cocina 300g de quinoa el domingo — guarda en nevera y úsala toda la semana.'],
    variantes:[{nombre:'Frío (ensalada)',desc:'Deja enfriar la quinoa, agrega todos los ingredientes fríos. Mejor para almuerzo rápido.'},{nombre:'Vegetariano',desc:'Sustituye el pollo por 150g lentejas cocidas o 200g champiñones salteados.'}]
  },
  {
    id:'sopa_vegetales', cat:'cena', nombre:'Sopa de vegetales con pollo',
    tiempo:'25 min', dificultad:'Fácil', kcal:320, p:30, c:28, g:6,
    emoji:'🍲', color:'var(--accent)',
    desc:'La cena ligera del domingo. Reconfortante, nutritiva y casi sin calorías extras.',
    ingredientes:['150g pechuga de pollo en cubos','1 zanahoria en rodajas','1 rama de apio en trozos','1/2 cebolla picada','2 dientes de ajo','50g espinacas','1L caldo de pollo bajo en sodio','Sal, comino, orégano, cilantro'],
    pasos:[
      'En olla a fuego medio, sofríe cebolla y ajo en spray de aceite 2 min.',
      'Agrega el pollo en cubos. Sella 3 min revolviendo.',
      'Agrega zanahoria y apio. Cocina 2 min más.',
      'Vierte el caldo. Sube el fuego hasta hervir.',
      'Baja a fuego medio-bajo. Agrega comino y orégano. Cocina 12-15 min.',
      'Apaga el fuego. Agrega espinacas y cilantro fresco. Tapa 2 min.'
    ],
    tips:['Las espinacas se agregan al final — si las cocinas mucho pierden todo el nutriente.','Haz el doble y guarda para el día siguiente. Las sopas mejoran de un día a otro.','Para más proteína agrega 1 huevo batido en hilo fino mientras revuelves (consommé).'],
    variantes:[{nombre:'Con papa',desc:'Agrega 150g papa en cubos junto con la zanahoria. +180 kcal.'},{nombre:'Con fideos integrales',desc:'Agrega 50g fideos los últimos 8 min de cocción.'}]
  },
  {
    id:'lentejas', cat:'almuerzo', nombre:'Lentejas con pavo y vegetales',
    tiempo:'25 min', dificultad:'Fácil', kcal:420, p:42, c:45, g:6,
    emoji:'🫘', color:'var(--orange)',
    desc:'Alta en fibra y proteína. Mantendrá tu saciedad por horas.',
    ingredientes:['150g lentejas rojas (no necesitan remojo)','120g pavo molido o en cubos','1 zanahoria picada','1/2 cebolla','2 dientes de ajo','1 lata tomate triturado (bajo sodio)','Comino, cúrcuma, sal, pimienta'],
    pasos:[
      'Sofríe cebolla y ajo en spray de aceite a fuego medio.',
      'Agrega el pavo. Cocina 4 min hasta dorar.',
      'Agrega zanahoria picada, comino y cúrcuma. Mezcla 1 min.',
      'Vierte el tomate triturado + 400ml agua + lentejas lavadas.',
      'Lleva a hervor, baja fuego. Cocina 18-20 min tapado.',
      'Ajusta sal. Las lentejas rojas se deshacen un poco — eso está bien.'
    ],
    tips:['Las lentejas rojas no necesitan remojo previo — se cocinan en 20 min.','La cúrcuma tiene efectos antiinflamatorios + da color dorado hermoso.','Haz el doble — se congela perfectamente hasta 3 meses.'],
    variantes:[{nombre:'Solo lentejas (vegetariano)',desc:'Omite el pavo. Agrega más zanahoria y 50g espinacas al final.'},{nombre:'Dal indio',desc:'Agrega leche de coco light al final. Sabor excepcional.'}]
  },
  {
    id:'camarones', cat:'cena', nombre:'Camarones al ajillo con arroz',
    tiempo:'15 min', dificultad:'Fácil', kcal:380, p:36, c:38, g:8,
    emoji:'🍤', color:'var(--red)',
    desc:'El plato más rápido del plan. 15 minutos del congelador a la mesa.',
    ingredientes:['200g camarones (frescos o descongelados)','4 dientes de ajo en láminas','Jugo de 1 limón','Paprika ahumada','Perejil fresco picado','Spray aceite de oliva','100g arroz integral cocido (sobrante)'],
    pasos:[
      'Seca bien los camarones con papel absorbente — humedad = vapor, no dorado.',
      'Calienta sartén a fuego ALTO hasta que humee.',
      'Aplica spray. Agrega el ajo, cocina 30 seg.',
      'Agrega camarones en una sola capa. NO revuelvas. 90 segundos.',
      'Voltea cada camarón. Otros 90 segundos.',
      'Exprime limón, agrega paprika y perejil. Sirve inmediatamente sobre el arroz.'
    ],
    tips:['La clave: fuego MUY alto y camarones muy secos. Así doran en vez de cocinarse al vapor.','Los camarones están listos cuando forman una "C". Si forman una "O" están sobrecocidos.','Descongela en nevera overnight o en agua fría corriente 5 min — nunca en microondas.'],
    variantes:[{nombre:'Al curry',desc:'Agrega 1 cdita curry en polvo + 2 cdas. yogur griego al final del fuego.'},{nombre:'Con pasta',desc:'Sirve sobre 100g pasta integral cocida en vez de arroz.'}]
  },
  {
    id:'ensalada_proteica', cat:'almuerzo', nombre:'Ensalada proteica completa',
    tiempo:'10 min', dificultad:'Muy fácil', kcal:320, p:35, c:18, g:10,
    emoji:'🥗', color:'var(--accent)',
    desc:'No es una ensalada de dieta triste. Es un plato completo y saciante.',
    ingredientes:['150g lechuga mixta o espinacas baby','120g pechuga de pollo grillada en tiras','100g tomates cherry cortados','50g pepino en rodajas','30g aguacate','1 huevo duro','Aderezo: limón + mostaza dijon + stevia + sal'],
    pasos:[
      'Prepara el aderezo: jugo de 1/2 limón + 1 cdita. mostaza Dijon + stevia + sal. Bate con tenedor.',
      'En un bowl grande coloca la base verde.',
      'Agrega pollo en tiras (puede ser sobrante de la noche anterior).',
      'Distribuye tomates, pepino, aguacate y huevo duro en cuartos.',
      'Vierte el aderezo justo antes de servir para que no se marchite la lechuga.'
    ],
    tips:['El truco de las ensaladas saciantes: proteína + grasa buena + fibra. Esta tiene las 3.','Prepara los ingredientes por separado y ensambla al momento. La lechuga aguanta 5 días lavada y seca.','Sustituye el pollo por atún en agua o camarones cocidos para variar.'],
    variantes:[{nombre:'Versión rápida',desc:'Atún + lechuga + tomate + limón. 5 min, misma proteína.'},{nombre:'Mediterránea',desc:'Agrega aceitunas + pepino + queso cottage + orégano.'}]
  },
  {
    id:'smoothie_proteico', cat:'merienda', nombre:'Smoothie proteico sin azúcar',
    tiempo:'3 min', dificultad:'Muy fácil', kcal:300, p:28, c:35, g:4,
    emoji:'🥤', color:'var(--purple)',
    desc:'La merienda perfecta post-entreno o para cuando no tienes tiempo.',
    ingredientes:['1 scoop proteína vainilla o chocolate','1 banano congelado (clave: congelado)','100g frutos rojos congelados','200ml leche de almendra sin azúcar','1 cdita. semillas de chía','Hielo opcional'],
    pasos:[
      'Congela el banano maduro la noche anterior — da cremosidad sin leche entera.',
      'En la licuadora: leche de almendra primero (protege la cuchilla).',
      'Agrega frutos rojos, banano congelado y proteína.',
      'Licúa 45-60 segundos a velocidad alta.',
      'Agrega la chía al final (después de licuar para que quede entera).',
      'Consume inmediatamente o refrigera máx. 24 horas.'
    ],
    tips:['El banano CONGELADO es el secreto de la cremosidad. Sin helado ni crema.','Congela varios bananos maduros en bolsa — duran 3 meses y están siempre listos.','Si queda muy espeso, agrega más leche. Si muy líquido, más hielo o banano.'],
    variantes:[{nombre:'Verde',desc:'Agrega 1 puñado de espinacas. No cambia el sabor pero suma hierro y fibra.'},{nombre:'Chocolate PB',desc:'Proteína chocolate + 1 cda. maní natural + banano. Increíble.'}]
  },
  {
    id:'snack_cottage', cat:'merienda', nombre:'Bowl de cottage con fruta',
    tiempo:'2 min', dificultad:'Muy fácil', kcal:200, p:20, c:22, g:4,
    emoji:'🍓', color:'var(--purple)',
    desc:'La merienda más rápida y proteica del plan. Cero cocción.',
    ingredientes:['150g queso cottage bajo en grasa','100g fruta (mango, fresas o frutos rojos)','Stevia o miel al gusto (1 cdita.)','Canela opcional'],
    pasos:[
      'Coloca el cottage en un bowl.',
      'Corta la fruta en cubos o usa frutos rojos enteros.',
      'Agrega encima la fruta.',
      'Añade canela + stevia. Listo.'
    ],
    tips:['Manzana verde + cottage + canela = la combinación más saciante y baja en IG.','El cottage es prácticamente insípido — sin la fruta o el condimento la mayoría lo rechaza.','Si es posthardtraining, usa mango o banano para carbohidratos de recuperación más rápida.'],
    variantes:[{nombre:'Salado',desc:'Cottage + pepino + limón + sal + orégano. Perfecto para quienes no les gusta el dulce.'},{nombre:'Con granola',desc:'Agrega 20g granola sin azúcar encima. +80 kcal pero más fibra.'}]
  },
  {
    id:'atun_galletas', cat:'merienda', nombre:'Atún con galletas integrales',
    tiempo:'3 min', dificultad:'Muy fácil', kcal:220, p:25, c:20, g:4,
    emoji:'🐟', color:'var(--blue)',
    desc:'El snack de emergencia cuando no tienes tiempo de cocinar nada.',
    ingredientes:['1 lata atún en agua (escurrido)','6 galletas de arroz o integrales sin sal','Jugo de 1/2 limón','Cilantro o perejil picado','Pimienta negra'],
    pasos:[
      'Abre y escurre muy bien el atún.',
      'Mezcla el atún con limón, cilantro y pimienta.',
      'Coloca cucharadas de atún sobre cada galleta.',
      'Consume inmediatamente (las galletas se ablandan).'
    ],
    tips:['Escurrir bien el atún es clave — el agua sobrante diluye el sabor.','El limón no solo da sabor — elimina el olor fuerte del atún.','Agrega 1 cda. de yogur griego al atún para hacerlo más cremoso (sustituye la mayonesa).'],
    variantes:[{nombre:'Con aguacate',desc:'Aplasta 20g aguacate en las galletas, pon el atún encima. +2g grasa buena.'},{nombre:'Ensalada de atún',desc:'Mezcla con pepino y zanahoria rallada. Servir sobre lechuga.'}]
  },
  {
    id:'prep_pollo_masivo', cat:'prep', nombre:'Meal Prep: Pollo en lote (semana entera)',
    tiempo:'40 min', dificultad:'Fácil', kcal:0, p:0, c:0, g:0,
    emoji:'🍳', color:'var(--muted)',
    desc:'Cocina 1kg de pollo el domingo. Proteína lista para toda la semana.',
    ingredientes:['1-1.2 kg pechugas de pollo','Marinada: jugo 2 limones + 4 dientes ajo + paprika + orégano + comino','Sal y pimienta','Spray aceite'],
    pasos:[
      'Aplana todas las pechugas a grosor uniforme.',
      'Marina 30 min mínimo en la mezcla de limón + especias.',
      'Calienta horno a 190°C o usa plancha/parrilla.',
      'Cocina en lotes de 3-4 pechugas a la vez.',
      'Deja enfriar completamente antes de refrigerar.',
      'Divide en porciones de 180g en bolsas o tuppers. Etiqueta con fecha.',
      'Nevera: hasta 4 días. Congelador: hasta 3 meses.'
    ],
    tips:['Varía la marinada: 1 lote con limón+ajo, otro con curry+yogur, otro con soya baja en sodio.','El pollo frío se puede usar directamente en ensaladas, wraps o calentar 90 seg en microondas.','Invierte 40 minutos el domingo y tendrás proteína lista para 5-6 comidas.'],
    variantes:[]
  },
  {
    id:'prep_arroz_masivo', cat:'prep', nombre:'Meal Prep: Arroz y quinoa en lote',
    tiempo:'35 min', dificultad:'Muy fácil', kcal:0, p:0, c:0, g:0,
    emoji:'🍚', color:'var(--muted)',
    desc:'La base de carbohidratos para toda la semana en una sola cocción.',
    ingredientes:['2 tazas arroz integral','1 taza quinoa','Caldo bajo en sodio o agua','Sal'],
    pasos:[
      'Remoja el arroz integral 30 min. Escurre.',
      'Cocina el arroz en olla grande: 2 tazas arroz + 5 tazas caldo. Fuego alto hasta hervir, luego bajo 25 min tapado.',
      'En olla separada: quinoa lavada + 1.5 tazas agua. Misma técnica, 15 min.',
      'Deja enfriar completamente ANTES de guardar en nevera.',
      'Divide en porciones de 150g (arroz) y 120g (quinoa) en tuppers.',
      'Etiqueta. Nevera hasta 5 días. Calentar con 1 cda. agua en microondas 2 min.'
    ],
    tips:['Enfriar antes de refrigerar es CRÍTICO — si guardas caliente, el vapor crea bacterias.','El arroz y quinoa fríos tienen más almidón resistente = mejor para microbiota y menos IG.','Mezcla arroz + quinoa (50/50) para más proteína y variedad.'],
    variantes:[]
  },
  {
    id:'aderezo_saludable', cat:'consejo', nombre:'Aderezo casero sin calorías vacías',
    tiempo:'2 min', dificultad:'Muy fácil', kcal:35, p:1, c:3, g:2,
    emoji:'🫙', color:'var(--green)',
    desc:'Sustituye todos los aderezos comerciales por esta base que sirve para todo.',
    ingredientes:['Jugo de 1 limón','1 cdita. mostaza Dijon (sin azúcar)','1 cdita. aceite de oliva extra virgen','Stevia o miel (1 gota)','Ajo en polvo, sal, pimienta'],
    pasos:[
      'Mezcla todos los ingredientes en un frasco pequeño.',
      'Cierra y agita para emulsionar.',
      'Guarda en nevera hasta 5 días.',
      'Agita antes de usar.'
    ],
    tips:['Los aderezos comerciales tienen en promedio 150 kcal por 2 cdas. Este tiene 35 kcal.','La mostaza Dijon actúa como emulsionante natural — mantiene la mezcla unida.','Variante: agrega yogur griego + eneldo para aderezo estilo ranch saludable.'],
    variantes:[]
  }
];

const recCategorias = [
  {id:'todas', label:'Todas', icon:'🍽️'},
  {id:'desayuno', label:'Desayuno', icon:'🌅'},
  {id:'almuerzo', label:'Almuerzo', icon:'☀️'},
  {id:'cena', label:'Cena', icon:'🌙'},
  {id:'merienda', label:'Meriendas', icon:'🥤'},
  {id:'prep', label:'Meal Prep', icon:'📦'},
  {id:'consejo', label:'Consejos', icon:'💡'}
];

const coccionTips = [
  {icon:'🌡️', titulo:'Control de temperatura', desc:'Fuego alto para sellar carnes (primera fase). Fuego medio-bajo para cocinar por dentro sin quemar. La mayoría de errores son por temperatura incorrecta.'},
  {icon:'🧂', titulo:'Sazón inteligente sin sodio', desc:'Limón + ajo + hierbas frescas = sabor sin sodio. El limón potencia todos los sabores. Agrega sal al final, nunca al inicio de la cocción de proteínas.'},
  {icon:'⏱️', titulo:'Reposo de las carnes', desc:'Después de cocinar cualquier carne, déjala reposar 3-5 minutos antes de cortar. Los jugos se redistribuyen y la carne queda mucho más jugosa.'},
  {icon:'🥢', titulo:'Mise en place', desc:'Prepara y mide todos los ingredientes ANTES de encender el fuego. La cocina caótica lleva a errores, ingredientes quemados y porciones incorrectas.'},
  {icon:'🧊', titulo:'Congelación inteligente', desc:'Proteínas: congela en porciones individuales de 150-180g. Descongelar en nevera 12h antes — nunca en agua caliente ni microondas para proteínas.'},
  {icon:'🫙', titulo:'Almacenamiento correcto', desc:'Tuppers de vidrio > plástico. Enfriar siempre antes de guardar. Etiqueta con fecha. Regla de oro: nevera 3-4 días, congelador 2-3 meses.'},
  {icon:'🥦', titulo:'Vegetales: máximo nutriente', desc:'Al vapor conserva más nutrientes que hervir. Si hierves, usa poca agua y guárdala (caldo). Agrega verduras de hoja verde siempre al final de la cocción.'},
  {icon:'🫒', titulo:'Aceite: cantidad y tipo', desc:'Spray de aceite = ~5 kcal. 1 cucharada = 120 kcal. El aceite de oliva pierde propiedades a >180°C — para alta temperatura usa aceite de aguacate o coco.'},
  {icon:'📏', titulo:'Pesa tus porciones', desc:'Una pechuga puede pesar entre 120g y 280g. Pesar es la única forma de saber exactamente qué estás comiendo. Invierte en una báscula de cocina digital.'}
];

const mealPrepPasos = [
  {paso:'1', titulo:'Proteínas (30 min)', desc:'Hornea o asa 1kg pollo marinado. Cocina 4-5 huevos duros. Abre y escurre 3-4 latas de atún.', tiempo:'30 min', color:'var(--orange)'},
  {paso:'2', titulo:'Carbohidratos (25 min)', desc:'Cocina 2 tazas de arroz integral y 1 taza de quinoa en ollas separadas. Se hacen solos.', tiempo:'25 min', color:'var(--amber)'},
  {paso:'3', titulo:'Verduras (15 min)', desc:'Lava y seca lechuga/espinacas. Corta pimientos, zanahoria, pepino en tiras. Guarda en tuppers con papel absorbente.', tiempo:'15 min', color:'var(--accent)'},
  {paso:'4', titulo:'Porciones y etiquetado (10 min)', desc:'Divide todo en porciones individuales según el plan. Etiqueta con nombre y fecha. Coloca en nevera.', tiempo:'10 min', color:'var(--blue)'},
  {paso:'5', titulo:'Batatas al horno (40 min)', desc:'Mientras haces lo demás: pon 3-4 batatas enteras en horno a 200°C. Sin esfuerzo adicional.', tiempo:'40 min paralelo', color:'var(--purple)'},
  {paso:'Total', titulo:'1 hora de trabajo', desc:'El resultado: proteína, carbohidratos y vegetales listos para 5-6 días. Cero excusas entre semana.', tiempo:'~60 min', color:'var(--red)'}
];

let activeRecCat = 'todas';
let selectedRec = null;

function renderRecetas(){
  renderRecCatTabs();
  renderRecGrid();
  renderCoccionTips();
  renderMealPrep();
}

function renderRecCatTabs(){
  document.getElementById('rec-filter-tabs').innerHTML = recCategorias.map(c=>{
    const count = c.id==='todas' ? recetas.length : recetas.filter(r=>r.cat===c.id).length;
    return `<button class="btn ${activeRecCat===c.id?'btn-primary':'btn-ghost'}" style="font-size:12px" onclick="setRecCat('${c.id}')">${c.icon} ${c.label} <span style="opacity:0.6;font-size:11px;margin-left:3px">${count}</span></button>`;
  }).join('');
}

function setRecCat(id){activeRecCat=id;renderRecCatTabs();renderRecGrid();}

function renderRecGrid(){
  const list = activeRecCat==='todas' ? recetas : recetas.filter(r=>r.cat===activeRecCat);
  const el = document.getElementById('rec-grid');
  if(!list.length){el.innerHTML='<div class="empty"><div class="empty-icon">🍽️</div><div class="empty-text">No hay recetas en esta categoría</div></div>';return;}
  el.innerHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px">${list.map(r=>{
    const catLabel = recCategorias.find(c=>c.id===r.cat);
    return `<div onclick="openRecModal('${r.id}')" style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:18px 20px;cursor:pointer;transition:all 0.18s;position:relative;overflow:hidden" onmouseover="this.style.borderColor='var(--border2)';this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='var(--border)';this.style.transform='translateY(0)'">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${r.color}"></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <span style="font-size:32px">${r.emoji}</span>
        <div style="text-align:right">
          <div style="font-size:10px;background:var(--bg3);border:1px solid var(--border);padding:2px 8px;border-radius:20px;color:var(--muted);margin-bottom:4px">${catLabel?catLabel.icon+' '+catLabel.label:''}</div>
          <div style="font-size:10px;color:var(--muted2)">⏱ ${r.tiempo} · ${r.dificultad}</div>
        </div>
      </div>
      <div style="font-size:15px;font-weight:600;margin-bottom:5px;line-height:1.3">${r.nombre}</div>
      <div style="font-size:12.5px;color:var(--muted);margin-bottom:12px;line-height:1.5">${r.desc}</div>
      ${r.cat!=='prep'&&r.cat!=='consejo'?`<div style="display:flex;gap:6px;flex-wrap:wrap">
        <span style="background:var(--accent-dim);color:var(--accent);font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px">${r.kcal} kcal</span>
        <span style="background:var(--blue-dim);color:var(--blue);font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px">P: ${r.p}g</span>
        <span style="background:var(--amber-dim);color:var(--amber);font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px">C: ${r.c}g</span>
        <span style="background:var(--orange-dim);color:var(--orange);font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px">G: ${r.g}g</span>
      </div>`:'<div style="font-size:12px;color:var(--muted);font-style:italic">Toca para ver los pasos completos →</div>'}
    </div>`;
  }).join('')}</div>`;
}

function openRecModal(id){
  const r = recetas.find(x=>x.id===id);
  if(!r)return;
  const catLabel = recCategorias.find(c=>c.id===r.cat);
  let html=`<div style="margin-bottom:18px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
      <span style="font-size:42px">${r.emoji}</span>
      <div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:3px">${catLabel?catLabel.icon+' '+catLabel.label.toUpperCase():''} · ⏱ ${r.tiempo} · ${r.dificultad}</div>
        <div style="font-family:var(--font-head);font-size:22px;font-weight:700;line-height:1.1">${r.nombre}</div>
      </div>
    </div>
    <div style="font-size:13px;color:var(--muted);line-height:1.6">${r.desc}</div>
  </div>`;
  if(r.cat!=='prep'&&r.cat!=='consejo'){
    html+=`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:18px">
      <div style="background:var(--bg3);border-radius:var(--radius-sm);padding:10px;text-align:center"><div style="font-family:var(--font-head);font-size:20px;color:var(--accent)">${r.kcal}</div><div style="font-size:10px;color:var(--muted2);text-transform:uppercase;font-weight:600">kcal</div></div>
      <div style="background:var(--bg3);border-radius:var(--radius-sm);padding:10px;text-align:center"><div style="font-family:var(--font-head);font-size:20px;color:var(--blue)">${r.p}g</div><div style="font-size:10px;color:var(--muted2);text-transform:uppercase;font-weight:600">proteína</div></div>
      <div style="background:var(--bg3);border-radius:var(--radius-sm);padding:10px;text-align:center"><div style="font-family:var(--font-head);font-size:20px;color:var(--amber)">${r.c}g</div><div style="font-size:10px;color:var(--muted2);text-transform:uppercase;font-weight:600">carbs</div></div>
      <div style="background:var(--bg3);border-radius:var(--radius-sm);padding:10px;text-align:center"><div style="font-family:var(--font-head);font-size:20px;color:var(--orange)">${r.g}g</div><div style="font-size:10px;color:var(--muted2);text-transform:uppercase;font-weight:600">grasas</div></div>
    </div>`;
  }
  html+=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:18px">
    <div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted2);margin-bottom:8px">Ingredientes</div>
      ${r.ingredientes.map(i=>`<div style="display:flex;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);font-size:13px"><span style="color:var(--accent);flex-shrink:0">▸</span><span>${i}</span></div>`).join('')}
    </div>
    <div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted2);margin-bottom:8px">Preparación</div>
      ${r.pasos.map((p,i)=>`<div style="display:flex;gap:10px;padding:6px 0;border-bottom:1px solid var(--border);font-size:12.5px"><span style="background:var(--bg3);color:var(--orange);font-weight:700;font-size:11px;min-width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">${i+1}</span><span style="color:var(--text);line-height:1.5">${p}</span></div>`).join('')}
    </div>
  </div>`;
  if(r.tips&&r.tips.length){
    html+=`<div style="background:var(--amber-dim);border:1px solid rgba(251,191,36,0.15);border-radius:var(--radius-sm);padding:14px;margin-bottom:14px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--amber);margin-bottom:8px">💡 Tips del chef</div>
      ${r.tips.map(t=>`<div style="font-size:12.5px;color:var(--text);padding:4px 0;line-height:1.5;border-bottom:1px solid rgba(251,191,36,0.1)">• ${t}</div>`).join('')}
    </div>`;
  }
  if(r.variantes&&r.variantes.length){
    html+=`<div>
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted2);margin-bottom:8px">Variantes</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${r.variantes.map(v=>`<div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 14px;font-size:12.5px"><strong style="color:var(--text)">${v.nombre}:</strong> <span style="color:var(--muted)">${v.desc}</span></div>`).join('')}
      </div>
    </div>`;
  }
  document.getElementById('rec-modal-content').innerHTML=html;
  document.getElementById('rec-modal-overlay').style.display='flex';
  document.body.style.overflow='hidden';
}

function closeRecModal(e){
  if(e&&e.target!==document.getElementById('rec-modal-overlay')&&e.type!=='click')return;
  document.getElementById('rec-modal-overlay').style.display='none';
  document.body.style.overflow='';
}

function renderCoccionTips(){
  document.getElementById('rec-tips-grid').innerHTML = coccionTips.map(t=>`
    <div class="card" style="border-left:3px solid var(--orange);border-radius:0 var(--radius) var(--radius) 0">
      <div style="font-size:22px;margin-bottom:8px">${t.icon}</div>
      <div style="font-size:14px;font-weight:600;margin-bottom:5px">${t.titulo}</div>
      <div style="font-size:12.5px;color:var(--muted);line-height:1.6">${t.desc}</div>
    </div>`).join('');
}

function renderMealPrep(){
  document.getElementById('rec-prep-grid').innerHTML = mealPrepPasos.map(p=>`
    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px 18px;display:flex;gap:14px;align-items:flex-start">
      <div style="width:36px;height:36px;border-radius:50%;background:${p.color};display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:18px;color:${p.paso==='Total'?'#0a1a12':'white'};flex-shrink:0">${p.paso}</div>
      <div>
        <div style="font-size:14px;font-weight:600;margin-bottom:3px">${p.titulo}</div>
        <div style="font-size:12.5px;color:var(--muted);line-height:1.5;margin-bottom:6px">${p.desc}</div>
        <div style="font-size:11px;background:var(--bg3);border:1px solid var(--border);display:inline-block;padding:2px 10px;border-radius:20px;color:var(--muted2)">⏱ ${p.tiempo}</div>
      </div>
    </div>`).join('');
}

// ════════════════════════════════════════
// INIT
// ════════════════════════════════════════
async function init(){
  setDateInputs();
  document.getElementById('page-date').textContent=new Date().toLocaleDateString('es-ES',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  await loadData();
  renderDashboard();
  renderShopTipsGrid();
}
init();
