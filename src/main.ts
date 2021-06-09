import { Plugin } from 'obsidian';
import { nanoid } from 'nanoid';
import { GistProcessor } from './gist_processor';

export default class GistPlugin extends Plugin {
  async onload() {
    const gistProcessor = new GistProcessor()

    gistProcessor.injectContainerHeightAdjustmentScript()

    this.registerMarkdownCodeBlockProcessor("gist", gistProcessor.processor)
  }
}
