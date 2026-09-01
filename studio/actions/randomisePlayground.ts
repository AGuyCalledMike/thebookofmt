import type {DocumentActionComponent} from 'sanity'

export function createRandomisePlaygroundAction(
  context: any
): DocumentActionComponent {
  const client = context.getClient({
    apiVersion: '2026-09-01',
  })

  return function RandomisePlaygroundAction(props) {
    if (props.type !== 'playground') {
      return null
    }

    const source = props.draft ?? props.published
    const images = Array.isArray(source?.images) ? source.images : []

    const disabled = images.length < 2

    return {
      label: 'Randomise order',
      disabled,
      title: disabled
        ? 'Add at least two images first'
        : 'Shuffle the Playground image order',

      onHandle: async () => {
        if (disabled) {
          props.onComplete()
          return
        }

        const shuffled = [...images]

        for (let i = shuffled.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }

        const baseId = props.id.replace(/^drafts\./, '')
        const draftId = `drafts.${baseId}`

        try {
          if (!props.draft && props.published) {
            const {
              _id,
              _rev,
              _createdAt,
              _updatedAt,
              ...publishedFields
            } = props.published

            await client.createIfNotExists({
              ...publishedFields,
              _id: draftId,
              _type: props.type,
            })
          }

          await client
            .patch(draftId)
            .set({
              images: shuffled,
            })
            .commit()

          props.onComplete()
        } catch (error) {
          console.error('Could not randomise Playground images:', error)
          window.alert('Could not randomise the Playground. Check the console for details.')
          props.onComplete()
        }
      },
    }
  }
}
