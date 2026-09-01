import {defineField, defineType} from 'sanity'

const richTextBlock = {
  type: 'block',
  marks: {
    decorators: [
      {title: 'Bold', value: 'strong'},
      {title: 'Italic', value: 'em'},
    ],
    annotations: [
      {
        name: 'projectLink',
        title: 'Project link',
        type: 'object',
        fields: [
          defineField({
            name: 'project',
            title: 'Project',
            type: 'reference',
            to: [{type: 'project'}],
            validation: (Rule) => Rule.required(),
          }),
        ],
      },
      {
        name: 'externalLink',
        title: 'External link',
        type: 'object',
        fields: [
          defineField({
            name: 'href',
            title: 'URL',
            type: 'url',
            validation: (Rule) =>
              Rule.uri({
                scheme: ['http', 'https', 'mailto'],
              }),
          }),
          defineField({
            name: 'newTab',
            title: 'Open in new tab',
            type: 'boolean',
            initialValue: true,
          }),
        ],
      },
    ],
  },
}

export const infoType = defineType({
  name: 'info',
  title: 'Info',
  type: 'document',

  fields: [
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'array',
      of: [richTextBlock],
    }),

    defineField({
      name: 'timeline',
      title: 'Timeline',
      description: 'Add career and life milestones in the order they should appear.',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'timelineItem',
          title: 'Timeline item',

          fields: [
            defineField({
              name: 'year',
              title: 'Year',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),

            defineField({
              name: 'content',
              title: 'Text',
              description: 'You can bold words or add project links.',
              type: 'array',
              of: [richTextBlock],
            }),

            // Kept so existing timeline copy is not lost.
            // Once you have moved an entry into the rich Text field above,
            // this old value can simply remain hidden.
            defineField({
              name: 'text',
              title: 'Legacy text',
              type: 'string',
              hidden: true,
            }),
          ],

          preview: {
            select: {
              title: 'year',
              subtitle: 'text',
            },
            prepare({title, subtitle}) {
              return {
                title,
                subtitle: subtitle || 'Rich text timeline entry',
              }
            },
          },
        },
      ],
    }),

    defineField({
      name: 'alongTheWayRich',
      title: 'Along the way',
      description: 'You can bold words or link phrases directly to projects.',
      type: 'array',
      of: [richTextBlock],
    }),

    // Kept as a hidden fallback so the plain-text value you already entered
    // continues to display until you move it into the rich field above.
    defineField({
      name: 'alongTheWay',
      title: 'Legacy Along the way',
      type: 'text',
      rows: 3,
      hidden: true,
    }),

    defineField({
      name: 'clients',
      title: 'Select clients',
      type: 'array',
      of: [{type: 'string'}],
    }),

    defineField({
      name: 'experience',
      title: 'Experience',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'experienceItem',
          title: 'Experience item',

          fields: [
            defineField({
              name: 'company',
              title: 'Company',
              type: 'string',
            }),

            defineField({
              name: 'role',
              title: 'Role',
              type: 'string',
            }),

            defineField({
              name: 'years',
              title: 'Years',
              type: 'string',
            }),
          ],

          preview: {
            select: {
              title: 'company',
              subtitle: 'role',
            },
          },
        },
      ],
    }),
  ],

  preview: {
    prepare() {
      return {
        title: 'Info',
      }
    },
  },
})
