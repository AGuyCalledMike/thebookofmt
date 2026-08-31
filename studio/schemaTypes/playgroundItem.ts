import {defineField, defineType} from 'sanity'

export const playgroundItemType = defineType({
  name: 'playgroundItem',
  title: 'Playground',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Internal title',
      description: 'Used only in the CMS.',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'mediaType',
      title: 'Media type',
      type: 'string',
      initialValue: 'image',
      options: {
        list: [
          {title: 'Image / GIF', value: 'image'},
          {title: 'Video', value: 'video'},
        ],
        layout: 'radio',
      },
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
      name: 'alt',
      title: 'Alt text',
      type: 'string',
    }),

    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      initialValue: 100,
    }),

    defineField({
      name: 'hidden',
      title: 'Hide item',
      type: 'boolean',
      initialValue: false,
    }),
  ],

  orderings: [
    {
      title: 'Playground order',
      name: 'playgroundOrder',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],

  preview: {
    select: {
      title: 'title',
      hidden: 'hidden',
      media: 'image',
    },

    prepare({title, hidden, media}) {
      return {
        title: hidden ? `${title} — HIDDEN` : title,
        media,
      }
    },
  },
})