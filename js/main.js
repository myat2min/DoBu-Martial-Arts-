/* DoBu page actions. Choices stay in the current browser. */
const $ = id => document.getElementById(id);
$('year').textContent = new Date().getFullYear();
const userKey = 'dobuMember';
const postsKey = 'dobuMessages';
const sessionKey = 'dobuSignedIn';
const prices = { Basic:25, Intermediate:35, Advanced:45, Elite:60, Junior:25 };
let signedIn = false;
function notice(id, message, error=false) {
  const box = $(id); if (!box) return;
  box.textContent = message;
  box.className = error ? 'error' : 'success';
}
function getSaved(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}
function putSaved(key, value) {
  try { localStorage.setItem(key,JSON.stringify(value)); return true; }
  catch { return false; }
}
function readSignedIn() {
  try { return sessionStorage.getItem(sessionKey) === 'yes'; }
  catch { return signedIn; }
}
function setSignedIn(value) {
  signedIn = value;
  try { if (value) sessionStorage.setItem(sessionKey,'yes'); else sessionStorage.removeItem(sessionKey); }
  catch { /* Keep the current tab open if browser storage is restricted. */ }
}
function numberOf(id) {
  const field = $(id); if (!field) return 0;
  const n = Number(field.value);
  return Number.isInteger(n) && n >= 0 && n <= 20 ? n : 0;
}
function choices() {
  return {
    plan:$('planSelect').value,
    firstArt:$('firstArt').value,
    secondArt:$('planSelect').value === 'Advanced' ? $('secondArt').value : '',
    startDate:$('startDate').value,
    privateHours:numberOf('privateHours'),
    selfDefence:$('selfDefence').value === '1' ? 1 : 0,
    fitnessVisits:numberOf('fitnessVisits'),
    personalHours:numberOf('personalHours'),
    payment:$('paymentMethod').value
  };
}
function updatePrice() {
  if (!$('priceLines')) return;
  const c = choices();
  $('secondArtGroup').hidden = c.plan !== 'Advanced';
  const muayThai = [...$('firstArt').options].find(option => option.value === 'Muay Thai');
  muayThai.disabled = c.plan === 'Junior';
  if (muayThai.disabled && $('firstArt').value === 'Muay Thai') { $('firstArt').value = ''; c.firstArt = ''; }
  const monthly = prices[c.plan] || 0;
  const extras = c.privateHours*15 + c.selfDefence*180 + c.fitnessVisits*6 + c.personalHours*35;
  const lines = [];
  if (c.plan) lines.push(`${c.plan} membership: £${monthly} / month`);
  if (c.firstArt) lines.push(`Martial art: ${c.firstArt}${c.secondArt ? ' + '+c.secondArt : ''}`);
  if (c.startDate) lines.push(`Preferred start: ${c.startDate}`);
  if (c.privateHours) lines.push(`Private tuition: ${c.privateHours} hour(s) × £15 = £${c.privateHours*15}`);
  if (c.selfDefence) lines.push('Six-week self-defence course: £180');
  if (c.fitnessVisits) lines.push(`Fitness room: ${c.fitnessVisits} visit(s) × £6 = £${c.fitnessVisits*6}`);
  if (c.personalHours) lines.push(`Personal training: ${c.personalHours} hour(s) × £35 = £${c.personalHours*35}`);
  const list = $('priceLines'); list.replaceChildren();
  if (!lines.length) list.textContent = 'Select a membership to begin.';
  lines.forEach(line => { const row=document.createElement('p'); row.textContent=line; list.appendChild(row); });
  $('monthlyTotal').textContent='£'+monthly;
  $('extrasTotal').textContent='£'+extras;
  $('firstTotal').textContent='£'+(monthly+extras);
  $('summaryPayment').textContent=c.payment || 'Not chosen';
  return {c,monthly,extras};
}
function showSaved() {
  const user = getSaved(userKey,null);
  const box = $('savedChoices'); if (!box) return;
  box.hidden = !user?.selection;
  if (user?.selection) {
    const s=user.selection;
    $('savedText').textContent=`${s.plan} plan · ${s.firstArt}${s.secondArt ? ' + '+s.secondArt : ''} · £${s.monthly}/month · £${s.extras} additional training · £${s.monthly+s.extras} first month estimate · ${s.payment}. Confirm the request and payment with the gym.`;
  }
}
function showPosts() {
  const list=$('postList'); if (!list) return;
  list.replaceChildren();
  const posts=getSaved(postsKey,[]);
  if (!posts.length) { list.textContent='No messages yet.'; return; }
  posts.slice().reverse().forEach(post => {
    const item=document.createElement('article'); item.className='post';
    const author=document.createElement('strong'); author.textContent=post.name;
    const date=document.createElement('small'); date.textContent=' · '+post.date;
    const text=document.createElement('p'); text.textContent=post.message;
    item.append(author,date,text); list.appendChild(item);
  });
}
function showMember() {
  if (!$('memberArea')) return;
  const user=getSaved(userKey,null), active=!!user && readSignedIn();
  $('authForms').hidden=active;
  $('memberArea').hidden=!active;
  if (!active) return;
  $('memberName').textContent=user.name;
  $('memberEmail').textContent=user.email;
  const selected=new URLSearchParams(location.search).get('plan');
  const s=user.selection || {};
  $('planSelect').value=(selected && prices[selected]) ? selected : (s.plan || '');
  $('firstArt').value=s.firstArt || '';
  $('secondArt').value=s.secondArt || '';
  $('startDate').value=s.startDate || '';
  $('privateHours').value=s.privateHours || 0;
  $('selfDefence').value=s.selfDefence || 0;
  $('fitnessVisits').value=s.fitnessVisits || 0;
  $('personalHours').value=s.personalHours || 0;
  $('paymentMethod').value=s.payment || '';
  updatePrice(); showSaved(); showPosts();
}
if ($('createForm')) $('createForm').addEventListener('submit',event => {
  event.preventDefault(); if (!event.currentTarget.reportValidity()) return;
  const name=$('createName').value.trim(), email=$('createEmail').value.trim().toLowerCase();
  if (name.length<2) return notice('createStatus','Enter your name.',true);
  const existing=getSaved(userKey,null);
  if (existing) return notice('createStatus','This browser already has a member profile. Use Sign in with its email.',true);
  if (!putSaved(userKey,{name,email})) return notice('createStatus','This browser could not save a profile.',true);
  setSignedIn(true); showMember();
});
if ($('signInForm')) $('signInForm').addEventListener('submit',event => {
  event.preventDefault(); if (!event.currentTarget.reportValidity()) return;
  const user=getSaved(userKey,null), email=$('signInEmail').value.trim().toLowerCase();
  if (!user || user.email !== email) return notice('signInStatus','No profile with this email is saved in this browser. Choose New member.',true);
  setSignedIn(true); showMember();
});
if ($('signOut')) $('signOut').addEventListener('click',() => { setSignedIn(false); showMember(); });
if ($('selectionForm')) {
  const form=$('selectionForm');
  form.addEventListener('input', updatePrice);
  form.addEventListener('change', updatePrice);
  form.addEventListener('submit',event => {
    event.preventDefault(); if (!form.reportValidity()) return;
    for (const id of ['privateHours','fitnessVisits','personalHours']) {
      const field=$(id), value=Number(field.value);
      if (!Number.isInteger(value) || value<0 || value>20) {
        notice('selectionStatus','Enter a whole number from 0 to 20 for each additional service.',true); field.focus(); return;
      }
    }
    const {c,monthly,extras}=updatePrice();
    if (!prices[c.plan] || !c.payment || !c.firstArt) return notice('selectionStatus','Choose a membership, martial art and payment preference.',true);
    if (c.plan === 'Advanced' && (!c.secondArt || c.secondArt === c.firstArt)) return notice('selectionStatus','Advanced includes two different martial arts. Choose a second art.',true);
    const user=getSaved(userKey,null);
    if (!user) return notice('selectionStatus','Sign in first.',true);
    user.selection={...c,monthly,extras};
    if (!putSaved(userKey,user)) return notice('selectionStatus','This browser could not save your choices.',true);
    try { history.replaceState(null,'',location.pathname); } catch { /* File URLs may block URL changes. */ }
    notice('selectionStatus','Your choices have been saved on this device. Speak to DoBu staff to confirm dates and payment.');
    showSaved();
  });
}
if ($('postForm')) $('postForm').addEventListener('submit',event => {
  event.preventDefault(); if (!event.currentTarget.reportValidity()) return;
  const message=$('postText').value.trim(),user=getSaved(userKey,null);
  if (!user || !readSignedIn()) return;
  if (message.length<2) return notice('postStatus','Write at least 2 characters.',true);
  const posts=getSaved(postsKey,[]);
  posts.push({name:user.name,message,date:new Date().toLocaleDateString()});
  if (!putSaved(postsKey,posts.slice(-30))) return notice('postStatus','This browser could not save the message.',true);
  event.currentTarget.reset(); showPosts(); notice('postStatus','Message saved on this device.');
});
if ($('contactForm')) $('contactForm').addEventListener('submit',event => {
  event.preventDefault(); if (!event.currentTarget.reportValidity()) return;
  notice('contactStatus','Your message is ready. This page cannot send it to DoBu staff; contact the gym directly.');
  event.currentTarget.reset();
});
showMember();
