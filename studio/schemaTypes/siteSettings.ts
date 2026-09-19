import {defineField, defineType} from 'sanity'

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',

  fields: [
    defineField({
      name: 'email',
      title: 'Contact email',
      description: 'Copied to the clipboard when someone clicks Contact.',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),

    defineField({
  name: 'portfolioLive',
  title: 'Portfolio live',
  type: 'boolean',
  description: 'Turn off to replace the portfolio with the holding page.',
  initialValue: true,
}),

    defineField({
      name: 'siteTitle',
      title: 'Site title',
      type: 'string',
      initialValue: 'The Book of MT',
    }),
  ],

  preview: {
    prepare() {
      return {
        title: 'Site Settings',
      }
    },
  },
})