import {useMemo, useState} from 'react'
import {set, unset, useClient} from 'sanity'
import {Button, Dialog, Spinner} from '@sanity/ui'

type SanityImageAsset = {
  _id: string
  url: string
  originalFilename?: string
}

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
  imageWrap: {
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

type SlideValue = {
  _key: string
  _type: 'image'
  asset: {
    _type: 'reference'
    _ref: string
  }
}

export default function SlideshowImagePickerInput(props: any) {
  const client = useClient({apiVersion: '2026-01-01'})
  const value = (props.value || []) as SlideValue[]

  const [open, setOpen] = useState(false)
  const [images, setImages] = useState<SanityImageAsset[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentAssetIds = useMemo(
    () =>
      value
        .map((item) => item.asset?._ref)
        .filter((id): id is string => Boolean(id)),
    [value],
  )

  const loadImages = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await client.fetch<SanityImageAsset[]>(`
        *[_type == "sanity.imageAsset"] | order(_createdAt desc) {
          _id,
          url,
          originalFilename
        }
      `)

      setImages(result.filter((item) => item._id && item.url))
    } catch (err) {
      console.error(err)
      setError('Could not load the image library.')
    } finally {
      setLoading(false)
    }
  }

  const openPicker = async () => {
    setSelectedIds(currentAssetIds)
    setOpen(true)
    await loadImages()
  }

  const toggle = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  const useSelected = () => {
    if (selectedIds.length < 2) return

    const nextValue: SlideValue[] = selectedIds.map((assetId) => ({
      _key: makeKey(),
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: assetId,
      },
    }))

    props.onChange(set(nextValue))
    setOpen(false)
  }

  return (
    <div>
      <div style={styles.toolbar}>
        <Button
          text={value.length >= 2 ? 'Change selection' : 'Select slideshow images'}
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
          id="slideshow-image-picker"
          header={`Select slideshow images · ${selectedIds.length} selected`}
          width={5}
          onClose={() => setOpen(false)}
        >
          <div style={styles.dialogBody}>
            <div style={styles.dialogHeader}>
              <span style={styles.muted}>
                Select as many images as you want. Minimum two.
              </span>

              <Button
                text={
                  selectedIds.length >= 2
                    ? `Use ${selectedIds.length} images`
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
            ) : images.length ? (
              <div style={styles.grid}>
                {images.map((image) => {
                  const selected = selectedIds.includes(image._id)

                  return (
                    <button
                      key={image._id}
                      type="button"
                      onClick={() => toggle(image._id)}
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

                        <div style={styles.imageWrap}>
                          <img
                            src={`${image.url}?auto=format&fit=crop&w=600&h=600&q=78`}
                            alt=""
                            style={styles.image}
                          />
                        </div>

                        <div style={styles.filename}>
                          {image.originalFilename || 'Image'}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div style={styles.muted}>No uploaded images were found.</div>
            )}
          </div>
        </Dialog>
      ) : null}
    </div>
  )
}
