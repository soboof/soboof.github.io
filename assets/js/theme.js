/* Night/day theme. Remembered in localStorage under soboof.theme, and shared
   by every page — it used to be pasted inline into all seven. */
(function(){
  const KEY='soboof.theme';
  const btn=document.getElementById('theme-toggle');
  function apply(t){if(t==='day')document.body.classList.add('day');else document.body.classList.remove('day');}
  apply(localStorage.getItem(KEY)||'night');
  btn.addEventListener('click',()=>{
    const next=document.body.classList.contains('day')?'night':'day';
    apply(next);localStorage.setItem(KEY,next);
  });
})();
