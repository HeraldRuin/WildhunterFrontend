export default defineNuxtPlugin(() => {
  useAuthToken().initFromStorage()
})
