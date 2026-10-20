import {useMemo, useState} from 'react'
import {set, unset, useClient} from 'sanity'
import {Button, Dialog, Spinner} from '@sanity/ui'

type SanityMediaAsset = {
  _id: string
  url: string
  originalFilename?: string
}

type SlideValue = {
  _key: string
  _type: 'image' | 'file'
  lightbox?: boolean
  asset: {
    _type: 'reference'
    _ref: string
  }
}

type MediaKind = 'image' | 'video'

function makeKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const styles = {
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap' as const,
  },
  muted: {
    fontSize: '13px',
    opacity: 0.65,
  },
  error: {
    padding: '12px',
    border: '1px solid rgba(255, 80, 80, 0.45)',
    borderRadius: '6px',
    color: '#ff8a8a',
  },
  dialogBody: {
    padding: '20px',
  },
  dialogHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '18px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '12px',
  },
  tileButton: {
    position: 'relative' as const,
    appearance: 'none' as const,
    border: 0,
    padding: 0,
    background: 'transparent',
    textAlign: 'left' as const,
    cursor: 'pointer',
    minWidth: 0,
  },
  tile: {
    position: 'relative' as const,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,.12)',
    borderRadius: '6px',
    background: 'rgba(255,255,255,.03)',
  },
  previewWrap: {
    aspectRatio: '1 / 1',
    overflow: 'hidden',
    background: 'rgba(127,127,127,.08)',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    display: 'block',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'grid',
    placeItems: 'center',
    background: '#111',
    color: '#fff',
    fontSize: '11px',
    letterSpacing: '0.12em',
  },
  checkbox: {
    position: 'absolute' as const,
    top: '10px',
    right: '10px',
    zIndex: 2,
    width: '18px',
    height: '18px',
  },
  filename: {
    padding: '8px',
    fontSize: '12px',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}

function SlideshowMediaPickerInput({props, mediaKind}: {props: any; mediaKind: MediaKind}) {
  const client = useClient({apiVersion: '2026-01-01'})
  const value = (props.value || []) as SlideValue[]

  const [open, setOpen] = useState(false)
  const [assets, setAssets] = useState<SanityMediaAsset[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [lightboxIds, setLightboxIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isVideo = mediaKind === 'video'
  const singular = isVideo ? 'film' : 'image'
  const plural = isVideo ? 'films' : 'images'

  const currentAssetIds = useMemo(
    () =>
      value
        .map((item) => item.asset?._ref)
        .filter((id): id is string => Boolean(id)),
    [value],
  )

  const loadAssets = async () => {
    setLoading(true)
    setError(null)

    try {
      const query = isVideo
        ? `
          *[_type == "sanity.fileAsset" && mimeType match "video/*"] | order(_createdAt desc) {
            _id,
            url,
            originalFilename
          }
        `
        : `
          *[_type == "sanity.imageAsset"] | order(_createdAt desc) {
            _id,
            url,
            originalFilename
          }
        `

      const result = await client.fetch<SanityMediaAsset[]>(query)
      setAssets(result.filter((item) => item._id && item.url))
    } catch (err) {
      console.error(err)
      setError(`Could not load the ${singular} library.`)
    } finally {
      setLoading(false)
    }
  }

  const openPicker = async () => {
    setSelectedIds(currentAssetIds)
    setLightboxIds(
      isVideo
        ? []
        : value
            .filter((item) => item.lightbox === true && item.asset?._ref)
            .map((item) => item.asset._ref),
    )
    setOpen(true)
    await loadAssets()
  }

  const toggle = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        setLightboxIds((lightboxes) => lightboxes.filter((item) => item !== id))
        return current.filter((item) => item !== id)
      }

      return [...current, id]
    })
  }

  const toggleLightbox = (id: string) => {
    if (isVideo || !selectedIds.includes(id)) return

    setLightboxIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  const useSelected = () => {
    if (selectedIds.length < 2) return

    const nextValue: SlideValue[] = selectedIds.map((assetId) => {
      const existing = value.find((item) => item.asset?._ref === assetId)

      return {
        _key: existing?._key || makeKey(),
        _type: isVideo ? 'file' : 'image',
        ...(isVideo ? {} : {lightbox: lightboxIds.includes(assetId)}),
        asset: {
          _type: 'reference',
          _ref: assetId,
        },
      }
    })

    props.onChange(set(nextValue))
    setOpen(false)
  }

  return (
    <div>
      <div style={styles.toolbar}>
        <Button
          text={value.length >= 2 ? 'Change selection' : `Select slideshow ${plural}`}
          mode="ghost"
          onClick={openPicker}
        />

        {value.length ? (
          <Button
            text="Clear"
            mode="bleed"
            tone="critical"
            onClick={() => props.onChange(unset())}
          />
        ) : null}

        <span style={styles.muted}>{value.length} selected</span>
      </div>

      {error ? <div style={styles.error}>{error}</div> : null}

      {open ? (
        <Dialog
          id={`slideshow-${mediaKind}-picker`}
          header={`Select slideshow ${plural} · ${selectedIds.length} selected`}
          width={5}
          onClose={() => setOpen(false)}
        >
          <div style={styles.dialogBody}>
            <div style={styles.dialogHeader}>
              <span style={styles.muted}>
                Select as many {plural} as you want. Minimum two.
              </span>

              <Button
                text={
                  selectedIds.length >= 2
                    ? `Use ${selectedIds.length} ${plural}`
                    : `${selectedIds.length} selected`
                }
                tone="primary"
                disabled={selectedIds.length < 2}
                onClick={useSelected}
              />
            </div>

            {loading ? (
              <div style={{display: 'flex', justifyContent: 'center', padding: '40px'}}>
                <Spinner />
              </div>
            ) : assets.length ? (
              <div style={styles.grid}>
                {assets.map((asset) => {
                  const selected = selectedIds.includes(asset._id)
                  const lightboxEnabled = lightboxIds.includes(asset._id)

                  return (
                    <div key={asset._id} style={{minWidth: 0}}>
                      <button
                        type="button"
                        onClick={() => toggle(asset._id)}
                        style={styles.tileButton}
                      >
                        <div
                          style={{
                            ...styles.tile,
                            outline: selected ? '2px solid currentColor' : 'none',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            readOnly
                            aria-label={selected ? 'Selected' : 'Not selected'}
                            style={styles.checkbox}
                          />

                          <div style={styles.previewWrap}>
                            {isVideo ? (
                              <div style={styles.videoPlaceholder}>FILM</div>
                            ) : (
                              <img
                                src={`${asset.url}?auto=format&fit=crop&w=600&h=600&q=78`}
                                alt=""
                                style={styles.image}
                              />
                            )}
                          </div>

                          <div style={styles.filename}>
                            {asset.originalFilename || (isVideo ? 'Film' : 'Image')}
                          </div>
                        </div>
                      </button>

                      {!isVideo ? (
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '7px',
                            padding: '8px 2px 0',
                            fontSize: '12px',
                            opacity: selected ? 1 : 0.45,
                            cursor: selected ? 'pointer' : 'default',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={lightboxEnabled}
                            disabled={!selected}
                            onChange={() => toggleLightbox(asset._id)}
                          />
                          Lightbox
                        </label>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={styles.muted}>No uploaded {plural} were found.</div>
            )}
          </div>
        </Dialog>
      ) : null}
    </div>
  )
}

export default function SlideshowImagePickerInput(props: any) {
  return <SlideshowMediaPickerInput props={props} mediaKind="image" />
}

export function SlideshowVideoPickerInput(props: any) {
  return <SlideshowMediaPickerInput props={props} mediaKind="video" />
}
