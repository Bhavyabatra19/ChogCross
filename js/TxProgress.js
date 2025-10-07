(function(){
  function mount(){
    var root = document.querySelector('.tx-progress-overlay');
    if(root) return root;
    root = document.createElement('div');
    root.className = 'tx-progress-overlay';
    root.innerHTML = '\n<div class="tx-progress">\n  <div class="tx-title">Processing Transaction</div>\n  <div class="tx-row"><div class="tx-spinner"></div><div class="tx-msg">Waiting for confirmation on chain...</div></div>\n  <div class="tx-link" id="tx-progress-link" style="display:none"></div>\n  <div class="tx-actions">\n    <button class="tx-btn" id="tx-progress-hide">Hide</button>\n  </div>\n</div>\n';
    document.body.appendChild(root);
    document.getElementById('tx-progress-hide').onclick = function(){ root.style.display='none'; };
    return root;
  }
  function explorerUrl(txHash){
    if(!txHash) return null;
    return 'https://testnet.monadexplorer.com/tx/' + txHash;
  }
  window.TxProgress = {
    show: function(txHash, title, msg){
      var el = mount();
      el.style.display = 'flex';
      var titleEl = el.querySelector('.tx-title');
      var msgEl = el.querySelector('.tx-msg');
      if(title) titleEl.textContent = title;
      if(msg) msgEl.textContent = msg;
      var linkWrap = document.getElementById('tx-progress-link');
      var url = explorerUrl(txHash);
      if(url){
        linkWrap.style.display='block';
        linkWrap.innerHTML = 'View on explorer: <a href="'+url+'" target="_blank" rel="noopener">'+txHash.slice(0,10)+'...</a>';
      } else {
        linkWrap.style.display='none';
        linkWrap.innerHTML = '';
      }
    },
    hide: function(){
      var el = document.querySelector('.tx-progress-overlay');
      if(el) el.style.display='none';
    }
  };
})();



