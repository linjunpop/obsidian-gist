import { Plugin } from 'obsidian';

export default class GistPlugin extends Plugin {
	async onload() {
		this.registerMarkdownCodeBlockProcessor("gist", async (sourceString: string, el, ctx) => {
			// Extract gist info from the block
			// FIXME: now, only the first line of the gist is valid, support multi-line?
			const gistInfo = sourceString.split("\n")[0]
			const [gistId, fileName] = gistInfo.split('#')

			let gistURL = `https://gist.github.com/${gistId}.json`

			if (fileName !== undefined) {
				gistURL = `${gistURL}?file=${fileName}`
			}

			fetch(gistURL)
				.then(response => response.json())
				.then(gistJSON => {
					this._insertGistElement(el, gistJSON)
				}).catch(error => {
					this._showError(el, gistInfo)
				})
		});
	}

	onunload() {
		console.log('unloading plugin');
	}

	// private
	_insertGistElement(el: HTMLElement, gistJSON: any) {
		// build container div
		const containerDiv = document.createElement('section');
		containerDiv.innerHTML = gistJSON.div

		// build stylesheet link
		const stylesheetLink = document.createElement('link');
		stylesheetLink.rel = "stylesheet";
		stylesheetLink.href = gistJSON.stylesheet

		el.appendChild(containerDiv)
		el.appendChild(stylesheetLink)
	}

	_showError(el: HTMLElement, gistInfo: String) {
		el.createEl('pre', { text: `Failed to load the Gist (${gistInfo}).` })
	}
}
