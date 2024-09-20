import { Hono } from 'hono'
import { Redis } from '@upstash/redis/cloudflare';
import { getEnsName } from '@wagmi/core'

import { http, createConfig } from '@wagmi/core'
import { mainnet, sepolia } from '@wagmi/core/chains'

export const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    // [sepolia.id]: http(),
  },
})

type Bindings = {
  REDIS_URL: string,
  REDIS_TOKEN: string,
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post('/set', async (c) => {

  const redis = new Redis({
    url: c.env.REDIS_URL,
    token: c.env.REDIS_TOKEN
  })

  try {
    const { key, value } = await c.req.json()

    await redis.set( encodeURI(key) , JSON.stringify(value) )

    return c.json({
      success: true,
      key,
      value
    })
  } catch (error) {
    return c.json({
      success: false,
      error: String(error)
    })
  }

})

app.get('/getredis/:key', async (c) => {

  let key = c.req.param('key')

  const redis = new Redis({
    url: c.env.REDIS_URL,
    token: c.env.REDIS_TOKEN
  })

  try {
    const value = await redis.get( encodeURI(key) ) as string;

    console.log('value', value)

    return c.json({
      success: true,
      key,
      value
    })
  } catch (error) {
    return c.json({
      success: false,
      error: String(error)
    })
  }


})


app.get('/get/:address', async (c) => {

  let address = c.req.param('address')

  const ensName = await getEnsName(config, { address })

  if (ensName) {
    return c.json({
      ens: ensName,
    })
  } else {
    return c.json({
      ens: null,
    })
  }


})

export default app
