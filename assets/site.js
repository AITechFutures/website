/* Mobile menu toggle. */
(function(){var b=document.querySelector('.menu-btn'),n=document.getElementById('nav');if(!b||!n)return;
function close(){n.classList.remove('open');b.setAttribute('aria-expanded','false');b.textContent='Menu';}
b.addEventListener('click',function(){var o=n.classList.toggle('open');b.setAttribute('aria-expanded',o);b.textContent=o?'Close':'Menu';});
n.addEventListener('click',function(e){if(e.target.tagName==='A'&&n.classList.contains('open'))close();});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&n.classList.contains('open')){close();b.focus();}});})();

/* Hero headline word rotation. Runs one cycle then rests on the first word; pauses on hover; off for reduced motion. */
(function(){var r=document.querySelector('.rotator');if(!r||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
var w=r.getAttribute('data-words').split('|'),i=0,steps=w.length,held=false,h=r.closest('h1');
h.addEventListener('mouseenter',function(){held=true;});h.addEventListener('mouseleave',function(){held=false;});
var t=setInterval(function(){if(held||document.hidden)return;
  i=(i+1)%w.length;if(--steps<=0)clearInterval(t);
  r.classList.add('out');
  setTimeout(function(){r.textContent=w[i];r.classList.remove('out');r.classList.add('in');void r.offsetWidth;r.classList.remove('in');},350);
},2600);})();
