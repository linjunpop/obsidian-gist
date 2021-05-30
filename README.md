# Obsidian GitHub Gist Plugin

![GitHub release badge](https://badgen.net/github/release/linjunpop/obsidian-gist)

This is a plugin to display the [GitHub Gist](https://gist.github.com) in [Obsidian](https://obsidian.md).

## Example

The `gist` fenced code blocks will be rendered as a embed Gist view.

1. With only the Gist ID:

   ```gist
   30efbfd874fb1a16176d3f638a1e712a
   ```

2. With the username and Gist ID:

   ```gist
   linjunpop/30efbfd874fb1a16176d3f638a1e712a
   ```

3. Specify to only show a single file in the Gist:

   ```gist
   linjunpop/30efbfd874fb1a16176d3f638a1e712a#math.ex
   30efbfd874fb1a16176d3f638a1e712a#concat.ex
   ```

![Example Image](https://user-images.githubusercontent.com/214616/120093926-f90eb580-c14f-11eb-94e3-a414c7528aef.png)

## Installation

### Manually installing the plugin

- Copy over `main.js`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/obsidian-gist/`.

## Development

### Develop the plugin locally

- Clone your repo to a local development folder. For convenience, you can place this folder in your `.obsidian/plugins/obsidian-gist` folder.
- Install NodeJS, then run `npm i` in the command line under your repo folder.
- Run `npm run dev` to compile your plugin from `main.ts` to `main.js`.
- Make changes to `main.ts` (or create new `.ts` files). Those changes should be automatically compiled into `main.js`.
- Reload Obsidian to load the new version of your plugin.
- Enable plugin in settings window.
- For updates to the Obsidian API run `npm update` in the command line under your repo folder.

### Releasing new releases

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: https://github.com/obsidianmd/obsidian-sample-plugin/releases
- Upload the files `manifest.json`, `main.js` as binary attachments.
- Publish the release.
