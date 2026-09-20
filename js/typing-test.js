window.WT = window.WT || {};

WT.TypingTest = (function(){
  "use strict";

  var wordsEl, pageEl, captureEl, resultsEl, sbWordsEl, newWordsBtn, wordCounterEl;
  var resultEls = {};

  var words = [], wordEls = [], wordTypedLen = [];
  var curWordIdx = 0, curCharIdx = 0;
  var startTime = null, finished = false;
  var totalCorrect = 0, totalIncorrect = 0, curOverflow = 0;
  // totalMistakes counts every wrong keystroke ever made and is never decremented by
  // backspace, so accuracy still penalizes mistakes the user goes back and fixes.
  var totalMistakes = 0;
  var wpmSamples = [], sampleTimer = null;
  var mode = 'words';

  function pickWords(){
    var n = 30 + Math.floor(Math.random()*21);
    var arr = [];
    for(var i=0;i<n;i++){ arr.push(WT.WORD_BANK[Math.floor(Math.random()*WT.WORD_BANK.length)]); }
    return arr;
  }

  function pickParagraph(){
    var text = WT.PARAGRAPH_BANK[Math.floor(Math.random()*WT.PARAGRAPH_BANK.length)];
    return text.split(/\s+/);
  }

  function pickTokens(){
    return mode === 'paragraph' ? pickParagraph() : pickWords();
  }

  function setMode(newMode){
    if(mode === newMode) return;
    mode = newMode;
    restart();
  }

  function render(){
    words = pickTokens();
    wordEls = [];
    wordTypedLen = words.map(function(){ return 0; });
    wordsEl.innerHTML = '';
    words.forEach(function(w){
      var wordSpan = document.createElement('span');
      wordSpan.className = 'word';
      var letters = [];
      for(var ci=0; ci<w.length; ci++){
        var l = document.createElement('span');
        l.className = 'letter';
        l.textContent = w[ci];
        wordSpan.appendChild(l);
        letters.push(l);
      }
      var endMarker = document.createElement('span');
      endMarker.className = 'letter wordend';
      endMarker.style.width = '1px';
      wordSpan.appendChild(endMarker);
      letters.push(endMarker);
      wordEls.push(letters);
      wordsEl.appendChild(wordSpan);
    });
    sbWordsEl.textContent = words.join(' ').length + ' chars';
    updateCaret();
  }

  function restart(){
    clearInterval(sampleTimer);
    curWordIdx = 0; curCharIdx = 0;
    startTime = null; finished = false;
    totalCorrect = 0; totalIncorrect = 0; curOverflow = 0; totalMistakes = 0;
    wpmSamples = [];
    resultsEl.classList.remove('show');
    wordsEl.style.display = '';
    newWordsBtn.classList.remove('hidden');
    wordCounterEl.classList.remove('hidden');
    render();
  }

  function updateWordCounter(){
    var completed = finished ? words.length : curWordIdx;
    wordCounterEl.textContent = completed + '/' + words.length;
  }

  function updateCaret(){
    document.querySelectorAll('.letter.caret-before').forEach(function(el){ el.classList.remove('caret-before'); });
    updateWordCounter();
    if(finished) return;
    var letters = wordEls[curWordIdx];
    if(!letters) return;
    letters[curCharIdx].classList.add('caret-before');
    letters[0].parentElement.scrollIntoView({block:'nearest'});
  }

  function setLetterState(wi, ci, state){
    wordEls[wi][ci].className = 'letter ' + state;
  }

  function wordHasIssue(wi){
    var word = words[wi];
    if(wordTypedLen[wi] < word.length) return true;
    var letters = wordEls[wi];
    for(var i=0; i<word.length; i++){
      if(letters[i].className.indexOf('incorrect') !== -1) return true;
    }
    return false;
  }

  function lastWordComplete(){
    if(curOverflow > 0) return false;
    var word = words[curWordIdx];
    if(curCharIdx < word.length) return false;
    var letters = wordEls[curWordIdx];
    for(var i=0; i<word.length; i++){
      if(letters[i].className.indexOf('incorrect') !== -1) return false;
    }
    return true;
  }

  function startTimer(){
    startTime = performance.now();
    sampleTimer = setInterval(sampleWpm, 250);
  }

  function sampleWpm(){
    var elapsedMin = (performance.now() - startTime) / 60000;
    if(elapsedMin <= 0) return;
    wpmSamples.push(((totalCorrect + totalIncorrect) / 5) / elapsedMin);
  }

  function avg(arr){ return arr.reduce(function(a,b){return a+b;},0) / arr.length; }

  function computeConsistency(){
    if(wpmSamples.length < 2) return 100;
    var mean = avg(wpmSamples);
    if(mean <= 0) return 100;
    var variance = avg(wpmSamples.map(function(s){ return (s-mean)*(s-mean); }));
    var stdev = Math.sqrt(variance);
    return Math.max(0, Math.min(100, Math.round(100 * (1 - stdev/mean))));
  }

  function finishTest(){
    finished = true;
    clearInterval(sampleTimer);
    var elapsedMin = Math.max((performance.now() - startTime) / 60000, 1/6000);
    var wpm = Math.round((totalCorrect/5) / elapsedMin) || 0;
    var totalKeys = totalCorrect + totalIncorrect;
    var rawWpm = Math.round((totalKeys/5) / elapsedMin) || 0;
    var accuracyDenom = totalCorrect + totalMistakes;
    var accuracy = accuracyDenom ? Math.round((totalCorrect/accuracyDenom)*100) : 100;
    var consistency = computeConsistency();
    resultEls.wpm.textContent = wpm;
    resultEls.raw.textContent = rawWpm;
    resultEls.acc.textContent = accuracy + '%';
    resultEls.con.textContent = consistency + '%';
    updateCaret();
    wordsEl.style.display = 'none';
    newWordsBtn.classList.add('hidden');
    wordCounterEl.classList.add('hidden');
    resultsEl.classList.add('show');
    WT.Stats.record(wpm, rawWpm, accuracy, consistency);
  }

  function commitWordAdvance(){
    wordTypedLen[curWordIdx] = curCharIdx;
    curWordIdx++;
    curCharIdx = 0;
    curOverflow = 0;
    if(curWordIdx >= words.length){ finishTest(); return; }
    updateCaret();
  }

  function handleKeydown(e){
    if(finished) return;
    if(e.key === 'Backspace'){
      e.preventDefault();
      if(curOverflow > 0){
        curOverflow--;
        totalIncorrect--;
        if(curWordIdx === words.length - 1 && lastWordComplete()){ finishTest(); return; }
        return;
      }
      if(curCharIdx > 0){
        curCharIdx--;
        var prevEl = wordEls[curWordIdx][curCharIdx];
        if(prevEl.classList.contains('incorrect')) totalIncorrect--;
        else if(prevEl.classList.contains('correct')) totalCorrect--;
        setLetterState(curWordIdx, curCharIdx, 'pending');
        updateCaret();
        return;
      }
      if(curWordIdx > 0 && wordHasIssue(curWordIdx - 1)){
        totalCorrect--;
        curWordIdx--;
        curCharIdx = wordTypedLen[curWordIdx];
        updateCaret();
      }
      return;
    }
    if(e.key === ' '){
      e.preventDefault();
      if(curCharIdx === 0) return;
      if(curWordIdx === words.length - 1){
        if(lastWordComplete()) finishTest();
        return;
      }
      totalCorrect++;
      commitWordAdvance();
      return;
    }
    if(e.key.length === 1){
      e.preventDefault();
      if(!startTime) startTimer();
      var word = words[curWordIdx];
      if(curCharIdx < word.length){
        var correct = e.key === word[curCharIdx];
        setLetterState(curWordIdx, curCharIdx, correct ? 'correct' : 'incorrect');
        if(correct){ totalCorrect++; } else { totalIncorrect++; totalMistakes++; }
        curCharIdx++;
      } else {
        totalIncorrect++;
        totalMistakes++;
        curOverflow++;
      }
      if(curWordIdx === words.length - 1 && lastWordComplete()){
        finishTest();
        return;
      }
      updateCaret();
    }
  }

  function focusCapture(){
    captureEl.focus();
    pageEl.classList.add('focused');
  }

  function init(ids){
    wordsEl = document.getElementById(ids.words);
    pageEl = document.getElementById(ids.page);
    captureEl = document.getElementById(ids.capture);
    resultsEl = document.getElementById(ids.results);
    sbWordsEl = document.getElementById(ids.sbWords);
    newWordsBtn = document.getElementById(ids.newWordsBtn);
    wordCounterEl = document.getElementById(ids.wordCounter);
    resultEls = {
      wpm: document.getElementById(ids.rWpm),
      raw: document.getElementById(ids.rRaw),
      acc: document.getElementById(ids.rAcc),
      con: document.getElementById(ids.rCon)
    };

    captureEl.addEventListener('keydown', handleKeydown);
    pageEl.addEventListener('click', focusCapture);
    captureEl.addEventListener('blur', function(){ pageEl.classList.remove('focused'); });
    document.getElementById(ids.retryBtn).addEventListener('click', function(e){ e.stopPropagation(); restart(); focusCapture(); });
    newWordsBtn.addEventListener('click', function(e){ e.stopPropagation(); restart(); focusCapture(); });

    render();
    setTimeout(focusCapture, 50);
  }

  return { init: init, restart: restart, focusCapture: focusCapture, setMode: setMode };
})();
