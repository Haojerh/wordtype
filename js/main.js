(function(){
  "use strict";

  WT.renderIcons();

  var profileBtn = document.getElementById('profileBtn');
  var profilePanel = document.getElementById('profilePanel');
  var settingsBtn = document.getElementById('settingsBtn');
  var settingsPanel = document.getElementById('settingsPanel');

  function closePanels(){
    profilePanel.classList.remove('show');
    settingsPanel.classList.remove('show');
  }

  profileBtn.addEventListener('click', function(e){
    e.stopPropagation();
    settingsPanel.classList.remove('show');
    profilePanel.classList.toggle('show');
  });
  settingsBtn.addEventListener('click', function(e){
    e.stopPropagation();
    profilePanel.classList.remove('show');
    settingsPanel.classList.toggle('show');
  });
  profilePanel.addEventListener('click', function(e){ e.stopPropagation(); });
  settingsPanel.addEventListener('click', function(e){ e.stopPropagation(); });
  document.addEventListener('click', closePanels);

  var wipeOverlay = document.getElementById('wipeConfirmOverlay');
  document.getElementById('wipeHistoryBtn').addEventListener('click', function(e){
    e.stopPropagation();
    wipeOverlay.classList.add('show');
  });
  document.getElementById('wipeCancelBtn').addEventListener('click', function(e){
    e.stopPropagation();
    wipeOverlay.classList.remove('show');
  });
  document.getElementById('wipeConfirmBtn').addEventListener('click', function(e){
    e.stopPropagation();
    WT.Stats.wipe();
    wipeOverlay.classList.remove('show');
    closePanels();
  });
  wipeOverlay.addEventListener('click', function(e){
    if(e.target === wipeOverlay) wipeOverlay.classList.remove('show');
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') wipeOverlay.classList.remove('show');
  });

  WT.Stats.init({
    wpm:'pStatWpm', raw:'pStatRaw', acc:'pStatAcc', con:'pStatCon', games:'pStatGames',
    min:'pStatMin', max:'pStatMax'
  });

  WT.Settings.init(settingsPanel, function(){
    WT.TypingTest.restart();
    WT.TypingTest.focusCapture();
  });

  WT.TypingTest.init({
    words:'words', page:'page', capture:'capture', results:'results',
    sbWords:'sbWords', newWordsBtn:'newWordsBtn', wordCounter:'wordCounter',
    retryBtn:'retryBtn', rWpm:'rWpm', rRaw:'rRaw', rAcc:'rAcc', rCon:'rCon'
  });

  var modeWordsBtn = document.getElementById('modeWords');
  var modeParagraphBtn = document.getElementById('modeParagraph');
  modeWordsBtn.addEventListener('click', function(e){
    e.stopPropagation();
    modeWordsBtn.classList.add('selected');
    modeParagraphBtn.classList.remove('selected');
    WT.TypingTest.setMode('words');
    WT.TypingTest.focusCapture();
  });
  modeParagraphBtn.addEventListener('click', function(e){
    e.stopPropagation();
    modeParagraphBtn.classList.add('selected');
    modeWordsBtn.classList.remove('selected');
    WT.TypingTest.setMode('paragraph');
    WT.TypingTest.focusCapture();
  });
})();
