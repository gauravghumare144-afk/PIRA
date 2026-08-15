const KEY="pria_goals_v1";
let goals=JSON.parse(localStorage.getItem(KEY)||"[]");
let editingId=null;
let deferredPrompt=null;

const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);

$("date").value=today();

window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault(); deferredPrompt=e; $("installBtn").style.display="block";
});
window.addEventListener("appinstalled",()=>{
  deferredPrompt=null; $("installBtn").style.display="none";
});
if(window.matchMedia("(display-mode: standalone)").matches || navigator.standalone){
  $("installBtn").style.display="none";
}

$("installBtn").onclick=async()=>{
  if(!deferredPrompt){
    alert("If no install window appears, use your browser menu → Install app / Add to Home Screen.");
    return;
  }
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt=null;
};

function save(){localStorage.setItem(KEY,JSON.stringify(goals));render();}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2);}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

$("goalForm").onsubmit=e=>{
  e.preventDefault();
  const title=$("title").value.trim(), date=$("date").value, time=$("time").value;
  if(!title||!date||!time)return;
  if(editingId){
    const g=goals.find(x=>x.id===editingId);
    if(g){g.title=title;g.date=date;g.time=time;}
    editingId=null; $("saveBtn").textContent="➕ Add Goal"; $("editHint").textContent="";
  }else{
    goals.push({id:uid(),title,date,time,completed:false,dismissed:false});
  }
  $("goalForm").reset(); $("date").value=today(); save();
};

function editGoal(id){
  const g=goals.find(x=>x.id===id); if(!g)return;
  editingId=id;$("title").value=g.title;$("date").value=g.date;$("time").value=g.time;
  $("saveBtn").textContent="💾 Save Changes";$("editHint").textContent="Editing: "+g.title;
  window.scrollTo({top:0,behavior:"smooth"});
}
function deleteGoal(id){if(confirm("Delete this goal?")){goals=goals.filter(g=>g.id!==id);save();}}
function toggleGoal(id){const g=goals.find(x=>x.id===id);if(g){g.completed=!g.completed;g.dismissed=false;save();}}

function formatTime(t){
  const [h,m]=t.split(":").map(Number);
  const d=new Date();d.setHours(h,m,0,0);
  return d.toLocaleTimeString([], {hour:"numeric",minute:"2-digit"});
}
function render(){
  const box=$("goals");box.innerHTML="";
  const sorted=[...goals].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  if(!sorted.length) box.innerHTML='<div class="empty">No goals yet. Add your first goal above.</div>';
  sorted.forEach(g=>{
    const el=document.createElement("div");el.className="goal "+(g.completed?"done":"");
    el.innerHTML=`<div><div class="goal-title">${escapeHTML(g.title)}</div>
    <div class="goal-meta">📅 ${g.date} &nbsp; ⏰ ${formatTime(g.time)} ${g.completed?"&nbsp; ✅ Completed":""}</div></div>
    <div class="actions">
      <button class="success" onclick="toggleGoal('${g.id}')">${g.completed?"↩ Undo":"✓ Complete"}</button>
      <button class="secondary" onclick="editGoal('${g.id}')">✏️ Edit</button>
      <button class="danger" onclick="deleteGoal('${g.id}')">🗑 Delete</button>
    </div>`;
    box.appendChild(el);
  });
  const t=today(), tg=goals.filter(g=>g.date===t), done=tg.filter(g=>g.completed).length;
  const pct=tg.length?Math.round(done/tg.length*100):0;
  $("stats").textContent=`${done} of ${tg.length} goals completed — ${pct}%`;
  $("bar").style.width=pct+"%";
  $("perfect").textContent=(tg.length>0&&done===tg.length)?"🏆 PERFECT DAY!":"";
}
render();

let audioCtx=null;
function beep(){
  try{
    audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type="sine";o.frequency.value=880;g.gain.value=.12;o.connect(g);g.connect(audioCtx.destination);
    o.start();o.stop(audioCtx.currentTime+.45);
  }catch(e){}
}
function speak(text){
  if("speechSynthesis" in window){
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);u.rate=.9;u.pitch=1;
    speechSynthesis.speak(u);
  }
}
function notify(title,body){
  if(Notification.permission==="granted"){
    try{new Notification(title,{body,icon:"icon.svg",tag:"pria-"+title});}catch(e){}
  }
}
function trigger(g){
  if(g.completed)return;
  const msg=`It's time to ${g.title} now.`;
  beep();speak(msg);notify("⏰ PRIA Reminder",msg);
  $("alarmStatus").textContent="🔔 Reminder active: "+g.title;
  g.lastAlert=Date.now();save();
}
$("testBtn").onclick=()=>{beep();speak("This is a PRIA test alarm.");notify("🔊 PRIA Test Alarm","This is a PRIA test alarm.");$("alarmStatus").textContent="Test alarm played.";};
$("notifyBtn").onclick=async()=>{
  if(!("Notification" in window)){alert("This browser does not support notifications.");return;}
  const p=await Notification.requestPermission();
  $("alarmStatus").textContent=p==="granted"?"🔔 Notifications allowed.":"Notifications were not allowed.";
};

function checkReminders(){
  const now=new Date(), keyDate=now.toISOString().slice(0,10), hh=String(now.getHours()).padStart(2,"0"), mm=String(now.getMinutes()).padStart(2,"0");
  goals.forEach(g=>{
    if(g.date===keyDate && g.time===`${hh}:${mm}` && !g.completed){
      const marker=`${keyDate}_${g.time}`;
      if(g.lastTriggered!==marker){g.lastTriggered=marker;trigger(g);}
    }
  });
  // Daily 6:00 AM reminder, once per day.
  if(hh==="06"&&mm==="00"){
    const dayKey="daily_"+keyDate;
    if(localStorage.getItem("pria_daily")!==dayKey){
      localStorage.setItem("pria_daily",dayKey);
      const msg="It's time to set today's goals.";
      beep();speak(msg);notify("🌅 PRIA Daily Reminder",msg);
    }
  }
}
setInterval(checkReminders,1000);
checkReminders();

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(e=>console.log("SW:",e)));
}
