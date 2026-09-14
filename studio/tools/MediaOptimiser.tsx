import {useCallback, useEffect, useRef, useState} from 'react'
import {useClient} from 'sanity'
import {
  Badge,
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Heading,
  Spinner,
  Text,
} from '@sanity/ui'

const API_VERSION = '2025-02-19'

type VideoAsset = {
  _id: string
  originalFilename?: string
  size?: number
  url?: string
  mimeType?: string
  usedBy: number
  usedByTitles: string[]
}

type SanityDocument = {
  _id: string
  _type: string
  [key: string]: unknown
}

const SYSTEM_FIELDS = new Set([
  '_id',
  '_type',
  '_rev',
  '_createdAt',
  '_updatedAt',
])

function formatMB(bytes = 0) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function savingPercent(oldSize = 0, newSize = 0) {
  if (!oldSize || !newSize) return 0

  return Math.round((1 - newSize / oldSize) * 100)
}

function toneForSize(
  size = 0,
): 'critical' | 'caution' | 'positive' {
  const mb = size / 1024 / 1024

  if (mb >= 20) return 'critical'
  if (mb >= 10) return 'caution'

  return 'positive'
}

function replaceReference(
  value: unknown,
  oldAssetId: string,
  newAssetId: string,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) =>
      replaceReference(
        item,
        oldAssetId,
        newAssetId,
      ),
    )
  }

  if (
    value &&
    typeof value === 'object'
  ) {
    const object = value as Record<
      string,
      unknown
    >

    if (
      object._type === 'reference' &&
      object._ref === oldAssetId
    ) {
      return {
        ...object,
        _ref: newAssetId,
      }
    }

    return Object.fromEntries(
      Object.entries(object).map(
        ([key, child]) => [
          key,
          replaceReference(
            child,
            oldAssetId,
            newAssetId,
          ),
        ],
      ),
    )
  }

  return value
}

function buildReplacementPatch(
  document: SanityDocument,
  oldAssetId: string,
  newAssetId: string,
) {
  const patch: Record<string, unknown> = {}

  Object.entries(document).forEach(
    ([key, value]) => {
      if (SYSTEM_FIELDS.has(key)) return

      const replaced = replaceReference(
        value,
        oldAssetId,
        newAssetId,
      )

      if (
        JSON.stringify(replaced) !==
        JSON.stringify(value)
      ) {
        patch[key] = replaced
      }
    },
  )

  return patch
}

export default function MediaOptimiser() {
  const client = useClient({
    apiVersion: API_VERSION,
  })

  const fileInput =
    useRef<HTMLInputElement>(null)

  const [assets, setAssets] =
    useState<VideoAsset[]>([])

  const [loading, setLoading] =
    useState(true)

  const [selected, setSelected] =
    useState<VideoAsset | null>(null)

  const [replacement, setReplacement] =
    useState<File | null>(null)

  const [replacing, setReplacing] =
    useState(false)

  const [deletingId, setDeletingId] =
    useState<string | null>(null)

  const [error, setError] =
    useState<string | null>(null)

  const [success, setSuccess] =
    useState<string | null>(null)

  const loadAssets =
    useCallback(async () => {
      setLoading(true)
      setError(null)

      try {
        const result =
          await client.fetch<VideoAsset[]>(`
            *[
              _type == "sanity.fileAsset" &&
              mimeType match "video/*"
            ] | order(size desc) {
              _id,
              originalFilename,
              size,
              url,
              mimeType,

              "usedBy": count(*[
                references(^._id)
              ]),

              "usedByTitles": *[
                references(^._id)
              ]{
                "title":
                  coalesce(
                    title,
                    _id
                  )
              }.title
            }
          `)

        setAssets(result)
      } catch (err) {
        console.error(err)

        setError(
          err instanceof Error
            ? err.message
            : 'Could not load video assets.',
        )
      } finally {
        setLoading(false)
      }
    }, [client])

  useEffect(() => {
    loadAssets()
  }, [loadAssets])

  const usedAssets = assets.filter(
    (asset) => asset.usedBy > 0,
  )

  const unusedAssets = assets.filter(
    (asset) => asset.usedBy === 0,
  )

  const usedSize = usedAssets.reduce(
    (total, asset) =>
      total + (asset.size || 0),
    0,
  )

  const unusedSize = unusedAssets.reduce(
    (total, asset) =>
      total + (asset.size || 0),
    0,
  )

  function openReplace(
    asset: VideoAsset,
  ) {
    setSelected(asset)
    setReplacement(null)
    setError(null)
    setSuccess(null)

    if (fileInput.current) {
      fileInput.current.value = ''
    }
  }

  function closeReplace() {
    if (replacing) return

    setSelected(null)
    setReplacement(null)
    setError(null)
  }

  async function replaceAsset() {
    if (!selected || !replacement) {
      return
    }

    if (
      !replacement.type.startsWith(
        'video/',
      )
    ) {
      setError(
        'Please choose a video file.',
      )
      return
    }

    if (
      selected.size &&
      replacement.size >= selected.size
    ) {
      const continueAnyway =
        window.confirm(
          `The replacement is not smaller than the current video.\n\nCurrent: ${formatMB(
            selected.size,
          )}\nNew: ${formatMB(
            replacement.size,
          )}\n\nReplace it anyway?`,
        )

      if (!continueAnyway) return
    }

    const confirmed = window.confirm(
      `Replace ${selected.originalFilename || 'this video'}?\n\n` +
        `Current: ${formatMB(
          selected.size,
        )}\n` +
        `New: ${formatMB(
          replacement.size,
        )}\n` +
        `Saving: ${savingPercent(
          selected.size,
          replacement.size,
        )}%\n\n` +
        `This will update every document using the existing video.\n\n` +
        `The old asset will NOT be deleted.`,
    )

    if (!confirmed) return

    setReplacing(true)
    setError(null)
    setSuccess(null)

    try {
      const newAsset =
        await client.assets.upload(
          'file',
          replacement,
          {
            filename:
              replacement.name,
            contentType:
              replacement.type ||
              'video/mp4',
          },
        )

      const documents =
        await client.fetch<
          SanityDocument[]
        >(
          `
            *[
              references($assetId)
            ]
          `,
          {
            assetId: selected._id,
          },
        )

      if (documents.length === 0) {
        setSuccess(
          'The compressed video was uploaded, but the original asset was not referenced by any documents. Nothing needed updating.',
        )

        setSelected(null)
        setReplacement(null)

        await loadAssets()
        return
      }

      let transaction =
        client.transaction()

      let changedDocuments = 0

      documents.forEach((document) => {
        const patch =
          buildReplacementPatch(
            document,
            selected._id,
            newAsset._id,
          )

        if (
          Object.keys(patch).length === 0
        ) {
          return
        }

        transaction =
          transaction.patch(
            document._id,
            (patchBuilder) =>
              patchBuilder.set(patch),
          )

        changedDocuments += 1
      })

      if (changedDocuments === 0) {
        throw new Error(
          'Sanity found documents referencing the old asset, but no replaceable references were found. No documents were changed.',
        )
      }

      await transaction.commit()

      const remainingReferences =
        await client.fetch<number>(
          `
            count(*[
              references($assetId)
            ])
          `,
          {
            assetId: selected._id,
          },
        )

      if (remainingReferences > 0) {
        throw new Error(
          `Replacement was uploaded and ${changedDocuments} document${
            changedDocuments === 1
              ? ''
              : 's'
          } were updated, but Sanity still reports ${remainingReferences} reference${
            remainingReferences === 1
              ? ''
              : 's'
          } to the old asset. The old asset has NOT been deleted.`,
        )
      }

      const savedBytes = Math.max(
        0,
        (selected.size || 0) -
          replacement.size,
      )

      setSuccess(
        `${selected.originalFilename || 'Video'} replaced successfully. ` +
          `${changedDocuments} document${
            changedDocuments === 1
              ? ''
              : 's'
          } updated. ` +
          `Saved ${formatMB(
            savedBytes,
          )} (${savingPercent(
            selected.size,
            replacement.size,
          )}%). ` +
          `The original is now in Unused videos.`,
      )

      setSelected(null)
      setReplacement(null)

      await loadAssets()
    } catch (err) {
      console.error(err)

      setError(
        err instanceof Error
          ? err.message
          : 'The video could not be replaced.',
      )
    } finally {
      setReplacing(false)
    }
  }

  async function deleteUnusedAsset(
    asset: VideoAsset,
  ) {
    setError(null)
    setSuccess(null)

    /*
     * Check references again immediately before
     * offering deletion.
     */
    try {
      const currentReferences =
        await client.fetch<number>(
          `
            count(*[
              references($assetId)
            ])
          `,
          {
            assetId: asset._id,
          },
        )

      if (currentReferences > 0) {
        setError(
          `${asset.originalFilename || 'This video'} is now referenced by ${currentReferences} document${
            currentReferences === 1
              ? ''
              : 's'
          }, so it was not deleted.`,
        )

        await loadAssets()
        return
      }

      const confirmed = window.confirm(
        `Permanently delete this unused video from Sanity?\n\n` +
          `${asset.originalFilename || 'Untitled video'}\n` +
          `${formatMB(asset.size)}\n\n` +
          `Sanity currently reports 0 references.\n\n` +
          `This cannot be undone.`,
      )

      if (!confirmed) return

      setDeletingId(asset._id)

      /*
       * Check once more after confirmation, immediately
       * before the destructive operation.
       */
      const finalReferenceCheck =
        await client.fetch<number>(
          `
            count(*[
              references($assetId)
            ])
          `,
          {
            assetId: asset._id,
          },
        )

      if (finalReferenceCheck > 0) {
        throw new Error(
          `${asset.originalFilename || 'This video'} became referenced before deletion, so it was not deleted.`,
        )
      }

      await client.delete(asset._id)

      setSuccess(
        `${asset.originalFilename || 'Video'} deleted. ${formatMB(
          asset.size,
        )} removed from unused Sanity assets.`,
      )

      await loadAssets()
    } catch (err) {
      console.error(err)

      setError(
        err instanceof Error
          ? err.message
          : 'The unused video could not be deleted.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  function renderUsedAsset(
    asset: VideoAsset,
  ) {
    return (
      <Card
        key={asset._id}
        border
        padding={4}
        radius={2}
      >
        <Flex
          align="center"
          gap={4}
          justify="space-between"
          wrap="wrap"
        >
          <Flex
            direction="column"
            gap={3}
          >
            <Text weight="semibold">
              {asset.originalFilename ||
                'Untitled video'}
            </Text>

            <Flex
              gap={2}
              align="center"
              wrap="wrap"
            >
              <Badge
                tone={toneForSize(
                  asset.size,
                )}
              >
                {formatMB(asset.size)}
              </Badge>

              <Badge>
                {asset.usedBy}{' '}
                reference
                {asset.usedBy === 1
                  ? ''
                  : 's'}
              </Badge>
            </Flex>

            {asset.usedByTitles
              ?.length > 0 && (
              <Text
                muted
                size={1}
              >
                Used by:{' '}
                {asset.usedByTitles.join(
                  ', ',
                )}
              </Text>
            )}
          </Flex>

          <Button
            mode="ghost"
            text="Replace"
            onClick={() =>
              openReplace(asset)
            }
          />
        </Flex>
      </Card>
    )
  }

  function renderUnusedAsset(
    asset: VideoAsset,
  ) {
    const isDeleting =
      deletingId === asset._id

    return (
      <Card
        key={asset._id}
        border
        padding={4}
        radius={2}
      >
        <Flex
          align="center"
          gap={4}
          justify="space-between"
          wrap="wrap"
        >
          <Flex
            direction="column"
            gap={3}
          >
            <Text weight="semibold">
              {asset.originalFilename ||
                'Untitled video'}
            </Text>

            <Flex
              gap={2}
              align="center"
              wrap="wrap"
            >
              <Badge>
                {formatMB(asset.size)}
              </Badge>

              <Badge tone="positive">
                0 references
              </Badge>
            </Flex>
          </Flex>

          <Button
            text={
              isDeleting
                ? 'Deleting…'
                : 'Delete'
            }
            tone="critical"
            mode="ghost"
            loading={isDeleting}
            disabled={
              deletingId !== null
            }
            onClick={() =>
              deleteUnusedAsset(asset)
            }
          />
        </Flex>
      </Card>
    )
  }

  return (
    <Box padding={5}>
      <Flex
        direction="column"
        gap={6}
      >
        <Flex
          direction="column"
          gap={3}
        >
          <Heading size={3}>
            Media Optimiser
          </Heading>

          <Text muted size={1}>
            Replace oversized videos with
            compressed versions, then remove
            the unused originals once you've
            checked the project.
          </Text>
        </Flex>

        {error && (
          <Card
            padding={4}
            radius={2}
            tone="critical"
          >
            <Text>{error}</Text>
          </Card>
        )}

        {success && (
          <Card
            padding={4}
            radius={2}
            tone="positive"
          >
            <Text>{success}</Text>
          </Card>
        )}

        {loading ? (
          <Flex
            align="center"
            gap={3}
          >
            <Spinner />

            <Text>
              Loading video assets…
            </Text>
          </Flex>
        ) : (
          <>
            <Flex
              direction="column"
              gap={3}
            >
              <Flex
                align="center"
                gap={2}
                wrap="wrap"
              >
                <Heading size={2}>
                  Used videos
                </Heading>

                <Badge>
                  {usedAssets.length}{' '}
                  assets
                </Badge>

                <Badge>
                  {formatMB(usedSize)}
                </Badge>
              </Flex>

              <Text muted size={1}>
                These videos are currently
                referenced by your Sanity
                documents.
              </Text>

              <Flex
                direction="column"
                gap={2}
              >
                {usedAssets.map(
                  renderUsedAsset,
                )}

                {usedAssets.length === 0 && (
                  <Card
                    border
                    padding={4}
                    radius={2}
                  >
                    <Text>
                      No referenced video
                      assets found.
                    </Text>
                  </Card>
                )}
              </Flex>
            </Flex>

            <Flex
              direction="column"
              gap={3}
            >
              <Flex
                align="center"
                gap={2}
                wrap="wrap"
              >
                <Heading size={2}>
                  Unused videos
                </Heading>

                <Badge>
                  {unusedAssets.length}{' '}
                  assets
                </Badge>

                <Badge
                  tone={
                    unusedSize > 0
                      ? 'caution'
                      : 'positive'
                  }
                >
                  {formatMB(unusedSize)}
                </Badge>
              </Flex>

              <Text muted size={1}>
                Sanity reports zero document
                references for these assets.
                Delete them only after you've
                checked the replacement on
                your project.
              </Text>

              <Flex
                direction="column"
                gap={2}
              >
                {unusedAssets.map(
                  renderUnusedAsset,
                )}

                {unusedAssets.length ===
                  0 && (
                  <Card
                    border
                    padding={4}
                    radius={2}
                  >
                    <Text>
                      No unused video assets.
                    </Text>
                  </Card>
                )}
              </Flex>
            </Flex>
          </>
        )}
      </Flex>

      {selected && (
        <Dialog
          header="Replace video"
          id="replace-video-dialog"
          onClose={closeReplace}
          width={1}
        >
          <Box padding={4}>
            <Flex
              direction="column"
              gap={5}
            >
              <Flex
                direction="column"
                gap={2}
              >
                <Text weight="semibold">
                  {selected.originalFilename}
                </Text>

                <Text
                  muted
                  size={1}
                >
                  Current size:{' '}
                  {formatMB(
                    selected.size,
                  )}
                </Text>

                <Text
                  muted
                  size={1}
                >
                  Used by{' '}
                  {selected.usedBy}{' '}
                  document
                  {selected.usedBy === 1
                    ? ''
                    : 's'}
                  .
                </Text>

                {selected.usedByTitles
                  ?.length > 0 && (
                  <Text
                    muted
                    size={1}
                  >
                    {selected.usedByTitles.join(
                      ', ',
                    )}
                  </Text>
                )}
              </Flex>

              <input
                ref={fileInput}
                type="file"
                accept="video/*"
                onChange={(event) => {
                  const file =
                    event.target.files?.[0] ||
                    null

                  setReplacement(file)
                  setError(null)
                }}
              />

              {replacement && (
                <Card
                  border
                  padding={3}
                  radius={2}
                >
                  <Flex
                    direction="column"
                    gap={2}
                  >
                    <Text>
                      {replacement.name}
                    </Text>

                    <Text
                      muted
                      size={1}
                    >
                      New size:{' '}
                      {formatMB(
                        replacement.size,
                      )}
                    </Text>

                    {selected.size && (
                      <>
                        <Text
                          muted
                          size={1}
                        >
                          Saving:{' '}
                          {formatMB(
                            Math.max(
                              0,
                              selected.size -
                                replacement.size,
                            ),
                          )}
                        </Text>

                        <Text
                          muted
                          size={1}
                        >
                          Reduction:{' '}
                          {savingPercent(
                            selected.size,
                            replacement.size,
                          )}
                          %
                        </Text>
                      </>
                    )}
                  </Flex>
                </Card>
              )}

              {error && (
                <Card
                  padding={3}
                  radius={2}
                  tone="critical"
                >
                  <Text>{error}</Text>
                </Card>
              )}

              <Flex
                gap={2}
                justify="flex-end"
              >
                <Button
                  text="Cancel"
                  mode="ghost"
                  disabled={replacing}
                  onClick={closeReplace}
                />

                <Button
                  text={
                    replacing
                      ? 'Replacing…'
                      : 'Replace asset'
                  }
                  tone="primary"
                  disabled={
                    !replacement ||
                    replacing
                  }
                  loading={replacing}
                  onClick={replaceAsset}
                />
              </Flex>
            </Flex>
          </Box>
        </Dialog>
      )}
    </Box>
  )
}