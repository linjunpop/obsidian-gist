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

			gists.forEach(lineItem => {
				this._processLineItem(el, lineItem)
			});
		});
	}

	onunload() {
	}

	// private

	_processLineItem(el: HTMLElement, gistIDAndFilename: string) {
		const [gistId, fileName] = gistIDAndFilename.split('#')

		let gistURL = `https://gist.github.com/${gistId}.json`

		if (fileName !== undefined) {
			gistURL = `${gistURL}?file=${fileName}`
		}

		fetch(gistURL)
			.then(response => response.json())
			.then(gistJSON => {
				this._insertGistElement(el, gistJSON as GistJSON)
			}).catch(error => {
				this._showError(el, gistIDAndFilename)
			})
	}

	_insertGistElement(el: HTMLElement, gistJSON: GistJSON) {
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

	_showError(el: HTMLElement, gistIDAndFilename: String) {
		el.createEl('pre', { text: `Failed to load the Gist (${gistIDAndFilename}).` })
	}
}
