import { Plugin } from 'obsidian';

type GistJSON = {
  description: string,
  public: Boolean,
  created_at: string,
  files: [string],
  owner: string,
  div: string,
  stylesheet: string
}

export default class GistPlugin extends Plugin {
  async onload() {
    this.registerMarkdownCodeBlockProcessor("gist", async (sourceString: string, el, ctx) => {
      const gists = sourceString.trim().split("\n")

      return Promise.all(
        gists.map(async (gist) => {
          return this._processGist(el, gist)
        })
      )
    });
  }

  onunload() {
  }

  // private

  async _processGist(el: HTMLElement, gist: string) {
    const pattern = /(?<protocol>https?:\/\/)?(?<host>gist\.github\.com\/)?((?<username>\w+)\/)?(?<gistID>\w+)(\#(?<filename>.+))?/

    const matchResult = gist.match(pattern).groups

    if (matchResult.gistID === undefined) {
      return this._showError(el, gist)
    }

    let gistURL = `https://gist.github.com/${matchResult.gistID}.json`

    if (matchResult.filename !== undefined) {
      gistURL = `${gistURL}?file=${matchResult.filename}`
    }

    try {
      const response = await fetch(gistURL)

      if (response.ok) {
        const gistJSON = await response.json()
        return this._insertGistElement(el, gistJSON as GistJSON)
      } else {
        return this._showError(el, gist)
      }
    } catch (error) {
      return this._showError(el, gist)
    }
  }

  async _insertGistElement(el: HTMLElement, gistJSON: GistJSON) {
    // container
    const container = document.createElement('iframe');

    // auto adjust container height
    const innerStyle = `
      <style>
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
        }
      </style>
    `

    // build stylesheet link
    const stylesheetLink = document.createElement('link');
    stylesheetLink.rel = "stylesheet";
    stylesheetLink.href = gistJSON.stylesheet

    // Inject content into the iframe
    container.srcdoc = `${stylesheetLink.outerHTML} \n ${gistJSON.div} \n ${innerStyle}`
    container.setAttribute('onload', 'this.height=this.contentDocument.body.scrollHeight;')

    // insert into the DOM
    el.appendChild(container)
  }

  async _showError(el: HTMLElement, gistIDAndFilename: String) {
    el.createEl('pre', { text: `Failed to load the Gist (${gistIDAndFilename}).` })
  }
}
