import {defineField, defineType} from 'sanity'

export const infoType = defineType({
  name: 'info',
  title: 'Info',
  type: 'document',

  fields: [
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'array',
      of: [{type: 'block'}],
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
              title: 'Company / Agency',
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
              role: 'role',
              years: 'years',
            },

            prepare({title, role, years}) {
              return {
                title,
                subtitle: [role, years].filter(Boolean).join(' · '),
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
        title: 'Info',
      }
    },
  },
})