(function(){var r=document.createElement('div');r.className='fx';r.setAttribute('aria-hidden','true');document.body.prepend(r);
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var kind='orb',cols=['#4fe3ff','#8b5cff','#ff4fd8','#ffe14a'];
for(var i=0;i<(kind==='ember'?38:kind==='petal'?22:34);i++){var s=document.createElement('span'),sz=kind==='ember'?2+Math.random()*4:kind==='orb'?3+Math.random()*7:0;
s.style.left=Math.random()*100+'%';s.style.setProperty('--dx',(Math.random()*160-80)+'px');
if(sz){s.style.width=s.style.height=sz+'px';}
if(kind==='orb')s.style.setProperty('--c',cols[i%4]);
if(kind==='petal'){s.style.top='-5vh';s.style.animationName='fall';}else{s.style.bottom='-6vh';}
s.style.animationDuration=(kind==='petal'?12+Math.random()*14:8+Math.random()*12)+'s';s.style.animationDelay=(-Math.random()*20)+'s';r.appendChild(s);}})();