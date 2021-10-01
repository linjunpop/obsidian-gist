import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

import GistPluginSettings from './settings';
import { GistProcessor } from './gist_processor';

const DEFAULT_SETTINGS: GistPluginSettings = {
  styleSheet: null
}

export default class GistPlugin extends Plugin {
  settings: GistPluginSettings

  async onload() {
    // Settings
    await this.loadSettings()
    this.addSettingTab(new GistSettingTab(this.app, this));

    // Load the Gist processor
    const gistProcessor = new GistProcessor(this.settings)

    // Register the processor to Obsidian
    this.registerDomEvent(window, "message", gistProcessor.messageEventHandler)
    this.registerMarkdownCodeBlockProcessor("gist", gistProcessor.processor)
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class GistSettingTab extends PluginSettingTab {
  plugin: GistPlugin;

  constructor(app: App, plugin: GistPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'Settings for Gist Plugin.' });

    new Setting(containerEl)
      .setName('Custom Stylesheet')
      .setDesc('Override the default stylesheet')
      .addTextArea(text => text
        .setPlaceholder('Paste your custom stylesheet here')
        .setValue('')
        .onChange(async (value) => {
          this.plugin.settings.styleSheet = value;
          await this.plugin.saveSettings();
        }));
  }
}