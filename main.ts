import { Plugin } from 'obsidian';
import { nanoid } from 'nanoid';

type GistJSON = {
  description: string,
  public: Boolean,
  created_at: string,
  files: [string],
  owner: string,
  div: string,
  stylesheet: string
}

const pluginName = "obsidian-gist"
const obsidianAppOrigin = 'app://obsidian.md'

export default class GistPlugin extends Plugin {
  async onload() {
    this._injectContainerHeightAdjustmentScript()

    this.registerMarkdownCodeBlockProcessor("gist", async (sourceString: string, el, ctx) => {
      const gists = sourceString.trim().split("\n")

      return Promise.all(
        gists.map(async (gist) => {
          return this._processGist(el, gist)
        })
      )
    });
  }

  // private

  async _processGist(el: HTMLElement, gistString: string) {
    const pattern = /(?<protocol>https?:\/\/)?(?<host>gist\.github\.com\/)?((?<username>\w+)\/)?(?<gistID>\w+)(\#(?<filename>.+))?/

    const matchResult = gistString.match(pattern).groups

    const gistID = matchResult.gistID

    if (gistID === undefined) {
      return this._showError(el, gistString, `Could not found a valid Gist ID, please make sure your content and format is correct.`)
    }

    let gistURL = `https://gist.github.com/${gistID}.json`

    if (matchResult.filename !== undefined) {
      gistURL = `${gistURL}?file=${matchResult.filename}`
    }

    try {
      const response = await fetch(gistURL)

      if (response.ok) {
        const gistJSON = await response.json() as GistJSON
        return this._insertGistElement(el, gistID, gistJSON)
      } else {
        return this._showError(el, gistString, `Could not fetch the Gist info from GitHub server. (Code: ${response.status})`)
      }
    } catch (error) {
      return this._showError(el, gistString, `Could not fetch the Gist from GitHub server. (Error: ${error})`)
    }
  }

  async _insertGistElement(el: HTMLElement, gistID: string, gistJSON: GistJSON) {
    // generate an uuid for each gist element
    const gistUUID = `${pluginName}-${gistID}-${nanoid()}`

    // container
    const container = document.createElement('iframe');
    container.id = gistUUID
    container.classList.add(`${pluginName}-container`)
    container.setAttribute('sandbox', 'allow-scripts allow-top-navigation-by-user-activation')
    container.setAttribute('loading', 'lazy')

    // reset the default things on HTML
    const resetStylesheet = `
      <style>
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
        }
      </style>
    `

    // height adjustment script
    const heightAdjustmentScript = `
      <script>
        deliverHeightMessage = () => {
          const contentHeight = document.body.scrollHeight;

          top.postMessage({
            sender: '${pluginName}',
            gistUUID: '${gistUUID}',
            contentHeight: contentHeight
          }, '${obsidianAppOrigin}');
        }

        window.addEventListener('load', () => {
          deliverHeightMessage();
        })
      </script>
    `

    // build stylesheet link
    const stylesheetLink = document.createElement('link');
    stylesheetLink.rel = "stylesheet";
    stylesheetLink.href = gistJSON.stylesheet

    // hack to make links open in the parent 
    const parentLinkHack = document.createElement('base')
    parentLinkHack.target = "_parent"

    // Inject content into the iframe
    container.srcdoc = `
      <html>
        <head>
          <!-- hack -->
          ${resetStylesheet}
          ${parentLinkHack.outerHTML}
          ${heightAdjustmentScript}

          <!-- gist style -->
          ${stylesheetLink.outerHTML}
        </head>

        <body>
          ${gistJSON.div}
        </body>
      </html>
    `

    // insert container into the DOM
    el.appendChild(container)
  }

  async _showError(el: HTMLElement, gistIDAndFilename: String, errorMessage: String = '') {
    const errorText = `
Failed to load the Gist (${gistIDAndFilename}).

Error:

  ${errorMessage}
    `.trim()

    el.createEl('pre', { text: errorText })
  }

  _injectContainerHeightAdjustmentScript() {
    const containerHeightAdjustmentScript = document.createElement('script')
    containerHeightAdjustmentScript.id = `${pluginName}-container-height-adjustment`
    containerHeightAdjustmentScript.textContent = `
      window.addEventListener("message", (messageEvent) => {
        const sender = messageEvent.data.sender

        if (messageEvent.origin !== 'null') {
          // a message received from the iFrame with \`srcdoc\` attribute, the \`origin\` will be \`null\`.
          return;
        }

        // only process message coming from this plugin
        if (sender === '${pluginName}') {
          const gistUUID = messageEvent.data.gistUUID
          const contentHeight = messageEvent.data.contentHeight

          const gistContainer = document.querySelector('iframe#' + gistUUID)
          gistContainer.height = contentHeight
        }
      }, false)
    `

    document.head.appendChild(containerHeightAdjustmentScript)
  }
}
