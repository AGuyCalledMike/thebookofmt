import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'
import {schemaTypes} from './schemaTypes'
import {createRandomisePlaygroundAction} from './actions/randomisePlayground'

export default defineConfig({
  name: 'default',
  title: 'The Book of MT',

  projectId: 'rlg8i7d8',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S, context) =>
        S.list()
          .title('Content')
          .items([
            orderableDocumentListDeskItem({
              type: 'project',
              title: 'Projects',
              S,
              context,
            }),

            ...S.documentTypeListItems().filter(
              (item) => item.getId() !== 'project'
            ),
          ]),
    }),

    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },

  document: {
    actions: (prev, context) => {
      if (context.schemaType !== 'playground') {
        return prev
      }

      return [
        ...prev,
        createRandomisePlaygroundAction(context),
      ]
    },
  },
})
