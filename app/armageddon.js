chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('www/main.html', {
    'outerBounds': {
      'width': 1050,
      'height': 768
    }
  });
});
