# axe-core-ui
This repo contains a bookmarklet script for testing withe axe-core.

To use the bookmarklet, create a bookmark with the following URL:

`
javascript: (function(){ const script = document.createElement('script'); script.src='https://cdn.jsdelivr.net/gh/timmhayes/axe-core-ui@main/index.js'; document.head.appendChild(script)})()
`