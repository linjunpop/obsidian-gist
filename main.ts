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

      await Promise.all(
        gists.map(async (gist) => {
          this._processGist(el, gist)
        })
      )
    });
  }

  onunload() {
  }

  // private

  async _processGist(el: HTMLElement, gist: string) {
    // const [gistId, fileName] = gistIDAndFilename.split('#')
    const pattern = /(?<protocol>https?:\/\/)?(?<host>gist\.github\.com\/)?((?<username>\w+)\/)?(?<gistID>\w+)(\#(?<filename>.+))?/

    const matchResult = gist.match(pattern).groups

    if (matchResult.gistID === undefined) {
      this._showError(el, gist)
      return
    }

    let gistURL = `https://gist.github.com/${matchResult.gistID}.json`

    if (matchResult.filename !== undefined) {
      gistURL = `${gistURL}?file=${matchResult.filename}`
    }

    try {
      const response = await fetch(gistURL)

      if (response.ok) {
        const gistJSON = await response.json()
        await this._insertGistElement(el, gistJSON as GistJSON)
      } else {
        await this._showError(el, gist)
      }
    } catch (error) {
      await this._showError(el, gist)
    }
  }

  async _insertGistElement(el: HTMLElement, gistJSON: GistJSON) {
    // build div
    const divEl = document.createElement('div');
    divEl.innerHTML = gistJSON.div

    // build stylesheet link
    const stylesheetLink = document.createElement('link');
    stylesheetLink.rel = "stylesheet";
    stylesheetLink.href = gistJSON.stylesheet

    // container
    const containerDiv = document.createElement('section');
    containerDiv.appendChild(divEl)
    containerDiv.appendChild(stylesheetLink)

    // insert into the DOM
    el.appendChild(containerDiv)
  }

  async _showError(el: HTMLElement, gistIDAndFilename: String) {
    el.createEl('pre', { text: `Failed to load the Gist (${gistIDAndFilename}).` })
  }
}
