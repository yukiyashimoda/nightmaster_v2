import type { AppLoadContext, EntryContext } from 'react-router'
import { ServerRouter } from 'react-router'
import { renderToReadableStream } from 'react-dom/server'
import { isbot } from 'isbot'

export const streamTimeout = 5_000

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  if (request.method.toUpperCase() === 'HEAD') {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    })
  }

  const userAgent = request.headers.get('user-agent')
  const waitForAll = (userAgent && isbot(userAgent)) || routerContext.isSpaMode

  const stream = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error: unknown) {
        responseStatusCode = 500
        console.error(error)
      },
    },
  )

  if (waitForAll) {
    await stream.allReady
  }

  responseHeaders.set('Content-Type', 'text/html')

  return new Response(stream, {
    headers: responseHeaders,
    status: responseStatusCode,
  })
}
