(function(){'use strict';
/* ---------- state ---------- */
var LS={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
var saved=LS.get('alpa-lang');
var S={lang:(saved==='ru'||saved==='en'||saved==='uz')?saved:'uz',view:{name:'home'},stack:[],
companies:{},posts:[],loads:[],chats:[],msgs:[],kind:'cargo',fromF:'',toF:'',
loaded:{companies:false,posts:false,loads:false,chats:false},error:'',uid:null,authReady:false,authMode:'in',allMsgs:[],confirmDel:'',sheet:false,pro:false};
var $app=document.getElementById('app');
var STABLE=['compose-load','compose-post','setup','chat','auth'];

function t(k){return (T[S.lang]&&T[S.lang][k])||T.en[k]||k}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function cityName(k){return CITIES[k]?CITIES[k][S.lang]:(k||'')}
function truckName(k){return t(TRUCKS.indexOf(k)>=0?k:'other')}
function myCo(){return S.uid?S.companies[S.uid]||null:null}
function co(id){return S.companies[id]||null}
function todayISO(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
var UZM=['yan','fev','mar','apr','may','iyn','iyl','avg','sen','okt','noy','dek'];
function fmtDate(iso){try{var d=new Date(iso+'T00:00:00');if(S.lang==='uz')return d.getDate()+' '+UZM[d.getMonth()];return d.toLocaleDateString(S.lang==='uz'?'uz-Latn-UZ':S.lang==='ru'?'ru-RU':'en-GB',{day:'numeric',month:'short'})}catch(e){return iso||''}}
function ago(ts){var m=Math.max(0,Math.round((Date.now()-ts)/60000));if(m<1)return t('now');
if(m<60)return t('ago_m').replace('{n}',m);var h=Math.round(m/60);if(h<24)return t('ago_h').replace('{n}',h);return t('ago_d').replace('{n}',Math.round(h/24))}
function clock(ts){var d=new Date(ts);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}

/* ---------- icons ---------- */
function svg(p,s,extra){return '<svg width="'+(s||22)+'" height="'+(s||22)+'" viewBox="0 0 24 24" fill="'+((extra&&extra.fill)||'none')+'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
var ic={
home:svg('<path d="M4 11l8-7 8 7v9H4z"/>',24),
truck:svg('<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.500" r="1.600"/><circle cx="17" cy="17.500" r="1.600"/>',24),
chat:svg('<path d="M4 5h16v11H9l-5 4z"/>',24),
user:svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',24),
back:svg('<path d="M15 5l-7 7 7 7"/>',22),
arrow:svg('<path d="M4 12h16M14 6l6 6-6 6"/>',18),
plus:svg('<path d="M12 5v14M5 12h14"/>',18),
plus24:svg('<path d="M12 5v14M5 12h14"/>',26),
send:svg('<path d="M4 12l16-8-6 16-3-6.500z"/>',20),
heart:svg('<path d="M12 20s-7-4.400-7-10a4 4 0 0 1 7-2.600A4 4 0 0 1 19 10c0 5.600-7 10-7 10z"/>',20),
heartOn:svg('<path d="M12 20s-7-4.400-7-10a4 4 0 0 1 7-2.600A4 4 0 0 1 19 10c0 5.600-7 10-7 10z"/>',20,{fill:'currentColor'}),
logo:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.400" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 20L12 4l7 16"/><path d="M8.500 14.500h7" stroke="#F2A33A"/></svg>'
};

function av(name,size){var s=String(name||'?'),h=0,i;for(i=0;i<s.length;i++)h+=s.charCodeAt(i);
var ini=s.trim().split(/\s+/).slice(0,2).map(function(w){return w.charAt(0)}).join('').toUpperCase();
return '<span class="av av'+(h%5)+'" style="width:'+size+'px;height:'+size+'px;font-size:'+Math.round(size*.36)+'px" aria-hidden="true">'+esc(ini||'?')+'</span>'}

function vb(c){return c&&c.verified?'<svg class="vb" width="15" height="15" viewBox="0 0 24 24" role="img" aria-label="'+esc(t('verified'))+'"><circle cx="12" cy="12" r="11" fill="#0B7A75"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>':''}
function since(ts){if(!ts)return '—';var d=new Date(ts);if(S.lang==='uz')return UZM[d.getMonth()]+' '+d.getFullYear();return d.toLocaleDateString(S.lang==='ru'?'ru-RU':'en-GB',{month:'short',year:'numeric'})}
function stories(){var ids=Object.keys(S.companies);if(!ids.length)return '';var now=Date.now(),recent={};
S.posts.forEach(function(p){if(now-p.createdAt<259200000)recent[p.ownerId]=true});
ids.sort(function(x,y){return (recent[y]?1:0)-(recent[x]?1:0)||S.companies[y].createdAt-S.companies[x].createdAt});
return '<div class="stories" role="list">'+ids.slice(0,15).map(function(id){var c=S.companies[id],nm=c.name.length>12?c.name.slice(0,11)+'…':c.name;
return '<button class="st" role="listitem" data-act="company" data-id="'+esc(id)+'"><span class="ring'+(recent[id]?' on':'')+'">'+av(c.name,50)+'</span><span class="stn">'+esc(nm)+'</span></button>'}).join('')+'</div>'}
function check(txt){return '<li>'+svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>',18)+'<span>'+esc(txt)+'</span></li>'}
function sheetHtml(){return '<div class="scrim" data-act="sheet-close"></div><div class="sheet" role="dialog" aria-label="'+esc(t('sheet_title'))+'"><h2>'+esc(t('sheet_title'))+'</h2>'
+'<button class="btn block" data-act="new-cargo">'+esc(t('post_cargo'))+'</button><button class="btn block soft" data-act="new-truck">'+esc(t('post_truck'))+'</button><button class="btn block ghost" data-act="newpost">'+esc(t('update_lbl'))+'</button><button class="btn block plain" data-act="sheet-close">'+esc(t('cancel'))+'</button></div>'}

/* ---------- view builders ---------- */
function barMain(){var b=['uz','ru','en'].map(function(l){return '<button class="lg'+(S.lang===l?' on':'')+'" data-act="lang" data-v="'+l+'" aria-pressed="'+(S.lang===l)+'">'+l.toUpperCase()+'</button>'}).join('');
return '<header class="bar"><div class="in"><div class="brand"><span class="logo">'+ic.logo+'</span><span>Alpa Lines</span></div><div class="langs" role="group" aria-label="'+esc(t('language'))+'">'+b+'</div></div></header>'}
function barSub(title,left){return '<header class="bar"><div class="in"><button class="icon" data-act="back" aria-label="'+esc(t('back'))+'">'+ic.back+'</button>'+(left||'')+'<h1 class="ttl">'+esc(title)+'</h1></div></header>'}
function tabsBar(cur){var items=[['home',ic.home,'tab_home'],['loads',ic.truck,'tab_loads'],['plus'],['chats',ic.chat,'tab_chats'],['profile',ic.user,'tab_profile']];
return '<nav class="tabs" aria-label="Menu"><div class="in">'+items.map(function(x){if(x[0]==='plus')return '<button class="fab" data-act="plus" aria-label="'+esc(t('sheet_title'))+'">'+ic.plus24+'</button>';
return '<button class="tab'+(cur===x[0]?' on':'')+'" data-act="tab" data-v="'+x[0]+'"'+(cur===x[0]?' aria-current="page"':'')+'>'+x[1]+'<span>'+esc(t(x[2]))+'</span></button>'}).join('')+'</div></nav>'}
function shell(bar,body,foot){return bar+'<main class="wrap">'+body+'</main>'+(foot||'')}

function citySelect(id,val,anyLabel,cls,chg){var o=anyLabel?'<option value="">'+esc(anyLabel)+'</option>':'<option value="" disabled'+(val?'':' selected')+'></option>';
Object.keys(CITIES).forEach(function(k){o+='<option value="'+k+'"'+(val===k?' selected':'')+'>'+esc(cityName(k))+'</option>'});
return '<select id="'+id+'" class="'+(cls||'')+'"'+(chg?' data-chg="'+chg+'"':'')+'>'+o+'</select>'}

function owner(c,ownerId,extra){var name=c?c.name:'—';
return '<div class="head"><button class="who" data-act="company" data-id="'+esc(ownerId)+'">'+av(name,36)+'<span><span class="nm">'+esc(name)+vb(c)+'</span><span class="sub">'+esc(c?t(c.type)+' · '+cityName(c.city):'')+'</span></span></button>'+(extra||'')+'</div>'}

function loadCard(l){var c=co(l.ownerId),mine=l.ownerId===S.uid,btn;
if(mine)btn=delBtn('del-load',l.id);
else if(l.demo)btn='<span class="chip amber">'+esc(t('example'))+'</span>';
else btn='<button class="btn" data-act="contact" data-id="'+esc(l.ownerId)+'">'+esc(t('contact'))+'</button>';
var chips='<span class="chip teal">'+esc(fmtDate(l.date))+'</span><span class="chip">'+esc(truckName(l.truckType))+'</span>'+(l.weight?'<span class="chip">'+esc(l.weight)+' t</span>':'');
var price=l.price?'<div class="price">$'+esc(Number(l.price).toLocaleString('en-US'))+'<small>USD</small></div>':'<div class="muted" style="font-size:12px;font-weight:600;text-align:right">'+esc(t('ask_price'))+'</div>';
return '<article class="card"><div class="top"><div class="route"><span>'+esc(cityName(l.from))+'</span>'+ic.arrow+'<span>'+esc(cityName(l.to))+'</span></div>'+price+'</div>'
+'<div class="chips">'+chips+'</div>'+(l.cargo?'<p class="txt">'+esc(l.cargo)+'</p>':'')+owner(c,l.ownerId,btn)+'</article>'}

function delBtn(act,id){var on=S.confirmDel===act+id;return '<button class="btn danger" data-act="'+act+'" data-id="'+esc(id)+'">'+esc(on?t('confirm'):t('delete'))+'</button>'}

function kindChip(k){if(k==='truck')return '<span class="chip teal">'+esc(t('kind_truck'))+'</span>';if(k==='cargo')return '<span class="chip amber">'+esc(t('kind_cargo'))+'</span>';return ''}
function postCard(p){var c=co(p.ownerId),mine=p.ownerId===S.uid,likes=p.likes||{},n=0,k;for(k in likes)if(likes[k])n++;
var liked=!!(S.uid&&likes[S.uid]);
var acts='<button class="'+(liked?'liked':'')+'" data-act="like" data-id="'+esc(p.id)+'" aria-pressed="'+liked+'" aria-label="Like">'+(liked?ic.heartOn:ic.heart)+'<span>'+n+'</span></button>';
if(!mine&&!p.demo)acts+='<button data-act="contact" data-id="'+esc(p.ownerId)+'">'+ic.chat.replace(/width="24" height="24"/,'width="20" height="20"')+'<span>'+esc(t('message'))+'</span></button>';
acts+='<span class="sp"></span>';
if(p.demo)acts+='<span class="chip amber">'+esc(t('example'))+'</span>';
if(mine)acts+=delBtn('del-post',p.id);
return '<article class="card"><div class="head">'+'<button class="who" data-act="company" data-id="'+esc(p.ownerId)+'">'+av(c?c.name:'?',40)+'<span><span class="nm">'+esc(c?c.name:'—')+(c?vb(c):'')+'</span><span class="sub">'+esc(c?t(c.type)+' · '+cityName(c.city):'')+' · '+esc(ago(p.createdAt))+'</span></span></button>'+kindChip(p.kind)+'</div>'
+'<p class="txt">'+esc(p.text)+'</p><div class="act">'+acts+'</div></article>'}

function empty(text,btn){return '<div class="empty"><p>'+esc(text)+'</p>'+(btn||'')+'</div>'}
function loading(){return '<div class="sk"></div><div class="sk"></div>'}
function createBanner(){return '<div class="banner"><span>'+esc(t('create_banner'))+'</span><button class="btn" data-act="setup">'+esc(t('create_btn'))+'</button></div>'}

function viewHome(){var h='',me=myCo();
if(S.loaded.companies)h+=stories();
if(S.loaded.companies){h+=me?'<button class="teaser" data-act="newpost">'+av(me.name,36)+'<span>'+esc(t('share_prompt'))+'</span></button>':createBanner()}
if(!S.loaded.posts)h+=loading();else if(!S.posts.length)h+=empty(t('no_posts'));else h+=S.posts.map(postCard).join('');
return shell(barMain(),h,tabsBar('home'))}

function viewLoads(){var kind=S.kind,td=todayISO();
var list=S.loads.filter(function(l){return l.kind===kind&&(!S.fromF||l.from===S.fromF)&&(!S.toF||l.to===S.toF)&&(l.date>=td||l.ownerId===S.uid)});
var h='<div class="seg" role="group"><button data-act="kind" data-v="cargo" class="'+(kind==='cargo'?'on':'')+'" aria-pressed="'+(kind==='cargo')+'">'+esc(t('cargo_tab'))+'</button><button data-act="kind" data-v="truck" class="'+(kind==='truck'?'on':'')+'" aria-pressed="'+(kind==='truck')+'">'+esc(t('trucks_tab'))+'</button></div>';
h+='<div class="grid2"><div class="field"><label for="fFrom">'+esc(t('from'))+'</label>'+citySelect('fFrom',S.fromF,t('any'),'sel','from')+'</div><div class="field"><label for="fTo">'+esc(t('to'))+'</label>'+citySelect('fTo',S.toF,t('any'),'sel','to')+'</div></div>';
h+='<button class="btn block" data-act="newload">'+ic.plus+'<span>'+esc(t(kind==='cargo'?'post_cargo':'post_truck'))+'</span></button>';
if(!S.loaded.loads)h+=loading();else if(!list.length)h+=empty(t('no_loads'));else h+=list.map(loadCard).join('');
return shell(barMain(),h,tabsBar('loads'))}

function viewChats(){var h;
if(!S.loaded.chats)h=loading();else if(!S.chats.length)h=empty(t('no_chats'));
else h=S.chats.map(function(c){var other=c.members.filter(function(m){return m!==S.uid})[0],oc=co(other);
return '<button class="chatrow" data-act="open-chat" data-id="'+esc(other)+'">'+av(oc?oc.name:'?',44)+'<span class="mid"><span class="nm">'+esc(oc?oc.name:'—')+'</span><span class="ls">'+esc((c.lastFrom===S.uid?'↩ ':'')+c.lastText)+'</span></span><span class="muted" style="font-size:12px">'+esc(ago(c.lastAt))+'</span></button>'}).join('');
return shell(barMain(),h,tabsBar('chats'))}

function coCard(c,id,mine){var phone=c.phone?'<p>'+esc(c.phone)+'</p>':'',nl=S.loads.filter(function(l){return l.ownerId===id}).length,np=S.posts.filter(function(p){return p.ownerId===id}).length,
stats='<div class="stats"><div><b>'+nl+'</b><span>'+esc(t('st_loads'))+'</span></div><div><b>'+np+'</b><span>'+esc(t('st_posts'))+'</span></div><div><b>'+esc(since(c.createdAt))+'</b><span>'+esc(t('st_since'))+'</span></div></div>';
return '<section class="card"><div class="head">'+av(c.name,56)+'<div style="min-width:0"><h2 style="font-size:19px;font-weight:800;letter-spacing:-.3px;overflow-wrap:anywhere">'+esc(c.name)+' '+vb(c)+'</h2><p class="muted">'+esc(t(c.type)+' · '+cityName(c.city))+'</p></div></div>'
+stats+phone+(c.about?'<p class="txt">'+esc(c.about)+'</p>':'')
+(c.demo?'<span class="chip amber" style="align-self:flex-start">'+esc(t('example'))+'</span>':'')
+(mine?'<button class="btn ghost" data-act="setup" style="align-self:flex-start">'+esc(t('edit'))+'</button>':(c.demo?'':'<button class="btn" data-act="contact" data-id="'+esc(id)+'" style="align-self:flex-start">'+esc(t('message'))+'</button>'))+'</section>'}

function listingsOf(id,mine){var td=todayISO();
var ls=S.loads.filter(function(l){return l.ownerId===id&&(mine||l.date>=td)}),ps=S.posts.filter(function(p){return p.ownerId===id}),h='';
if(ls.length)h+='<h2 class="sec">'+esc(t(mine?'your_listings':'listings'))+'</h2>'+ls.map(loadCard).join('');
if(ps.length)h+='<h2 class="sec">'+esc(t(mine?'your_posts':'posts'))+'</h2>'+ps.map(postCard).join('');
return h}

function viewProfile(){var me=myCo(),h='';
if(!S.loaded.companies)h=loading();
else if(!me)h=createBanner();
else h=coCard(me,S.uid,true)+listingsOf(S.uid,true);
h+='<button class="proCard" data-act="pro"><span><b>'+esc(t('pro_card'))+'</b><span class="muted">'+esc(t('pro_card_d'))+'</span></span>'+ic.arrow+'</button>';
h+='<button class="btn danger block" data-act="sign-out">'+esc(t('sign_out'))+'</button>';
h+='<p class="note">Alpa Lines · '+esc(t('version'))+'</p>';
return shell(barMain(),h,tabsBar('profile'))}

function viewCompany(){var id=S.view.id,c=co(id);
if(!c)return shell(barSub(''),empty('—'));
return shell(barSub(c.name),coCard(c,id,id===S.uid)+listingsOf(id,id===S.uid))}

function viewSetup(){var me=myCo()||{};
var opts=TYPES.map(function(k){return '<option value="'+k+'"'+((me.type||'carrier')===k?' selected':'')+'>'+esc(t(k))+'</option>'}).join('');
var h='<div><h2 style="font-size:22px;font-weight:800;letter-spacing:-.4px">'+esc(t('setup_title'))+'</h2><p class="muted">'+esc(t('setup_sub'))+'</p></div>'
+'<div class="field"><label for="cName">'+esc(t('company_name'))+' *</label><input id="cName" maxlength="80" autocomplete="organization" value="'+esc(me.name||'')+'"></div>'
+'<div class="grid2"><div class="field"><label for="cType">'+esc(t('company_type'))+'</label><select id="cType">'+opts+'</select></div>'
+'<div class="field"><label for="cCity">'+esc(t('city'))+' *</label>'+citySelect('cCity',me.city||'')+'</div></div>'
+'<div class="field"><label for="cPhone">'+esc(t('phone'))+' ('+esc(t('optional'))+')</label><input id="cPhone" type="tel" maxlength="30" autocomplete="tel" value="'+esc(me.phone||'')+'" placeholder="+998 90 123 45 67"></div>'
+'<div class="field"><label for="cAbout">'+esc(t('about'))+' ('+esc(t('optional'))+')</label><textarea id="cAbout" maxlength="500">'+esc(me.about||'')+'</textarea></div>'
+'<p class="err" id="formErr" role="alert"></p>'
+'<div class="row"><button class="btn ghost" data-act="back">'+esc(t('cancel'))+'</button><button class="btn" data-act="save-company">'+esc(t('save'))+'</button></div>';
return shell(barSub(t('tab_profile')),h)}

function viewPro(){var h='<section class="proHead"><div class="proTag"><span class="logo">'+ic.logo+'</span><b>ALPA LINES PRO</b><span class="chip amber">'+esc(t('soon'))+'</span></div><h2>'+esc(t('pro_head'))+'</h2><p>'+esc(t('pro_sub'))+'</p></section>'
+'<section class="card"><div class="row"><h3>'+esc(t('plan_free'))+'</h3><b class="muted">$0</b></div><ul class="ck muted">'+check(t('free_f1'))+check(t('free_f2'))+'</ul></section>'
+'<section class="card pro"><span class="pop">'+esc(t('popular'))+'</span><div class="row"><h3>Pro</h3><div class="price">$29 <span class="muted" style="font-size:13px;font-weight:600">/ '+esc(t('month'))+'</span></div></div>'
+'<ul class="ck">'+check(t('pro_f1'))+check(t('pro_f2'))+check(t('pro_f3'))+check(t('pro_f4'))+'</ul>'
+(S.pro?'<p class="chip teal" style="align-self:flex-start">'+esc(t('waitlist_done'))+'</p>':'<button class="btn block" data-act="join-pro">'+esc(t('waitlist_btn'))+'</button>')
+'<p class="note">'+esc(t('pro_year'))+'</p><p class="err" id="formErr" role="alert"></p></section>'
+'<section class="card"><div class="row" style="flex-wrap:nowrap"><div><h3>'+esc(t('boost_t'))+'</h3><p class="muted" style="font-size:13px">'+esc(t('boost_d'))+'</p></div><b class="price">$5</b></div></section>'
+'<p class="note">'+esc(t('waitlist_note'))+'</p>';
return shell(barSub('Pro'),h)}

function viewComposeLoad(){var k=S.view.kind||'cargo';
var tr=TRUCKS.map(function(x){return '<option value="'+x+'">'+esc(t(x))+'</option>'}).join('');
var h='<div class="seg" role="group"><button data-act="form-kind" data-v="cargo" id="kc" class="'+(k==='cargo'?'on':'')+'">'+esc(t('post_cargo'))+'</button><button data-act="form-kind" data-v="truck" id="kt" class="'+(k==='truck'?'on':'')+'">'+esc(t('post_truck'))+'</button></div>'
+'<div class="grid2"><div class="field"><label for="lFrom">'+esc(t('from'))+' *</label>'+citySelect('lFrom','')+'</div><div class="field"><label for="lTo">'+esc(t('to'))+' *</label>'+citySelect('lTo','')+'</div></div>'
+'<div class="grid2"><div class="field"><label for="lDate">'+esc(t('date'))+' *</label><input id="lDate" type="date" min="'+todayISO()+'" value="'+todayISO()+'"></div><div class="field"><label for="lTruck">'+esc(t('truck_type'))+'</label><select id="lTruck">'+tr+'</select></div></div>'
+'<div class="grid2"><div class="field"><label for="lWeight">'+esc(t('weight'))+' ('+esc(t('optional'))+')</label><input id="lWeight" type="number" inputmode="decimal" min="0" step="0.1"></div><div class="field"><label for="lPrice">'+esc(t('price'))+' ('+esc(t('optional'))+')</label><input id="lPrice" type="number" inputmode="numeric" min="0" step="10"></div></div>'
+'<div class="field"><label for="lCargo">'+esc(t('cargo_name'))+' / '+esc(t('note'))+' ('+esc(t('optional'))+')</label><textarea id="lCargo" maxlength="300" style="min-height:80px"></textarea></div>'
+'<p class="err" id="formErr" role="alert"></p>'
+'<div class="row"><button class="btn ghost" data-act="back">'+esc(t('cancel'))+'</button><button class="btn" data-act="publish-load">'+esc(t('publish'))+'</button></div>';
return shell(barSub(t(k==='cargo'?'post_cargo':'post_truck')),h)}

function viewComposePost(){
var h='<div class="field"><label for="pKind">'+esc(t('kind_news'))+'</label><select id="pKind"><option value="news">'+esc(t('kind_news'))+'</option><option value="truck">'+esc(t('kind_truck'))+'</option><option value="cargo">'+esc(t('kind_cargo'))+'</option></select></div>'
+'<div class="field"><textarea id="pText" maxlength="1000" placeholder="'+esc(t('share_prompt'))+'" aria-label="'+esc(t('share_prompt'))+'"></textarea></div>'
+'<p class="err" id="formErr" role="alert"></p>'
+'<div class="row"><button class="btn ghost" data-act="back">'+esc(t('cancel'))+'</button><button class="btn" data-act="publish-post">'+esc(t('share'))+'</button></div>';
return shell(barSub(t('tab_home')),h)}

function viewChat(){var v=S.view,oc=co(v.other),name=oc?oc.name:'—';
var bar=barSub(name,'<span style="margin-right:8px">'+av(name,34)+'</span>');
var body='<p class="note">'+esc(t(oc&&oc.demo?'example_chat':'chat_note'))+'</p><div class="msgs" id="msgs"></div>';
var foot='<div class="inputbar"><div class="in"><form id="msgForm" autocomplete="off"><input id="msgInput" aria-label="'+esc(t('write_msg'))+'" placeholder="'+esc(t('write_msg'))+'" maxlength="2000"><button class="send" type="submit" aria-label="'+esc(t('send'))+'">'+ic.send+'</button></form></div></div>';
return shell(bar,body,foot)}

/* ---------- render ---------- */
function viewAuth(){var up=S.authMode==='up';
var h='<div style="padding-top:12px"><h2 style="font-size:24px;font-weight:800;letter-spacing:-.5px">'+esc(t('auth_title'))+'</h2><p class="muted">'+esc(t('auth_sub'))+'</p></div>'
+'<form id="authForm" class="card" autocomplete="on"><div class="field"><label for="aEmail">'+esc(t('email'))+'</label><input id="aEmail" type="email" inputmode="email" autocomplete="email" autocapitalize="none" required></div>'
+'<div class="field"><label for="aPass">'+esc(t('password'))+'</label><input id="aPass" type="password" autocomplete="'+(up?'new-password':'current-password')+'" minlength="6" required></div>'
+'<p class="err" id="formErr" role="alert"></p><button class="btn block" type="submit">'+esc(t(up?'sign_up':'sign_in'))+'</button>'
+'<button class="btn ghost block" type="button" data-act="auth-mode">'+esc(t(up?'have_account':'no_account'))+'</button></form>';
return shell(barMain(),h)}

function render(force){
if(!force&&STABLE.indexOf(S.view.name)>=0)return;
var html;
if(S.error)html=shell(barMain(),empty(t(S.error)));
else if(!S.authReady)html=shell(barMain(),loading());
else if(!S.uid)html=viewAuth();
else{switch(S.view.name){
case 'loads':html=viewLoads();break;case 'chats':html=viewChats();break;case 'profile':html=viewProfile();break;
case 'company':html=viewCompany();break;case 'setup':html=viewSetup();break;case 'compose-load':html=viewComposeLoad();break;
case 'compose-post':html=viewComposePost();break;case 'chat':html=viewChat();break;case 'pro':html=viewPro();break;default:html=viewHome()}
if(S.sheet)html+=sheetHtml()}
$app.innerHTML=html;
if(S.uid&&S.view.name==='chat')paintMsgs();
}

function pairMsgs(){var o=S.view.other,u=S.uid;return S.allMsgs.filter(function(m){return (m.from===u&&m.to===o)||(m.from===o&&m.to===u)})}
function paintMsgs(){var el=document.getElementById('msgs');if(!el)return;
el.innerHTML=pairMsgs().map(function(m){var out=m.from===S.uid;return '<div class="b '+(out?'out':'in-')+'">'+esc(m.text)+'<time>'+esc(clock(m.at))+'</time></div>'}).join('');
window.scrollTo(0,document.body.scrollHeight)}

/* ---------- navigation ---------- */
function goTab(n){S.stack=[];S.confirmDel='';S.sheet=false;S.view={name:n};render(true);window.scrollTo(0,0)}
function push(v){S.stack.push(S.view);S.view=v;S.confirmDel='';S.sheet=false;render(true);window.scrollTo(0,0)}
function back(){S.view=S.stack.pop()||{name:'home'};S.confirmDel='';S.sheet=false;render(true);window.scrollTo(0,0)}
function needCompany(){if(myCo())return false;push({name:'setup'});return true}
function openChat(other){if(!S.uid||other===S.uid)return;if(needCompany())return;push({name:'chat',other:other})}

/* ---------- data (Supabase) ---------- */
var sb=null,chan=null,timers={};
function later(k,fn){clearTimeout(timers[k]);timers[k]=setTimeout(fn,250)}
function done(name){S.loaded[name]=true;render()}
function loadCompanies(){return sb.from('companies').select('*').then(function(r){
if(r.error){console.warn(r.error);return done('companies')}
var o={};r.data.forEach(function(c){o[c.id]={name:c.name,type:c.type,city:c.city,phone:c.phone||'',about:c.about||'',verified:!!c.verified,createdAt:Date.parse(c.created_at)}});S.companies=o;done('companies')})}
function loadPosts(){return sb.from('posts').select('*, post_likes(user_id)').order('created_at',{ascending:false}).limit(60).then(function(r){
if(r.error){console.warn(r.error);return done('posts')}
S.posts=r.data.map(function(p){var likes={};(p.post_likes||[]).forEach(function(x){likes[x.user_id]=true});return {id:p.id,ownerId:p.owner,kind:p.kind,text:p.text,createdAt:Date.parse(p.created_at),likes:likes}});done('posts')})}
function loadLoads(){return sb.from('loads').select('*').order('created_at',{ascending:false}).limit(150).then(function(r){
if(r.error){console.warn(r.error);return done('loads')}
S.loads=r.data.map(function(l){return {id:l.id,ownerId:l.owner,kind:l.kind,from:l.from_city,to:l.to_city,date:l.load_date,truckType:l.truck_type,weight:l.weight,price:l.price,cargo:l.cargo,createdAt:Date.parse(l.created_at)}});done('loads')})}
function deriveChats(){var m={};S.allMsgs.forEach(function(x){var o=x.from===S.uid?x.to:x.from,c=m[o];if(!c||x.at>=c.lastAt)m[o]={id:o,members:[S.uid,o],lastText:x.text,lastAt:x.at,lastFrom:x.from}});
return Object.keys(m).map(function(k){return m[k]}).sort(function(a,b){return b.lastAt-a.lastAt})}
function loadMsgs(){return sb.from('messages').select('*').or('sender.eq.'+S.uid+',recipient.eq.'+S.uid).order('created_at',{ascending:true}).limit(1000).then(function(r){
if(r.error){console.warn(r.error);return done('chats')}
S.allMsgs=r.data.map(function(x){return {id:x.id,from:x.sender,to:x.recipient,text:x.text,at:Date.parse(x.created_at)}});S.chats=deriveChats();
if(S.view.name==='chat')paintMsgs();done('chats')})}

function loadPro(){return sb.from('pro_waitlist').select('user_id').eq('user_id',S.uid).then(function(r){if(r.error){console.warn(r.error);return}S.pro=!!(r.data&&r.data.length);if(S.view.name==='pro')render(true)})}
function joinPro(){sb.from('pro_waitlist').insert({user_id:S.uid,plan:'pro'}).then(function(r){if(r.error&&r.error.code!=='23505'){failMsg(r.error);return}S.pro=true;render(true)})}

function startData(){
loadCompanies();loadPosts();loadLoads();loadMsgs();loadPro();
chan=sb.channel('alpa')
.on('postgres_changes',{event:'*',schema:'public',table:'companies'},function(){later('c',loadCompanies)})
.on('postgres_changes',{event:'*',schema:'public',table:'posts'},function(){later('p',loadPosts)})
.on('postgres_changes',{event:'*',schema:'public',table:'post_likes'},function(){later('p',loadPosts)})
.on('postgres_changes',{event:'*',schema:'public',table:'loads'},function(){later('l',loadLoads)})
.on('postgres_changes',{event:'*',schema:'public',table:'messages'},function(){later('m',loadMsgs)})
.subscribe()}
function stopData(){if(chan){try{sb.removeChannel(chan)}catch(e){}chan=null}
S.companies={};S.posts=[];S.loads=[];S.allMsgs=[];S.chats=[];S.pro=false;S.sheet=false;S.loaded={companies:false,posts:false,loads:false,chats:false}}

function setSession(sess){var id=sess&&sess.user?sess.user.id:null;
if(S.authReady&&id===S.uid)return;
S.authReady=true;stopData();S.uid=id;S.authMode='in';S.stack=[];S.view={name:id?'home':'auth'};render(true);if(id)setTimeout(startData,0)}

/* ---------- writes ---------- */
function formErr(key,extra){var el=document.getElementById('formErr');if(el)el.textContent=key?t(key)+(extra?': '+extra:''):''}
function val(id){var el=document.getElementById(id);return el?el.value.trim():''}
function failMsg(e){console.warn(e);formErr('save_fail')}
function ok(r){if(r.error){failMsg(r.error);return false}return true}

function doAuth(){var email=val('aEmail'),pw=(document.getElementById('aPass')||{}).value||'',up=S.authMode==='up';
if(!email||pw.length<6){formErr('auth_fail');return}
var call=up?sb.auth.signUp({email:email,password:pw}):sb.auth.signInWithPassword({email:email,password:pw});
call.then(function(r){if(r.error){formErr('auth_fail',r.error.message);return}
if(up&&!(r.data&&r.data.session))formErr('confirm_email')})}

function saveCompany(){var name=val('cName'),city=val('cCity');if(!name||!city){formErr('required');return}
sb.from('companies').upsert({id:S.uid,name:name,type:val('cType')||'carrier',city:city,phone:val('cPhone')||null,about:val('cAbout')||null,updated_at:new Date().toISOString()}).then(function(r){
if(!ok(r))return;return loadCompanies().then(function(){S.stack=[];S.view={name:'profile'};render(true)})})}

function publishLoad(){var from=val('lFrom'),to=val('lTo'),date=val('lDate');
if(!from||!to||!date){formErr('required');return}if(from===to){formErr('bad_route');return}
var w=parseFloat(val('lWeight')),p=parseFloat(val('lPrice')),kind=S.view.kind||'cargo';
sb.from('loads').insert({owner:S.uid,kind:kind,from_city:from,to_city:to,load_date:date,truck_type:val('lTruck')||'other',weight:isFinite(w)&&w>0?w:null,price:isFinite(p)&&p>0?p:null,cargo:val('lCargo')||null}).then(function(r){
if(!ok(r))return;return loadLoads().then(function(){S.kind=kind;S.stack=[];S.view={name:'loads'};render(true);window.scrollTo(0,0)})})}

function publishPost(){var text=val('pText');if(!text){formErr('required');return}
sb.from('posts').insert({owner:S.uid,kind:val('pKind')||'news',text:text}).then(function(r){
if(!ok(r))return;return loadPosts().then(function(){S.stack=[];S.view={name:'home'};render(true);window.scrollTo(0,0)})})}

function toggleLike(id){if(needCompany())return;var p=S.posts.filter(function(x){return x.id===id})[0];if(!p)return;
var q=(p.likes&&p.likes[S.uid])?sb.from('post_likes').delete().eq('post_id',id).eq('user_id',S.uid):sb.from('post_likes').insert({post_id:id,user_id:S.uid});
q.then(function(r){if(r.error)console.warn(r.error);loadPosts()})}

function sendMsg(){var inp=document.getElementById('msgInput'),text=inp.value.trim();if(!text||!S.view.other)return;
inp.value='';inp.focus();
sb.from('messages').insert({sender:S.uid,recipient:S.view.other,text:text.slice(0,2000)}).then(function(r){
if(r.error){console.warn(r.error);inp.value=text;return}loadMsgs()})}

function remove(table,id){sb.from(table).delete().eq('id',id).then(function(r){if(r.error)console.warn(r.error);S.confirmDel='';(table==='loads'?loadLoads():loadPosts()).then(function(){render(true)})})}

/* ---------- events ---------- */
$app.addEventListener('click',function(e){var el=e.target.closest('[data-act]');if(!el)return;var a=el.dataset.act,v=el.dataset.v,id=el.dataset.id;
switch(a){
case 'tab':goTab(v);break;
case 'lang':S.lang=v;LS.set('alpa-lang',v);document.documentElement.lang=v;render(true);break;
case 'kind':S.kind=v;render(true);break;
case 'back':back();break;
case 'auth-mode':S.authMode=S.authMode==='up'?'in':'up';render(true);break;
case 'sign-out':sb.auth.signOut();break;
case 'setup':push({name:'setup'});break;
case 'save-company':saveCompany();break;
case 'newload':if(!needCompany())push({name:'compose-load',kind:S.kind});break;
case 'form-kind':S.view.kind=v;document.getElementById('kc').classList.toggle('on',v==='cargo');document.getElementById('kt').classList.toggle('on',v==='truck');
var h1=document.querySelector('.ttl');if(h1)h1.textContent=t(v==='cargo'?'post_cargo':'post_truck');break;
case 'publish-load':publishLoad();break;
case 'newpost':if(!needCompany())push({name:'compose-post'});break;
case 'plus':S.sheet=true;render(true);break;
case 'sheet-close':S.sheet=false;render(true);break;
case 'new-cargo':case 'new-truck':if(!needCompany())push({name:'compose-load',kind:a==='new-cargo'?'cargo':'truck'});break;
case 'pro':push({name:'pro'});break;
case 'join-pro':joinPro();break;
case 'publish-post':publishPost();break;
case 'company':push({name:'company',id:id});break;
case 'contact':openChat(id);break;
case 'open-chat':openChat(id);break;
case 'like':toggleLike(id);break;
case 'del-load':case 'del-post':var key=a+id;if(S.confirmDel!==key){S.confirmDel=key;render(true)}else remove(a==='del-load'?'loads':'posts',id);break;
}});
$app.addEventListener('change',function(e){var el=e.target.closest('[data-chg]');if(!el)return;
if(el.dataset.chg==='from')S.fromF=el.value;else S.toF=el.value;render(true)});
$app.addEventListener('submit',function(e){e.preventDefault();
if(e.target.id==='msgForm')sendMsg();else if(e.target.id==='authForm')doAuth()});

/* ---------- start ---------- */
(function init(){
document.documentElement.lang=S.lang;
var okCfg=SUPABASE_URL.indexOf('https://')===0&&SUPABASE_KEY.length>20;
if(!okCfg){S.error='no_config';S.authReady=true;render(true);return}
if(!window.supabase){S.error='no_db';S.authReady=true;render(true);return}
render(true);
sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
sb.auth.onAuthStateChange(function(ev,sess){setTimeout(function(){setSession(sess)},0)});
sb.auth.getSession().then(function(r){setSession(r.data&&r.data.session)});
})();
})();
