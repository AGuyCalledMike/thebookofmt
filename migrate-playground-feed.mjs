import {createClient} from '@sanity/client'

const client = createClient({
  projectId: 'rlg8i7d8',
  dataset: 'production',
  apiVersion: '2026-01-01',
  useCdn: false,
  token: process.env.SANITY_AUTH_TOKEN,
})

if (!process.env.SANITY_AUTH_TOKEN) {
  throw new Error(
    'Missing SANITY_AUTH_TOKEN. Run this with a Sanity token that has write access.'
  )
}

const playground = await client.fetch(`
  *[_type == "playground"][0] {
    _id,
    items,
    images[] {
      _key,
      alt,
      hidden,
      asset
    },
    videos[] {
      _key,
      hidden,
      videoMode,
      asset
    }
  }
`)

if (!playground?._id) {
  throw new Error('No Playground document found.')
}

if (Array.isArray(playground.items) && playground.items.length) {
  console.log('Playground already has a mixed feed. Nothing changed.')
  process.exit(0)
}

const items = [
  ...(playground.images ?? []).map((item) => ({
    _key: item._key,
    _type: 'playgroundItem',
    mediaType: 'image',
    image: {
      _type: 'image',
      asset: item.asset,
    },
    alt: item.alt || '',
    hidden: item.hidden === true,
  })),

  ...(playground.videos ?? []).map((item) => ({
    _key: item._key,
    _type: 'playgroundItem',
    mediaType: 'video',
    video: {
      _type: 'file',
      asset: item.asset,
    },
    videoMode: item.videoMode || 'loop',
    hidden: item.hidden === true,
  })),
]

await client.patch(playground._id).set({items}).commit()

console.log(`Migrated ${items.length} Playground items into the mixed feed.`)
