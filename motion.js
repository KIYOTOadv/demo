window.KiyotoMotion={install(isPaused){
 'use strict';
 const clean=[],loops=[],gs=window.gsap,ST=window.ScrollTrigger;
 if(gs&&ST)gs.registerPlugin(ST,window.Flip);
 const dialog=document.querySelector('.language-gate'),root=document.documentElement;
 let alive=true,intro=null,gateTween=null;
 const controllers=[];
 const clamp=gs?gs.utils.clamp(0,1):v=>Math.max(0,Math.min(1,v));
 const gateOpen=()=>!!dialog.open;
 const quiet=()=>isPaused()||document.hidden;
 // A shared rendering lifecycle: no frame queue while asleep, paused, or covered.
 function scene(canvas,draw,{gate=false}={}){
  if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;
  let width=1,height=1,frame=0,raf=0,time=0,last=0,visible=gate;
  const pointer={x:.5,y:.5,active:false,strength:0,targetX:.5,targetY:.5,pulse:0,trail:[],delta:.016};let stroke=null;
  const allowed=()=>alive&&!quiet()&&(gate?gateOpen():visible&&!gateOpen());
  const paint=ts=>{const dt=Math.min((ts-last)||16,35);last=ts;if(allowed()){time+=dt*.001;pointer.delta=dt*.001;const follow=1-Math.exp(-dt*.012);pointer.x+=(pointer.targetX-pointer.x)*follow;pointer.y+=(pointer.targetY-pointer.y)*follow;pointer.strength+=((pointer.active?1:0)-pointer.strength)*follow;pointer.pulse*=Math.exp(-dt*.002);pointer.trail.forEach(sample=>sample.life*=Math.exp(-dt*.003));pointer.trail=pointer.trail.filter(sample=>sample.life>.025);}draw(ctx,width,height,time,pointer);canvas.dataset.frames=String(++frame);};
  const loop=ts=>{raf=0;if(!allowed())return;paint(ts);raf=requestAnimationFrame(loop);};
  const sync=()=>{if(allowed()&&!raf){last=0;raf=requestAnimationFrame(loop);}else if(!allowed()){cancelAnimationFrame(raf);raf=0;}};
  const resize=()=>{const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;width=r.width;height=r.height;const d=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);ctx.setTransform(d,0,0,d,0,0);paint(0);sync();};
  const observer=new IntersectionObserver(e=>{visible=e[0].isIntersecting;sync();},{rootMargin:'80px'});observer.observe(canvas);
  const move=e=>{if(e.pointerType==='touch'||isPaused())return;if(e.pointerType==='pen'){sweep(e);return;}const r=canvas.getBoundingClientRect();pointer.targetX=clamp((e.clientX-r.left)/r.width);pointer.targetY=clamp((e.clientY-r.top)/r.height);pointer.active=true;};
  const leave=()=>pointer.active=false,activate=()=>{if(!isPaused())pointer.pulse=1;};
  const startStroke=e=>{if(isPaused())return;stroke={startX:e.clientX,startY:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};pointer.active=false;};
  const sweep=e=>{if(!stroke||isPaused())return;const dx=e.clientX-stroke.lastX,dy=e.clientY-stroke.lastY;if(!stroke.moved&&Math.hypot(e.clientX-stroke.startX,e.clientY-stroke.startY)<8)return;stroke.moved=true;if(Math.hypot(dx,dy)<2)return;const r=canvas.getBoundingClientRect();pointer.trail.push({x:clamp((e.clientX-r.left)/r.width),y:clamp((e.clientY-r.top)/r.height),vx:Math.max(-1,Math.min(1,dx/32)),vy:Math.max(-1,Math.min(1,dy/32)),life:1});pointer.trail=pointer.trail.slice(-8);stroke.lastX=e.clientX;stroke.lastY=e.clientY;};
  const down=e=>{if(e.pointerType==='touch')return;if(e.pointerType==='pen')startStroke(e);else activate();};
  const finish=()=>{stroke=null;pointer.active=false;};const release=e=>{if(e.pointerType!=='touch')finish();};
  const touchStart=e=>{if(e.touches.length===1)startStroke(e.touches[0]);else finish();},touchMove=e=>{if(e.touches.length===1)sweep(e.touches[0]);else finish();};
  const key=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}};
  canvas.addEventListener('pointermove',move,{passive:true});canvas.addEventListener('pointerleave',leave);canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('touchstart',touchStart,{passive:true});canvas.addEventListener('touchmove',touchMove,{passive:true});canvas.addEventListener('touchend',finish,{passive:true});canvas.addEventListener('touchcancel',finish,{passive:true});canvas.addEventListener('keydown',key);
  addEventListener('resize',resize);document.addEventListener('visibilitychange',sync);document.addEventListener('kiyoto:motion',sync);const gateChange=()=>{resize();sync();};document.addEventListener('kiyoto:gate',gateChange);
  loops.push(sync);resize();
  clean.push(()=>{cancelAnimationFrame(raf);observer.disconnect();removeEventListener('resize',resize);document.removeEventListener('visibilitychange',sync);document.removeEventListener('kiyoto:motion',sync);document.removeEventListener('kiyoto:gate',gateChange);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointerup',release);canvas.removeEventListener('pointercancel',release);canvas.removeEventListener('touchstart',touchStart);canvas.removeEventListener('touchmove',touchMove);canvas.removeEventListener('touchend',finish);canvas.removeEventListener('touchcancel',finish);canvas.removeEventListener('keydown',key);});
 }
 // Thin signal fragments sampled from the real mark. No floating dot texture.
 const points=window.KIYOTO_LOGO_POINTS||[];
 document.querySelectorAll('.signal-canvas').forEach(canvas=>{
  const pink=canvas.dataset.surface==='pink',frequency=canvas.dataset.kind==='frequency';
  const positions=new Float32Array(points.length*2);let previousWidth=0,previousHeight=0;
  scene(canvas,(ctx,w,h,t,p)=>{
   ctx.fillStyle=pink?'#EE2243':'#171717';ctx.fillRect(0,0,w,h);
   const size=Math.min(w*.84,h*.86),cx=w*.5,cy=h*.5;
   const px=(p.x-.5)*w,py=(p.y-.5)*h,reset=w!==previousWidth||h!==previousHeight,follow=1-Math.exp(-p.delta*9),radius=size*.23,radiusSquared=radius*radius;previousWidth=w;previousHeight=h;const strokes=p.trail.map(s=>({...s,x:(s.x-.5)*w,y:(s.y-.5)*h}));
   ctx.lineCap='butt';
   for(let band=0;band<4;band++){
    ctx.strokeStyle=pink?['#F5EFEA','#f5efea99','#17171788','#F5EFEA'][band]:['#EE2243','#F5EFEA','#EE2243','#ee2243cc'][band];
    ctx.lineWidth=band===1?1.15:1.4;ctx.beginPath();
    for(let i=band;i<points.length;i+=4){
     const [sx,sy]=points[i];let x=(sx-125)/250*size,y=(sy-137.5)/275*size;
     const flow=Math.sin(y/size*11+t*.7)*3+Math.sin(i*.17+t*.4)*1.2;
     const force=p.strength>.001?p.strength*clamp(1-Math.hypot(x-px,y-py)/(size*.45)):0;
     let swipeX=0,swipeY=0;for(const sample of strokes){const dx=x-sample.x,dy=y-sample.y,squared=dx*dx+dy*dy;if(squared>=radiusSquared)continue;const d=Math.sqrt(squared),brush=(1-d/radius)*sample.life;swipeX+=(dx/(d||1)+sample.vx*.8)*brush*size*.12;swipeY+=(dy/(d||1)+sample.vy*.8)*brush*size*.12;}
     x+=Math.max(-size*.26,Math.min(size*.26,swipeX));y+=Math.max(-size*.26,Math.min(size*.26,swipeY));
     const scatter=p.pulse*(30+(i%29)*3);x+=flow+Math.sin(i*.81)*scatter+(x-px)*force*.12;y+=Math.cos(i*.21+t*.55)*1.6+Math.cos(i*.67)*scatter+(y-py)*force*.12;
     if(frequency)x+=Math.sin(y/size*8+t*.4)*size*.025;
     const offset=i*2;if(reset){positions[offset]=x;positions[offset+1]=y;}else{positions[offset]+=(x-positions[offset])*follow;positions[offset+1]+=(y-positions[offset+1])*follow;}const length=2+(i%4)*.7;ctx.moveTo(cx+positions[offset],cy+positions[offset+1]);ctx.lineTo(cx+positions[offset]+length,cy+positions[offset+1]-.5);
    }ctx.stroke();
   }
  });
 });
 scene(document.querySelector('.gate-currents'),(ctx,w,h,t,p)=>{
  ctx.clearRect(0,0,w,h);ctx.strokeStyle='#F5EFEA';ctx.lineWidth=.9;const count=w<600?23:36;
  for(let j=0;j<count;j++){ctx.beginPath();const base=(j+.5)/count;for(let i=0;i<=90;i++){const x=(i/90*1.2-.1)*w;const bend=p.active?(p.y-.5)*h*.025*Math.exp(-Math.pow((x-p.x*w)/(w*.2),2)):0;const y=base*h+Math.sin(x/w*5+t*.22+base*2)*h*.07+Math.cos(x/w*2.4-t*.16)*h*.035+bend;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.globalAlpha=.19+(j%3)*.025;ctx.stroke();}ctx.globalAlpha=1;
 },{gate:true});
 const gatePosition=()=>{
  const logo=document.querySelector('.gate-logo'),options=document.querySelector('.gate-options');
  if(innerHeight<=650&&innerWidth>540){dialog.style.setProperty('--intro-options-top',Math.max(20,(innerHeight-options.offsetHeight)/2)+'px');return {scale:.72,x:-innerWidth*.26,y:0};}
  const maskHeight=Math.min(logo.offsetHeight,logo.offsetWidth*4011/2449),scale=Math.min(.9,Math.min(innerHeight*.34,320)/maskHeight);
  const visibleHeight=maskHeight*scale,gap=Math.max(24,Math.min(40,innerHeight*.035));
  const groupHeight=visibleHeight+gap+options.offsetHeight,top=Math.max(24,innerHeight*.44-groupHeight/2);
  dialog.style.setProperty('--intro-options-top',(top+visibleHeight+gap)+'px');
  const origin=logo.offsetHeight*.4,baseTop=logo.offsetTop+(logo.offsetHeight-maskHeight)/2;
  return {scale,x:0,y:top-(logo.offsetTop+origin+(baseTop-logo.offsetTop-origin)*scale)};
 };
 function showGate(){
  root.classList.toggle('gate-open',gateOpen());if(!gateOpen()){intro?.play();return;}
  if(!gs){document.querySelector('.gate-logo').style.transform='translateY(-18vh) scale(.47)';return;}
  gateTween?.kill();const position=gatePosition();
  if(dialog.dataset.reopened||isPaused()){gs.set('.gate-logo',position);gs.set('.gate-options',{autoAlpha:1,y:0});}
  else{gs.set('.gate-logo',{scale:1,x:0,y:0});gs.set('.gate-options',{autoAlpha:0,y:15});gateTween=gs.timeline().to('.gate-logo',{...position,duration:1.35,ease:'power3.inOut'},.85).to('.gate-options',{autoAlpha:1,y:0,duration:.65,ease:'power2.out'},2.05);}
 }
 const gateObserver=new MutationObserver(()=>{showGate();loops.forEach(f=>f());});gateObserver.observe(dialog,{attributes:true,attributeFilter:['open']});
 const gateResize=()=>{if(dialog.open&&gs){gateTween?.kill();gs.set('.gate-logo',gatePosition());gs.set('.gate-options',{autoAlpha:1,y:0});}};
 addEventListener('resize',gateResize);document.addEventListener('kiyoto:gate',showGate);
 clean.push(()=>{gateObserver.disconnect();gateTween?.kill();removeEventListener('resize',gateResize);document.removeEventListener('kiyoto:gate',showGate);root.classList.remove('gate-open');});
 if(gs){
  const context=gs.context(()=>{
   intro=gs.timeline({paused:true,defaults:{ease:'power3.out'}});
   if(document.querySelector('.giant-word'))intro.from('.logo-letter',{autoAlpha:0,filter:'blur(5px)',duration:.65,stagger:.09,clearProps:'filter'}).from('.logo-tagline',{autoAlpha:0,filter:'blur(3px)',duration:.65,clearProps:'filter'},.35).from('.masthead-foot',{autoAlpha:0,duration:.55},'-.3');
   else intro.from('.editorial-hero h1>span',{y:40,autoAlpha:0,duration:.9,stagger:.1});
   // Related shapes move as a composition, not a collection of unrelated reveals.
   document.querySelectorAll('.principle-figure').forEach((el,i)=>{const targets=el.querySelectorAll('i');const tl=gs.timeline({repeat:-1,yoyo:true,paused:true,defaults:{duration:3.4,ease:'sine.inOut'}});if(i===0)tl.to(targets[0],{scaleX:.58,rotation:20},0).to(targets[1],{x:45,scale:.65},0);else if(i===1)tl.to(targets,{rotation:j=>j?-95:95,scale:j=>j?1.1:.6,stagger:.1},0);else tl.to(targets,{x:j=>j?-48:48,scaleY:.68,stagger:.1},0);controllers.push({el,tl,visible:false});});
   const lines=document.querySelectorAll('.conversation-lines i');lines.forEach((el,i)=>{gs.set(el,{y:i*12,rotation:-12+i*.6});});
   if(lines.length){const tl=gs.timeline({repeat:-1,yoyo:true,paused:true}).to(lines,{x:70,y:i=>i*12+45,rotation:i=>-6+i*.4,duration:10,ease:'sine.inOut',stagger:.12});controllers.push({el:document.querySelector('.conversation'),tl,visible:false});}
   document.querySelectorAll('.registration-lines i').forEach((el,i)=>{gs.fromTo(el,{scaleX:.2},{scaleX:1,duration:1.2,delay:i*.1,ease:'power3.out'});});
   if(ST){
    document.querySelectorAll('.person').forEach(el=>{gs.fromTo(el.querySelector('.person-rule'),{scaleX:.15},{scaleX:1,ease:'none',scrollTrigger:{trigger:el,start:'top 85%',end:'bottom 75%',scrub:.8}});});
    const board=document.querySelector('.proof-board');if(board){
     const paper1=board.querySelector('.p-one'),paper2=board.querySelector('.p-two'),paper3=board.querySelector('.p-three'),focus=board.querySelector('.proof-focus');
     const scenes=[{r:[-14,13,-2],x:[-6,25,5],y:[-3,3,13],focus:.95},{r:[-4,4,0],x:[-20,20,0],y:[0,0,0],focus:1.06},{r:[0,0,0],x:[-5,5,0],y:[0,0,0],focus:.78},{r:[-7,7,0],x:[-10,12,8],y:[-4,0,10],focus:.96}];
     const selectStage=i=>{const config=scenes[i];[paper1,paper2,paper3].forEach((el,j)=>gs.to(el,{rotation:config.r[j],xPercent:config.x[j],yPercent:config.y[j],duration:isPaused()?0:.85,ease:'power3.inOut',overwrite:true}));gs.to(focus,{scale:config.focus,duration:isPaused()?0:.85,ease:'power3.inOut',overwrite:true});document.querySelector('.board-stage').textContent=`0${i+1} / 04`;document.querySelectorAll('button[data-stage]').forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));board.dataset.stage=i;};
     const stageLine=()=>matchMedia('(max-width:900px)').matches?'55%':'center';
     document.querySelectorAll('.stage').forEach((el,i)=>{ST.create({trigger:el,start:()=>'top '+stageLine(),end:()=>'bottom '+stageLine(),invalidateOnRefresh:true,onEnter:()=>selectStage(i),onEnterBack:()=>selectStage(i)});});
     document.querySelectorAll('button[data-stage]').forEach(b=>b.addEventListener('click',()=>selectStage(Number(b.dataset.stage))));selectStage(0);
    }
   }
  });
  clean.push(()=>context.revert());
 }
 const activeObserver=new IntersectionObserver(entries=>{entries.forEach(e=>{const c=controllers.find(c=>c.el===e.target);if(c){c.visible=e.isIntersecting;sync();}});},{rootMargin:'40px'});controllers.forEach(c=>activeObserver.observe(c.el));
 function sync(){root.classList.toggle('page-asleep',document.hidden);controllers.forEach(c=>c.tl.paused(!c.visible||quiet()||gateOpen()));if(isPaused()){intro?.progress(1).pause();gateTween?.progress(1).pause();}loops.forEach(f=>f());}
 document.addEventListener('kiyoto:motion',sync);document.addEventListener('visibilitychange',sync);document.addEventListener('kiyoto:gate',sync);
 requestAnimationFrame(()=>{if(alive){showGate();if(!gateOpen()&&!isPaused())intro?.play();if(isPaused())intro?.progress(1).pause();sync();ST?.refresh();}});
 clean.push(()=>{activeObserver.disconnect();document.removeEventListener('kiyoto:motion',sync);document.removeEventListener('visibilitychange',sync);document.removeEventListener('kiyoto:gate',sync);});
 return()=>{alive=false;clean.forEach(f=>f());};
}};
