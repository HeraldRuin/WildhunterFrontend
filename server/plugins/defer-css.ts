function deferStylesheets(chunk: string) {
  return chunk.replace(/<link\b[^>]*\brel="stylesheet"[^>]*>/g, (match) => {
    if (match.includes('onload=') || /\bmedia=/.test(match)) {
      return match
    }

    const deferred = match.replace('<link', '<link media="print" onload="this.media=\'all\'"')
    return `${deferred}<noscript>${match}</noscript>`
  })
}

export default defineNitroPlugin((nitroApp) => {
  const assets = useStorage('assets:critical-css')

  nitroApp.hooks.hook('render:html', async (html) => {
    const [fontsCss, mainCss] = await Promise.all([
      assets.getItem('fonts.css'),
      assets.getItem('main.css'),
    ])
    const criticalCss = `${fontsCss ?? ''}\n${mainCss ?? ''}`

    html.head = html.head.map(chunk => deferStylesheets(chunk))
    html.head.unshift(`<style>${criticalCss}</style>`)
  })
})
