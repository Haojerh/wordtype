window.WT = window.WT || {};

WT.Settings = (function(){
  "use strict";
  var STORAGE_KEY = 'wordtype:quickrestart';
  var VALID = ['off', 'esc', 'tab', 'enter'];
  var mode = 'off';
  var onRestart = function(){};

  function load(){
    try{
      var saved = localStorage.getItem(STORAGE_KEY);
      if(VALID.indexOf(saved) !== -1) mode = saved;
    }catch(e){}
  }

  function renderOptions(container){
    container.querySelectorAll('.qr-opt').forEach(function(btn){
      btn.classList.toggle('active', btn.getAttribute('data-val') === mode);
    });
  }

  function init(container, restartCallback){
    onRestart = restartCallback || onRestart;
    load();
    renderOptions(container);
    container.querySelectorAll('.qr-opt').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        mode = btn.getAttribute('data-val');
        try{ localStorage.setItem(STORAGE_KEY, mode); }catch(err){}
        renderOptions(container);
      });
    });
    document.addEventListener('keydown', function(e){
      if(mode === 'off') return;
      var matches = (mode === 'esc' && e.key === 'Escape') ||
                    (mode === 'tab' && e.key === 'Tab') ||
                    (mode === 'enter' && e.key === 'Enter');
      if(matches){
        e.preventDefault();
        onRestart();
      }
    });
  }

  return { init: init };
})();
