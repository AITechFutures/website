/* Mobile menu toggle. The only script on the site. */
(function(){var b=document.querySelector('.menu-btn'),n=document.getElementById('nav');if(!b||!n)return;
function close(){n.classList.remove('open');b.setAttribute('aria-expanded','false');b.textContent='Menu';}
b.addEventListener('click',function(){var o=n.classList.toggle('open');b.setAttribute('aria-expanded',o);b.textContent=o?'Close':'Menu';});
n.addEventListener('click',function(e){if(e.target.tagName==='A'&&n.classList.contains('open'))close();});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&n.classList.contains('open')){close();b.focus();}});})();
