import { nanoid } from 'nanoid';

import GistPluginSettings from './settings';
import {request, RequestUrlParam} from "obsidian";

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

class GistProcessor {
  settings: GistPluginSettings

  constructor(settings: GistPluginSettings) {
    this.settings = settings
  }

  messageEventHandler = (messageEvent: MessageEvent) => {
    if (messageEvent.origin !== 'null') {
      // a message received from the iFrame with `srcdoc` attribute, the `origin` will be `null`.
      return;
    }

    const sender = messageEvent.data.sender

    // only process message coming from this plugin
    if (sender === pluginName) {
      const gistUUID = messageEvent.data.gistUUID
      const contentHeight = messageEvent.data.contentHeight

      const gistContainer: HTMLElement = document.querySelector('iframe#' + gistUUID)
      gistContainer.setAttribute('height', contentHeight)
    }
  }

  processor = async (sourceString: string, el: HTMLElement) => {
    const gists = sourceString.trim().split("\n")

    return Promise.all(
      gists.map(async (gist) => {
        return this._processGist(el, gist)
      })
    )
  };

  // private

  private async _processGist(el: HTMLElement, gistString: string) {
    const pattern = /(?<protocol>https?:\/\/)?(?<host>gist\.github\.com\/)?((?<username>[\w-]+)\/)?(?<gistID>\w+)(\#(?<filename>.+))?/

    const matchResult = gistString.match(pattern).groups

    const gistID = matchResult.gistID

    if (gistID === undefined) {
      return this._showError(el, gistString, `Could not found a valid Gist ID, please make sure your content and format is correct.`)
    }

    let gistURL = `https://gist.github.com/${gistID}.json`

    if (matchResult.filename !== undefined) {
      gistURL = `${gistURL}?file=${matchResult.filename}`
    }

    const urlParam: RequestUrlParam = {
      url: gistURL,
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    }
    try {
      const res = await request(urlParam)
      const gistJSON = JSON.parse(res) as GistJSON
      return this._insertGistElement(el, gistID, gistJSON)
    } catch (error) {
      return this._showError(el, gistString, `Could not fetch the Gist from GitHub server. (Error: ${error})`)
    }
  }

  private async _insertGistElement(el: HTMLElement, gistID: string, gistJSON: GistJSON) {
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

    // custom stylesheet
    let customStylesheet = ""
    if (this.settings.styleSheet && this.settings.styleSheet.length > 0) {
      customStylesheet = this.settings.styleSheet
    }

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

          <!-- custom style -->
          <style>
            ${customStylesheet}
          </style>
        </head>

        <body>
          ${gistJSON.div}
        </body>
      </html>
    `

    // insert container into the DOM
    el.appendChild(container)
  }

  private async _showError(el: HTMLElement, gistIDAndFilename: String, errorMessage: String = '') {
    const errorText = `
Failed to load the Gist (${gistIDAndFilename}).

Error:

  ${errorMessage}
    `.trim()

    el.createEl('pre', { text: errorText })
  }
}

export { GistProcessor }
