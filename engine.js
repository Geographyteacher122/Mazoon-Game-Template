/* محرك لعبة «مَزُون» التعليمية — تصميم: أ. عهود العبرية · CC BY-NC-SA 4.0 · لا تعدّل هذا الملف */
const SETTINGS=window.MAZOON_SETTINGS||{title:'اسم اللعبة',subtitle:'',course:'',questions:[]};


(()=>{
'use strict';
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mod=(a,n)=>((a%n)+n)%n;
const lerp=(a,b,t)=>a+(b-a)*t;
function hash(n){const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
if(!CanvasRenderingContext2D.prototype.roundRect){CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){let a,b,c,d;if(Array.isArray(r)){if(r.length===4)[a,b,c,d]=r;else a=b=c=d=r[0]||0}else a=b=c=d=r||0;this.moveTo(x+a,y);this.lineTo(x+w-b,y);this.quadraticCurveTo(x+w,y,x+w,y+b);this.lineTo(x+w,y+h-c);this.quadraticCurveTo(x+w,y+h,x+w-c,y+h);this.lineTo(x+d,y+h);this.quadraticCurveTo(x,y+h,x,y+h-d);this.lineTo(x,y+a);this.quadraticCurveTo(x,y,x+a,y);this.closePath()}}

/* ============ الإعدادات: عدّلها هنا ============ */
const CONFIG={
  title:SETTINGS.title,subtitle:SETTINGS.subtitle,course:SETTINGS.course,
  hearts:5,passRatio:0.6,pointsPerAnswer:50,
  stations:[{name:'الرحلة الكبرى'}],
  questions:[(SETTINGS.questions||[]).slice(0,10).map(it=>{
    const q={q:it.q,source:it.source||'',options:it.options||['صح','خطأ'],answer:it.answer||0};
    if(typeof it.tf==='boolean'){q.options=['صح','خطأ'];q.answer=it.tf?0:1}
    if(it.locate){q.locate=true;q.options=[];q.answer=0;if(it.gov){q.gov=it.gov;q.gname=it.gname}}
    if(it.img)q.img=it.img;if(it.card)q.card=it.card;
    if(it.route)q.task={text:it.route===true?'ارسم مسار طالب العلم من ميناء صحار إلى ميناء البصرة.':it.route,arrow:false};
    return q})]
};
if(CONFIG.questions[0].length<3)console.warn('أضف 3 أسئلة على الأقل');
/* تطبيق الألوان */
(function theme(){
  const C=Object.assign({main:'#ff6f61',accent:'#2c3490',card:'#fff7ee',ok:'#1fbf9a',bad:'#f0566a',hud:'#161a4a'},SETTINGS.colors||{});
  const rgb=h=>{h=String(h).replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');const n=parseInt(h,16);return isNaN(n)?[0,0,0]:[n>>16&255,n>>8&255,n&255]};
  const mix=(a,b,t)=>{const x=rgb(a),y=rgb(b);return'rgb('+x.map((v,i)=>Math.round(v+(y[i]-v)*t)).join(',')+')'};
  const st=document.documentElement.style;
  st.setProperty('--coral',C.main);st.setProperty('--btn1',mix(C.main,'#fff',.2));st.setProperty('--btnS',mix(C.main,'#000',.3));
  st.setProperty('--ink2',C.accent);st.setProperty('--soft1',mix(C.accent,'#fff',.25));st.setProperty('--softS',mix(C.accent,'#000',.3));
  st.setProperty('--chipbg',mix(C.accent,'#fff',.88));st.setProperty('--optb',mix(C.accent,'#fff',.8));
  st.setProperty('--cream',C.card);st.setProperty('--ok',C.ok);st.setProperty('--bad',C.bad);st.setProperty('--hudrgb',rgb(C.hud).join(','));
})();
const N=CONFIG.stations.length;

/* ============ الصور ============ */
const IM={};let assetsReady=false;
function prepMid(){const im=IM.mid,h=44,cn=document.createElement('canvas');cn.width=im.width;cn.height=h;const x=cn.getContext('2d');x.drawImage(im,0,0,im.width,h,0,0,im.width,h);x.globalCompositeOperation='destination-in';const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,1)');x.fillStyle=g;x.fillRect(0,0,im.width,h);IM.midTop=cn}
(function load(){
  const keys=Object.keys(ASSETS);let n=0;
  keys.forEach(k=>{const i=new Image();i.onload=i.onerror=()=>{if(++n===keys.length){prepMid();assetsReady=true;$('#loading').classList.add('hide')}};i.src='data:image/webp;base64,'+ASSETS[k];IM[k]=i});
})();

/* ============ أجواء المحطات (ألوان الضوء فوق المشهد) ============ */
const MOODS=[
 {},
 {mul:['#fff3e0','#fffaf2']},
 {mul:['#ff9d8c','#ffd9aa'],glow:{x:.28,y:.64,r:560,c:'255,170,100',a:.55}},
 {mul:['#a68bd6','#ffb7c4'],glow:{x:.72,y:.62,r:520,c:'255,150,170',a:.45}},
 {mul:['#33428f','#5568b4'],night:true},
 {mul:['#c4ecf2','#ffe8d4'],glow:{x:.55,y:.6,r:580,c:'255,222,170',a:.5}}
];

/* ============ العناصر ============ */
const stage=$('#stage'),cv=$('#cv'),ctx=cv.getContext('2d');
const GY=560,SPEED=300,PH=150;let LW=1280;
let U=1,rotNeeded=false,coinTarget={x:200,y:30};
function calcTarget(){const el=$('#coinStat svg'),sr=stage.getBoundingClientRect(),r=el.getBoundingClientRect();if(r.width)coinTarget={x:(r.left+r.width/2-sr.left)/U,y:(r.top+r.height/2-sr.top)/U}}
function fit(){
  const W=innerWidth,H=innerHeight-36;
  const s=Math.min(W/1280,H/720);U=s;LW=Math.min(3200,Math.max(1280,W/s));
  stage.style.width=LW*s+'px';stage.style.height=720*s+'px';stage.style.fontSize=16*s+'px';
  const dpr=Math.min(window.devicePixelRatio||1,2);
  cv.width=Math.round(LW*s*dpr);cv.height=Math.round(720*s*dpr);
  rotNeeded=innerHeight>innerWidth&&innerWidth<820;
  $('#rotate').style.display=rotNeeded?'flex':'none';
  calcTarget();
}
addEventListener('resize',fit);addEventListener('orientationchange',()=>setTimeout(fit,200));fit();
if('ontouchstart' in window||matchMedia('(pointer:coarse)').matches)document.body.classList.add('touch');

/* ============ الصوت ============ */
let AC=null,soundOn=true;
function initAudio(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume()}
function tone(f,d,type,v,delay,slide){if(!AC||!soundOn)return;const t=AC.currentTime+(delay||0);const o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);g.gain.setValueAtTime(v||.1,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d+.03)}
const SFX={
  jump:()=>tone(380,.16,'sine',.09,0,300),
  land:()=>tone(120,.1,'sine',.1,0,-50),
  coin:()=>{tone(988,.08,'square',.05);tone(1319,.2,'square',.05,.07)},
  block:()=>{tone(180,.12,'square',.08,0,120);tone(540,.14,'triangle',.08,.08)},
  hurt:()=>tone(240,.32,'sawtooth',.1,0,-150),
  ok:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.18,'triangle',.1,i*.08)),
  bad:()=>tone(260,.28,'square',.07,0,-120),
  cp:()=>{tone(660,.15,'sine',.1);tone(990,.25,'sine',.1,.1)},
  gate:()=>[392,523,659,784,1047].forEach((f,i)=>tone(f,.26,'triangle',.1,i*.1)),
  stomp:()=>{tone(300,.12,'square',.08,0,200);tone(150,.1,'sine',.1,.05)},
  whoosh:()=>tone(300,.4,'sine',.06,0,500)
};
const sfx=n=>{try{SFX[n]()}catch(e){}};

/* ============ الإدخال ============ */
const keys={l:0,r:0,j:0};
let P={},S={mode:'home'},lv=null,mood=MOODS[0],cam={x:0},T=0,shake=0;
function pressJump(){keys.j=1;P.buf=.13}
addEventListener('keydown',e=>{
  if(e.repeat)return;const k=e.key;
  if(k==='ArrowLeft'||k==='a'||k==='A')keys.l=1;
  else if(k==='ArrowRight'||k==='d'||k==='D')keys.r=1;
  else if(k===' '||k==='ArrowUp'||k==='w'||k==='W'){pressJump();e.preventDefault()}
  else if(k==='Escape'||k==='p'||k==='P')togglePause();
});
addEventListener('keyup',e=>{
  const k=e.key;
  if(k==='ArrowLeft'||k==='a'||k==='A')keys.l=0;
  else if(k==='ArrowRight'||k==='d'||k==='D')keys.r=0;
  else if(k===' '||k==='ArrowUp'||k==='w'||k==='W')keys.j=0;
});
addEventListener('blur',()=>{keys.l=keys.r=keys.j=0});
function bindBtn(id,on,off){const el=$(id);
  el.addEventListener('pointerdown',e=>{e.preventDefault();try{el.setPointerCapture(e.pointerId)}catch(_){}el.classList.add('down');initAudio();on()});
  const up=()=>{el.classList.remove('down');off()};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up);
}
bindBtn('#bl',()=>keys.l=1,()=>keys.l=0);
bindBtn('#br',()=>keys.r=1,()=>keys.r=0);
bindBtn('#bj',pressJump,()=>keys.j=0);
/* التحكم باللمس المباشر: اضغط مطولًا نحو الجهة المطلوبة، ولمسة أعلى الشخصية للقفز */
const tp={on:0,x:0,y:0,id:null,jl:0};
function tpApply(){
  if(!tp.on||S.mode!=='play'){return}
  const r=cv.getBoundingClientRect(),k=r.width/LW;
  const lx=(tp.x-r.left)/k,ly=(tp.y-r.top)/k,px=P.x-cam.x+(P.w||40)/2,dx=lx-px;
  keys.l=dx<-28?1:0;keys.r=dx>28?1:0;
  if(ly<P.y-60){if(!tp.jl){tp.jl=1;pressJump()}}else{tp.jl=0;if(!tp.jb)keys.j=0}
}
cv.addEventListener('pointerdown',e=>{if(S.mode!=='play')return;e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(_){}initAudio();tp.on=1;tp.id=e.pointerId;tp.x=e.clientX;tp.y=e.clientY;tp.jl=0;tpApply()});
cv.addEventListener('pointermove',e=>{if(tp.on&&e.pointerId===tp.id){tp.x=e.clientX;tp.y=e.clientY}});
const tpEnd=e=>{if(e.pointerId===tp.id&&tp.on){tp.on=0;tp.jl=0;keys.l=keys.r=0;keys.j=0}};
cv.addEventListener('pointerup',tpEnd);cv.addEventListener('pointercancel',tpEnd);


/* ============ بناء المستوى ============ */
const POOLS=[['flat','bush','high','pit','bush','steps','pit'],['bush','high','crab','pit','pit2','steps','stones','crab'],['bush','crab','pit','pit2','steps','stones','bird','moving','pit2','crab']];
const DECOR=['plantA','plantB','plantC','plantA','plantB','plantC'];const BLOOM=['flowerA','flowerB','flowerC'];
function buildLevel(si){
  const r=mulberry32(900+si*131),NQ=Math.min(Math.max(0,(CONFIG.questions[si]||[]).length-1),9),L=1700+(NQ+1)*1300;
  const lv={L,segs:[],plats:[],blocks:[],bushes:[],crabs:[],birds:[],coins:[],hearts:[],decor:[],cps:[],gate:{x:L,open:0}};
  let x=560,gs=-400,needCp=false,d=0;
  const coin=(cx,cy)=>lv.coins.push({x:cx,y:cy,got:false,ph:r()*6});
  for(let i=0;i<5;i++)coin(300+i*55,GY-60);
  const list=CONFIG.questions[si]||[],nb=Math.min(Math.max(0,list.length-1),9);let qn=0;
  const qth=[];for(let j=0;j<nb;j++)qth.push(600+(L-1100-600)*(j+1)/(nb+1));
  lv.nq=nb;let hardLeft=2;const HARD=[['pit','steps','pit'],['pit','pit2','steps','stones','crab'],['pit2','stones','moving','pit','crab','bird'],['pit2','stones','moving','pit2','stones','bird','crab']];
  while(x<L-780){
    const pool=POOLS[Math.min(d,2)];let k=needCp?'cp':pool[Math.floor(r()*pool.length)];
    if(k!=='cp'&&hardLeft>0&&!(qn<nb&&x>=qth[qn])){k=HARD[Math.min(d,3)][Math.floor(r()*HARD[Math.min(d,3)].length)];hardLeft--}
    if(qn<nb&&x>=qth[qn]){k='qb';hardLeft=2}
    if(k==='flat'){for(let j=0;j<4;j++)coin(x+70+j*60,GY-60);x+=300}
    else if(k==='bush'){lv.bushes.push({x:x+190});for(let j=0;j<5;j++)coin(x+110+j*40,GY-60-Math.sin(j/4*Math.PI)*95);x+=380}
    else if(k==='crab'){lv.crabs.push({x:x+210,min:x+70,max:x+350,dir:r()<.5?-1:1,alive:true,ph:r()*6});for(let j=0;j<3;j++)coin(x+170+j*40,GY-150);x+=420}
    else if(k==='bird'){lv.birds.push({x:x+210,min:x+60,max:x+360,dir:1,alive:true,ph:r()*6,y0:GY-105,y:GY-105});for(let j=0;j<3;j++)coin(x+170+j*40,GY-60);x+=420}
    else if(k==='high'){lv.plats.push({x:x+90,bx:x+90,y:GY-120,w:240,dx:0});for(let j=0;j<4;j++)coin(x+125+j*55,GY-175);x+=420}
    else if(k==='qb'){
      if(qn%2===1){
        const a0=x+110,pw=420,p2={x:a0+170,bx:a0+170,y:GY-105,w:110,dx:0};
        lv.segs.push([gs,a0]);gs=a0+pw;
        lv.plats.push({x:a0+50,bx:a0+50,y:GY-70,w:92,dx:0},p2,{x:a0+310,bx:a0+310,y:GY-70,w:92,dx:0});
        lv.blocks.push({x:p2.x+31,y:p2.y-232,t:'q',qi:qn,used:false,shown:true,bump:0});
        coin(a0+96,GY-125);coin(a0+356,GY-125);x=gs+130;
      }else{
        lv.blocks.push({x:x+170,y:GY-232,t:'q',qi:qn,used:false,shown:true,bump:0});
        for(let j=0;j<3;j++)coin(x+90+j*50,GY-60);for(let j=0;j<3;j++)coin(x+230+j*50,GY-60);x+=440;
      }
      qn++;d=Math.floor(qn/2);if(qn%2===0)needCp=true}
    else if(k==='pit2'){const pw=120+d*6,a=x+130;lv.segs.push([gs,a]);lv.segs.push([a+pw,a+pw+110]);gs=a+pw+110+pw;for(const o of[a,a+pw+110])for(let j=0;j<4;j++){const t=j/3;coin(o-10+(pw+20)*t,GY-70-Math.sin(t*Math.PI)*90)}x=gs+130}
    else if(k==='stones'){const pw=330+d*8,a=x+110;lv.segs.push([gs,a]);gs=a+pw;lv.plats.push({x:a+55,bx:a+55,y:GY-70,w:92,dx:0},{x:a+185,bx:a+185,y:GY-105,w:92,dx:0});coin(a+100,GY-125);coin(a+230,GY-160);x=gs+130}
    else if(k==='pit'){const pw=150+Math.floor(r()*(20+d*8)),a=x+130;lv.segs.push([gs,a]);gs=a+pw;for(let j=0;j<5;j++){const t=j/4;coin(a-10+(pw+20)*t,GY-70-Math.sin(t*Math.PI)*95)}x=gs+130}
    else if(k==='steps'){const a=x+60;lv.segs.push([gs,a]);gs=x+440;lv.plats.push({x:x+90,bx:x+90,y:GY-95,w:110,dx:0},{x:x+250,bx:x+250,y:GY-125,w:110,dx:0});coin(x+145,GY-150);coin(x+305,GY-180);x+=500}
    else if(k==='moving'){const a=x+60;lv.segs.push([gs,a]);gs=x+460;lv.plats.push({x:x+190,bx:x+200,y:GY-90,w:120,amp:95,sp:1.3,ph:r()*6,dx:0});coin(x+150,GY-170);coin(x+230,GY-190);coin(x+310,GY-170);x+=520}
    else if(k==='cp'){lv.cps.push({x:x+120,on:false,rise:0});if(d>=1)lv.hearts.push({x:x+240,y:GY-70,got:false});for(let j=0;j<3;j++)coin(x+170+j*55,GY-60);needCp=false;x+=340}
  }
  lv.segs.push([gs,L+520]);
  // زينة
  const sup=cx=>lv.segs.some(s=>cx>s[0]+40&&cx<s[1]-40);
  for(let dx=180;dx<L+480;dx+=120+r()*190){
    if(Math.abs(dx-L)<150||!sup(dx))continue;
    lv.decor.push({k:DECOR[Math.floor(r()*DECOR.length)],x:dx,s:.7+r()*.5,flip:r()<.5,bl:r()<.5?BLOOM[Math.floor(r()*3)]:null,bx:r()});
  }
  return lv;
}
const HOME_LV={L:1e7,segs:[[-1e5,1e7]],plats:[],blocks:[],bushes:[],crabs:[],birds:[],coins:[],hearts:[],decor:[],cps:[],gate:null};
(function(){const r=mulberry32(5);for(let dx=200;dx<14000;dx+=140+r()*200)HOME_LV.decor.push({k:DECOR[Math.floor(r()*DECOR.length)],x:dx,s:.7+r()*.5,flip:r()<.5,bl:r()<.5?BLOOM[Math.floor(r()*3)]:null,bx:r()})})();

/* ============ اللاعب والفيزياء ============ */
function newPlayer(){return{x:120,y:GY,vx:0,vy:0,face:1,onGround:true,on:null,coyote:0,buf:0,inv:0,anim:0,alpha:1,lastSafe:120,splashed:false,squash:0,dust:0}}
function support(cx){for(const s of lv.segs)if(cx>=s[0]-6&&cx<=s[1]+6)return true;return false}
function edgeDist(cx){let m=1e9;for(const s of lv.segs)if(cx>=s[0]&&cx<=s[1])m=Math.min(m,cx-s[0],s[1]-cx);return m}
function phys(dt,dir,jumpOn,speed){
  const prevY=P.y;
  const tv=dir*(speed||SPEED);
  P.vx+=(tv-P.vx)*Math.min(1,dt*(P.onGround?14:6));
  if(dir)P.face=dir>0?1:-1;
  P.coyote=P.onGround?.1:Math.max(0,P.coyote-dt);
  P.buf=Math.max(0,P.buf-dt);
  if(jumpOn&&P.buf>0&&P.coyote>0){P.vy=-790;P.onGround=false;P.on=null;P.coyote=0;P.buf=0;P.squash=-1;sfx('jump');puff(P.x,P.y,5)}
  P.x=clamp(P.x+P.vx*dt,40,lv.L+440);
  const g=(P.vy<0&&!keys.j)?4200:1950;
  P.vy=Math.min(P.vy+g*dt,1200);P.y+=P.vy*dt;
  // ارتطام الرأس بالكتل من الأسفل
  if(P.vy<0)for(const b of lv.blocks){
    if(P.x>b.x-14&&P.x<b.x+62){const hp=prevY-PH,h=P.y-PH;if(hp>=b.y+46&&h<=b.y+48){P.y=b.y+48+PH;P.vy=90;hitBlock(b)}}
  }
  let landed=false,onP=null;
  if(P.vy>=0){
    if(prevY<=GY+6&&P.y>=GY&&support(P.x)){P.y=GY;landed=true}
    if(!landed)for(const pl of lv.plats){if(prevY<=pl.y+6&&P.y>=pl.y&&P.x>=pl.x-12&&P.x<=pl.x+pl.w+12){P.y=pl.y;landed=true;onP=pl;break}}
    if(!landed)for(const b of lv.blocks){if(!b.shown)continue;if(prevY<=b.y+6&&P.y>=b.y&&P.x>=b.x-12&&P.x<=b.x+60){P.y=b.y;landed=true;break}}
  }
  if(landed){if(!P.onGround&&P.vy>380){puff(P.x,P.y,8);P.squash=1;sfx('land')}P.vy=0;P.onGround=true;P.on=onP;P.splashed=false}else{P.onGround=false;P.on=null}
  P.anim+=dt*(Math.abs(P.vx)/36);
  if(P.onGround&&Math.abs(P.vx)>140){P.dust-=dt;if(P.dust<=0){P.dust=.17;puff(P.x-P.face*14,P.y,2)}}
  P.squash*=Math.pow(.0009,dt);if(Math.abs(P.squash)<.01)P.squash=0;
}

/* ============ الجسيمات والتأثيرات ============ */
const parts=[],flies=[];
function spark(x,y,col,n,g){for(let i=0;i<n;i++){const a=Math.random()*6.28,s=60+Math.random()*180;parts.push({k:'s',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-60,life:.65,max:.65,c:col,r:2+Math.random()*3,g:g})}}
function puff(x,y,n){for(let i=0;i<n;i++)parts.push({k:'s',x:x+(Math.random()-.5)*30,y:y-4,vx:(Math.random()-.5)*110,vy:-20-Math.random()*40,life:.45,max:.45,c:'rgba(255,248,230,.75)',r:3+Math.random()*3,g:60})}
function splash(x,y){for(let i=0;i<16;i++)parts.push({k:'s',x,y,vx:(Math.random()-.5)*240,vy:-130-Math.random()*240,life:.85,max:.85,c:'#cdf3ff',r:2+Math.random()*3.4,g:900})}
function floatText(x,y,t,c){parts.push({k:'t',x,y,vx:0,vy:-60,life:1.1,max:1.1,c,t})}
function updParts(dt){for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.life-=dt;if(p.life<=0){parts.splice(i,1);continue}p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.k==='s')p.vy+=(p.g===undefined?300:p.g)*dt}
  for(let i=flies.length-1;i>=0;i--){const f=flies[i];f.t+=dt;if(f.t>=f.dur){flies.splice(i,1);const el=$('#coinStat');el.classList.add('pop');setTimeout(()=>el.classList.remove('pop'),160);continue}}}
function flyCoin(wx,wy,delay){flies.push({sx:wx-cam.x,sy:wy,t:-(delay||0),dur:.75})}
function addCoins(n,wx,wy){P.col=.45;for(let i=0;i<n;i++){S.coins++;S.points+=10;flyCoin(wx,wy-i*6,i*.09)}sfx('coin');setHUD()}

/* ============ الكتل ============ */
function hitBlock(b){
  b.bump=1;
  if(b.qi!==undefined){if(b.used){sfx('land');return}sfx('block');spark(b.x+24,b.y+24,'#ffe08a',14,200);openBlockQ(b);return}
  if(b.used){sfx('land');return}
  b.used=true;b.shown=true;sfx('block');spark(b.x+24,b.y+24,'#ffe08a',14,200);
  const cx=b.x+24,cy=b.y-10;
  if(b.r==='coins'){addCoins(4,cx,cy)}
  else if(b.r==='star'){S.points+=100;floatText(cx,cy-20,'+100','#fff3b0');spark(cx,cy,'#fff3b0',24,100);sfx('ok');setHUD()}
  else if(b.r==='heart'){if(S.hearts<CONFIG.hearts)S.hearts++;else{S.points+=50;floatText(cx,cy-20,'+50','#ffd0da')}spark(cx,cy,'#ff8aa0',16,100);sfx('ok');setHUD()}
}

/* ============ المحطات ============ */
function startStation(si){
  S.si=si;lv=buildLevel(si);mood=MOODS[si%MOODS.length];
  P=newPlayer();cam.x=0;parts.length=0;flies.length=0;
  S.hearts=CONFIG.hearts;S.p0=S.points;S.c0=S.coins;
  S.mode='play';Q=null;S.bq=0;S.qa=0;
  $('#hud').classList.add('on');$('#touch').classList.add('on');
  setHUD();requestAnimationFrame(calcTarget);
  notify('ابدأ المغامرة','','station',2600);
  if(si===0)notify('طريقة اللعب','اجمع العملات، واقفز لتضرب كتل «؟» بالرأس فتظهر الأسئلة، وتجاوز الحفر والعقبات حتى بوابة السؤال الأخير','info',3600);
}
function newGame(){S={mode:'play',si:0,points:0,coins:0,hearts:CONFIG.hearts,gateOK:[],iris:0,irisDir:1};startStation(0)}
function respawn(){P.x=P.lastSafe;P.y=GY;P.vx=P.vy=0;P.inv=1.6;P.splashed=false;P.onGround=true}
function hurt(kb){
  if(P.inv>0||S.mode!=='play')return;
  P.hurtT=.6;S.hearts--;shake=12;sfx('hurt');setHUD();
  if(S.hearts<=0){die();return}
  P.inv=1.6;if(kb){P.vy=-430;P.vx=-P.face*280;P.onGround=false}
}
function die(){
  S.mode='dead';$('#touch').classList.remove('on');
  showCard('<div class="card res"><h2>انتهت اللعبة</h2><p>سقطت ثلاث مرات متتالية وانتهت المحاولات. جرّب من جديد وسيكون الحظ حليفك.</p><button class="btn" id="retry">العب مجدداً</button></div>');
  $('#retry').onclick=()=>{hideCard();irisTo(-1,()=>{newGame()})};
}

/* ============ التحديث ============ */
function update(dt){
  T+=dt;shake*=.9;P.col=Math.max(0,(P.col||0)-dt);P.cel=Math.max(0,(P.cel||0)-dt);P.hurtT=Math.max(0,(P.hurtT||0)-dt);
  if(S.iris!==undefined&&S.irisDir){S.iris=clamp(S.iris+S.irisDir*dt*1.5,0,1);if(S.iris>=1&&S.irisDir>0)S.irisDir=0;if(S.iris<=0&&S.irisDir<0){S.irisDir=0;const cb=S.irisCb;S.irisCb=null;cb&&cb()}}
  if(S.mode==='home'){cam.x+=45*dt;P.anim+=dt*2.2;P.vx=45;P.face=1;updParts(dt);return}
  if(S.mode==='paused'||S.mode==='quiz'||S.mode==='dead'||S.mode==='end'||S.mode==='trans'){updParts(dt);return}
  if(P.inv>0)P.inv-=dt;
  const dirIn=(keys.r?1:0)-(keys.l?1:0);
  for(const pl of lv.plats){if(pl.amp){const nx=pl.bx+Math.sin(T*pl.sp+pl.ph)*pl.amp;pl.dx=nx-pl.x;pl.x=nx}}
  if(P.onGround&&P.on&&P.on.dx)P.x+=P.on.dx;
  for(const b of lv.blocks)b.bump=Math.max(0,b.bump-dt*6);
  if(S.mode==='play'){
    phys(dt,dirIn,true);
    if(P.onGround&&Math.abs(P.y-GY)<1&&edgeDist(P.x)>80&&!lv.bushes.some(b=>Math.abs(b.x-P.x)<110)&&!lv.crabs.some(c=>c.alive&&Math.abs(c.x-P.x)<140)&&!lv.birds.some(c=>c.alive&&Math.abs(c.x-P.x)<140))P.lastSafe=P.x;
    if(P.y>GY+34&&!P.splashed&&!support(P.x)){P.splashed=true;splash(P.x,GY+34);sfx('stomp')}
    if(P.y>830){S.hearts--;sfx('hurt');setHUD();if(S.hearts<=0)die();else respawn()}
    for(const c of lv.crabs){if(!c.alive)continue;c.x+=c.dir*58*dt;if(c.x<c.min||c.x>c.max)c.dir*=-1;c.ph+=dt*8}
    for(const b of lv.birds){if(!b.alive)continue;b.x+=b.dir*75*dt;if(b.x<b.min||b.x>b.max)b.dir*=-1;b.ph+=dt*7;b.y=b.y0+Math.sin(b.ph*.45)*24}
    const bx0=P.x-18,bx1=P.x+18,by0=P.y-PH,by1=P.y;
    for(const b of lv.bushes)if(bx1>b.x-26&&bx0<b.x+26&&by1>GY-44&&by0<GY)hurt(true);
    for(const c of lv.crabs){if(!c.alive)continue;
      if(bx1>c.x-30&&bx0<c.x+30&&by1>GY-38&&by0<GY){
        if(P.vy>150&&P.y<GY-14){c.alive=false;P.vy=-540;P.onGround=false;sfx('stomp');spark(c.x,GY-20,'#ff8a6e',16);S.points+=20;floatText(c.x,GY-70,'+20','#fff');setHUD()}
        else hurt(true)}}
    for(const b of lv.birds){if(!b.alive)continue;
      if(bx1>b.x-26&&bx0<b.x+26&&by1>b.y-16&&by0<b.y+16){
        if(P.vy>150&&P.y<b.y+2){b.alive=false;P.vy=-540;P.onGround=false;sfx('stomp');spark(b.x,b.y,'#ffffff',16);S.points+=30;floatText(b.x,b.y-30,'+30','#fff');setHUD()}
        else hurt(true)}}
    for(const d of lv.coins){if(d.got)continue;if(Math.abs(d.x-P.x)<38&&Math.abs(d.y-(P.y-64))<62){d.got=true;P.col=.45;S.coins++;S.points+=10;sfx('coin');spark(d.x,d.y,'#ffe27a',8,120);flyCoin(d.x,d.y,0);setHUD()}}
    for(const h of lv.hearts){if(h.got)continue;if(Math.abs(h.x-P.x)<40&&Math.abs(h.y-(P.y-64))<64){h.got=true;if(S.hearts<CONFIG.hearts)S.hearts++;else S.points+=25;sfx('ok');spark(h.x,h.y,'#ff8aa0',12);setHUD()}}
    for(const cp of lv.cps){if(!cp.on&&P.x>cp.x){cp.on=true;P.lastSafe=cp.x;sfx('cp');spark(cp.x,GY-130,'#ffffff',22);notify('نقطة حفظ جديدة','','info',1600)}if(cp.on)cp.rise=Math.min(1,cp.rise+dt*1.6)}
    if(P.x>=lv.gate.x-120)S.mode='gatewalk';
  }else if(S.mode==='gatewalk'){
    phys(dt,P.x<lv.gate.x-70?1:0,false,230);
    if(P.x>=lv.gate.x-72&&Math.abs(P.vx)<30){S.mode='gate';P.vx=0;P.face=1;openGate()}
  }else if(S.mode==='finale'){
    S.fT+=dt;P.cel=1;P.vx=0;P.y=GY;P.onGround=true;
    const k=clamp((S.fT-.5)/1.5,0,1);
    P.alpha=clamp((S.fT-.3)/.5,0,1);P.x=lv.gate.x-8-k*130;P.face=k<1?-1:1;
    S.fW-=dt;if(S.fW<=0){S.fW=.3;sfx(Math.random()<.5?'ok':'coin');const cols=['#ffd95e','#ff7aa2','#7ee0ff','#9dff9a','#ffffff','#ffb35c'];const col=cols[Math.floor(Math.random()*cols.length)];spark(lv.gate.x-260+Math.random()*420,GY-300-Math.random()*220,col,34,180);}
    for(let i=0;i<3;i++){const cols=['#ffd95e','#ff7aa2','#7ee0ff','#9dff9a','#ffffff','#ffb35c'];parts.push({k:'s',x:cam.x+Math.random()*LW,y:-20,vx:(Math.random()-.5)*60,vy:90+Math.random()*140,life:5,max:5,c:cols[Math.floor(Math.random()*cols.length)],r:3+Math.random()*3,g:30})}
    if(S.fT>5.5){S.mode='trans';advance()}
  }else if(S.mode==='exit'){
    S.gateT+=dt;lv.gate.open=Math.min(1,S.gateT/.9);
    if(lv.gate.open>=1){phys(dt,1,false,170);if(P.x>lv.gate.x-6)P.alpha=clamp(1-(P.x-(lv.gate.x-6))/50,0,1);if(P.alpha<=0){if(S.si>=N-1){S.mode='finale';S.fT=0;S.fW=0;P.vx=0;P.x=lv.gate.x-8;P.face=-1;P.onGround=true;P.on=null;$('#touch').classList.remove('on')}else{S.mode='trans';advance()}}}
    else phys(dt,0,false)
  }
  const tgt=clamp(P.x-LW*.367,0,Math.max(0,lv.L+520-LW));
  cam.x+=(tgt-cam.x)*Math.min(1,dt*6);
  updParts(dt);
  const ratio=clamp(P.x/lv.gate.x,0,1);
  $('#progFill').style.width=ratio*100+'%';$('#progMark').style.left=ratio*100+'%';
}
function irisTo(dir,cb){S.irisDir=dir;S.irisCb=cb||null}
function advance(){
  sfx('whoosh');
  irisTo(-1,()=>{
    if(S.si>=N-1){showEnd();irisTo(1)}
    else{startStation(S.si+1);irisTo(1)}
  });
}

/* ============ الواجهة ============ */
const heartSVG='<svg viewBox="0 0 24 24"><path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z" fill="#ff6f81"/><path d="M7 8.5a2.2 2.2 0 0 1 2.4-1.6" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/></svg>';
function setHUD(){
  $('#vPts').textContent=S.points;$('#vCoins').textContent=S.coins;
  let html='';for(let i=0;i<CONFIG.hearts;i++)html+=heartSVG.replace('<svg','<svg class="'+(i<S.hearts?'':'off')+'"');
  $('#hearts').innerHTML=html;
  const tq=CONFIG.questions[S.si].length,qa=S.qa||0;$('#stNum').textContent=Math.floor(qa/2)+1;$('#stTopic').textContent='الأسئلة '+Math.min(qa,tq)+'/'+tq;
}
const nq=[];let nbusy=false;
function notify(title,sub,kind,ms){nq.push({title,sub,kind:kind||'info',ms:ms||2300});if(!nbusy)nextNote()}
function nextNote(){
  const n=nq.shift();const el=$('#notice');
  if(!n){nbusy=false;return}
  nbusy=true;el.className='notice '+n.kind;
  el.innerHTML='<b>'+n.title+'</b>'+(n.sub?'<span>'+n.sub+'</span>':'');
  void el.offsetWidth;el.classList.add('show');
  setTimeout(()=>{el.classList.remove('show');setTimeout(nextNote,380)},n.ms);
}
function showCard(html){const m=$('#modal');m.innerHTML=html;m.classList.add('on')}
function hideCard(){const m=$('#modal');m.classList.remove('on');m.innerHTML=''}
$('#gTitle').textContent=CONFIG.title;$('#gSub').textContent=CONFIG.course;
$('#hTitle').textContent=CONFIG.title;$('#hSub').textContent=CONFIG.subtitle;
document.title=CONFIG.title+' | لعبة تعليمية';
$('#homeStart').addEventListener('click',()=>{if(!assetsReady)return;initAudio();$('#home').classList.remove('on');newGame()});
$('#btnSound').addEventListener('click',()=>{soundOn=!soundOn;$('#btnSound').classList.toggle('off',!soundOn);$('#sndWave').style.display=soundOn?'':'none'});
$('#btnPause').addEventListener('click',togglePause);
function togglePause(){
  if(S.mode==='paused'){hideCard();S.mode=S.prev;return}
  if(S.mode!=='play')return;
  S.prev=S.mode;S.mode='paused';keys.l=keys.r=keys.j=0;
  showCard('<div class="card res"><h2>إيقاف مؤقت</h2><p>خذ قسطاً من الراحة ثم تابع رحلتك.</p><button class="btn soft" id="rs">استئناف</button><button class="btn soft" id="rt">إعادة الرحلة</button></div>');
  $('#rs').onclick=togglePause;
  $('#rt').onclick=()=>{hideCard();S.points=S.p0;S.coins=S.c0;startStation(S.si)};
}

/* ============ بوابة الأسئلة ============ */
let Q=null;
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function openBlockQ(b){S.mode='quiz';P.vx=0;Q={list:[CONFIG.questions[S.si][b.qi]],i:0,c:0,blk:b};setTimeout(showQ,350)}
function blockDone(ok){
  const b=Q.blk,pts=Q.pts||CONFIG.pointsPerAnswer;hideCard();b.used=true;Q=null;S.mode='play';S.qa=(S.qa||0)+1;if(S.qa%2===0&&S.qa<CONFIG.questions[S.si].length-1)notify('المرحلة التالية','قفزات أصعب بانتظارك','info',2400);
  if(ok){S.bq=(S.bq||0)+1;S.points+=pts;P.col=.6;P.cel=.9;spark(b.x+24,b.y-6,'#fff3b0',26,100);floatText(b.x+24,b.y-30,'+'+pts,'#fff3b0');addCoins(5,b.x+24,b.y-10)}
  else{notify('لا بأس','تابع الطريق، فبانتظارك أسئلة أخرى','info',1800)}
  setHUD();
}
function openGate(){sfx('gate');const L0=CONFIG.questions[S.si];Q={list:lv.nq>0?[L0[L0.length-1]]:L0,i:0,c:0};
  notify('السؤال الأخير',lv.nq>0?'أجب لتنهي الرحلة':'أجب لتفتح البوابة','info',1500);
  setTimeout(showQ,900)}
/* ===== مهمة رسم المسار على الخريطة ===== */
const OMG={"W":799,"H":1057.5,"g":[{"id":"bur","d":"M413,165L407,169L400.5,169.5L396.5,175L398.5,201L395.5,203.5L397,206.5L391.5,211.5L391.5,215.5L398.5,229L398,237.5L390.5,246.5L398,250.5L410,249L411.5,251.5L411,255.5L416,264.5L406,266.5L398.5,270.5L392.5,266.5L388.5,266L364.5,277.5L365,282L368.5,288.5L368.5,298L372,303.5L371.5,313L359.5,329.5L357.5,338L368,343L381,340L386,329L392,328.5L401.5,324.5L412,326L420.5,317L423.5,310L414,302.5L414.5,284L421.5,277.5L420.5,271.5L432.5,271.5L438,275L449,276L453.5,273L453.5,271L450.5,269.5L448,257L442,252.5L443.5,246.5L442.5,239.5L447.5,235.5L448.5,232.5L442.5,227.5L437,226.5L437,221L433,215L433,208L439,207.5L434.5,201L436,194L433,190L426.5,193.5L422.5,192.5L413,178.5L414,177L419,178L421,172L419,168.5Z"},{"id":"nba","d":"M447.5,169L448.5,174L447,176.5L435,182.5L433.5,189.5L436,194L434.5,202L435,204.5L439,208L432.5,207.5L432,212L436,220.5L436,226.5L442,227.5L448,232L446.5,236L441.5,240L443,246L442,249L443.5,254.5L448,258.5L450,264.5L449.5,268.5L453.5,272L451.5,274.5L453,280.5L461.5,284L462.5,289L467,292L472,302.5L478,302.5L488.5,311.5L493,308L495,312.5L498.5,310L498.5,314L503.5,316.5L504,320.5L507.5,322.5L512.5,320L516.5,321L522,319L540.5,307.5L554,306.5L555,302.5L562,299L564.5,295.5L563.5,292L558.5,289L542,284.5L528,278.5L504,257.5L486,230.5L478,223L475.5,223L472,218.5L473,215.5L463,198.5L452,169Z"},{"id":"dha","d":"M450.5,275L437,274.5L431,270.5L420,271.5L421,277.5L414,284L414.5,295L413,302L423.5,310.5L418,319.5L415.5,321L415.5,323L412.5,325.5L402.5,324L391,328.5L386.5,328.5L384,330.5L381,339L377,341L367,342.5L354.5,337.5L345.5,355.5L337.5,367L336,375.5L337,401.5L335,409.5L379.5,485.5L357.5,552.5L359,556L471,540L472.5,525L476.5,521L474.5,513L480.5,472.5L483,462L487.5,458.5L490,453.5L491.5,445L491.5,431.5L489.5,428.5L489,423L491.5,418L501.5,409.5L511.5,407.5L512,403.5L509,400.5L506,400L502,395L502,391.5L506.5,387L505.5,382L507.5,376L504.5,373.5L508,366.5L506,363L510,359.5L520,356.5L520.5,352.5L525.5,348.5L525.5,347L520,344L521,339.5L514,331.5L515,329.5L521.5,326L520.5,324L513.5,319.5L510.5,322L507,322.5L505,321L505,317L498.5,313.5L499,310.5L497,310L494.5,312.5L492.5,308.5L488.5,311.5L478.5,302.5L472.5,302.5L468,292.5L463,289L462,284.5L458.5,281.5L453,281L453.5,277.5Z"},{"id":"sba","d":"M517.5,320.5L521.5,325.5L514.5,329.5L514,331.5L521,340L528,344.5L528.5,349L530.5,351.5L532.5,351.5L534,348L538,351.5L538.5,354L544.5,358.5L554,361L557,363.5L562.5,360.5L566,360.5L576.5,363.5L582.5,362.5L586.5,367L591,363.5L594,354.5L598,351.5L597.5,346.5L603,341L604.5,333L607.5,331.5L616,331.5L620,314.5L618.5,306L616,303L599.5,303.5L593,300.5L589,296.5L577,296.5L566.5,292.5L561.5,299L554,303L553.5,306L539,308L528.5,315.5Z"},{"id":"mct","d":"M617.5,304L619.5,317.5L617,324.5L634,330L641,338.5L640.5,342L643.5,345L644,349.5L647.5,352L648,355L650,355.5L654.5,353L655.5,355.5L659.5,358L666.5,355.5L672.5,362L676,359.5L679.5,363L688,361.5L690,371L699,376.5L701,381.5L705.5,383L709,390.5L714.5,393.5L725,395L732.5,389.5L730.5,383.5L722,378L716.5,372.5L716,369.5L711.5,366L709.5,362.5L709,356.5L703,351.5L701,344.5L690.5,336.5L688,333L687.5,327L685,324L682,324L674.5,320L670.5,316.5L669,312.5L659.5,310.5L654,314L641.5,314L626,304.5L621.5,303Z"},{"id":"dak","d":"M633.5,329.5L625,326L618,325.5L615,332L604.5,332L603.5,339.5L597.5,346L597.5,351.5L593,355L590.5,363.5L587,366.5L585,366.5L582,362L572.5,362.5L569,360.5L563,360L557.5,363L552,360L546.5,359.5L540,355L536,349L534,348L531,351.5L527.5,345L526,348L520,352.5L519.5,357L512,358.5L506,363.5L508,367L504.5,373L506.5,376L505,381.5L506,387.5L502,391.5L501.5,395.5L504.5,399L508.5,400.5L511.5,405.5L510.5,407.5L503.5,408.5L498,411.5L490.5,418.5L488.5,423L491,432L489.5,453L487,458L482.5,461.5L474,510.5L475.5,522L472,525L470,541L465.5,557.5L473.5,562L477.5,568L486,568.5L526,587L602,602L612,602L616.5,577.5L620,571L614,537.5L620,529L614,518L606.5,517L606.5,515L609,513L609,509L607,504L601,496.5L595.5,483L588,476L580.5,478.5L579,478L579,476L583.5,473.5L584.5,463L602.5,442.5L602.5,434.5L598,433.5L597.5,431.5L602.5,427L602.5,416.5L609.5,409L610.5,401.5L607.5,398.5L612,394.5L606.5,384L606.5,381L613.5,381.5L618,377.5L625.5,378L629,373.5L639.5,372.5L642.5,369L648.5,366.5L648.5,365L645,363L647,351L644.5,349.5L644,345L641.5,342.5L641.5,338.5Z"},{"id":"nsh","d":"M653.5,353L645,356.5L644.5,363L648.5,365L648.5,367L642,369L640,372L632,374L630,373L626,378L619,377L615.5,379L614,382L608,380L606,381L606,384L612,393.5L608,398.5L610,401.5L609,408.5L601.5,417L601.5,428L597,431.5L597.5,433.5L601.5,434.5L602,442.5L584,463L582.5,473.5L578.5,478L580,479L588,476L594.5,482L600.5,496.5L606.5,504L608,508.5L608,514L606,517L613,518L620,529.5L613.5,537L619,569.5L621,571L631,569L637.5,570L647,585.5L654,587L666.5,594.5L671.5,589L677.5,574L677,571.5L679,570L681.5,555.5L687,541.5L688,524.5L682.5,517.5L684.5,508L685.5,507.5L691.5,514.5L692,525.5L698,529L705,520.5L712,517.5L713,476.5L716.5,468L712.5,460.5L712.5,449L711,444L705,437L714.5,428L720.5,427.5L727,431.5L731.5,431.5L733,429L730.5,425.5L731,421L725.5,416L725,411.5L719.5,405L719,400.5L709,390.5L709.5,388.5L706.5,383L702,382.5L700.5,377.5L690.5,371L689,362L672,361.5L666.5,355.5L659,358Z"},{"id":"ssh","d":"M703,624L700.5,625L699,633L691,643L690.5,651.5L689,653L683.5,653L676,662.5L676.5,680L678,681L685.5,676L691.5,669L696,653.5L709,644L707,637.5L703.5,633L704.5,625ZM732,391L726,394.5L714,394.5L719,401.5L719,405L724.5,411L724.5,415L730.5,421L730,425.5L733,430L727,431.5L721,427L718,426.5L714,428L711.5,431.5L707.5,432.5L704.5,437L710.5,443.5L712,461L716,468L712.5,476.5L711.5,518L704,521L699.5,528L696,528L692.5,526L692,514.5L686.5,508.5L683.5,509.5L682,517.5L687.5,525L686.5,541.5L681,555L678.5,569.5L671.5,587L672,588.5L675.5,589.5L675.5,594L677,595L692,594.5L702,580L719,562L731.5,552L747,544.5L747,540.5L758,522.5L761,510L768.5,501.5L768.5,499L776.5,490L778.5,476.5L787.5,465L787.5,463L791.5,459.5L793,452.5L792,442L794,437L790.5,429L788,428L784,432L782,430.5L782,426.5L775,424L765.5,423.5L761.5,426L762,422L750.5,413.5L743.5,404.5L739,402.5Z"},{"id":"wus","d":"M692,595L677,594.5L674.5,588.5L671,589L666,594.5L651,585.5L648,586L642.5,575.5L638.5,570.5L634.5,568.5L619,571L616,577L610.5,602.5L533.5,588.5L522.5,585.5L483.5,567.5L481.5,569L478.5,568.5L475,563L465.5,557.5L470,543L468.5,540.5L356.5,556.5L311,698.5L316.5,698.5L319.5,702L316.5,707.5L394,834.5L395.5,839L389,845.5L387.5,849.5L395.5,860L404,857.5L410.5,858.5L410.5,860.5L405.5,862L405,864L412,865L444.5,917L452,913L457.5,905L467,898.5L466,893.5L472,881L472.5,871L475.5,864.5L475.5,852L493.5,831.5L514.5,821.5L535.5,816L552.5,813L581.5,813L587,810L593,809.5L597,806.5L593,797L594,789L590,786.5L587.5,779L589.5,762.5L583,749L585.5,736L581,734L581.5,727.5L587,720.5L594.5,701L596.5,688.5L595,684L595.5,678L601.5,670L610,664L607.5,660.5L608,656.5L620,649.5L620.5,641L631.5,634L638,635L640.5,637.5L640.5,640L632.5,653L632.5,655.5L640.5,659L649.5,658.5L654.5,661.5L658,661L666,653L667.5,643L674.5,627.5L684,619.5L680.5,615L693,598.5Z"},{"id":"dho","d":"M317,698.5L310,698L5.5,798.5L80,976.5L77,982.5L83.5,985L112,1051.5L150.5,1041.5L161.5,1042.5L168,1040.5L180,1029.5L201,1026.5L204.5,1023.5L206.5,1018.5L238,1014L268,1014.5L274,1016L276.5,1021L287,1024L289,1022L296.5,1021.5L299,1019.5L303.5,1019L307,1016L310.5,1016.5L316,1013L323,1004L327,1003L329.5,997.5L334.5,993L332.5,989L338,980L338.5,975L336,971L332,969L331.5,960L336,953L347,945.5L347,941L350.5,937.5L352.5,931L366,925.5L384.5,922.5L400,923.5L407.5,920L421,921L427.5,919L444,921.5L446,920.5L414.5,867L411.5,864.5L405.5,864L406,862L410.5,861L411,858.5L407,856.5L395,859.5L387.5,848L395,840L396,837L317,706.5L319.5,701Z"},{"id":"mus","d":"M464,16L460,19L452.5,17.5L450.5,19L447,26.5L446,33L444,35.5L439.5,35.5L437.5,32L436,32L433.5,35.5L432.5,41L429.5,43.5L424,53.5L430.5,54L433,57.5L433.5,62.5L431.5,65L432.5,70L429.5,77.5L431.5,86.5L431,92.5L433,100L441.5,101.5L444,89L448,86L456,69L461,65.5L458,62.5L457.5,56L462,50.5L461.5,47.5L463.5,45L462.5,39.5L464,34L460,32L459.5,29L461.5,26.5L465.5,26.5L468.5,20ZM449.5,133L442,129.5L439,131.5L439.5,135L437,139.5L439,140.5L444,140L449,137Z"}]};
const MAPG={W:856,H:960,TOL:9,LON0:46,LAT1:32,KX:57.06,KY:60,_b:null,
  pr(lo,la){return[(lo-this.LON0)*this.KX,(this.LAT1-la)*this.KY]},
  L(a){return a.map(p=>this.pr(p[0],p[1]))},
  build(){
    if(this._b)return this._b;
    const T=this;
    const oc0=[[53.1,16.65],[54.1,17.0],[54.7,16.97],[55.3,17.4],[55.7,17.9],[56.1,17.95],[56.6,18.4],[57.3,18.9],[57.8,19.0],[57.7,19.65],[57.9,20.1],[58.15,20.6],[58.4,20.9],[59.0,21.4],[59.45,21.8],[59.82,22.5],[59.5,22.6],[59.2,22.8],[58.9,23.25],[58.6,23.6],[58.2,23.75],[57.9,23.7],[57.4,23.9],[56.7,24.35],[56.47,24.75],[56.36,24.98]];
    const omanCoast=oc0.map((q,i)=>i<1?q:[q[0]+(56-q[0])*.15,q[1]+(20.5-q[1])*.15]);
    const sea=T.L([[52.0,14.8],[52.17,16.2]].concat(omanCoast,[[56.35,25.12],[56.27,25.6],[56.22,25.9],[56.25,26.25],[56.2,26.3],[56.15,26.2],[56.1,26.0],[55.95,25.8],[55.55,25.55],[55.35,25.3],[54.4,24.5],[53.0,24.25],[52.6,24.17],[51.8,24.1],[51.6,24.4],[51.4,24.65],[51.6,24.95],[51.6,25.3],[51.55,25.7],[51.25,26.15],[51.1,26.0],[50.8,25.7],[50.8,25.4],[50.8,24.7],[50.2,25.6],[50.1,26.45],[50.15,26.65],[49.65,27.0],[49.2,27.6],[48.5,28.4],[48.1,29.1],[48.0,29.4],[48.2,29.7],[48.4,29.95],[48.9,30.0],[49.15,30.35],[49.6,30.2],[50.15,30.05],[50.6,29.6],[50.83,28.95],[51.4,28.2],[52.05,27.83],[52.6,27.48],[53.5,27.0],[54.2,26.8],[54.88,26.56],[55.6,26.95],[56.0,27.1],[56.28,27.17],[56.9,27.0],[57.1,26.5],[57.77,25.65],[58.5,25.4],[60.4,25.35],[61.2,25.25],[61.2,14.8]]));
    // حدود المحافظات (من الخريطة المعتمدة) محوّلة إلى إحداثيات هذه الخريطة
    const gov=[];
    OMG.g.forEach(g=>{g.d.split('M').filter(Boolean).forEach(sub=>{
      const ring=sub.replace('Z','').split('L').map(t=>{const q=t.split(',').map(Number);
        return T.pr(52.0+(q[0]-5.5)/101.1,26.38-(q[1]-16)/106.3)});
      gov.push({id:g.id,r:ring})})});
    const isl=[[[50.4,26.3],[50.7,26.3],[50.7,25.8],[50.45,25.8]],[[55.3,26.65],[55.55,26.9],[56.0,26.97],[56.3,26.9],[56.3,26.7],[55.8,26.55]]].map(a=>T.L(a));
    const shatt=T.L([[48.5,29.98],[48.45,30.1],[48.3,30.35],[48.17,30.43],[47.95,30.5],[47.82,30.52]]);
    const path=(c,a,close)=>{c.beginPath();a.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));if(close)c.closePath()};
    const oc=document.createElement('canvas');oc.width=T.W;oc.height=T.H;const o=oc.getContext('2d');
    o.fillStyle='#000';o.fillRect(0,0,T.W,T.H);
    o.fillStyle='#fff';o.strokeStyle='#fff';o.lineJoin='round';o.lineCap='round';
    path(o,sea,true);o.fill();
    o.lineWidth=7;path(o,shatt,false);o.stroke();
    o.fillStyle='#000';isl.forEach(a=>{path(o,a,true);o.fill()});
    gov.forEach(g=>{path(o,g.r,true);o.fill()});
    const d=o.getImageData(0,0,T.W,T.H).data,n=T.W*T.H,s0=new Uint8Array(n),t1=new Uint8Array(n),m=new Uint8Array(n),R=T.TOL-1;
    for(let i=0;i<n;i++)s0[i]=d[i*4]>127?1:0;
    for(let y=0;y<T.H;y++)for(let x=0;x<T.W;x++){let v=0;for(let k=-R;k<=R;k++){const xx=x+k;if(xx>=0&&xx<T.W&&s0[y*T.W+xx]){v=1;break}}t1[y*T.W+x]=v}
    for(let y=0;y<T.H;y++)for(let x=0;x<T.W;x++){let v=0;for(let k=-R;k<=R;k++){const yy=y+k;if(yy>=0&&yy<T.H&&t1[yy*T.W+x]){v=1;break}}m[y*T.W+x]=v}
    const P=(lo,la)=>T.pr(lo,la);
    return this._b={target:T.L([[49.0,27.0],[50.4,27.0],[50.75,26.45],[50.75,25.7],[50.2,25.3],[49.3,25.3],[49.0,26.0]]),tl:P(49.85,26.25),sea,gov,isl,shatt,m,path,
      sohar:P(56.7,24.35),basra:P(47.82,30.52),hormuz:P(56.4,26.65),fao:P(48.5,29.98),
      labels:[
        ['بحر العرب',P(60.0,19.2),'s'],['خليج عُمان',P(59.5,24.1),'s'],['الخليج العربي',P(53.0,26.7),'s'],
        ['مضيق هرمز',P(57.55,26.45),'h'],['شط العرب',P(49.5,30.75),'r'],
        ['سلطنة عُمان',P(55.9,20.9),'o'],['السعودية',P(49.3,23.0),'l'],['الإمارات',P(54.5,23.6),'l'],['إيران',P(54.0,29.3),'l'],['العراق',P(46.9,31.4),'l'],['اليمن',P(48.4,17.2),'l']
      ]}
  },
  isSea(x,y){const m=this._b.m;x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=this.W||y>=this.H)return false;return m[y*this.W+x]===1}
};
function showMap(task,done){
  const G=MAPG,B=G.build(),W=G.W,H=G.H;
  showCard('<div class="card mapc"><div class="mw" id="mw"><canvas id="mcv"></canvas></div><div class="side"><span class="chip">'+(task.chip||'مهمة الخريطة')+'</span>'+
    '<h3 class="mtask">'+task.text+'</h3>'+
    '<div class="mstat" id="mst">'+(task.locate?'اضغط على الخريطة لتحديد الموقع':'ضع إصبعك على ميناء صحار ثم اسحب لرسم المسار')+'</div>'+
    '<div class="mtools"><button class="tl" id="mz1" aria-label="تكبير">+</button><button class="tl" id="mz0" aria-label="تصغير">−</button>'+(task.locate?'':'<button class="tl wide" id="mclr">أعد الرسم</button>')+'</div>'+
    '<div class="mhint"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11V5a1.5 1.5 0 013 0v5m0 0V4a1.5 1.5 0 013 0v7m0-2a1.5 1.5 0 013 0v6a6 6 0 01-6 6h-1a6 6 0 01-5-3l-2.5-4a1.4 1.4 0 012.2-1.6L9 14"/></svg><span>يمكنك تحريك الخريطة وتكبيرها بإصبعين</span></div></div></div>');
  const cv=$('#mcv'),mw=$('#mw'),c=cv.getContext('2d'),st=$('#mst');
  const dpr=Math.min(2,window.devicePixelRatio||1);
  const locate=!!task.locate;let tries=0,moved=0,pin=null,reveal=false;let cw=1,ch=1,fit=1,V={k:1,ox:0,oy:0},pts=[],phase='draw',busy=false,arrow=null,reached=0,t0=performance.now(),failMark=null,raf=0;
  const u=()=>parseFloat(getComputedStyle(stage).fontSize)||16;
  function clampV(){V.k=Math.max(1,Math.min(5,V.k));const s=fit*V.k;V.ox=Math.min(0,Math.max(cw-W*s,V.ox));V.oy=Math.min(0,Math.max(ch-H*s,V.oy))}
  function size(){const r=mw.getBoundingClientRect();cw=Math.max(1,r.width);ch=Math.max(1,r.height);cv.width=Math.round(cw*dpr);cv.height=Math.round(ch*dpr);fit=cw/W;clampV()}
  function toB(x,y){const r=cv.getBoundingClientRect(),s=fit*V.k;return[(x-r.left-V.ox)/s,(y-r.top-V.oy)/s]}
  function say(t,k){st.textContent=t;st.className='mstat'+(k?' '+k:'')}
  function zoomAt(f,sx,sy){const r=cv.getBoundingClientRect(),px=sx-r.left,py=sy-r.top,s0=fit*V.k,bx=(px-V.ox)/s0,by=(py-V.oy)/s0;V.k*=f;clampV();const s1=fit*V.k;V.ox=px-bx*s1;V.oy=py-by*s1;clampV()}
  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  function steps(){const set=new Set([0]);
    if(pts.length>12)set.add(1);
    for(const p of pts){if(dist(p,B.hormuz)<36){set.add(1);set.add(2);break}}
    let h=false;for(const p of pts){if(dist(p,B.hormuz)<36)h=true;if(h&&p[0]<(54-G.LON0)*G.KX)set.add(3)}
    for(const p of pts){if(dist(p,B.fao)<32){set.add(4);break}}
    if(reached)set.add(5);
    
  }
  function addPt(b){
    const l=pts[pts.length-1];if(!l){pts.push(b);return}
    const dd=dist(l,b);if(dd<2.5)return;const n=Math.ceil(dd/2.5);
    for(let i=1;i<=n;i++)pts.push([l[0]+(b[0]-l[0])*i/n,l[1]+(b[1]-l[1])*i/n]);
  }
  function evaluate(){
    let bad=0,run=0,maxRun=0;const badIdx=[];
    pts.forEach((p,i)=>{if(!G.isSea(p[0],p[1])){bad++;run++;badIdx.push(i);if(run>maxRun)maxRun=run}else run=0});
    const okH=pts.some(p=>dist(p,B.hormuz)<36),okF=pts.some(p=>dist(p,B.fao)<32);
    return{ok:bad/pts.length<=.03&&maxRun<=9&&okH&&okF,bad,badIdx,okH,okF};
  }
  function success(){
    reached=1;steps();sfx('ok');
    if(task.arrow){phase='arrow';say('أحسنت، وصل طالب العلم. اضغط على المسار لتحديد اتجاه العودة بسهم','ok');return}
    finish();
  }
  function finish(){phase='done';say('أحسنت! وصل طالب العلم إلى ميناء البصرة','ok');setTimeout(()=>{cancelAnimationFrame(raf);done()},2000)}
  function fail(r){
    busy=true;failMark=r.badIdx;sfx('bad');
    say('المسار غير صحيح، ارسمه في البحر ليصل إلى ميناء البصرة','bad');
    setTimeout(()=>{pts=[];failMark=null;busy=false;reached=0;steps();say('أعد الرسم من ميناء صحار')},1700);
  }
  const TG=task.gov?B.gov.find(g=>g.id===task.gov):null,TN=task.gname||'إقليم البحرين',TT=TG?TG.r:B.target,TL=TG?[TG.r.reduce((a,p)=>a+p[0],0)/TG.r.length,TG.r.reduce((a,p)=>a+p[1],0)/TG.r.length]:B.tl;
  const pip=(b,poly)=>{let r=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],q=poly[j];if((a[1]>b[1])!==(q[1]>b[1])&&b[0]<(q[0]-a[0])*(b[1]-a[1])/(q[1]-a[1])+a[0])r=!r}return r};
  function tapLocate(b){
    if(busy)return;tries++;const inside=pip(b,TT)||(TG&&TT.some(p=>Math.hypot(p[0]-b[0],p[1]-b[1])<16));pin={x:b[0],y:b[1],ok:inside};
    if(inside){reveal=true;busy=true;if(task.onTap)task.onTap();sfx('ok');say('أحسنت! الموقع الصحيح: '+TN,'ok');setTimeout(()=>{cancelAnimationFrame(raf);done(true)},2300)}
    else if(tries>=2){reveal=true;busy=true;sfx('bad');say('الموقع الصحيح: '+TN+'، تابع الرحلة','bad');setTimeout(()=>{cancelAnimationFrame(raf);done(false)},2800)}
    else{sfx('bad');say('ليس هذا الموضع، حاول مرة أخرى','bad')}
  }
  /* تفاعل اللمس */
  const ptr=new Map();let mode=null,pan0=null,pin0=null;
  const cen=()=>{const a=[...ptr.values()];return[(a[0].x+a[1].x)/2,(a[0].y+a[1].y)/2,Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)]};
  cv.addEventListener('contextmenu',e=>e.preventDefault());
  cv.addEventListener('pointerdown',e=>{
    initAudio();try{cv.setPointerCapture(e.pointerId)}catch(_){}
    ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(ptr.size>=2){mode='pinch';const a=cen();pin0={d:a[2],cx:a[0],cy:a[1]};return}
    if(e.button===2||e.button===1||e.shiftKey){mode='pan';pan0={x:e.clientX,y:e.clientY};return}
    if(locate){if(!busy){mode='lpan';pan0={x:e.clientX,y:e.clientY};moved=0}return}
    if(busy||phase==='done')return;
    const b=toB(e.clientX,e.clientY);
    if(phase==='arrow'){
      let bi=-1,bd=34;pts.forEach((p,i)=>{const d=dist(p,b);if(d<bd){bd=d;bi=i}});
      if(bi<0){say('اضغط على نقطة من المسار المرسوم','bad');return}
      const j=Math.max(0,bi-14),p=pts[bi],q=pts[j];arrow={x:p[0],y:p[1],a:Math.atan2(q[1]-p[1],q[0]-p[0])};
      sfx('ok');finish();return}
    if(!pts.length||dist(b,B.sohar)<40&&dist(pts[pts.length-1],b)>45){
      if(dist(b,B.sohar)<40){pts=[B.sohar.slice()];addPt(b);mode='draw';say('تابع الرسم في البحر حتى ميناء البصرة');steps()}
      else say('ابدأ الرسم من ميناء صحار','bad');
      return}
    if(dist(pts[pts.length-1],b)<48){mode='draw';addPt(b)}
    else say('تابع من آخر نقطة في المسار أو اضغط «أعد الرسم»','bad');
  });
  cv.addEventListener('pointermove',e=>{
    const o=ptr.get(e.pointerId);if(!o)return;
    if(mode==='pinch'&&ptr.size>=2){o.x=e.clientX;o.y=e.clientY;const a=cen();const f=a[2]/(pin0.d||1);zoomAt(f,a[0],a[1]);V.ox+=a[0]-pin0.cx;V.oy+=a[1]-pin0.cy;clampV();pin0={d:a[2],cx:a[0],cy:a[1]};return}
    if(mode==='lpan'){const dx=e.clientX-pan0.x,dy=e.clientY-pan0.y;moved+=Math.abs(dx)+Math.abs(dy);V.ox+=dx;V.oy+=dy;pan0={x:e.clientX,y:e.clientY};clampV();o.x=e.clientX;o.y=e.clientY;return}
    if(mode==='pan'){V.ox+=e.clientX-pan0.x;V.oy+=e.clientY-pan0.y;pan0={x:e.clientX,y:e.clientY};clampV();o.x=e.clientX;o.y=e.clientY;return}
    o.x=e.clientX;o.y=e.clientY;
    if(mode==='draw'&&!busy&&phase==='draw'){
      const evs=e.getCoalescedEvents?e.getCoalescedEvents():[e];
      for(const ev of(evs.length?evs:[e])){addPt(toB(ev.clientX,ev.clientY))}
      steps();
      const l=pts[pts.length-1];
      if(dist(l,B.basra)<26){mode=null;const r=evaluate();r.ok?success():fail(r)}
    }
  });
  const up=e=>{ptr.delete(e.pointerId);if(mode==='lpan'&&!ptr.size&&moved<8&&e.type==='pointerup')tapLocate(toB(e.clientX,e.clientY));if(ptr.size<2&&mode==='pinch')mode=null;
    if(!ptr.size){if(mode==='draw'&&phase==='draw'&&!busy&&pts.length>3)say('تابع الرسم حتى ميناء البصرة');mode=null}};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.deltaY<0?1.2:1/1.2,e.clientX,e.clientY)},{passive:false});
  const cr=()=>{const r=cv.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]};
  $('#mz1').onclick=()=>{const a=cr();zoomAt(1.4,a[0],a[1])};
  $('#mz0').onclick=()=>{const a=cr();zoomAt(1/1.4,a[0],a[1])};
  if($('#mclr'))$('#mclr').onclick=()=>{if(phase==='done'||busy)return;pts=[];arrow=null;reached=0;phase='draw';mode=null;steps();say('أعد الرسم من ميناء صحار')};
  /* الرسم */
  function render(now){
    if(!document.body.contains(cv))return;
    const s=fit*V.k,U=u(),tt=(now-t0)/1000;
    c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,cw,ch);
    c.save();c.translate(V.ox,V.oy);c.scale(s,s);
    c.fillStyle='#fbe9cf';c.fillRect(0,0,W,H);
    // البحر
    c.lineJoin='round';c.lineCap='round';
    B.path(c,B.sea,true);c.fillStyle='#8fe0ea';c.fill();
    c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=5/s;c.stroke();
    c.strokeStyle='#8fe0ea';c.lineWidth=7;B.path(c,B.shatt,false);c.stroke();
    c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=1.2/s;c.stroke();
    // اليابسة
    B.isl.forEach(a=>{B.path(c,a,true);c.fillStyle='#fbe9cf';c.fill();c.strokeStyle='#e3c79c';c.lineWidth=1.2/s;c.stroke()});
    B.gov.forEach(g=>{B.path(c,g.r,true);c.fillStyle='#ffc79a';c.fill()});B.gov.forEach(g=>{B.path(c,g.r,true);c.strokeStyle='#ff8a6e';c.lineWidth=1.1/s;c.stroke()});
    if(reveal){B.path(c,TT,true);c.fillStyle='rgba(155,140,255,.32)';c.fill();c.setLineDash([6/s,4/s]);c.strokeStyle='#6d5be0';c.lineWidth=2/s;c.stroke();c.setLineDash([])}
    // المسار
    const lw=U*.34/s;
    if(pts.length>1){
      c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));
      c.strokeStyle='#fff';c.lineWidth=lw*1.9;c.stroke();
      c.strokeStyle=reached?'#1fbf9a':'#ff6f61';c.lineWidth=lw;c.stroke();
      if(failMark&&failMark.length){c.strokeStyle='#f0566a';c.lineWidth=lw*1.5;failMark.forEach(i=>{const p=pts[i];c.beginPath();c.arc(p[0],p[1],lw*.8,0,7);c.fillStyle='#f0566a';c.fill()})}
    }
    if(arrow){c.save();c.translate(arrow.x,arrow.y);c.rotate(arrow.a);const a=U*.9/s;c.beginPath();c.moveTo(a,0);c.lineTo(-a*.6,a*.75);c.lineTo(-a*.25,0);c.lineTo(-a*.6,-a*.75);c.closePath();c.fillStyle='#ff6f61';c.strokeStyle='#fff';c.lineWidth=lw*.7;c.stroke();c.fill();c.restore()}
    // العلامات
    const ring=(p,col,pulse)=>{const r=U*.5/s,k=pulse?(tt%1.4)/1.4:0;if(pulse){c.beginPath();c.arc(p[0],p[1],r*(1+k*1.6),0,7);c.strokeStyle=col;c.globalAlpha=1-k;c.lineWidth=lw*.8;c.stroke();c.globalAlpha=1}
      c.beginPath();c.arc(p[0],p[1],r,0,7);c.fillStyle='#fff';c.fill();c.lineWidth=lw*.9;c.strokeStyle=col;c.stroke();c.beginPath();c.arc(p[0],p[1],r*.42,0,7);c.fillStyle=col;c.fill()};
    if(!locate){ring(B.sohar,'#ff6f61',!pts.length);ring(B.basra,reached?'#1fbf9a':'#2c3490',phase==='draw'&&pts.length>0)}
    if(pin){const r=U*.5/s,col=pin.ok?'#1fbf9a':'#f0566a',x=pin.x,y=pin.y;c.beginPath();c.moveTo(x,y);c.lineTo(x-r*.8,y-r*1.5);c.lineTo(x+r*.8,y-r*1.5);c.closePath();c.fillStyle=col;c.fill();c.beginPath();c.arc(x,y-r*2,r,0,7);c.fill();c.lineWidth=lw*.6;c.strokeStyle='#fff';c.stroke();c.beginPath();c.arc(x,y-r*2,r*.4,0,7);c.fillStyle='#fff';c.fill()}
    c.restore();
    // النصوص (مقاس ثابت على الشاشة)
    const tx=(txt,p,o)=>{const x=p[0]*s+V.ox,y=p[1]*s+V.oy;if(x<-60||y<-30||x>cw+60||y>ch+30)return;
      c.font=(o.w||700)+' '+(U*(o.f||.78))+'px Cairo,sans-serif';c.textAlign=o.al||'center';c.textBaseline='middle';
      c.lineJoin='round';c.lineWidth=U*.28;c.strokeStyle=o.halo||'rgba(255,255,255,.9)';c.strokeText(txt,x,y);c.fillStyle=o.col;c.fillText(txt,x,y)};
    B.labels.forEach(l=>{const k=l[2];
      if(k==='s')tx(l[0],l[1],{col:'#1f6f86',f:.82,w:800});
      else if(k==='h')tx(l[0],l[1],{col:'#2c3490',f:.7,w:800});
      else if(k==='r')tx(l[0],l[1],{col:'#1f6f86',f:.66,w:700});
      else if(k==='o')tx(l[0],l[1],{col:'#c2412f',f:1.05,w:900,halo:'rgba(255,247,238,.9)'});
      else tx(l[0],l[1],{col:'#9a7b55',f:.72,w:700,halo:'rgba(251,233,207,.9)'})});
    if(reveal)tx(TN,TL,{col:'#4a3bb8',f:.95,w:900});
    if(!locate)tx('ميناء صحار',[B.sohar[0]+U*.8/s,B.sohar[1]-U*.15/s],{col:'#c2412f',f:.78,w:900,al:'left'});
    if(!locate&&reached)tx('ميناء البصرة',[B.basra[0],B.basra[1]+U*1.25/s],{col:'#12806a',f:.82,w:900});
    raf=requestAnimationFrame(render);
  }
  size();steps();new ResizeObserver(size).observe(mw);raf=requestAnimationFrame(render);
}
function qScore(){const t=(performance.now()-(Q.t0||performance.now()))/1000;return Math.round(Math.max(20,Math.min(100,100-(t-5)*4)))}
function showQ(){
  const q=Q.list[Q.i];Q.t0=performance.now();Q.pts=0;clearInterval(Q.iv);
  if(q.locate){showMap({text:q.q,locate:true,gov:q.gov,gname:q.gname,onTap:()=>{if(Q)Q.pts=qScore()},chip:Q.blk?'سؤال <b><bdi dir="ltr">'+(Q.blk.qi+1)+'/'+(lv.nq+1)+'</bdi></b>':'السؤال الأخير'},ok=>{if(ok){Q.c++;Q.sum=(Q.sum||0)+(Q.pts||50)}if(Q.blk){blockDone(ok);return}Q.i++;Q.i<Q.list.length?showQ():finishGate()});return}
  const tf=q.options.length===2&&q.options[0]==='صح';
  let opts=q.options.map((t,i)=>({t,ok:i===q.answer}));
  if(!tf)shuffle(opts);
  const ic=ok=>ok?'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>':'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  let html='<div class="card q"><span class="chip">'+(Q.blk?'سؤال <b><bdi dir="ltr">'+(Q.blk.qi+1)+'/'+(lv.nq+1)+'</bdi></b>':lv.nq>0?'السؤال الأخير':'السؤال <b><bdi dir="ltr">'+(Q.i+1)+'/'+Q.list.length+'</bdi></b>')+'</span><div class="tmr" id="tmr"><span class="trk"><i></i></span><b>+100</b></div>'+
    '<h2 class="qt'+(q.q.length>110?' long':'')+'">'+q.q+'</h2>'+(q.img?'<img class="qimg" alt="" src="'+q.img+'">':'')+(q.card?'<div class="idc">'+q.card.map(t=>'<p>'+t+'</p>').join('')+'</div>':'')+'<div class="opts'+(opts.length===3?' o3':'')+'" id="opts">';
  opts.forEach((o,i)=>{html+='<button class="opt" data-i="'+i+'">'+(tf?ic(o.t==='صح'):'')+o.t+'</button>'});
  html+='</div>'+(q.source?'<div class="src">المصدر: '+q.source+'</div>':'')+'</div>';
  showCard(html);
  const box=$('#opts');
  {const tm=$('#tmr'),f=tm&&tm.querySelector('i'),lb=tm&&tm.querySelector('b'),my=Q;my.iv=setInterval(()=>{if(!document.body.contains(tm)||Q!==my){clearInterval(my.iv);return}const p=qScore();f.style.width=((p-20)/80*100)+'%';lb.textContent='+'+p},120)}
  box.addEventListener('click',e=>{
    const b=e.target.closest('.opt');if(!b||box.classList.contains('lock'))return;
    box.classList.add('lock');initAudio();
    const ok=opts[+b.dataset.i].ok;
    [...box.children].forEach((el,i)=>{if(opts[i].ok)el.classList.add('ok');else if(el===b)el.classList.add('bad');else el.classList.add('dim')});
    clearInterval(Q.iv);Q.pts=qScore();if(ok){Q.c++;Q.sum=(Q.sum||0)+Q.pts;sfx('ok');const tb=$('#tmr b');if(tb)tb.textContent='+'+Q.pts}else sfx('bad');
    setTimeout(()=>{const go=()=>{if(Q.blk){blockDone(ok);return}Q.i++;Q.i<Q.list.length?showQ():finishGate()};(q.task&&(ok||Q.blk))?showMap(q.task,go):go()},1500);
  });
}
function finishGate(){
  const need=Math.ceil(Q.list.length*CONFIG.passRatio);
  if(Q.c>=need){
    const tot=CONFIG.questions[S.si].length,got=Q.c+(S.bq||0);S.points+=(Q.sum||Q.c*CONFIG.pointsPerAnswer);S.gateOK[S.si]=got;P.cel=2.2;setHUD();sfx('gate');
    showCard('<div class="card res"><h2>أحسنت</h2><p>أجبت إجابة صحيحة عن <bdi dir="ltr">'+got+'/'+tot+'</bdi> وفُتحت البوابة.</p><div class="bar"><i></i></div></div>');
    setTimeout(()=>{hideCard();S.mode='exit';S.gateT=0},2300);
  }else{
    showCard('<div class="card res"><h2>اقتربت من الهدف</h2><p>'+(lv.nq>0?'راجع الإجابة الصحيحة ثم أعد المحاولة للسؤال الأخير.':'أجبت إجابة صحيحة عن <bdi dir="ltr">'+Q.c+'/'+Q.list.length+'</bdi>. المطلوب <bdi dir="ltr">'+need+'</bdi> على الأقل.')+'</p><button class="btn" id="again">أعد المحاولة</button></div>');
    $('#again').onclick=()=>{Q.i=0;Q.c=0;showQ()};
  }
}
function showEnd(){
  S.mode='end';$('#touch').classList.remove('on');
  let tot=0,cnt=0;CONFIG.questions.forEach((l,i)=>{cnt+=l.length;tot+=S.gateOK[i]||0});
  const ratio=cnt?tot/cnt:1,n=ratio>=.9?3:ratio>=.75?2:1;
  const star=on=>'<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" fill="'+(on?'#ffb48a':'#d6cff0')+'" stroke="'+(on?'#ff6f61':'#bdb5de')+'" stroke-width="1.2" stroke-linejoin="round"/></svg>';
  showCard('<div class="card res"><h2>أتممت الرحلة</h2><div class="stars">'+star(n>=3)+star(n>=2)+star(1)+'</div><p>النقاط: <bdi dir="ltr">'+S.points+'</bdi> · العملات: <bdi dir="ltr">'+S.coins+'</bdi><br>الإجابات الصحيحة: <bdi dir="ltr">'+tot+'/'+cnt+'</bdi></p><button class="btn" id="again2">العب مجدداً</button></div>');
  $('#again2').onclick=()=>{hideCard();irisTo(-1,()=>{newGame()})};
}

/* ============ الرسم ============ */
function tileMirror(c,img,s,y,off,h2){
  const w=img.width*s,h=h2||img.height*s;
  let k=-Math.floor(off/w)-1;
  for(let x=mod(off,w)-w;x<LW;x+=w,k++){
    if(mod(k,2)===0)c.drawImage(img,x,y,w+1,h);
    else{c.save();c.translate(x+w,y);c.scale(-1,1);c.drawImage(img,0,0,w+1,h);c.restore()}
  }
}
const CLOUDS=[['cloudB',.5,70,.55,5,.05],['cloudA',.1,150,.7,8,.07],['cloudE',.3,110,.9,6,.06],['cloudB',.8,40,.35,4,.04],['cloudA',.65,185,.5,10,.08],['cloudE',.95,60,.8,7,.05]];
function drawSea(c,off){
  const im=IM.mid,s=.9,w=im.width*s,h=im.height*s,y0=562-h,hz=212;
  let k=-Math.floor(off/w)-1;
  for(let x=mod(off,w)-w;x<LW;x+=w,k++){
    c.save();if(mod(k,2)){c.translate(x+w,0);c.scale(-1,1)}else c.translate(x,0);
    c.drawImage(IM.midTop,0,y0,w+1,44*s);
    c.drawImage(im,0,43,im.width,hz-43,0,y0+43*s,w+1,(hz-43)*s);
    const n=18,rh=(im.height-hz)/n;
    for(let i=0;i<n;i++){const dy=y0+(hz+i*rh)*s,sh=Math.sin(T*1.5+i*.9)*(.6+i*.13);c.drawImage(im,0,hz+i*rh,im.width,rh+.4,sh,dy,w+1,rh*s+.7)}
    c.restore();
  }
  return y0+hz*s; // خط الأفق
}
function drawBackground(c){
  let g=c.createLinearGradient(0,0,0,340);g.addColorStop(0,'#0a84ff');g.addColorStop(1,'#78c2ff');c.fillStyle=g;c.fillRect(0,0,LW,562);
  g=c.createLinearGradient(0,562,0,720);g.addColorStop(0,'#1190e4');g.addColorStop(1,'#0a52b4');c.fillStyle=g;c.fillRect(0,561,LW,160);
  const sk=IM.sky;tileMirror(c,sk,.9,-119,-(cam.x*.03+T*3));
  g=c.createLinearGradient(0,0,0,230);g.addColorStop(0,'rgba(10,110,245,.65)');g.addColorStop(1,'rgba(10,110,245,0)');c.fillStyle=g;c.fillRect(0,0,LW,230);
  const hz=drawSea(c,-cam.x*.25);
  for(const cl of CLOUDS){
    const im=IM[cl[0]],w=im.width*cl[3],x=mod(cl[1]*1900+T*cl[4]-cam.x*cl[5],1900)-w,y=cl[2];
    c.globalAlpha=.95;c.drawImage(im,x,y+Math.sin(T*.4+cl[1]*9)*3,w,im.height*cl[3]);c.globalAlpha=1;
  }
  // لمعان البحر
  c.fillStyle='rgba(255,255,255,.75)';
  for(let i=0;i<26;i++){
    const a=.5+.5*Math.sin(T*2.2+i*1.9);if(a<.55)continue;
    const x=mod(hash(i)*1500-cam.x*.25+T*6,1400)-60,y=hz+14+hash(i+30)*(520-hz);
    c.globalAlpha=a*.7;c.fillRect(x,y,8+hash(i+7)*14,2);
  }
  c.globalAlpha=1;
  // السفينة الشراعية
  const dh=IM.dhow,ds=.52,dw=dh.width*ds,dhh=dh.height*ds;
  const dx=mod(T*9+700-cam.x*.25,1900)-300,dy=hz+36+Math.sin(T*1.1)*2.5;
  c.save();c.translate(dx+dw/2,dy);c.rotate(Math.sin(T*1.1+1)*.025);c.drawImage(dh,-dw/2,-dhh,dw,dhh);c.restore();
  c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.ellipse(dx+dw/2,dy+1,dw*.45,3,0,0,6.28);c.fill();
}
function drawFlag(c,x,y,w,h,t,rise){
  const im=IM.flag,n=22,sw=im.width/n;
  for(let i=0;i<n;i++){
    const f=i/(n-1),oy=Math.sin(t*5-i*.38)*h*.09*f;
    c.drawImage(im,i*sw,0,sw+.6,im.height,x+f*w,y+oy,w/n+.8,h);
  }
}
function drawPalmStart(c){
  const im=IM.palm,s=.66,w=im.width*s,h=im.height*s;
  c.save();c.translate(-60,GY+6);c.rotate(Math.sin(T*.9)*.006);c.drawImage(im,0,-h,w,h);c.restore();
  const pl=IM.plantD;c.drawImage(pl,-30,GY+8-pl.height*.7,pl.width*.7,pl.height*.7);
  const sg=IM.sign,ss=.62;c.drawImage(sg,250,GY+6-sg.height*ss,sg.width*ss,sg.height*ss);
}
function drawDecor(c,list,x0,x1){
  for(const d of list){
    if(d.x<x0||d.x>x1)continue;const im=IM[d.k],w=im.width*d.s,h=im.height*d.s;
    if(d.flip){c.save();c.translate(d.x+w/2,GY+7);c.scale(-1,1);c.drawImage(im,-w/2,-h,w,h);c.restore()}
    else c.drawImage(im,d.x-w/2,GY+7-h,w,h);
    if(d.bl){const b=IM[d.bl],bs=d.s*.62,bw=b.width*bs,bh=b.height*bs;c.drawImage(b,d.x-bw/2+(d.bx-.5)*w*.4,GY+7-h*.62-bh/2,bw,bh)}
  }
}
function drawGroundTile(c,x0,x1){
  const im=IM.ground,th=162,tw=im.width*th/im.height;
  let k=Math.floor(x0/tw);
  for(let x=k*tw;x<x1;x+=tw,k++){
    if(mod(k,2)===0)c.drawImage(im,x,GY-2,tw+1,th);
    else{c.save();c.translate(x+tw,GY-2);c.scale(-1,1);c.drawImage(im,0,0,tw+1,th);c.restore()}
  }
  c.fillStyle='#8b4a22';c.fillRect(x0,GY-2+th-1,x1-x0,6);
}
function drawGround(c){
  const segs=lv.segs;
  for(let i=0;i<segs.length-1;i++){
    const a=segs[i][1],b=segs[i+1][0];if(b<cam.x-20||a>cam.x+LW+20)continue;
    const g=c.createLinearGradient(0,GY+30,0,720);g.addColorStop(0,'#2bb0f4');g.addColorStop(1,'#0a5fc0');
    c.fillStyle=g;c.fillRect(a-2,GY+30,b-a+4,200);
    c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=3;c.beginPath();
    for(let x=a;x<=b;x+=10){const y=GY+32+Math.sin(x*.09+T*3)*3;x===a?c.moveTo(x,y):c.lineTo(x,y)}c.stroke();
    c.fillStyle='rgba(255,255,255,.25)';for(let j=0;j<4;j++)c.fillRect(a+10+mod(j*47+T*18,b-a-30),GY+60+j*22,22,2);
  }
  for(const s of segs){
    const a=s[0],b=s[1];if(b<cam.x-60||a>cam.x+LW+60)continue;
    const x0=Math.max(a,cam.x-60),x1=Math.min(b,cam.x+LW+60);
    c.save();c.beginPath();c.roundRect(a,GY-14,b-a,170,[16,16,6,6]);c.clip();
    drawGroundTile(c,x0,x1);
    // تظليل حواف الجروف
    if(a>cam.x-60){const g=c.createLinearGradient(a,0,a+26,0);g.addColorStop(0,'rgba(60,25,5,.55)');g.addColorStop(1,'rgba(60,25,5,0)');c.fillStyle=g;c.fillRect(a,GY,26,170)}
    if(b<cam.x+LW+60){const g=c.createLinearGradient(b,0,b-26,0);g.addColorStop(0,'rgba(60,25,5,.55)');g.addColorStop(1,'rgba(60,25,5,0)');c.fillStyle=g;c.fillRect(b-26,GY,26,170)}
    c.restore();
  }
}
function drawPlat(c,p){
  const im=IM.ground,sh=60,srcW=Math.min(im.width-4,p.w/1.13),sx=mod(Math.floor(p.x*.7),im.width-srcW);
  // الجزء السفلي (جذع الصخر)
  let g=c.createLinearGradient(0,p.y,0,p.y+110);g.addColorStop(0,'#b9692e');g.addColorStop(1,'#6f3519');
  c.fillStyle=g;c.beginPath();c.moveTo(p.x+2,p.y+40);c.bezierCurveTo(p.x+p.w*.2,p.y+105,p.x+p.w*.4,p.y+118,p.x+p.w*.5,p.y+120);c.bezierCurveTo(p.x+p.w*.6,p.y+118,p.x+p.w*.8,p.y+105,p.x+p.w-2,p.y+40);c.closePath();c.fill();
  c.fillStyle='rgba(255,255,255,.1)';c.beginPath();c.ellipse(p.x+p.w*.38,p.y+62,p.w*.09,8,0,0,6.28);c.fill();
  c.fillStyle='rgba(0,0,0,.14)';c.beginPath();c.ellipse(p.x+p.w*.62,p.y+80,p.w*.08,7,0,0,6.28);c.fill();
  // العشب
  c.save();c.beginPath();c.roundRect(p.x-4,p.y-6,p.w+8,sh,[14,14,20,20]);c.clip();
  c.drawImage(im,sx,0,srcW,sh/1.13,p.x-4,p.y-6,p.w+8,sh);
  c.restore();
}
function drawBlock(c,b){
  if(!b.shown)return;
  const by=b.y-Math.sin(b.bump*Math.PI)*12,x=b.x;
  c.save();c.translate(x,by);
  const used=b.used;
  let g=c.createLinearGradient(0,0,0,48);
  if(used){g.addColorStop(0,'#c9a477');g.addColorStop(1,'#8c6a46')}else{g.addColorStop(0,'#ffd75e');g.addColorStop(1,'#f0951c')}
  c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.roundRect(2,5,48,48,9);c.fill();
  c.fillStyle=g;c.beginPath();c.roundRect(0,0,48,48,9);c.fill();
  c.lineWidth=3;c.strokeStyle=used?'#6b4a2a':'#b2620c';c.stroke();
  c.fillStyle='rgba(255,255,255,.35)';c.beginPath();c.roundRect(4,4,40,8,4);c.fill();
  c.fillStyle=used?'#6b4a2a':'#b2620c';[[7,7],[41,7],[7,41],[41,41]].forEach(a=>{c.beginPath();c.arc(a[0],a[1],2.4,0,6.28);c.fill()});
  if(b.qi!==undefined&&!used){c.save();c.globalAlpha=.35+.25*Math.sin(T*4);const gg=c.createRadialGradient(24,24,10,24,24,52);gg.addColorStop(0,'rgba(255,230,120,.9)');gg.addColorStop(1,'rgba(255,230,120,0)');c.fillStyle=gg;c.beginPath();c.arc(24,24,52,0,6.28);c.fill();c.restore();
    c.save();c.font='800 14px Cairo,Tahoma,sans-serif';c.textAlign='center';c.direction='rtl';const tw=c.measureText('سؤال '+(b.qi+1)).width+16;c.fillStyle='rgba(20,30,70,.82)';c.beginPath();c.roundRect(24-tw/2,-30+Math.sin(T*3)*2,tw,22,11);c.fill();c.fillStyle='#fff';c.textBaseline='middle';c.fillText('سؤال '+(b.qi+1),24,-19+Math.sin(T*3)*2);c.restore()}
  if(!used){c.fillStyle='#fff';c.strokeStyle='#b2620c';c.lineWidth=3;c.font='900 32px Cairo,Tahoma,sans-serif';c.textAlign='center';c.textBaseline='middle';c.direction='ltr';c.strokeText('؟',24,26);c.fillText('؟',24,26)}
  c.restore();
}
// تلميح للكتل المخفية: بريق خفيف
function drawHiddenHint(c,b){
  if(b.shown)return;const a=.5+.5*Math.sin(T*3+b.x);
  c.fillStyle='rgba(255,255,255,'+(.15+a*.3)+')';c.beginPath();c.arc(b.x+24,b.y+24,3+a*2,0,6.28);c.fill();
}
function drawCoin(c,d){
  const y=d.y+Math.sin(T*3+d.ph)*4,w=Math.abs(Math.cos(T*3.2+d.ph));
  c.save();c.translate(d.x,y);
  const g=c.createRadialGradient(0,0,2,0,0,28);g.addColorStop(0,'rgba(255,224,120,.5)');g.addColorStop(1,'rgba(255,224,120,0)');c.fillStyle=g;c.beginPath();c.arc(0,0,28,0,6.28);c.fill();
  c.scale(Math.max(.14,w),1);
  const gg=c.createLinearGradient(-14,-14,14,14);gg.addColorStop(0,'#fff6b0');gg.addColorStop(.5,'#ffc72c');gg.addColorStop(1,'#d98a00');
  c.fillStyle=gg;c.beginPath();c.arc(0,0,15,0,6.28);c.fill();c.lineWidth=2.5;c.strokeStyle='#b86e00';c.stroke();
  c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=1.6;c.beginPath();c.arc(0,0,10.5,.5,2.1);c.stroke();
  c.fillStyle='#e49a00';c.beginPath();for(let i=0;i<10;i++){const r=i%2?3:7,a=-Math.PI/2+i*Math.PI/5;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.closePath();c.fill();
  c.restore();
}
function drawHeartItem(c,h){
  const y=h.y+Math.sin(T*3)*5,s=1+Math.sin(T*5)*.08;
  c.save();c.translate(h.x,y);c.scale(s,s);
  const g=c.createRadialGradient(0,0,4,0,0,34);g.addColorStop(0,'rgba(255,140,170,.6)');g.addColorStop(1,'rgba(255,140,170,0)');c.fillStyle=g;c.beginPath();c.arc(0,0,34,0,6.28);c.fill();
  c.fillStyle='#ff5f7e';c.beginPath();c.moveTo(0,16);c.bezierCurveTo(-26,-2,-14,-22,0,-9);c.bezierCurveTo(14,-22,26,-2,0,16);c.fill();
  c.strokeStyle='#c93a55';c.lineWidth=2;c.stroke();
  c.fillStyle='rgba(255,255,255,.6)';c.beginPath();c.ellipse(-8,-8,4,2.6,-.6,0,6.28);c.fill();
  c.restore();
}
function drawBush(c,x){
  c.save();c.translate(x,GY);
  c.fillStyle='rgba(0,0,0,.2)';c.beginPath();c.ellipse(0,3,38,7,0,0,6.28);c.fill();
  for(let i=0;i<11;i++){const a=Math.PI+i/10*Math.PI,r=38+(i%2)*14;c.fillStyle='#f4ead0';c.beginPath();c.moveTo(Math.cos(a+.16)*18,-8+Math.sin(a+.16)*16);c.lineTo(Math.cos(a)*r,-10+Math.sin(a)*r*1.05);c.lineTo(Math.cos(a-.16)*18,-8+Math.sin(a-.16)*16);c.fill()}
  let g=c.createRadialGradient(-6,-26,4,0,-18,34);g.addColorStop(0,'#9bbd4c');g.addColorStop(1,'#4d6f26');
  c.fillStyle=g;c.beginPath();c.ellipse(0,-17,28,19,0,0,6.28);c.fill();c.strokeStyle='#3b561c';c.lineWidth=2.5;c.stroke();
  c.fillStyle='#c7243a';[[-10,-20],[8,-12],[12,-26],[-4,-8]].forEach(a=>{c.beginPath();c.arc(a[0],a[1],3.4,0,6.28);c.fill()});
  c.restore();
}
function drawCrab(c,cr){
  c.save();c.translate(cr.x,GY);
  c.fillStyle='rgba(0,0,0,.2)';c.beginPath();c.ellipse(0,3,32,6,0,0,6.28);c.fill();
  c.strokeStyle='#a52e27';c.lineWidth=4.5;c.lineCap='round';
  for(let i=0;i<3;i++){const o=Math.sin(cr.ph+i*1.4)*4;[-1,1].forEach(s=>{c.beginPath();c.moveTo(s*14,-14);c.lineTo(s*(26+i*3),-8+o);c.lineTo(s*(31+i*3),1);c.stroke()})}
  const cl=Math.sin(cr.ph*.6)*.2;
  [-1,1].forEach(s=>{c.save();c.translate(s*24,-27);c.rotate(s*(.3+cl));let g=c.createLinearGradient(0,-20,0,4);g.addColorStop(0,'#ff8f6e');g.addColorStop(1,'#e0473f');c.fillStyle=g;c.beginPath();c.ellipse(0,-9,11,14,0,0,6.28);c.fill();c.strokeStyle='#a52e27';c.lineWidth=2;c.stroke();c.fillStyle='#e0473f';c.beginPath();c.moveTo(0,-15);c.lineTo(s*9,-24);c.lineTo(s*2,-6);c.fill();c.restore()});
  let g=c.createRadialGradient(-6,-26,3,0,-17,26);g.addColorStop(0,'#ff9a7c');g.addColorStop(1,'#d9443a');
  c.fillStyle=g;c.beginPath();c.ellipse(0,-17,24,16,0,0,6.28);c.fill();c.strokeStyle='#a52e27';c.lineWidth=2.5;c.stroke();
  c.fillStyle='rgba(255,255,255,.45)';c.beginPath();c.ellipse(-7,-24,10,4,-.3,0,6.28);c.fill();
  c.fillStyle='#fff';[-7,7].forEach(x=>{c.beginPath();c.arc(x,-34,5.4,0,6.28);c.fill();c.strokeStyle='#a52e27';c.lineWidth=1.5;c.stroke()});
  c.fillStyle='#1b1f4b';[-7,7].forEach(x=>{c.beginPath();c.arc(x+cr.dir*1.6,-34,2.6,0,6.28);c.fill()});
  c.restore();
}
function drawBird(c,b){
  c.save();c.translate(b.x,b.y);c.scale(b.dir,1);
  const fl=Math.sin(b.ph*1.2)*.7;
  c.fillStyle='rgba(0,0,0,.12)';c.beginPath();c.ellipse(0,GY-b.y+3,20,4,0,0,6.28);c.fill();
  const wing=(s)=>{c.save();c.translate(-2,-4);c.rotate(-fl*s);let g=c.createLinearGradient(0,-26,0,4);g.addColorStop(0,'#ffffff');g.addColorStop(1,'#cfd8e6');c.fillStyle=g;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-22,-16,-38,-22);c.quadraticCurveTo(-26,-2,-8,6);c.closePath();c.fill();c.strokeStyle='#8c9bb4';c.lineWidth=1.5;c.stroke();c.fillStyle='#46506a';c.beginPath();c.moveTo(-38,-22);c.quadraticCurveTo(-34,-16,-28,-10);c.lineTo(-33,-20);c.fill();c.restore()};
  wing(1);
  let g=c.createLinearGradient(0,-14,0,14);g.addColorStop(0,'#ffffff');g.addColorStop(1,'#d4dceb');c.fillStyle=g;
  c.beginPath();c.ellipse(0,0,24,12,0,0,6.28);c.fill();c.strokeStyle='#8c9bb4';c.lineWidth=1.8;c.stroke();
  c.beginPath();c.arc(20,-5,8.5,0,6.28);c.fill();c.stroke();
  c.fillStyle='#ff9a2e';c.beginPath();c.moveTo(27,-6);c.lineTo(38,-3);c.lineTo(27,-1);c.fill();
  c.fillStyle='#1b1f4b';c.beginPath();c.arc(22,-7,1.9,0,6.28);c.fill();
  c.fillStyle='#e9eef7';c.beginPath();c.moveTo(-22,0);c.lineTo(-38,-4);c.lineTo(-34,6);c.fill();
  c.save();c.translate(-2,-2);c.rotate(fl*.8);c.fillStyle='#f4f7fc';c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(-18,12,-34,22);c.quadraticCurveTo(-20,2,-8,-4);c.fill();c.strokeStyle='#8c9bb4';c.lineWidth=1.3;c.stroke();c.restore();
  c.restore();
}
function drawCheckpoint(c,cp){
  c.save();c.translate(cp.x,GY);
  c.strokeStyle='#7a4a2a';c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(0,4);c.lineTo(0,-170);c.stroke();
  c.fillStyle='#ffd35a';c.beginPath();c.arc(0,-174,6,0,6.28);c.fill();
  const fy=-60-cp.rise*100;
  drawFlag(c,3,fy-26,60,43,T+cp.x);
  if(cp.on){const g=c.createRadialGradient(34,-125,4,34,-125,80);g.addColorStop(0,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.beginPath();c.arc(34,-125,80,0,6.28);c.fill()}
  c.restore();
}
// بوابة الأسئلة: حصن رملي بتصميم يشبه القلعة في الخلفية
function drawGate(c,gt){
  const x=gt.x,op=gt.open;c.save();c.translate(x,GY);
  const sand=(x0,y0,x1,y1)=>{const g=c.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,'#f0d9ab');g.addColorStop(1,'#c99f66');return g};
  // الأبراج
  const tower=(tx)=>{
    c.fillStyle=sand(tx,-260,tx+70,0);c.fillRect(tx,-250,70,250);
    c.fillStyle='rgba(120,70,20,.18)';c.fillRect(tx+52,-250,18,250);
    c.fillStyle=sand(tx-6,-285,tx+76,-250);
    for(let i=0;i<4;i++)c.fillRect(tx-6+i*20,-272,14,26);
    c.fillRect(tx-6,-256,82,10);
    c.fillStyle='#5b3a1e';c.beginPath();c.roundRect(tx+27,-200,16,34,[8,8,0,0]);c.fill();
    c.beginPath();c.roundRect(tx+27,-120,16,34,[8,8,0,0]);c.fill();
  };
  tower(-125);tower(55);
  // الجدار العلوي وقوس الباب
  c.fillStyle=sand(-60,-170,60,0);c.fillRect(-58,-175,116,175);
  c.fillStyle=sand(-60,-200,60,-170);for(let i=0;i<5;i++)c.fillRect(-58+i*24,-196,16,24);c.fillRect(-58,-180,116,8);
  // الباب
  c.save();c.beginPath();c.moveTo(-40,0);c.lineTo(-40,-100);c.arc(0,-100,40,Math.PI,0);c.lineTo(40,0);c.clip();
  let g=c.createLinearGradient(0,-150,0,0);g.addColorStop(0,'#fff6d8');g.addColorStop(1,'#bfe9ff');c.fillStyle=g;c.fillRect(-40,-150,80,150);
  [-1,1].forEach(s=>{const off=s*op*40,x0=s<0?-40+off:off;
    c.fillStyle='#7a4a2a';c.fillRect(x0,-150,40,150);c.strokeStyle='#4f2d17';c.lineWidth=3;c.strokeRect(x0+3,-146,34,142);
    c.fillStyle='#e2b567';for(let i=0;i<4;i++){c.beginPath();c.arc(x0+(s<0?27:13),-120+i*30,3.2,0,6.28);c.fill()}});
  c.restore();
  c.strokeStyle='#a97a3f';c.lineWidth=4;c.beginPath();c.moveTo(-40,0);c.lineTo(-40,-100);c.arc(0,-100,40,Math.PI,0);c.lineTo(40,0);c.stroke();
  // علم
  c.strokeStyle='#d9d9e6';c.lineWidth=4;c.beginPath();c.moveTo(-90,-272);c.lineTo(-90,-345);c.stroke();
  drawFlag(c,-87,-348,58,42,T);
  c.restore();
}
/* ===== البطلة: فتاة عُمانية مرسومة بالشيفرة (وجه أمامي ثابت) ===== */
const INK='#3a3550',SKIN='#e9b28a',SKIN2='#d49a72',NAVY='#25396b',NAVY2='#1b2b55',WHITE='#f8f6f3',WHITE2='#dcd8d8',BROWN='#7b4a2c';
function limb2(c,x,y,a1,l1,a2,l2,w,col,ink){
  const mx=x+Math.sin(a1)*l1,my=y+Math.cos(a1)*l1,ex=mx+Math.sin(a2)*l2,ey=my+Math.cos(a2)*l2;
  c.lineCap='round';c.lineJoin='round';
  c.strokeStyle=ink;c.lineWidth=w+3;c.beginPath();c.moveTo(x,y);c.lineTo(mx,my);c.lineTo(ex,ey);c.stroke();
  c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(mx,my);c.lineTo(ex,ey);c.stroke();
  return[mx,my,ex,ey];
}
function legDraw(c,th,bend,far){
  const [kx,ky,ax,ay]=limb2(c,0,-60,th,27,th-bend,29,8.5,far?SKIN2:SKIN,INK);
  // جورب أبيض
  c.lineCap='round';c.strokeStyle=INK;c.lineWidth=11.5;c.beginPath();c.moveTo(kx+(ax-kx)*.3,ky+(ay-ky)*.3);c.lineTo(ax,ay);c.stroke();
  c.strokeStyle=far?WHITE2:WHITE;c.lineWidth=8.8;c.beginPath();c.moveTo(kx+(ax-kx)*.3,ky+(ay-ky)*.3);c.lineTo(ax,ay);c.stroke();
  c.save();c.translate(ax,ay);c.rotate((th-bend)*.4);
  c.fillStyle=far?'#1c1c26':'#101018';c.strokeStyle=INK;c.lineWidth=1.6;c.beginPath();c.ellipse(4.5,.4,11.5,5.2,0,0,6.28);c.fill();c.stroke();
  c.strokeStyle='#5a5a6a';c.lineWidth=1.6;c.beginPath();c.moveTo(-1,-4.2);c.lineTo(7,-3.8);c.stroke();
  c.restore();
}
function armDraw(c,a1,a2,far){
  const wh=far?WHITE2:WHITE;
  const [mx,my,ex,ey]=limb2(c,2,-105,a1,17,a2,16,8.5,wh,INK);
  c.strokeStyle=far?'#c9c4c4':'#e6e2e2';c.lineWidth=9.6;c.lineCap='round';const t0=.7,t1=.86;
  c.beginPath();c.moveTo(mx+(ex-mx)*t0,my+(ey-my)*t0);c.lineTo(mx+(ex-mx)*t1,my+(ey-my)*t1);c.stroke();
  c.fillStyle=far?SKIN2:SKIN;c.strokeStyle=INK;c.lineWidth=1.8;c.beginPath();c.arc(ex+Math.sin(a2)*1.5,ey+Math.cos(a2)*1.5,5.4,0,6.28);c.fill();c.stroke();
  c.fillStyle=wh;c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.ellipse(2,-103,7,6.5,0,0,6.28);c.fill();c.stroke();
}
function drawGirl(c,o){
  const {ph,run,st,t}=o,air=st==='air',cel=st==='cel',hurt=st==='hurt',col=o.col,isRun=st==='run';
  const blink=(t%3.8)<.12&&!cel,br=Math.sin(t*2.4);
  const lean=hurt?-.14:isRun?.1*run:air?.06:cel?0:.01;
  const pN=ph,pF=ph+Math.PI;
  const legPose=(p,near)=>{
    if(air)return near?[.95,.45]:[-.45,1.05];
    if(hurt)return near?[.5,.5]:[-.2,.3];
    if(cel)return[near?.12:-.12,.1];
    if(isRun)return[.82*Math.sin(p)*run,.18+.95*Math.max(0,Math.cos(p+.55))*run];
    return[near?.04:-.03,.02];
  };
  const lf=legPose(pF,false),ln=legPose(pN,true);
  const armPose=(p,near)=>{
    if(air)return near?[-1.9,-2.3]:[1.55,1.9];
    if(cel)return near?[-2.5+Math.sin(t*9)*.15,-2.9]:[2.5+Math.sin(t*9+1.5)*.15,2.9];
    if(hurt)return near?[-1.2,-.8]:[-1.6,-1.2];
    if(col>0&&near)return[1.65,1.9];
    if(isRun)return[.95*Math.sin(p+Math.PI)*run,.95+.35*Math.max(0,Math.sin(p+Math.PI))*run];
    return[(near?.1:-.1)+br*.03,.12];
  };
  const af=armPose(pN,false),an=armPose(pF,true);
  const body=()=>{c.translate(0,-60);c.rotate(lean);c.translate(0,60)};
  c.save();body();armDraw(c,af[0],af[1],true);c.restore();
  legDraw(c,lf[0],lf[1],true);
  legDraw(c,ln[0],ln[1],false);
  c.save();body();
  // حقيبة الظهر
  c.fillStyle=BROWN;c.strokeStyle=INK;c.lineWidth=2.2;
  c.beginPath();c.roundRect(-27,-110,19,38,6);c.fill();c.stroke();
  c.fillStyle='#8d5a38';c.beginPath();c.roundRect(-29,-92,9,15,3);c.fill();c.stroke();
  c.strokeStyle='#3a2314';c.lineWidth=1.4;c.beginPath();c.moveTo(-24,-104);c.lineTo(-11,-104);c.stroke();
  // التنورة
  const fl=air?6:run*3,tr=run*6+(air?4:0),wob=isRun?Math.sin(ph*2)*2.5:0;
  c.fillStyle=NAVY;c.strokeStyle=INK;c.lineWidth=2.2;c.lineJoin='round';
  c.beginPath();c.moveTo(11,-90);c.bezierCurveTo(17,-76,27+fl,-60,29+fl,-42+(air?-3:0));
  c.quadraticCurveTo(12,-36+wob,-2,-40);c.quadraticCurveTo(-16,-36-wob,-28-tr,-42+(air?-3:0));
  c.bezierCurveTo(-24-tr*.6,-62,-16,-78,-11,-90);c.closePath();c.fill();c.stroke();
  c.strokeStyle=NAVY2;c.lineWidth=1.3;
  for(const x of[-6,0,6]){c.beginPath();c.moveTo(x,-86);c.quadraticCurveTo(x*2.2,-64,x*3.2-tr*.3+fl*.4,-44);c.stroke()}
  // صدرية الفستان
  c.fillStyle=NAVY;c.strokeStyle=INK;c.lineWidth=2.2;
  c.beginPath();c.moveTo(-10,-113);c.quadraticCurveTo(2,-108,13,-113);c.lineTo(11,-88);c.lineTo(-11,-88);c.closePath();c.fill();c.stroke();
  c.strokeStyle=NAVY2;c.lineWidth=2;c.beginPath();c.moveTo(-11,-89);c.lineTo(11,-89);c.stroke();
  // شعار صغير
  c.fillStyle='#4a7bd0';c.strokeStyle=INK;c.lineWidth=1.2;c.beginPath();c.moveTo(4,-104);c.lineTo(10,-104);c.lineTo(10,-98);c.quadraticCurveTo(7,-95,4,-98);c.closePath();c.fill();c.stroke();
  c.fillStyle='#f2c14e';c.beginPath();c.arc(7,-100.5,1.5,0,6.28);c.fill();
  // حزام الحقيبة
  c.strokeStyle=BROWN;c.lineWidth=3.4;c.lineCap='round';c.beginPath();c.moveTo(-6,-110);c.quadraticCurveTo(2,-98,-3,-86);c.stroke();
  // طرحة تغطي الرقبة والصدر
  c.fillStyle=WHITE;c.strokeStyle=INK;c.lineWidth=2.2;
  c.beginPath();c.moveTo(-18,-132);c.quadraticCurveTo(-20,-110,-8,-104);c.quadraticCurveTo(6,-98,20,-105);c.quadraticCurveTo(28,-112,28,-130);c.closePath();c.fill();c.stroke();
  c.strokeStyle=WHITE2;c.lineWidth=1.4;c.beginPath();c.moveTo(-6,-118);c.quadraticCurveTo(4,-100,16,-110);c.stroke();c.beginPath();c.moveTo(0,-122);c.quadraticCurveTo(6,-106,18,-118);c.stroke();
  // ---- الرأس
  c.save();c.translate(2,-112);c.rotate((hurt?-.12:0)+(isRun?Math.sin(ph*2)*.03*run:0));c.translate(-2,112+(st==='idle'?br*.8:0));
  // الوجه
  c.fillStyle=SKIN;c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.ellipse(14,-142,22,27,0,0,6.28);c.fill();c.stroke();
  // عينان
  for(const [ex,rx,ry] of[[16,5.6,6.6],[28.5,3.9,5.8]]){
    const ey=-142;
    if(blink||cel){c.strokeStyle=INK;c.lineWidth=2.4;c.beginPath();c.arc(ex,ey+1.5,rx*.9,Math.PI*1.1,Math.PI*1.9);c.stroke()}
    else{
      const k=hurt?1.18:1;
      c.fillStyle='#fff';c.strokeStyle=INK;c.lineWidth=1.3;c.beginPath();c.ellipse(ex,ey,(rx+1.1)*k,(ry+.6)*k,0,0,6.28);c.fill();c.stroke();
      c.fillStyle='#6a3a1c';c.beginPath();c.ellipse(ex+1.2,ey+.6,rx*.88*k,ry*.9*k,0,0,6.28);c.fill();
      c.fillStyle='#24140a';c.beginPath();c.ellipse(ex+1.4,ey+.8,rx*.5*k,ry*.55*k,0,0,6.28);c.fill();
      c.fillStyle='#fff';c.beginPath();c.arc(ex+2.5,ey-1.8,1.6,0,6.28);c.fill();
      c.strokeStyle='#2a1a14';c.lineWidth=2;c.beginPath();c.arc(ex+.6,ey+.6,(rx+1.4)*k,Math.PI*1.1,Math.PI*1.9);c.stroke();
    }
    c.strokeStyle='#5a3322';c.lineWidth=2.2;const by=ey-(hurt?14:12.5);c.beginPath();c.moveTo(ex-rx,by+2.4);c.quadraticCurveTo(ex,by-2.6,ex+rx,by+2.6);c.stroke();
  }
  c.fillStyle='rgba(232,110,100,.45)';c.beginPath();c.ellipse(15,-130,6,4.2,0,0,6.28);c.fill();c.beginPath();c.ellipse(28,-131,3.4,3.2,0,0,6.28);c.fill();
  // أنف
  c.strokeStyle=INK;c.lineWidth=1.5;c.beginPath();c.moveTo(30.5,-139);c.quadraticCurveTo(35.5,-135,31,-132.5);c.stroke();
  // فم
  c.strokeStyle=INK;c.lineWidth=1.7;
  if(hurt){c.fillStyle='#7a2a2a';c.beginPath();c.ellipse(24,-123,3,4,0,0,6.28);c.fill();c.stroke()}
  else if(air||cel||col>0||run>.4){
    c.fillStyle='#fff';c.beginPath();c.moveTo(15,-127);c.quadraticCurveTo(23,-124.5,31,-127.5);c.quadraticCurveTo(28,-117,22,-117.5);c.quadraticCurveTo(16,-118,15,-127);c.closePath();c.fill();c.stroke();
    c.fillStyle='#e0605e';c.beginPath();c.ellipse(22.5,-119.4,4,1.8,0,0,6.28);c.fill();
  }else{
    c.fillStyle='#fff';c.beginPath();c.moveTo(16,-126);c.quadraticCurveTo(23,-123.5,30,-126.5);c.quadraticCurveTo(27,-119,22,-119);c.quadraticCurveTo(17,-119,16,-126);c.closePath();c.fill();c.stroke();
  }
  // الحجاب: إطار حول الوجه
  c.fillStyle=WHITE;c.strokeStyle=INK;c.lineWidth=2.2;
  c.beginPath();c.ellipse(2,-146,34,37,0,0,6.28);c.ellipse(14,-142,22,27,0,0,6.28);c.fill('evenodd');
  c.beginPath();c.ellipse(2,-146,34,37,0,0,6.28);c.stroke();
  c.beginPath();c.ellipse(14,-142,22,27,0,0,6.28);c.stroke();
  c.strokeStyle=WHITE2;c.lineWidth=1.4;c.beginPath();c.arc(-4,-146,24,2.6,4.2);c.stroke();c.beginPath();c.arc(-2,-148,16,2.7,4.0);c.stroke();
  c.restore();
  c.restore();
  c.save();body();armDraw(c,an[0],an[1],false);c.restore();
}
const GM=[[162, 356, 83.3], [198, 350, 111.1], [204, 350, 110.7], [190, 348, 103.9], [210, 343, 121.0], [183, 345, 102.7], [183, 346, 107.1], [230, 353, 142.9], [228, 358, 140.5], [183, 306, 108.1]];
function drawPlayer(c){
  const run=clamp(Math.abs(P.vx)/SPEED,0,1),air=!P.onGround;
  let a=P.alpha;if(P.inv>0&&Math.floor(T*14)%2)a*=.35;
  if(S.mode==='home'||(support(P.x)&&P.y<=GY+2)||P.on){const base=P.on?P.on.y:GY;const h=clamp((base-P.y)/220,0,1);c.fillStyle='rgba(20,20,40,'+(.28*(1-h))+')';c.beginPath();c.ellipse(P.x,base+3,28*(1-h*.4),6.5,0,0,6.28);c.fill()}
  const hurtOn=(P.hurtT||0)>0,cel=S.mode==='end'||(P.cel||0)>0;
  let f=0;
  if(air)f=P.vy<-60?7:8;
  else if((P.squash||0)>.55)f=9;
  else if(run>.05&&!cel&&!hurtOn)f=1+Math.floor(((P.anim/4.2)%1+1)%1*6);
  const img=IM['gf'+f];
  const m=GM[f],hs=190/350;
  let oy=0,sy=1,rot=0;
  if(f===0)sy=1+Math.sin(T*2.4)*.008;
  if(cel&&!air)oy=-Math.abs(Math.sin(T*8))*16;
  if(hurtOn)rot=-.16;
  c.save();c.globalAlpha=a;c.translate(P.x,P.y+oy);c.scale(P.face<0?-1:1,sy);c.rotate(rot);
  c.drawImage(img,-m[2]*hs,-m[1]*hs,m[0]*hs,m[1]*hs);
  c.restore();
}
function drawScenery(c){
  const x0=cam.x-160,x1=cam.x+LW+160;
  drawGround(c);
  drawPalmStart(c);
  drawDecor(c,lv.decor,x0,x1);
  for(const p of lv.plats)if(p.x+p.w>x0&&p.x<x1)drawPlat(c,p);
  if(lv.gate)drawGate(c,lv.gate);
}
function drawEntities(c){
  const x0=cam.x-160,x1=cam.x+LW+160;
  for(const cp of lv.cps)drawCheckpoint(c,cp);
  for(const b of lv.blocks){drawHiddenHint(c,b);drawBlock(c,b)}
  for(const b of lv.bushes)if(b.x>x0&&b.x<x1)drawBush(c,b.x);
  for(const cr of lv.crabs)if(cr.alive&&cr.x>x0&&cr.x<x1)drawCrab(c,cr);
  for(const b of lv.birds)if(b.alive&&b.x>x0&&b.x<x1)drawBird(c,b);
  for(const d of lv.coins)if(!d.got&&d.x>x0&&d.x<x1)drawCoin(c,d);
  for(const h of lv.hearts)if(!h.got)drawHeartItem(c,h);
  if(mood.night||(mood.glow&&S.si>=3)){const g=c.createRadialGradient(P.x,P.y-80,10,P.x,P.y-80,200);g.addColorStop(0,'rgba(255,240,200,.32)');g.addColorStop(1,'rgba(255,240,200,0)');c.fillStyle=g;c.fillRect(P.x-200,P.y-280,400,400)}
  drawPlayer(c);
  // واجهة مياه الحفر فوق اللاعب الساقط
  for(let i=0;i<lv.segs.length-1;i++){const a=lv.segs[i][1],b=lv.segs[i+1][0];if(b<x0||a>x1)continue;c.fillStyle='rgba(20,130,210,.5)';c.fillRect(a-2,GY+40,b-a+4,200)}
  for(const p of parts){
    const al=clamp(p.life/p.max,0,1);
    if(p.k==='t'){c.globalAlpha=al;c.fillStyle=p.c;c.strokeStyle='rgba(0,0,0,.45)';c.lineWidth=4;c.font='900 26px Cairo,sans-serif';c.textAlign='center';c.direction='ltr';c.strokeText(p.t,p.x,p.y);c.fillText(p.t,p.x,p.y);c.globalAlpha=1}
    else{c.globalAlpha=al;c.fillStyle=p.c;c.beginPath();c.arc(p.x,p.y,p.r,0,6.28);c.fill();c.globalAlpha=1}
  }
}
function tintPass(c){
  const m=mood;
  if(m.mul){const g=c.createLinearGradient(0,0,0,720);g.addColorStop(0,m.mul[0]);g.addColorStop(1,m.mul[1]);c.globalCompositeOperation='multiply';c.fillStyle=g;c.fillRect(0,0,LW,720);c.globalCompositeOperation='source-over'}
  if(m.glow){const gl=m.glow,g=c.createRadialGradient(gl.x*LW,gl.y*720,10,gl.x*LW,gl.y*720,gl.r);g.addColorStop(0,'rgba('+gl.c+','+gl.a+')');g.addColorStop(1,'rgba('+gl.c+',0)');c.globalCompositeOperation='screen';c.fillStyle=g;c.fillRect(0,0,LW,720);c.globalCompositeOperation='source-over'}
  if(m.night){
    for(let i=0;i<80;i++){const a=.35+.65*Math.abs(Math.sin(T*1.3+i));c.fillStyle='rgba(255,255,255,'+a*.9+')';c.beginPath();c.arc(hash(i)*LW,hash(i+99)*230,.8+hash(i+5)*1.5,0,6.28);c.fill()}
    const mx=1000-cam.x*.02,my=120,g=c.createRadialGradient(mx,my,20,mx,my,190);g.addColorStop(0,'rgba(220,230,255,.5)');g.addColorStop(1,'rgba(220,230,255,0)');c.fillStyle=g;c.beginPath();c.arc(mx,my,190,0,6.28);c.fill();c.fillStyle='#fff6dc';c.beginPath();c.arc(mx,my,46,0,6.28);c.fill();c.fillStyle='rgba(200,190,170,.4)';[[-14,-8,9],[12,10,7],[8,-18,5]].forEach(a=>{c.beginPath();c.arc(mx+a[0],my+a[1],a[2],0,6.28);c.fill()});
  }
}
function drawFlies(c){
  for(const f of flies){
    if(f.t<0)continue;const k=clamp(f.t/f.dur,0,1),e=k*k*(3-2*k);
    const x=lerp(f.sx,coinTarget.x,e),y=lerp(f.sy,coinTarget.y,e)-Math.sin(k*Math.PI)*60,s=1-e*.45;
    c.save();c.translate(x,y);c.scale(s,s);
    const g=c.createLinearGradient(-10,-10,10,10);g.addColorStop(0,'#fff6b0');g.addColorStop(1,'#e49a00');c.fillStyle=g;c.beginPath();c.arc(0,0,12,0,6.28);c.fill();c.strokeStyle='#b86e00';c.lineWidth=2;c.stroke();c.restore();
  }
}
function drawIris(c){
  if(S.iris===undefined||S.iris>=1)return;
  const k=S.iris,e=k*k*(3-2*k);
  const px=clamp(P.x-cam.x,0,LW),py=clamp(P.y-80,0,720),R=e*1500;
  c.save();c.fillStyle='#0d1236';c.beginPath();c.rect(0,0,LW,720);c.arc(px,py,Math.max(R,.01),0,6.28,true);c.fill('evenodd');c.restore();
}
function render(){
  if(!assetsReady)return;
  const c=ctx;c.setTransform(cv.width/LW,0,0,cv.height/720,0,0);c.globalAlpha=1;
  drawBackground(c);
  c.save();c.translate(-cam.x+(Math.random()-.5)*shake,(Math.random()-.5)*shake);
  drawScenery(c);
  c.restore();
  tintPass(c);
  c.save();c.translate(-cam.x+(Math.random()-.5)*shake,(Math.random()-.5)*shake);
  drawEntities(c);
  c.restore();
  drawFlies(c);
  const g=c.createRadialGradient(640,360,420,640,360,920);g.addColorStop(0,'rgba(10,10,40,0)');g.addColorStop(1,'rgba(10,10,40,.3)');
  c.fillStyle=g;c.fillRect(0,0,LW,720);
  drawIris(c);
}

/* ============ الحلقة الرئيسية ============ */
function enterHome(){
  S={mode:'home',points:0,coins:0,hearts:CONFIG.hearts,si:0};
  lv=HOME_LV;mood=MOODS[0];P=newPlayer();P.x=640;P.y=GY;cam.x=0;
  $('#hud').classList.remove('on');$('#touch').classList.remove('on');
}
enterHome();
let last=performance.now();
function frame(now){
  const dt=Math.min(.033,(now-last)/1000);last=now;
  if(!rotNeeded&&assetsReady){
    if(S.mode==='home'){P.x=cam.x+LW/2}
    tpApply();update(dt);render();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__game={go:i=>startStation(i),S:()=>S,P:()=>P,lv:()=>lv,keys,cam:()=>cam,openBlockQ,showMap};
})();

/* حماية الحقوق: الشعار الظاهر وحقوق الإعداد */
(function(){
  const TXT='إعداد : أ. عهود العبرية - مدرسة وادي غول للتعليم الأساسي (١-٩)';
  ['contextmenu','dragstart','copy','cut'].forEach(e=>document.addEventListener(e,ev=>ev.preventDefault()));
  const stage=document.querySelector('#stage');
  function ensure(){
    let c=document.getElementById('credit');
    if(!c){c=document.createElement('div');c.id='credit';(document.getElementById('app')||document.body).appendChild(c)}
    if(c.textContent!==TXT)c.textContent=TXT;
    if(c.hasAttribute('hidden'))c.removeAttribute('hidden');if(c.getAttribute('style'))c.removeAttribute('style');
    let w=document.getElementById('wm');
    if(!w&&stage){w=document.createElement('div');w.id='wm';stage.appendChild(w)}
    if(w){if(w.textContent!=='© أ. عهود العبرية')w.textContent='© أ. عهود العبرية';if(w.getAttribute('style'))w.removeAttribute('style')}
  }
  ensure();setInterval(ensure,1500);
  const mo=new MutationObserver(ensure);mo.observe(document.getElementById('app')||document.body,{childList:true});if(stage)mo.observe(stage,{childList:true});['credit','wm'].forEach(i=>{const e=document.getElementById(i);if(e)mo.observe(e,{attributes:true,childList:true,characterData:true,subtree:true})});
  ['300','400','500','700','900'].forEach(w=>{try{document.fonts.load(w+' 16px "Cairo"')}catch(_){}});
})();
