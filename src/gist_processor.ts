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

class GistProcessor {
  static default() {
    return new GistProcessor()
  }

  constructor() {
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
    const pattern = /(?<protocol>https?:\/\/)?(?<host>gist\.github\.com\/)?((?<username>\w+)\/)?(?<gistID>\w+)(\#(?<filename>.+))?/

    const matchResult = gistString.match(pattern).groups

    const gistID = matchResult.gistID
    const gistFilename = matchResult.filename

    if (gistID === undefined) {
      return this._showError(el, gistString, `Could not found a valid Gist ID, please make sure your content and format is correct.`)
    }

    let gistURL = `https://gist.github.com/${gistID}.json`

    if (gistFilename !== undefined) {
      gistURL = `${gistURL}?file=${gistFilename}`
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

  private async _insertGistElement(el: HTMLElement, gistID: string, gistJSON: GistJSON) {
    // generate an uuid for each gist element
    const gistUUID = `${pluginName}-${nanoid()}`

    // build container
    let gistViewEl = document.createElement('gist-view')
    gistViewEl.id = gistUUID
    gistViewEl.setAttribute('gist-id', gistID)

    gistViewEl.setAttribute('div', gistJSON.div)
    gistViewEl.setAttribute('stylesheet', gistJSON.stylesheet)

    // insert container into the DOM
    el.appendChild(gistViewEl)
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
