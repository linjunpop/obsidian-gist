import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface GistPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: GistPluginSettings = {
	mySetting: 'default'
}

export default class GistPlugin extends Plugin {
	settings: GistPluginSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new GistPluginSettingTab(this.app, this));

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

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
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

class GistPluginSettingTab extends PluginSettingTab {
	plugin: GistPlugin;

	constructor(app: App, plugin: GistPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Settings for the Gist plugin.' });

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue('')
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
