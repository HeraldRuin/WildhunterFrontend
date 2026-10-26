export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response) => {
    if (typeof response.body !== 'string' || !response.body.includes('rel="prefetch" as="script"')) {
      return
    }

    response.body = response.body.replaceAll(
      '<link rel="prefetch" as="script"',
      '<link rel="prefetch"',
    )
  })
})
