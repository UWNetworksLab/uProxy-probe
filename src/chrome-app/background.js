chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('uprobe.html', {
    'bounds': {
      'width': 400,
      'height': 500
    }
  });
});
