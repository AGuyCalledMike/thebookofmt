import {defineField, defineType} from 'sanity'

export const playgroundType = defineType({
  name: 'playground',
  title: 'Playground',
  type: 'document',

  fields: [
    defineField({
      name: 'images',
      title: 'Images / GIFs',
      description:
        'Upload multiple images or GIFs at once, then drag to reorder them.',
      type: 'array',
      of: [
        {
          type: 'image',
          name: 'playgroundImage',
          title: 'Image / GIF',

          options: {
            hotspot: true,
          },

          fields: [
            defineField({
              name: 'alt',
              title: 'Alt text',
              type: 'string',
            }),

            defineField({
              name: 'hidden',
              title: 'Hide item',
              description:
                'Hide this image from the site without deleting it.',
              type: 'boolean',
              initialValue: false,
            }),
          ],

          preview: {
            select: {
              filename: 'asset.originalFilename',
              media: 'asset',
              hidden: 'hidden',
            },

            prepare({filename, media, hidden}) {
              return {
                title: hidden
                  ? `${filename || 'Untitled image'} — HIDDEN`
                  : filename || 'Untitled image',
                media,
              }
            },
          },
        },
      ],
    }),

    defineField({
      name: 'videos',
      title: 'Videos',
      description:
        'Add videos individually. These currently render after the image/GIF masonry.',
      type: 'array',
      of: [
        {
          type: 'file',
          name: 'playgroundVideo',
          title: 'Video',

          options: {
            accept: 'video/*',
          },

          fields: [
            defineField({
              name: 'hidden',
              title: 'Hide item',
              description:
                'Hide this video from the site without deleting it.',
              type: 'boolean',
              initialValue: false,
            }),
          ],

          preview: {
            select: {
              filename: 'asset.originalFilename',
              hidden: 'hidden',
            },

            prepare({filename, hidden}) {
              return {
                title: hidden
                  ? `${filename || 'Untitled video'} — HIDDEN`
                  : filename || 'Untitled video',
              }
            },
          },
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
