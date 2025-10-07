// Minimal toast API, themed for the game UI
(function(){
  function ensureContainer(){
    var el = document.querySelector('.toast-container');
    if(!el){
      el = document.createElement('div');
      el.className = 'toast-container';
      document.body.appendChild(el);
    }
    return el;
  }

  function showToast(kind, title, msg, actions){
    try{
      var container = ensureContainer();
      var t = document.createElement('div');
      t.className = 'toast ' + (kind||'info');
      var titleEl = document.createElement('div');
      titleEl.className = 'title';
      titleEl.textContent = title || '';
      var msgEl = document.createElement('div');
      msgEl.className = 'msg';
      msgEl.textContent = msg || '';
      t.appendChild(titleEl);
      t.appendChild(msgEl);
      if(actions && actions.length){
        var act = document.createElement('div');
        act.className = 'actions';
        actions.forEach(function(a){
          var b = document.createElement('button');
          b.className = 'btn';
          b.textContent = a.label;
          b.onclick = function(e){ e.stopPropagation(); a.onClick && a.onClick(); };
          act.appendChild(b);
        });
        t.appendChild(act);
      }
      container.appendChild(t);
      setTimeout(function(){ if(t && t.parentNode){ t.parentNode.removeChild(t); } }, 4000);
    }catch(e){
      console.warn('Toast failed:', e && e.message ? e.message : e);
    }
  }

  window.Toast = {
    success: function(title, msg, actions){ showToast('success', title, msg, actions); },
    error: function(title, msg, actions){ showToast('error', title, msg, actions); },
    info: function(title, msg, actions){ showToast('info', title, msg, actions); }
  };
})();



