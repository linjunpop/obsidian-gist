import { Plugin } from 'obsidian';
import { GistProcessor } from './gist_processor';
import { GistView } from './gist_view';

export default class GistPlugin extends Plugin {
  async onload() {
    window.customElements.define(
      'gist-view',
      GistView
    );

    this.registerMarkdownCodeBlockProcessor("gist", GistProcessor.default().processor)
  }
}
