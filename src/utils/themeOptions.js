export const normalizeThemeOptions = (options) => {
  return options && typeof options === 'object' && !Array.isArray(options)
    ? options
    : {}
}
