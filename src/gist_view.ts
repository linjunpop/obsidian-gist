class GistView extends HTMLElement {
  private shadow: ShadowRoot

  constructor() {
    super()

    this.shadow = this.attachShadow({ mode: 'closed' });
  }

  connectedCallback() {
    this._setContent()
  }

  disconnectedCallback() {
    // cleanup?
    this.shadow.innerHTML = ''
  }

  _setContent() {
    const div = this.getAttribute('div')
    const stylesheet = this.getAttribute('stylesheet')

    const mainEl = document.createElement('main')
    mainEl.innerHTML = div

    const stylesheetLink = document.createElement('link');
    stylesheetLink.rel = "stylesheet";
    stylesheetLink.href = stylesheet

    this.shadow.appendChild(stylesheetLink)
    this.shadow.appendChild(mainEl)
  }
}

export { GistView }
