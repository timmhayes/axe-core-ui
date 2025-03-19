(() => {

  const axeSrc = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.3/axe.min.js'
  const elementRef = 'axe-core-test-ui'

  const escapeHTML = (str) => {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
  }

  const runTests = async () => {
    // inject axe-core into main document and all iframes
    await Promise.all([injectAxe(window), ...[...document.querySelectorAll('iframe')].map(iframe => injectAxe(iframe.contentWindow))])

    axe.run((err, results) => {
      if (err) throw err
      console.log(results)
      log(`Tested: ${results.timestamp}`, true);

      ['Violations', 'Incomplete', 'Inapplicable', 'Passes'].forEach(type => {
        const resultArray = results[type.toLowerCase()]
        log(`
          <div class="${elementRef}-section"><button class="${elementRef}-toggle" aria-label="open section">+</button> ${type}: ${resultArray.length}
            <ol class="${elementRef}-list">${resultArray.map(reportItem => `
              <li>
                <strong>${reportItem.impact ? reportItem.impact : "N/A"}: </strong> ${reportItem.tags.filter(tag => !/cat\./.test(tag)).join(', ')}<br/>
                <a href="${reportItem.helpUrl}" target="_blank">${escapeHTML(reportItem.description)}</a>
                <ol>${reportItem.nodes.map(node => `
                  <li>
                    <a href="#" data-target='${JSON.stringify(node.target)}' class="${elementRef}-page-refs">${node.target.join(' =>')}</a>
                    ${node.failureSummary?`<span class="${elementRef}-about" title="${node.failureSummary}">[more]</span>`:''}
                  </li>`
                ).join('')}</ol>
              </li>`
            ).join('')}
            </ol>
          </div>
        `)
      })
    })
  }

  const highlightPageElement = async (e) => {
    // this code hightlights the element on the page that is referenced in the report, or when needed, an element in a child iframe
    if (e.target.classList.contains(`${elementRef}-page-refs`)) {
      e.preventDefault()
      const selectors = JSON.parse(e.target.dataset.target)
      let parentDocument = document
      let element
      selectors.forEach(selector => {
        element = parentDocument.querySelector(selector)
        if (element && element.contentDocument) parentDocument = element.contentDocument
      })
      if (parentDocument !== document) injectStyles(parentDocument)
      if (element) {
        element.classList.toggle(`${elementRef}-highlight`)
        e.target.classList.toggle(`${elementRef}-link-highlight`)
      }
    } else if (e.target.classList.contains(`${elementRef}-toggle`)) {
      e.target.parentElement.querySelector(`.${elementRef}-list`).classList.toggle('open')
      e.target.innerText = e.target.innerText === '+' ? '-' : '+'
    }
  }

  const log = async (message, wipeAll) => {
    const element = await getGUI()
    const results = element.querySelector(`#${elementRef}-results`)
    if (wipeAll) results.innerHTML = ''
    results.innerHTML += `<div>${message}</div>`
  }

  const getGUI = async () => {
    let element = document.querySelector(`#${elementRef}`)
    if (element) return element
    element = document.createElement('div')
    element.id = `${elementRef}`
    element.role = 'contentinfo'
    document.body.appendChild(element)
    element.innerHTML = htmlTemplate
    element.addEventListener('click', highlightPageElement)
    document.querySelector(`#${elementRef}-refresh`).addEventListener('click', ()=> {
      log('Refreshing...', true)
      setTimeout(runTests, 100)
    })
    document.querySelector(`#${elementRef}-close`).addEventListener('click', () => element.remove())
    injectStyles(document)
    return element
  }

  const injectAxe = async (win) => {
    return new Promise((resolve, reject) => {
      if (win.axe) return resolve(win.axe)
      else {
        const script = win.document.createElement('script')
        script.src = axeSrc
        win.document.body.appendChild(script)
        script.onload = () => resolve(win.axe)
        script.onerror = reject
      }
    })
  }

  const injectStyles = async (doc) => {
    let element = doc.querySelector(`#${elementRef}-styles`)
    if (element) return element
    element = doc.createElement('style')
    element.id = `${elementRef}-styles`
    doc.head.appendChild(element)
    element.innerHTML = styleTemplate
    return element
  }

  const htmlTemplate = `
    <div class="${elementRef}-head">
      <h2>AXE Core Test Results</h2>
      <button id="${elementRef}-refresh">Refresh</button>
      <button id="${elementRef}-close">Close</button>
    </div>
    <div id="${elementRef}-results"></div>
  `

  const styleTemplate = `
    #${elementRef} {
      background: #fff;
      border: 1px red solid;
      box-shadow: -1px 7px 15px 0px rgba(0,0,0,0.5);
      font-family: sans-serif;
      max-height: 100%;
      overflow: auto;
      padding: 0; 
      position: absolute;
      resize: vertical;
      right: 40px;
      top: 0;
      width: 600px;
      z-index: 999999;
    }
    .${elementRef}-head {
      background: #000;
      color: #fff;
      padding: 5px 10px;
    }
    #${elementRef} h2 {
      background: #000;
      color: #fff;
      display: inline-block;
      font-size: 1.5em;
      margin: 0;
      padding: 5px 10px;
    }
    #${elementRef} label.block {
      margin-top: 10px;
    }
    #${elementRef} li {
      margin: 5px 0!important;
    }
    #${elementRef}-refresh, #${elementRef}-close {
      color: #fff;
      cursor: pointer;
      background: #000;
      position: absolute;
      padding: 5px 10px;
      right: 0;
      top: 5px;
    }
    #${elementRef}-refresh { 
      right: 60px;
    }
    #${elementRef} input[type="text"],  #${elementRef} label.block {
      display: block;
       width: 100%;
    }
    #${elementRef}-results {
      padding: 10px;
    }
    .${elementRef}-section {
      margin: 5px 0;
    }
    .${elementRef}-link-highlight {
      background-color: rgba(255, 255, 0, 0.2)!important;
      font-weight: bold!important;
    }
    .${elementRef}-highlight {
      outline: 5px red solid!important;
      background-color: rgba(255, 0, 0, 0.2)!important;
    }
    .${elementRef}-list:not(.open) {
      display: none;
    }
    .${elementRef}-toggle { width: 20px;
      height: 20px;
      border: 1px black solid;
      text-align: center;
      padding: 0 2px;
      background: #fff;
      cursor: pointer;
      vertical-align: bottom}
    .${elementRef}-about {
      cursor: help;
    }
  `

  runTests()

})()
