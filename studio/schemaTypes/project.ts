import {defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'

export const projectType = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',

  fields: [
    orderRankField({
      type: 'project',
      newItemPosition: 'after',
    }),

    defineField({
      name: 'title',
      title: 'Internal project title',
      description: 'Used only inside Sanity.',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'headline',
      title: 'Project headline',
      description: 'The headline shown on the website.',
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
      title: 'Media',
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
              options: {
                layout: 'radio',
                list: [
                  {title: 'Image', value: 'image'},
                  {title: 'Video', value: 'video'},
                  {title: 'Slideshow', value: 'slideshow'},
                  {title: '4-image gallery', value: 'gallery'},
                ],
              },
              initialValue: 'image',
              validation: (Rule) => Rule.required(),
            }),

            defineField({
              name: 'image',
              title: 'Image',
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
              name: 'poster',
              title: 'Poster image',
              description: 'Optional thumbnail shown before the video plays.',
              type: 'image',
              options: {
                hotspot: true,
              },
              hidden: ({parent}) => parent?.mediaType !== 'video',
            }),

            defineField({
              name: 'slides',
              title: 'Slides',
              type: 'array',
              hidden: ({parent}) => parent?.mediaType !== 'slideshow',
              validation: (Rule) =>
                Rule.custom((slides, context) => {
                  const parent = context.parent as {mediaType?: string} | undefined

                  if (parent?.mediaType !== 'slideshow') {
                    return true
                  }

                  if (!Array.isArray(slides) || slides.length < 2) {
                    return 'Add at least two images to a slideshow.'
                  }

                  return true
                }),
              of: [
                {
                  type: 'image',
                  name: 'slide',
                  title: 'Slide',
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
                  preview: {
                    select: {
                      title: 'asset.originalFilename',
                      media: 'asset',
                    },
                    prepare({title, media}) {
                      return {
                        title: title || 'Image',
                        media,
                      }
                    },
                  },
                },
              ],
            }),


            defineField({
              name: 'galleryImages',
              title: 'Gallery images',
              description: 'Upload exactly four images. They render as a 2 × 2 gallery on desktop.',
              type: 'array',
              hidden: ({parent}) => parent?.mediaType !== 'gallery',
              validation: (Rule) =>
                Rule.custom((images, context) => {
                  const parent = context.parent as {mediaType?: string} | undefined

                  if (parent?.mediaType !== 'gallery') {
                    return true
                  }

                  if (!Array.isArray(images) || images.length !== 4) {
                    return 'Add exactly four images.'
                  }

                  return true
                }),
              of: [
                {
                  type: 'image',
                  name: 'galleryImage',
                  title: 'Gallery image',
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
                  preview: {
                    select: {
                      title: 'asset.originalFilename',
                      media: 'asset',
                    },
                    prepare({title, media}) {
                      return {
                        title: title || 'Image',
                        media,
                      }
                    },
                  },
                },
              ],
            }),

            defineField({
              name: 'width',
              title: 'Width',
              type: 'string',
              options: {
                layout: 'radio',
                list: [
                  {title: 'Full', value: 'full'},
                  {title: 'Half', value: 'half'},
                ],
              },
              initialValue: 'full',
              validation: (Rule) => Rule.required(),
            }),

            defineField({
              name: 'alt',
              title: 'Alt text',
              type: 'string',
              hidden: ({parent}) => parent?.mediaType !== 'image',
            }),
          ],

          preview: {
            select: {
              mediaType: 'mediaType',
              width: 'width',
              image: 'image',
              poster: 'poster',
              firstSlide: 'slides.0',
              slideCount: 'slides',
              firstGalleryImage: 'galleryImages.0',
              galleryCount: 'galleryImages',
            },

            prepare({
              mediaType,
              width,
              image,
              poster,
              firstSlide,
              slideCount,
              firstGalleryImage,
              galleryCount,
            }) {
              const typeLabel =
                mediaType === 'video'
                  ? 'VIDEO'
                  : mediaType === 'slideshow'
                    ? 'SLIDESHOW'
                    : mediaType === 'gallery'
                      ? '4-IMAGE GALLERY'
                      : 'IMAGE'

              const widthLabel = width === 'half' ? 'HALF' : 'FULL'

              const subtitle =
                mediaType === 'slideshow' && Array.isArray(slideCount)
                  ? `${slideCount.length} slide${slideCount.length === 1 ? '' : 's'}`
                  : mediaType === 'gallery' && Array.isArray(galleryCount)
                    ? `${galleryCount.length} image${galleryCount.length === 1 ? '' : 's'}`
                    : undefined

              return {
                title: `${typeLabel} · ${widthLabel}`,
                subtitle,
                media:
                  mediaType === 'video'
                    ? poster
                    : mediaType === 'slideshow'
                      ? firstSlide
                      : mediaType === 'gallery'
                        ? firstGalleryImage
                        : image,
              }
            },
          },
        },
      ],
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
      title: 'Description',
      type: 'array',
      of: [{type: 'block'}],
    }),

    defineField({
      name: 'enableReadMore',
      title: 'Enable Read More',
      type: 'boolean',
      initialValue: false,
    }),

    defineField({
      name: 'longDescription',
      title: 'Long description',
      type: 'array',
      hidden: ({document}) => document?.enableReadMore !== true,
      of: [{type: 'block'}],
    }),

    // Kept hidden temporarily so existing projects with the old numeric
    // order value do not show "unknown field" warnings in Studio.
    // The website no longer uses this field.
    defineField({
      name: 'order',
      title: 'Legacy order',
      type: 'number',
      hidden: true,
    }),

    defineField({
      name: 'hidden',
      title: 'Hide project',
      description: 'Hide this project from the site without deleting it.',
      type: 'boolean',
      initialValue: false,
    }),
  ],

  preview: {
    select: {
      title: 'title',
      headline: 'headline',
      hidden: 'hidden',
    },

    prepare({title, headline, hidden}) {
      return {
        title: `${title || 'Untitled project'}${hidden ? ' — HIDDEN' : ''}`,
        subtitle: headline || 'No public headline yet',
      }
    },
  },
})
