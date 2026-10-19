import {defineField, defineType} from 'sanity'
import {orderRankField} from '@sanity/orderable-document-list'
import GalleryImagePickerInput from '../components/GalleryImagePickerInput'
import SlideshowImagePickerInput, {SlideshowVideoPickerInput} from '../components/SlideshowImagePickerInput'

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
  description: 'The headline shown on the website. Add a line break where you want it to wrap.',
  type: 'text',
  rows: 2,
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
                  {title: 'Video slideshow', value: 'videoSlideshow'},
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
  name: 'videoMode',
  title: 'Video behaviour',
  type: 'string',
  options: {
    layout: 'radio',
    list: [
      {title: 'Film — play with controls', value: 'film'},
      {title: 'Loop — autoplay, muted, no controls', value: 'loop'},
    ],
  },
  initialValue: 'film',
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
              name: 'slideshowType',
              title: 'Slideshow media',
              type: 'string',
              options: {
                layout: 'radio',
                list: [
                  {title: 'Image', value: 'image'},
                  {title: 'Film', value: 'film'},
                ],
              },
              initialValue: 'image',
              hidden: ({parent}) => parent?.mediaType !== 'slideshow',
            }),

            defineField({
              name: 'slides',
              title: 'Images',
              description: 'Select two or more images from the image library.',
              type: 'array',
              hidden: ({parent}) =>
                parent?.mediaType !== 'slideshow' || parent?.slideshowType === 'film',
              components: {
                input: SlideshowImagePickerInput,
              },
              validation: (Rule) =>
                Rule.custom((slides, context) => {
                  const parent = context.parent as
                    | {mediaType?: string; slideshowType?: string}
                    | undefined

                  if (
                    parent?.mediaType !== 'slideshow' ||
                    parent?.slideshowType === 'film'
                  ) {
                    return true
                  }

                  if (!Array.isArray(slides) || slides.length < 2) {
                    return 'Add at least two images to the slideshow.'
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
              name: 'slideVideos',
              title: 'Films',
              description: 'Select two or more films from the media library.',
              type: 'array',
              hidden: ({parent}) =>
                parent?.mediaType !== 'slideshow' || parent?.slideshowType !== 'film',
              components: {
                input: SlideshowVideoPickerInput,
              },
              validation: (Rule) =>
                Rule.custom((films, context) => {
                  const parent = context.parent as
                    | {mediaType?: string; slideshowType?: string}
                    | undefined

                  if (
                    parent?.mediaType !== 'slideshow' ||
                    parent?.slideshowType !== 'film'
                  ) {
                    return true
                  }

                  if (!Array.isArray(films) || films.length < 2) {
                    return 'Add at least two films to the slideshow.'
                  }

                  return true
                }),
              of: [
                {
                  type: 'file',
                  name: 'slideFilm',
                  title: 'Film',
                  options: {
                    accept: 'video/*',
                  },
                },
              ],
            }),

            defineField({
              name: 'videoSlides',
              title: 'Video slides',
              description: 'Videos play muted and loop until their display time expires. Drag to reorder.',
              type: 'array',
              hidden: ({parent}) => parent?.mediaType !== 'videoSlideshow',
              validation: (Rule) => Rule.custom((slides, context) => {
                const parent = context.parent as {mediaType?: string} | undefined
                return parent?.mediaType !== 'videoSlideshow' || (Array.isArray(slides) && slides.length >= 2)
                  ? true : 'Add at least two video slides.'
              }),
              of: [{
                type: 'object',
                name: 'videoSlide',
                title: 'Video slide',
                fields: [
                  defineField({name: 'title', title: 'Description', type: 'string', validation: (Rule) => Rule.required()}),
                  defineField({name: 'video', title: 'Video', type: 'file', options: {accept: 'video/*'}, validation: (Rule) => Rule.required()}),
                  defineField({name: 'poster', title: 'Poster image', type: 'image', options: {hotspot: true}}),
                  defineField({name: 'duration', title: 'Display time (seconds)', description: 'Time before the next fade starts. Shorter videos loop.', type: 'number', initialValue: 5, validation: (Rule) => Rule.required().min(0.5).max(600)}),
                ],
                preview: {select: {title: 'title', media: 'poster'}},
              }],
            }),
            defineField({
              name: 'videoTransitionDuration',
              title: 'Fade duration (seconds)',
              description: 'Use 0 for an immediate cut. This is added after each slide’s display time.',
              type: 'number',
              initialValue: 0.5,
              hidden: ({parent}) => parent?.mediaType !== 'videoSlideshow',
              validation: (Rule) => Rule.min(0).max(10),
            }),

            defineField({
              name: 'galleryImages',
              title: 'Gallery images',
              description: 'Select exactly four images from the Media Library.',
              type: 'array',
              hidden: ({parent}) => parent?.mediaType !== 'gallery',
              components: {
                input: GalleryImagePickerInput,
              },
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
              slideshowType: 'slideshowType',
              firstSlide: 'slides.0',
              slideCount: 'slides',
              filmCount: 'slideVideos',
              firstGalleryImage: 'galleryImages.0',
              galleryCount: 'galleryImages',
            },

            prepare({
              mediaType,
              width,
              image,
              poster,
              slideshowType,
              firstSlide,
              slideCount,
              filmCount,
              firstGalleryImage,
              galleryCount,
            }) {
              const typeLabel =
                mediaType === 'videoSlideshow'
                  ? 'VIDEO SLIDESHOW'
                  : mediaType === 'video'
                  ? 'VIDEO'
                  : mediaType === 'slideshow'
                    ? 'SLIDESHOW'
                    : mediaType === 'gallery'
                      ? '4-IMAGE GALLERY'
                      : 'IMAGE'

              const widthLabel = width === 'half' ? 'HALF' : 'FULL'

              const slideshowCount =
                slideshowType === 'film' ? filmCount : slideCount

              const subtitle =
                mediaType === 'slideshow' && Array.isArray(slideshowCount)
                  ? `${slideshowCount.length} ${slideshowType === 'film' ? 'film' : 'slide'}${slideshowCount.length === 1 ? '' : 's'}`
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
      name: 'slideshowTransitionTime',
      title: 'Slideshow transition time',
      description: 'Seconds each slide stays on screen before moving to the next.',
      type: 'number',
      initialValue: 4,
      validation: (Rule) => Rule.min(0.5).max(60),
      hidden: ({document}) => {
        const media = document?.media as Array<{mediaType?: string}> | undefined
        return !media?.some((item) => item?.mediaType === 'slideshow')
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
      title: 'Description',
      type: 'array',
      of: [
        {
          type: 'block',
          marks: {
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'linkType',
                    title: 'Link to',
                    type: 'string',
                    initialValue: 'url',
                    options: {
                      list: [
                        {title: 'URL', value: 'url'},
                        {title: 'Project', value: 'project'},
                      ],
                    },
                  },
                  {
                    name: 'href',
                    title: 'URL',
                    type: 'url',
                    hidden: ({parent}: {parent?: {linkType?: string}}) =>
                      parent?.linkType === 'project',
                  },
                  {
                    name: 'project',
                    title: 'Project',
                    type: 'reference',
                    to: [{type: 'project'}],
                    hidden: ({parent}: {parent?: {linkType?: string}}) =>
                      parent?.linkType !== 'project',
                  },
                ],
              },
            ],
          },
        },
      ],
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
      of: [
        {
          type: 'block',
          marks: {
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'linkType',
                    title: 'Link to',
                    type: 'string',
                    initialValue: 'url',
                    options: {
                      list: [
                        {title: 'URL', value: 'url'},
                        {title: 'Project', value: 'project'},
                      ],
                    },
                  },
                  {
                    name: 'href',
                    title: 'URL',
                    type: 'url',
                    hidden: ({parent}: {parent?: {linkType?: string}}) =>
                      parent?.linkType === 'project',
                  },
                  {
                    name: 'project',
                    title: 'Project',
                    type: 'reference',
                    to: [{type: 'project'}],
                    hidden: ({parent}: {parent?: {linkType?: string}}) =>
                      parent?.linkType !== 'project',
                  },
                ],
              },
            ],
          },
        },
      ],
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
