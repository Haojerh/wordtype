window.WT = window.WT || {};

WT.Stats = (function(){
  "use strict";
  var STORAGE_KEY = 'wordtype:stats';
  var data = { games:0, wpmSum:0, rawSum:0, accSum:0, conSum:0, wpmMin:null, wpmMax:null };
  var els = {};

  function render(){
    var g = data.games || 0;
    els.wpm.textContent = g ? Math.round(data.wpmSum/g) : '-';
    els.raw.textContent = g ? Math.round((data.rawSum||0)/g) : '-';
    els.acc.textContent = g ? Math.round(data.accSum/g) + '%' : '-';
    els.con.textContent = g ? Math.round(data.conSum/g) + '%' : '-';
    els.games.textContent = g;
    els.min.textContent = g ? data.wpmMin : '-';
    els.max.textContent = g ? data.wpmMax : '-';
  }

  function save(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }catch(e){}
  }

  function init(ids){
    els = {
      wpm: document.getElementById(ids.wpm),
      raw: document.getElementById(ids.raw),
      acc: document.getElementById(ids.acc),
      con: document.getElementById(ids.con),
      games: document.getElementById(ids.games),
      min: document.getElementById(ids.min),
      max: document.getElementById(ids.max)
    };
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        var parsed = JSON.parse(raw);
        if(parsed && typeof parsed === 'object') data = parsed;
      }
    }catch(e){}
    render();
  }

  function record(wpm, rawWpm, acc, con){
    data.games = (data.games||0) + 1;
    data.wpmSum = (data.wpmSum||0) + wpm;
    data.rawSum = (data.rawSum||0) + rawWpm;
    data.accSum = (data.accSum||0) + acc;
    data.conSum = (data.conSum||0) + con;
    data.wpmMin = data.wpmMin === null ? wpm : Math.min(data.wpmMin, wpm);
    data.wpmMax = data.wpmMax === null ? wpm : Math.max(data.wpmMax, wpm);
    save();
    render();
  }

  function wipe(){
    data = { games:0, wpmSum:0, rawSum:0, accSum:0, conSum:0, wpmMin:null, wpmMax:null };
    render();
    try{ localStorage.removeItem(STORAGE_KEY); }catch(e){}
  }

  return { init: init, record: record, wipe: wipe };
})();
