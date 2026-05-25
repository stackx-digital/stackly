importScripts('config.js', 'api.js')

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'shorten-link',
    title: 'Shorten with Stackly',
    contexts: ['link', 'selection'],
  })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'shorten-link') return

  const urlToShorten = info.linkUrl || info.selectionText
  if (!urlToShorten) return

  const { session } = await chrome.storage.local.get('session')
  if (!session?.access_token) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Stackly',
      message: 'Please log in to Stackly extension first.',
    })
    return
  }

  try {
    const { shortUrl } = await createShortLink(urlToShorten, session.access_token)

    // Copy to clipboard via injected script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (text) => navigator.clipboard.writeText(text),
      args: [shortUrl],
    })

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Stackly – Link Shortened!',
      message: `${shortUrl} copied to clipboard.`,
    })
  } catch (e) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Stackly – Error',
      message: e.message || 'Failed to shorten link.',
    })
  }
})
