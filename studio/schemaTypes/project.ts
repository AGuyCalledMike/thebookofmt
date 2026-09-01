import {defineField, defineType} from 'sanity'

export const projectType = defineType({
  name: 'project',
  title: 'Projects',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Project title',
      description: 'Internal name used in the CMS. This does not appear on the website.',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'headline',
      title: 'Project headline',
      description: 'The large headline displayed at the top of the project.',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags',
      },
    }),

    defineField({
      name: 'media',
      title: 'Project media',
      description: 'Add images or video in the order they should appear.',
      type: 'array',

      of: [
        {
          type: 'object',
          name: 'mediaItem',
          title: 'Media item',

          fields: [
            defineField({
              name: 'mediaType',
              title: 'Media type',
              type: 'string',
              initialValue: 'image',
       options: {
  list: [
    {title: 'Image / GIF', value: 'image'},
    {title: 'Video', value: 'video'},
    {title: 'Slideshow', value: 'slideshow'},
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
  name: 'slides',
  title: 'Slideshow images',
  description: 'Add the images that should rotate inside this slideshow block.',
  type: 'array',
  of: [
    {
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
        }),
      ],
    },
  ],
  hidden: ({parent}) => parent?.mediaType !== 'slideshow',
}),

            defineField({
              name: 'width',
              title: 'Desktop width',
              type: 'string',
              initialValue: 'full',
              options: {
                list: [
                  {title: 'Full width', value: 'full'},
                  {title: 'Half width', value: 'half'},
                ],
                layout: 'radio',
              },
              validation: (Rule) => Rule.required(),
            }),

            defineField({
              name: 'alt',
              title: 'Alt text',
              type: 'string',
              description: 'A short description of the image for accessibility.',
            }),
          ],



          preview: {
            select: {
              mediaType: 'mediaType',
              width: 'width',
              image: 'image',
            },

            

            prepare({mediaType, width, image}) {
              return {
                title: mediaType === 'video' ? 'Video' : 'Image',
                subtitle: width === 'half' ? 'Half width' : 'Full width',
                media: image,
              }
            },
          },
        },
      ],
    }),

        defineField({
      name: 'mobileMediaMode',
      title: 'Mobile media layout',
      description: 'Choose how this project’s media appears on mobile.',
      type: 'string',
      initialValue: 'stack',
      options: {
        list: [
          {title: 'Stack', value: 'stack'},
          {title: 'Swipe slideshow', value: 'slideshow'},
        ],
        layout: 'radio',
      },
    }),

    defineField({
      name: 'brand',
      title: 'Brand',
      type: 'string',
    }),

    defineField({
      name: 'projectName',
      title: 'Project',
      type: 'string',
    }),

    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
    }),

    defineField({
      name: 'agency',
      title: 'Agency',
      type: 'string',
    }),

   defineField({
  name: 'description',
  title: 'Short description',
  description: 'The concise version shown by default on the website.',
  type: 'array',
  of: [{type: 'block'}],
}),

defineField({
  name: 'enableReadMore',
  title: 'Enable Read More',
  description: 'Allow this project to expand into a longer case study.',
  type: 'boolean',
  initialValue: false,
}),

defineField({
  name: 'longDescription',
  title: 'Long description',
  description: 'The full version that replaces the short description when Read More is opened.',
  type: 'array',
  of: [{type: 'block'}],
  hidden: ({parent}) => !parent?.enableReadMore,
}),

    defineField({
      name: 'order',
      title: 'Order',
      description: 'Lower numbers appear first.',
      type: 'number',
      initialValue: 100,
    }),

    defineField({
      name: 'hidden',
      title: 'Hide project',
      description: 'Hide this project from the website without deleting it.',
      type: 'boolean',
      initialValue: false,
    }),
  ],

  orderings: [
    {
      title: 'Portfolio order',
      name: 'portfolioOrder',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],

  preview: {
    select: {
      title: 'title',
      headline: 'headline',
      brand: 'brand',
      hidden: 'hidden',
      media: 'media.0.image',
    },

    prepare({title, headline, brand, hidden, media}) {
      return {
        title: hidden ? `${title} — HIDDEN` : title,
        subtitle: brand || headline,
        media,
      }
    },
  },
})