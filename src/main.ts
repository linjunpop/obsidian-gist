import { Plugin } from 'obsidian';
import { GistProcessor } from './gist_processor';

export default class GistPlugin extends Plugin {
  async onload() {
    const gistProcessor = new GistProcessor()

    this.registerDomEvent(window, "message", gistProcessor.messageEventHandler)

    this.registerMarkdownCodeBlockProcessor("gist", gistProcessor.processor)
  }
}
