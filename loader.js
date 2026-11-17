/* محرك لعبة «مَزُون» التعليمية — تصميم: أ. عهود العبرية · CC BY-NC-SA 4.0 */
(function(){
  var U='https://geographyteacher122.github.io/Mazoon-Game-Template/engine.html';
  document.body.innerHTML='<div style="font:700 18px sans-serif;color:#fff;text-align:center;padding-top:40vh">جارٍ التحميل…</div>';
  fetch(U,{cache:'no-cache'}).then(function(r){if(!r.ok)throw 0;return r.text()}).then(function(h){
    document.open();document.write(h);document.close();
  }).catch(function(){
    document.body.innerHTML='<div style="font:700 18px sans-serif;color:#fff;text-align:center;padding:40vh 20px 0">تعذّر تحميل اللعبة. تحقق من اتصال الإنترنت ثم أعد المحاولة.</div>';
  });
})();
