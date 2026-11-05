import {defineField, defineType} from 'sanity'

export const playgroundType = defineType({
  name: 'playground',
  title: 'Playground',
  type: 'document',

  fields: [
    defineField({
      name: 'items',
      title: 'Playground feed',
      description:
        'Add images, GIFs and videos to one feed, then drag to reorder them.',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'playgroundItem',
          title: 'Playground item',

          fields: [
            defineField({
              name: 'mediaType',
              title: 'Media type',
              type: 'string',
              options: {
                layout: 'radio',
                list: [
                  {title: 'Image / GIF', value: 'image'},
                  {title: 'Video', value: 'video'},
                ],
              },
              initialValue: 'image',
              validation: (Rule) => Rule.required(),
            }),

            defineField({
              name: 'image',
              title: 'Image / GIF',
              type: 'image',
              options: {
                hotspot: true,
              },
              hidden: ({parent}) => parent?.mediaType !== 'image',
            }),

            defineField({
              name: 'video',
              title: 'Video',
              type: 'file',
              options: {
                accept: 'video/*',
              },
              hidden: ({parent}) => parent?.mediaType !== 'video',
            }),

            defineField({
              name: 'videoMode',
              title: 'Video behaviour',
              type: 'string',
              options: {
                layout: 'radio',
                list: [
                  {title: 'Loop — autoplay, muted, no controls', value: 'loop'},
                  {title: 'Film — play with controls', value: 'film'},
                ],
              },
              initialValue: 'loop',
              hidden: ({parent}) => parent?.mediaType !== 'video',
            }),

            defineField({
              name: 'alt',
              title: 'Alt text',
              type: 'string',
              hidden: ({parent}) => parent?.mediaType !== 'image',
            }),

            defineField({
              name: 'hidden',
              title: 'Hide item',
              description:
                'Hide this item from the site without deleting it.',
              type: 'boolean',
              initialValue: false,
            }),
          ],

          preview: {
            select: {
              mediaType: 'mediaType',
              image: 'image',
              imageFilename: 'image.asset.originalFilename',
              videoFilename: 'video.asset.originalFilename',
              videoMode: 'videoMode',
              hidden: 'hidden',
            },

            prepare({
              mediaType,
              image,
              imageFilename,
              videoFilename,
              videoMode,
              hidden,
            }) {
              const isVideo = mediaType === 'video'
              const filename = isVideo ? videoFilename : imageFilename
              const mode = isVideo
                ? videoMode === 'film'
                  ? 'FILM'
                  : 'LOOP'
                : 'IMAGE / GIF'

              return {
                title: hidden
                  ? `${filename || 'Untitled item'} — HIDDEN`
                  : filename || 'Untitled item',
                subtitle: mode,
                media: isVideo ? undefined : image,
              }
            },
          },
        },
      ],
    }),

    // Legacy fields kept hidden so existing Playground content is not lost.
    // Once items have been migrated into the mixed feed these can stay hidden.
    defineField({
      name: 'images',
      title: 'Legacy images',
      type: 'array',
      hidden: true,
      of: [
        {
          type: 'image',
          name: 'playgroundImage',
          title: 'Image / GIF',
          options: {hotspot: true},
          fields: [
            defineField({name: 'alt', title: 'Alt text', type: 'string'}),
            defineField({
              name: 'hidden',
              title: 'Hide item',
              type: 'boolean',
              initialValue: false,
            }),
          ],
        },
      ],
    }),

    defineField({
      name: 'videos',
      title: 'Legacy videos',
      type: 'array',
      hidden: true,
      of: [
        {
          type: 'file',
          name: 'playgroundVideo',
          title: 'Video',
          options: {accept: 'video/*'},
          fields: [
            defineField({
              name: 'videoMode',
              title: 'Video behaviour',
              type: 'string',
              initialValue: 'loop',
            }),
            defineField({
              name: 'hidden',
              title: 'Hide item',
              type: 'boolean',
              initialValue: false,
            }),
          ],
        },
      ],
    }),
  ],

  preview: {
    prepare() {
      return {
        title: 'Playground',
      }
    },
  },
})
