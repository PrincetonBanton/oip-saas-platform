const ENABLE_TRACER = true


 //Extracts file name from import.meta.url or returns raw location string
function resolveLocation(location) {
  if (typeof location === 'string' && (location.includes('/') || location.includes('\\'))) {
    return location.split('/').pop().split('?')[0]
  }
  return location
}

export function traceFlow(location, action, data = null) {
  if (!ENABLE_TRACER) return

  const file = resolveLocation(location)
  const timestamp = new Date().toLocaleTimeString()
  let alertMessage = `📍 [${timestamp}]\nFile/Component: [${file}]\nExecution: ${action}`

  if (data !== null) {
    try {
      const formattedData = typeof data === 'object' ? JSON.stringify(data, null, 2) : data
      alertMessage += `\n\nPayload / Data:\n${formattedData}`
    } catch {
      alertMessage += `\n\nPayload / Data: [Unserializable Object]`
    }
  }

  alert(alertMessage)
}