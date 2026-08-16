const GOALS_KEY = "pria_goals_v5";
let goals = JSON.parse(localStorage.getItem(GOALS_KEY) || "[]");
let editingId = null;
let deferredPrompt = null;
let activeAlarmId = null;
let alarmInterval = null;
let audioContext = null;

const $ = id => document.getElementById(id);

function todayKey(){ return new Date().toISOString().slice(0,10); }
function save(){ localStorage.setItem(GOALS_KEY, JSON.stringify(goals)); render(); }

function esc(value){
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function formatDateTime(date,time){
  const d = new Date(`${date}T${time}`);
  return d.toLocaleString([], {
    weekday:"short", day:"2-digit", month:"short", year:"numeric",
    hour:"2-digit", minute:"2-digit"
  });
}

function render(){
  const list = $("goalsList");
  const sorted = [...goals].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));

  if(!sorted.length){
    list.innerHTML = '<p style="margin-top:18px">No goals yet. Add your first goal above.</p>';
  } else {
    list.innerHTML = sorted.map(g => `
      <div class="goal ${g.completed ? "completed" : ""}">
        <div>
          <div class="goal-title">${g.completed ? "✅ " : ""}${esc(g.title)}</div>
          <div class="goal-meta">🗓️ ${formatDateTime(g.date,g.time)}</div>
        </div>
        <div class="goal-actions">
          ${!g.completed ? `<button class="btn primary" onclick="completeGoal('${g.id}')">✓ Complete</button>` : ""}
          <button class="btn light" onclick="editGoal('${g.id}')">✏️ Edit</button>
          <button class="btn danger" onclick="deleteGoal('${g.id}')">🗑️ Delete</button>
        </div>
      </div>
    `).join("");
  }
  updateProgress();
}

function updateProgress(){
  const todays = goals.filter(g => g.date === todayKey());
  const completed = todays.filter(g => g.completed).length;
  const percent = todays.length ? Math.round(completed / todays.length * 100) : 0;

  $("progressText").textContent = `${completed} of ${todays.length} goals completed — ${percent}%`;
  $("progressBar").style.width = percent + "%";
  $("perfectDay").classList.toggle("hidden", !(todays.length > 0 && completed === todays.length));
}

function openForm(goal=null){
  $("goalForm").classList.remove("hidden");
  editingId = goal ? goal.id : null;
  $("goalTitle").value = goal ? goal.title : "";
  $("goalDate").value = goal ? goal.date : todayKey();
  $("goalTime").value = goal ? goal.time : "";
  $("goalTitle").focus();
}

$("addGoalBtn").onclick = () => openForm();

$("cancelGoalBtn").onclick = () => {
  $("goalForm").classList.add("hidden");
  editingId = null;
};

$("saveGoalBtn").onclick = () => {
  const title = $("goalTitle").value.trim();
  const date = $("goalDate").value;
  const time = $("goalTime").value;

  if(!title || !date || !time){
    alert("Please enter the goal, date and exact time.");
    return;
  }

  if(editingId){
    const goal = goals.find(g => g.id === editingId);
    if(goal) Object.assign(goal, {title,date,time,alertedAt:null});
  } else {
    goals.push({
      id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random())),
      title,date,time,completed:false,alertedAt:null
    });
  }

  save();
  $("goalForm").classList.add("hidden");
  editingId = null;
};

window.completeGoal = function(id){
  const goal = goals.find(g => g.id === id);
  if(!goal) return;
  goal.completed = true;
  save();
  if(activeAlarmId === id) closeAlarm();
};

window.deleteGoal = function(id){
  if(confirm("Delete this goal?")){
    goals = goals.filter(g => g.id !== id);
    save();
  }
};

window.editGoal = function(id){
  const goal = goals.find(g => g.id === id);
  if(goal) openForm(goal);
};

function setStatus(text){
  $("status").textContent = text;
}

function speak(text){
  if(!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  speechSynthesis.speak(utterance);
}

function beep(){
  try{
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    if(audioContext.state === "suspended") audioContext.resume();

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.09;
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.35);
  }catch(e){}
}

function notify(title, body){
  if("Notification" in window && Notification.permission === "granted"){
    try{
      new Notification(title,{body,icon:"icon.svg",tag:"pria-reminder"});
    }catch(e){}
  }
}

async function enableNotifications(){
  if(!("Notification" in window)){
    alert("This browser does not support notifications.");
    return;
  }
  const permission = await Notification.requestPermission();
  if(permission === "granted"){
    setStatus("Notifications & alarms allowed");
    notify("PRIA","Notifications and alarms are enabled.");
    speak("Notifications and alarms are enabled.");
  }else{
    setStatus("Notification permission not granted");
  }
}

$("notificationBtn").onclick = enableNotifications;

$("testAlarmBtn").onclick = () => {
  beep();
  setTimeout(beep,450);
  speak("This is the PRIA test alarm.");
  setStatus("Test alarm played");
  setTimeout(()=>setStatus("Ready"),2500);
};

function triggerGoalAlarm(goal){
  activeAlarmId = goal.id;
  $("alarmMessage").textContent = `It's time to ${goal.title} now.`;
  $("alarmOverlay").classList.remove("hidden");

  notify("PRIA Reminder", `It's time to ${goal.title} now.`);
  speak(`It's time to ${goal.title} now.`);
  beep();

  if(alarmInterval) clearInterval(alarmInterval);
  alarmInterval = setInterval(() => {
    if(!activeAlarmId) return;
    beep();
    speak(`It's time to ${goal.title} now.`);
  }, 5000);
}

function closeAlarm(){
  $("alarmOverlay").classList.add("hidden");
  if(alarmInterval){
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
  activeAlarmId = null;
}

$("dismissAlarmBtn").onclick = closeAlarm;

$("completeAlarmBtn").onclick = () => {
  if(activeAlarmId){
    const goal = goals.find(g=>g.id===activeAlarmId);
    if(goal){
      goal.completed = true;
      save();
    }
  }
  closeAlarm();
};

function checkReminders(now){
  const minuteKey = Math.floor(now.getTime()/60000);

  for(const goal of goals){
    if(goal.completed) continue;

    const due = new Date(`${goal.date}T${goal.time}`);
    const difference = Math.abs(now.getTime() - due.getTime());

    if(difference <= 60000 && goal.alertedAt !== minuteKey){
      goal.alertedAt = minuteKey;
      localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
      triggerGoalAlarm(goal);
    }
  }

  const dailyKey = "pria_daily_6am_" + todayKey();
  if(now.getHours() === 6 && now.getMinutes() === 0 && localStorage.getItem(dailyKey) !== "1"){
    localStorage.setItem(dailyKey,"1");
    notify("PRIA","It's time to set today's goals.");
    speak("It's time to set today's goals.");
  }
}

function updateClock(){
  const now = new Date();
  $("clock").textContent = now.toLocaleTimeString();
  $("date").textContent = now.toLocaleDateString([],{
    weekday:"long",day:"numeric",month:"long",year:"numeric"
  });
  checkReminders(now);
}

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredPrompt = event;
  $("installBtn").classList.remove("hidden");
});

$("installBtn").onclick = async () => {
  if(deferredPrompt){
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    deferredPrompt = null;
    $("installBtn").classList.add("hidden");
    setStatus(result.outcome === "accepted" ? "PRIA installed" : "Install cancelled");
  }else{
    alert("Open your browser menu and choose Install PRIA or Add to Home Screen.");
  }
};

window.addEventListener("appinstalled",()=>{
  $("installBtn").classList.add("hidden");
  setStatus("PRIA installed");
});

if(window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true){
  $("installBtn").classList.add("hidden");
}

render();
updateClock();
setInterval(updateClock,1000);
