'use strict';
// ── DATA ──
const S=[
  {t:'Neon Pulse',a:'Cosmic Drift',g:'Electronic',c:'assets/covers/cover1.png',d:214,
   ly:['Floating through the neon streams','Electric signals fill my dreams','A pulse that drives the city lights','We dance beneath the digital nights','','Synthesized and brought to life','Cutting through the static strife','Frequencies that make you feel','Something perfectly surreal','','Oh the neon pulse is calling out','Beats so loud there is no doubt','Lost inside the rave machine','Caught between the world unseen','','Data streams like rivers flow','Underneath the pixel glow','Every heartbeat synced in time','To the rhythm of this rhyme']},
  {t:'Sunset Boulevard',a:'The Retrowave',g:'Synthwave',c:'assets/covers/cover2.png',d:247,
   ly:['Driving down the boulevard at night','The palm trees glow in fading light','A city built on golden dreams','Nothing here is what it seems','','Radio plays our favorite song','As the summer stretches long','Windows down the warm breeze flows','Wherever the night wind goes','','Sunset boulevard we ride','Side by side and glorified','Every neon sign we pass','Moments frozen here like glass','','Stars above are just for us','Living life without a fuss','In this retrowave we live','Everything we have to give']},
  {t:'Rainy Window',a:'Lo-fi Haze',g:'Lo-fi',c:'assets/covers/cover3.png',d:189,
   ly:['Rain taps softly on the pane','Thoughts that drift like drops of rain','A warm cup and an open book','Find yourself a cozy nook','','Lantern lights and amber glow','Outside the quiet garden show','Petrichor fills the evening air','Worries fade without a care','','Just the rain and me tonight','Everything will be alright','Lofi beats to ease the mind','Leave the busy world behind','','Notes descend like water falls','Music drifting through the halls','In the haze I find my peace','Let the gentle raining cease']},
  {t:'Midnight Jazz',a:'Blue Velvet',g:'Jazz',c:'assets/covers/cover4.png',d:312,
   ly:['The city sleeps but we are wide awake','A saxophone for heaven\'s sake','Notes that curl like cigarette smoke rise','Up toward the starless midnight skies','','A piano walks the keys so slow','Bassline keeps the steady flow','Drums that brush with velvet touch','Jazz that means so very much','','Midnight jazz is all we need','Plant the solitary seed','Of a melody that grows','In the place where no one goes','','Blue is just a state of mind','In the music we will find','Every feeling every thought','Every battle ever fought']},
  {t:'Circuit Breaker',a:'Digital Ghost',g:'Techno',c:'assets/covers/cover5.png',d:278,
   ly:['Circuits fire within the grid','Breaking every limit hid','Electric surge through iron veins','System reboot begins again','','Voltage spikes and data streams','Reality is not what it seems','We are ghosts inside the wire','Dancing higher ever higher','','Circuit breaker snap the line','Cross the threshold cross the shrine','Of a world built bit by bit','Find the place where we all fit','','Bass drops like a lightning strike','This is everything we like','Digital forever now','Ghost inside the machine somehow']},
  {t:'Deep Ocean',a:'Aqua Dream',g:'Ambient',c:'assets/covers/cover6.png',d:230,
   ly:['Beneath the waves the silence calls','A world of blue no fear no walls','Bioluminescent trails of light','Dancing creatures in the night','','Currents carry ancient songs','Where the ocean floor belongs','Pressure deep and cold and free','Only you and only sea','','Drifting in the endless blue','Finding peace I never knew','Ocean breathes and so do I','Underneath the liquid sky','','Every ripple every wave','Every life the waters gave','Floating weightless lost in time','Deep below the waterline']},
  {t:'Lavender Bloom',a:'Pastel Sky',g:'Indie Pop',c:'assets/covers/cover7.png',d:198,
   ly:['Lavender fills the morning air','Wildflowers growing everywhere','Pastel colors paint the dawn','The world awakes and carries on','','Soft piano notes arise','Mirrored in your gentle eyes','Every petal holds a dream','Nothing\'s ever what it seems','','We are blooming we are free','Wild and soft as we can be','In the meadow hand in hand','More than life had ever planned','','Let the light come let it through','Everything is born anew','Lavender and morning dew','All I ever needed you']},
  {t:'Golden Streets',a:'Urban Poet',g:'Hip-Hop',c:'assets/covers/cover8.png',d:265,
   ly:['Gold spray paint on concrete grey','These streets remember what I say','Every crack and every wall','Heard my rise before my fall','','Rhythm born in city nights','Chasing after distant lights','Words like bricks I lay them down','Building castles in this town','','Golden streets beneath my feet','Every verse a heartbeat beat','This is where I learned my art','Graffiti written on my heart','','Now the city knows my name','Nothing ever stays the same','From the bottom to the sky','Golden streets will never die']},
  {t:'Ivory Sonata',a:'Clara Nova',g:'Classical',c:'assets/covers/cover9.png',d:340,
   ly:['Ivory keys beneath my hands','Music speaks what no one planned','Every note a world unfolds','Every measure story told','','Strings and silence intertwine','In the space between each line','Breath of violins ascend','Where the melody must end','','Softly now the theme returns','Heart remembers what it learns','In the concert hall alone','Every harmony comes home','','Final chord and then the still','Time has paused against its will','Ivory sonata done','And we two have become one']},
  {t:'Golden Hour',a:'Soul River',g:'R&B',c:'assets/covers/cover10.png',d:252,
   ly:['Amber light through dusty blinds','The kind of glow that love defines','Your silhouette against the sun','The golden hour has begun','','Smooth and warm like honey poured','Every word that I adored','City quiet city gold','Stories waiting to be told','','We don\'t need to say a thing','Just let the golden moment ring','Sipping slow and breathing deep','These the moments that we keep','','Sun is setting but we stay','Letting go of yesterday','Golden hour fades to night','Everything is going to be alright']}
];

// ── State ──
let idx=0,playing=false,shuffle=false,repeat=0,vol=0.8,muted=false,prevVol=0.8;
let seekDrag=false,volDrag=false,timer=null,elapsed=0,autoplay=true,hist=[],lyIdx=-1,singOn=false;

// ── Audio Engine ──
let ctx=null,mg=null,nodes=[];
function ensureCtx(){if(!ctx){ctx=new(window.AudioContext||window.webkitAudioContext)();mg=ctx.createGain();mg.gain.value=vol;mg.connect(ctx.destination);}if(ctx.state==='suspended')ctx.resume();}
function killNodes(){nodes.forEach(n=>{try{n.stop();}catch(e){}});nodes=[];}
function mkOsc(t,f,g,t0,t1){const o=ctx.createOscillator(),gn=ctx.createGain();o.type=t;o.frequency.value=f;gn.gain.setValueAtTime(g,t0);gn.gain.exponentialRampToValueAtTime(1e-4,t1);o.connect(gn);gn.connect(mg);o.start(t0);o.stop(t1);nodes.push(o);}
function mkNz(g,t0,d){const sz=Math.ceil(ctx.sampleRate*d),buf=ctx.createBuffer(1,sz,ctx.sampleRate),dat=buf.getChannelData(0);for(let i=0;i<sz;i++)dat[i]=Math.random()*2-1;const s=ctx.createBufferSource(),gn=ctx.createGain(),fl=ctx.createBiquadFilter();fl.type='bandpass';fl.frequency.value=200;fl.Q.value=1;s.buffer=buf;gn.gain.setValueAtTime(g,t0);gn.gain.exponentialRampToValueAtTime(1e-4,t0+d);s.connect(fl);fl.connect(gn);gn.connect(mg);s.start(t0);s.stop(t0+d);nodes.push(s);}
function mkKick(t){const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(40,t+.08);g.gain.setValueAtTime(.45,t);g.gain.exponentialRampToValueAtTime(1e-4,t+.25);o.connect(g);g.connect(mg);o.start(t);o.stop(t+.3);nodes.push(o);}

const SYNTHS=[
  ()=>{const n=[220,277,330,440,554,659,880],now=ctx.currentTime,s=.25;for(let i=0;i<100;i++){const t=now+i*s;mkOsc('sawtooth',n[i%n.length],.07,t,t+s*.9);if(i%4===0)mkOsc('sine',55,.15,t,t+s*1.8);if(i%2===0)mkNz(.03,t,.05);}},
  ()=>{const ch=[[196,247,294],[220,262,330],[175,220,262],[196,247,330]],now=ctx.currentTime,b=.6;for(let i=0;i<40;i++){const c=ch[i%ch.length],t=now+i*b*2;c.forEach(f=>mkOsc('sine',f,.05,t,t+b*1.8));mkOsc('triangle',c[0]/2,.13,t,t+b*1.9);mkNz(.05,t+b,.1);}},
  ()=>{const m=[262,294,330,262,349,392,330,294],now=ctx.currentTime,b=.8;for(let i=0;i<50;i++){const t=now+i*b*.75,f=m[i%m.length],o=ctx.createOscillator(),g=ctx.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.1,t);g.gain.exponentialRampToValueAtTime(1e-4,t+b*2);o.connect(g);g.connect(mg);o.start(t);o.stop(t+b*2);nodes.push(o);if(i%4===0)mkOsc('sine',80,.08,t,t+.15);if(i%3===0)mkNz(.01,t,.35);}},
  ()=>{const bl=[110,131,147,165,175,196,220,196],ct=[[262,330,392],[247,311,370],[220,277,349],[247,311,415]],now=ctx.currentTime,b=.67;for(let i=0;i<80;i++){const t=now+i*b*.5;mkOsc('sine',bl[i%bl.length],.11,t,t+b*.45);if(i%4===0)ct[Math.floor(i/4)%ct.length].forEach(f=>mkOsc('sine',f,.035,t,t+b*1.8));if(i%8===4)mkNz(.02,t,.18);if(i%2===1)mkNz(.015,t+b*.15,.06);}},
  ()=>{const a=[55,58,65,73,82,73,65,58],now=ctx.currentTime,b=60/135;for(let i=0;i<130;i++){const t=now+i*b;mkKick(t);const ao=ctx.createOscillator(),ag=ctx.createGain(),af=ctx.createBiquadFilter();ao.type='sawtooth';ao.frequency.value=a[i%a.length];af.type='lowpass';af.Q.value=14;af.frequency.setValueAtTime(200,t);af.frequency.exponentialRampToValueAtTime(1100,t+b*.5);ag.gain.setValueAtTime(.1,t);ag.gain.exponentialRampToValueAtTime(1e-4,t+b*.9);ao.connect(af);af.connect(ag);ag.connect(mg);ao.start(t);ao.stop(t+b);nodes.push(ao);mkNz(.025,t+b*.5,.04);if(i%4===2)mkNz(.07,t,.11);}},
  ()=>{const p=[146,164,196,220,246,196,174,131],now=ctx.currentTime,b=.9;for(let i=0;i<60;i++){const t=now+i*b;mkOsc('sine',p[i%p.length],.09,t,t+b*1.6);mkOsc('sine',p[i%p.length]*2,.02,t,t+b*1.2);if(i%8===0)mkNz(.012,t,.5);}},
  ()=>{const m=[262,294,330,349,392,349,330,262],now=ctx.currentTime,b=.5;for(let i=0;i<80;i++){const t=now+i*b;mkOsc('triangle',m[i%m.length],.08,t,t+b*.9);if(i%4===0)mkOsc('sine',131,.1,t,t+b*1.8);if(i%8===4)mkNz(.03,t,.08);}},
  ()=>{const n=[110,138,165,138,110,92,110,92],now=ctx.currentTime,b=.44;for(let i=0;i<110;i++){const t=now+i*b;mkOsc('sawtooth',n[i%n.length],.065,t,t+b*.85);if(i%4===0)mkKick(t);if(i%2===0)mkNz(.035,t+b*.5,.05);}},
  ()=>{const m=[262,330,392,440,392,330,294,262],now=ctx.currentTime,b=.7;for(let i=0;i<55;i++){const t=now+i*b;mkOsc('sine',m[i%m.length],.07,t,t+b*1.4);mkOsc('sine',m[i%m.length]*1.5,.018,t,t+b);if(i%6===0)mkNz(.009,t,.6);}},
  ()=>{const m=[220,247,262,294,220,196,220,247],now=ctx.currentTime,b=.55;for(let i=0;i<80;i++){const t=now+i*b;mkOsc('sine',m[i%m.length],.09,t,t+b*1.1);mkOsc('triangle',m[i%m.length]/2,.11,t,t+b*.9);if(i%4===2)mkNz(.028,t,.1);if(i%8===0)mkNz(.018,t,.4);}}
];
function startAudio(){ensureCtx();killNodes();SYNTHS[idx]();mg.gain.value=muted?0:vol;}
function stopAudio(){killNodes();}

// ── Speech ──
function speak(txt){if(!singOn||!txt||!txt.trim()||!window.speechSynthesis)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(txt);u.rate=.88;u.pitch=1.1;u.volume=.8;const vs=window.speechSynthesis.getVoices();const pv=vs.find(v=>/en/i.test(v.lang)&&/female|samantha|zira|google/i.test(v.name))||vs.find(v=>/en/i.test(v.lang));if(pv)u.voice=pv;window.speechSynthesis.speak(u);}
function stopSpeak(){window.speechSynthesis?.cancel();}

// ── DOM ──
const $=id=>document.getElementById(id);
const qEl=$('sbQueue'),artWrap=$('artWrap'),pArt=$('pArt');
const pTitle=$('pTitle'),pArtist=$('pArtist');
const curTime=$('curTime'),totTime=$('totTime');
const seekBar=$('seekBar'),seekFill=$('seekFill');
const iPlay=$('iPlay'),iPause=$('iPause'),btnPlay=$('btnPlay');
const btnPrev=$('btnPrev'),btnNext=$('btnNext'),btnShuffle=$('btnShuffle'),btnRepeat=$('btnRepeat');
const volBar=$('volBar'),volFill=$('volFill');
const chkAuto=$('chkAutoplay'),chkSing=$('chkSing');
const lyricsEl=$('lyricsEl'),toastEl=$('toast');
const sidebar=$('sidebar'),sbMask=$('sbMask'),btnMenu=$('btnMenu'),sbX=$('sbX');
const btnFav=$('btnFav'),btnFav2=$('btnFav2'),favSvg=$('favSvg'),favSvg2=$('favSvg2');

// ── Build queue ──
function buildQ(){
  qEl.innerHTML='';
  S.forEach((s,i)=>{
    const li=document.createElement('li');li.className='q-item'+(i===idx?' active':'');li.dataset.i=i;
    li.innerHTML=`<img class="q-img" src="${s.c}" alt=""/><div class="q-meta"><div class="q-name">${s.t}</div><div class="q-artist">${s.a}</div></div>`+
      `<div class="q-bars"><span></span><span></span><span></span></div><span class="q-dur">${fmt(s.d)}</span>`;
    li.addEventListener('click',()=>playAt(i));
    qEl.appendChild(li);
  });
}

// ── Build lyrics ──
function buildLyrics(lines){
  lyricsEl.innerHTML='';
  lines.forEach(ln=>{
    const d=document.createElement('span');
    if(!ln){d.className='ly-line blank';d.innerHTML='&nbsp;';}
    else{d.className='ly-line';d.textContent=ln;}
    lyricsEl.appendChild(d);
  });
}

// ── Load song ──
function load(i){
  const s=S[i];
  pArt.style.opacity='0';
  setTimeout(()=>{pArt.src=s.c;pArt.style.opacity='1';},180);
  pTitle.textContent=s.t;pArtist.textContent=s.a;
  totTime.textContent=fmt(s.d);elapsed=0;curTime.textContent='0:00';
  seekFill.style.width='0%';lyIdx=-1;
  document.querySelectorAll('.q-item').forEach((el,j)=>{el.classList.toggle('active',j===i);el.classList.remove('playing');});
  qEl.querySelector('.q-item.active')?.scrollIntoView({block:'nearest',behavior:'smooth'});
  buildLyrics(s.ly);
  stopSpeak();
}

// ── Play / Pause ──
function play(){
  playing=true;iPlay.classList.add('hidden');iPause.classList.remove('hidden');
  artWrap.classList.add('playing');
  qEl.querySelector('.q-item.active')?.classList.add('playing');
  startTimer();startAudio();toast_(`▶ ${S[idx].t}`);
}
function pause(){
  playing=false;iPlay.classList.remove('hidden');iPause.classList.add('hidden');
  artWrap.classList.remove('playing');
  qEl.querySelector('.q-item.active')?.classList.remove('playing');
  stopTimer();stopAudio();stopSpeak();
}
function togglePlay(){playing?pause():play();}
function playAt(i){if(i<0||i>=S.length)return;pause();hist.push(idx);idx=i;load(idx);play();}

// ── Timer ──
function startTimer(){
  stopTimer();
  timer=setInterval(()=>{
    const d=S[idx].d;elapsed+=.25;
    if(elapsed>=d){elapsed=d;updateSeek();onEnd();return;}
    updateSeek();syncLy();
  },250);
}
function stopTimer(){if(timer){clearInterval(timer);timer=null;}}
function updateSeek(){
  const p=(elapsed/S[idx].d)*100;
  seekFill.style.width=p+'%';curTime.textContent=fmt(elapsed);
}
function onEnd(){stopAudio();stopSpeak();if(repeat===2){elapsed=0;play();return;}if(autoplay||repeat===1)next();}

// ── Lyric sync ──
function syncLy(){
  const lines=S[idx].ly,p=elapsed/S[idx].d;
  const li=Math.min(Math.floor(p*lines.length),lines.length-1);
  if(li===lyIdx)return;lyIdx=li;
  const els=lyricsEl.querySelectorAll('.ly-line');
  els.forEach((el,j)=>{el.classList.remove('active','past');if(j<li)el.classList.add('past');else if(j===li)el.classList.add('active');});
  lyricsEl.querySelector('.ly-line.active')?.scrollIntoView({block:'center',behavior:'smooth'});
  speak(lines[li]||'');
}

// ── Nav ──
function next(){if(shuffle){let n;do{n=Math.floor(Math.random()*S.length);}while(n===idx&&S.length>1);playAt(n);}else playAt((idx+1)%S.length);}
function prev(){if(elapsed>3){elapsed=0;updateSeek();if(playing){stopAudio();startAudio();}return;}if(shuffle&&hist.length>0)playAt(hist.pop());else playAt((idx-1+S.length)%S.length);}

// ── Shuffle / Repeat ──
function toggleShuffle(){shuffle=!shuffle;btnShuffle.classList.toggle('on',shuffle);toast_(shuffle?'🔀 Shuffle On':'Shuffle Off');}
function toggleRepeat(){repeat=(repeat+1)%3;btnRepeat.classList.toggle('on',repeat>0);toast_(['Repeat Off','🔁 Repeat All','🔂 Repeat One'][repeat]);}

// ── Volume ──
function setVol(v){vol=Math.max(0,Math.min(1,v));muted=vol===0;if(mg)mg.gain.value=vol;volFill.style.width=(vol*100)+'%';}
function toggleMute(){if(muted){setVol(prevVol||.7);}else{prevVol=vol;if(mg)mg.gain.value=0;muted=true;volFill.style.width='0%';}}

// ── Drag ──
function seekAt(e){const r=seekBar.getBoundingClientRect(),cx=e.touches?e.touches[0].clientX:e.clientX;elapsed=Math.max(0,Math.min(1,(cx-r.left)/r.width))*S[idx].d;updateSeek();syncLy();if(playing){stopAudio();startAudio();}}
function volAt(e){const r=volBar.getBoundingClientRect(),cx=e.touches?e.touches[0].clientX:e.clientX;setVol(Math.max(0,Math.min(1,(cx-r.left)/r.width)));}

// ── Toast ──
let tt;function toast_(m){toastEl.textContent=m;toastEl.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>toastEl.classList.remove('show'),2e3);}
function fmt(s){const t=Math.floor(s);return`${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`;}

// ── Sidebar ──
function openSb(){sidebar.classList.add('open');sbMask.classList.add('show');}
function closeSb(){sidebar.classList.remove('open');sbMask.classList.remove('show');}

// ── Fav ──
let fav=false;
function toggleFav(){fav=!fav;[favSvg,favSvg2].forEach(s=>{s.style.fill=fav?'#fc3c44':'none';});toast_(fav?'❤️ Favourited':'Removed');}

// ── Events ──
btnPlay.addEventListener('click',togglePlay);
btnPrev.addEventListener('click',prev);
btnNext.addEventListener('click',next);
btnShuffle.addEventListener('click',toggleShuffle);
btnRepeat.addEventListener('click',toggleRepeat);
btnMenu.addEventListener('click',openSb);
sbX.addEventListener('click',closeSb);
sbMask.addEventListener('click',closeSb);
btnFav.addEventListener('click',toggleFav);
btnFav2.addEventListener('click',toggleFav);
chkAuto.addEventListener('change',()=>{autoplay=chkAuto.checked;toast_(autoplay?'▶️ Autoplay On':'Autoplay Off');});
chkSing.addEventListener('change',()=>{singOn=chkSing.checked;if(!singOn)stopSpeak();toast_(singOn?'🎤 Speak Lyrics On':'Speak Lyrics Off');});

seekBar.addEventListener('mousedown',e=>{seekDrag=true;seekAt(e);});
document.addEventListener('mousemove',e=>{if(seekDrag)seekAt(e);});
document.addEventListener('mouseup',()=>{seekDrag=false;});
seekBar.addEventListener('touchstart',e=>{seekDrag=true;seekAt(e);},{passive:true});
document.addEventListener('touchmove',e=>{if(seekDrag)seekAt(e);},{passive:true});
document.addEventListener('touchend',()=>{seekDrag=false;});

volBar.addEventListener('mousedown',e=>{volDrag=true;volAt(e);});
document.addEventListener('mousemove',e=>{if(volDrag)volAt(e);});
document.addEventListener('mouseup',()=>{volDrag=false;});
volBar.addEventListener('touchstart',e=>{volDrag=true;volAt(e);},{passive:true});
document.addEventListener('touchmove',e=>{if(volDrag)volAt(e);},{passive:true});
document.addEventListener('touchend',()=>{volDrag=false;});

document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT')return;
  ({' ':()=>{e.preventDefault();togglePlay();},'ArrowRight':()=>{e.preventDefault();next();},'ArrowLeft':()=>{e.preventDefault();prev();},'ArrowUp':()=>{e.preventDefault();setVol(vol+.05);},'ArrowDown':()=>{e.preventDefault();setVol(vol-.05);},'m':toggleMute,'M':toggleMute,'s':toggleShuffle,'S':toggleShuffle,'r':toggleRepeat,'R':toggleRepeat}[e.key]||function(){})();
});

if(window.speechSynthesis){window.speechSynthesis.getVoices();window.speechSynthesis.addEventListener('voiceschanged',()=>window.speechSynthesis.getVoices());}

// ── Init ──
buildQ();load(0);setVol(.8);
