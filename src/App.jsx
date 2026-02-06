import { useEffect, useMemo, useRef, useState } from 'react'
import { removeBackground } from '@imgly/background-removal'
import { toPng } from 'html-to-image'
import './App.css'

const starterItems = [
  {
    id: 'img-1',
    type: 'image',
    x: 6,
    y: 6,
    w: 40,
    h: 44,
    label: 'Morning light',
    scale: 1,
    radius: 18,
    locked: false,
    rotation: 0,
    cropX: 0,
    cropY: 0,
    zoom: 1,
    filter: 'none',
  },
  {
    id: 'img-2',
    type: 'image',
    x: 50,
    y: 10,
    w: 42,
    h: 30,
    label: 'City walk',
    scale: 1,
    radius: 18,
    locked: false,
    rotation: 0,
    cropX: 0,
    cropY: 0,
    zoom: 1,
    filter: 'none',
  },
  {
    id: 'img-3',
    type: 'image',
    x: 54,
    y: 44,
    w: 38,
    h: 38,
    label: 'Coffee break',
    scale: 1,
    radius: 18,
    locked: false,
    rotation: 0,
    cropX: 0,
    cropY: 0,
    zoom: 1,
    filter: 'none',
  },
  {
    id: 'text-1',
    type: 'text',
    x: 10,
    y: 54,
    w: 40,
    h: 24,
    text: 'Weekend in Lisbon',
    scale: 1,
    radius: 18,
    locked: false,
    rotation: 0,
    color: '#0f172a',
    fontSize: 28,
    fontFamily: 'Space Grotesk',
    backgroundColor: '#ffffff',
    backgroundOpacity: 0.85,
    borderWidth: 0,
    borderColor: '#e2e8f0',
    padding: 12,
    align: 'left',
  },
]

const presets = [
  { id: 'classic', name: 'Classic Grid', note: '3x3 frames, 4:5' },
  { id: 'story', name: 'Story Stack', note: 'vertical stack' },
  { id: 'editorial', name: 'Editorial', note: 'bold type + 2 photos' },
  { id: 'polaroid', name: 'Polaroid', note: 'soft frames + tape' },
]

const tips = [
  'Drag images from your desktop into the canvas.',
  'Paste a photo with Cmd/Ctrl + V to drop it in.',
  'Double-click text to edit quickly.',
]

const backgroundPresets = [
  { id: 'soft', label: 'Soft Blush', value: '#fff1f2' },
  { id: 'paper', label: 'Warm Paper', value: '#f8f5f2' },
  { id: 'night', label: 'Night Mode', value: '#0f172a' },
  { id: 'mint', label: 'Mint Wash', value: '#ecfeff' },
]

const gradientPresets = [
  {
    id: 'sunset',
    label: 'Sunset',
    value: 'linear-gradient(135deg, #f97316, #fb7185, #6366f1)',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    value: 'linear-gradient(135deg, #38bdf8, #0ea5e9, #1e293b)',
  },
]

const filters = [
  { id: 'none', label: 'Original', value: 'none' },
  { id: 'bright', label: 'Bright', value: 'brightness(1.12) contrast(1.05)' },
  { id: 'cinematic', label: 'Cinematic', value: 'contrast(1.25) saturate(0.85)' },
  { id: 'golden', label: 'Golden', value: 'sepia(0.4) saturate(1.2)' },
  { id: 'mono', label: 'Mono', value: 'grayscale(1) contrast(1.1)' },
  { id: 'cool', label: 'Cool', value: 'hue-rotate(190deg) saturate(1.1)' },
]

const fonts = [
  'Space Grotesk',
  'Playfair Display',
  'Archivo',
  'DM Sans',
  'Bebas Neue',
]

const formats = [
  {
    id: 'ig-portrait',
    name: 'Instagram 4:5',
    ratio: '4 / 5',
    width: 1080,
    height: 1350,
  },
  {
    id: 'tt-vertical',
    name: 'TikTok 9:16',
    ratio: '9 / 16',
    width: 1080,
    height: 1920,
  },
]

const layoutTemplates = {
  classic: [
    { x: 6, y: 6, w: 42, h: 38 },
    { x: 52, y: 6, w: 42, h: 26 },
    { x: 52, y: 36, w: 42, h: 38 },
  ],
  story: [
    { x: 10, y: 6, w: 80, h: 30 },
    { x: 10, y: 40, w: 80, h: 30 },
    { x: 10, y: 74, w: 80, h: 20 },
  ],
  editorial: [
    { x: 6, y: 10, w: 54, h: 60 },
    { x: 62, y: 10, w: 32, h: 32 },
    { x: 62, y: 46, w: 32, h: 24 },
  ],
  polaroid: [
    { x: 8, y: 10, w: 46, h: 48 },
    { x: 52, y: 22, w: 40, h: 44 },
    { x: 16, y: 64, w: 36, h: 26 },
  ],
}

const hexToRgba = (hex, alpha = 1) => {
  const value = hex.replace('#', '')
  const bigint = parseInt(value, 16)
  if (Number.isNaN(bigint)) return `rgba(0,0,0,${alpha})`
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const starterClips = [
  { id: 'clip-1', label: 'Intro', duration: 3 },
  { id: 'clip-2', label: 'Product shot', duration: 5 },
  { id: 'clip-3', label: 'CTA', duration: 2 },
]

function App() {
  const [items, setItems] = useState(starterItems)
  const [selectedId, setSelectedId] = useState('img-1')
  const [selectedClipId, setSelectedClipId] = useState('clip-1')
  const [clips, setClips] = useState(starterClips)
  const [mode, setMode] = useState('image')
  const [formatId, setFormatId] = useState(formats[0].id)
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)
  const dragStateRef = useRef(null)
  const [background, setBackground] = useState({
    type: 'color',
    value: '#ffffff',
  })
  const [cropMode, setCropMode] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const [isExporting, setIsExporting] = useState(false)

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId),
    [items, selectedId]
  )

  const activeFormat = useMemo(
    () => formats.find((format) => format.id === formatId) || formats[0],
    [formatId]
  )

  const selectedClip = useMemo(
    () => clips.find((clip) => clip.id === selectedClipId),
    [clips, selectedClipId]
  )

  const addText = () => {
    const nextId = `text-${Date.now()}`
    setItems((current) => [
      ...current,
      {
        id: nextId,
        type: 'text',
        x: 18,
        y: 18,
        w: 52,
        h: 20,
        text: 'New caption',
        scale: 1,
        radius: 18,
        locked: false,
        rotation: 0,
        color: '#0f172a',
        fontSize: 28,
        fontFamily: 'Space Grotesk',
        backgroundColor: '#ffffff',
        backgroundOpacity: 0.85,
        borderWidth: 0,
        borderColor: '#e2e8f0',
        padding: 12,
        align: 'left',
      },
    ])
    setSelectedId(nextId)
  }

  const addPhoto = (src, label = 'New photo') => {
    const nextId = `img-${Date.now()}`
    setItems((current) => [
      ...current,
      {
        id: nextId,
        type: 'image',
        x: 12,
        y: 12,
        w: 38,
        h: 32,
        label,
        src,
        scale: 1,
        radius: 18,
        locked: false,
        autoSize: Boolean(src),
        rotation: 0,
        cropX: 0,
        cropY: 0,
        zoom: 1,
        filter: 'none',
      },
    ])
    setSelectedId(nextId)
  }

  const updateItem = (itemId, updates) => {
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
    )
  }

  const updateSelected = (updates) => {
    if (!selectedId) return
    updateItem(selectedId, updates)
  }

  const getGridPosition = (index) => {
    const columns = 2
    const col = index % columns
    const row = Math.floor(index / columns)
    const gap = 4
    const width = 44
    const height = 32
    const x = 6 + col * (width + gap)
    const y = 6 + row * (height + gap)
    return { x, y, w: width, h: height }
  }

  const addImagesFromFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((file) =>
      file.type.startsWith('image/')
    )

    if (!files.length) return

    const baseIndex = items.filter((item) => item.type === 'image').length

    files.forEach((file, index) => {
      const reader = new FileReader()
      reader.onload = () => {
        const nextId = `img-${Date.now()}-${index}`
        const layout = getGridPosition(baseIndex + index)
        setItems((liveItems) => [
          ...liveItems,
          {
            id: nextId,
            type: 'image',
            label: file.name || `Image ${index + 1}`,
            src: reader.result,
            ...layout,
            scale: 1,
            radius: 18,
            locked: false,
            autoSize: true,
            rotation: 0,
            cropX: 0,
            cropY: 0,
            zoom: 1,
            filter: 'none',
          },
        ])
        setSelectedId(nextId)
      }
      reader.readAsDataURL(file)
    })
  }

  const handleFileChange = (event) => {
    addImagesFromFiles(event.target.files)
    event.target.value = ''
  }

  const handleDrop = (event) => {
    event.preventDefault()
    addImagesFromFiles(event.dataTransfer.files)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

  const startDrag = (event, itemId) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const item = items.find((entry) => entry.id === itemId)
    if (!item || item.locked) return

    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()

    const pointerX = event.clientX - rect.left
    const pointerY = event.clientY - rect.top
    const offsetX = pointerX - (rect.width * item.x) / 100
    const offsetY = pointerY - (rect.height * item.y) / 100

    dragStateRef.current = {
      itemId,
      offsetX,
      offsetY,
      startX: pointerX,
      startY: pointerY,
      startCropX: item.cropX ?? 0,
      startCropY: item.cropY ?? 0,
      mode: cropMode && item.type === 'image' ? 'crop' : 'move',
    }
    setSelectedId(itemId)
  }

  const onPointerMove = (event) => {
    const dragState = dragStateRef.current
    const canvas = canvasRef.current
    if (!dragState || !canvas) return
    const rect = canvas.getBoundingClientRect()
    const pointerX = event.clientX - rect.left
    const pointerY = event.clientY - rect.top

    if (dragState.mode === 'crop') {
      const deltaX = ((pointerX - dragState.startX) / rect.width) * 100
      const deltaY = ((pointerY - dragState.startY) / rect.height) * 100
      setItems((current) =>
        current.map((item) =>
          item.id === dragState.itemId
            ? {
                ...item,
                cropX: Math.max(-50, Math.min(50, dragState.startCropX + deltaX)),
                cropY: Math.max(-50, Math.min(50, dragState.startCropY + deltaY)),
              }
            : item
        )
      )
      return
    }

    const nextX = ((pointerX - dragState.offsetX) / rect.width) * 100
    const nextY = ((pointerY - dragState.offsetY) / rect.height) * 100

    setItems((current) =>
      current.map((item) =>
        item.id === dragState.itemId
          ? {
              ...item,
              x: Math.max(0, Math.min(100 - item.w, nextX)),
              y: Math.max(0, Math.min(100 - item.h, nextY)),
            }
          : item
      )
    )
  }

  const stopDrag = () => {
    dragStateRef.current = null
  }

  const bringToFront = () => {
    if (!selectedItem) return
    setItems((current) => [
      ...current.filter((item) => item.id !== selectedItem.id),
      selectedItem,
    ])
  }

  const sendToBack = () => {
    if (!selectedItem) return
    setItems((current) => [
      selectedItem,
      ...current.filter((item) => item.id !== selectedItem.id),
    ])
  }

  const cycleLayer = () => {
    if (!selectedItem) return
    setItems((current) => {
      const index = current.findIndex((item) => item.id === selectedItem.id)
      if (index === -1) return current
      const next = [...current]
      const [removed] = next.splice(index, 1)
      next.splice(index === next.length ? 0 : index + 1, 0, removed)
      return next
    })
  }

  const toggleLock = () => {
    if (!selectedItem) return
    updateSelected({ locked: !selectedItem.locked })
  }

  const duplicateSelected = () => {
    if (!selectedItem) return
    const nextId = `${selectedItem.type}-${Date.now()}`
    const offset = 3
    setItems((current) => [
      ...current,
      {
        ...selectedItem,
        id: nextId,
        x: Math.min(100 - selectedItem.w, selectedItem.x + offset),
        y: Math.min(100 - selectedItem.h, selectedItem.y + offset),
        locked: false,
      },
    ])
    setSelectedId(nextId)
  }

  const snapSelected = () => {
    if (!selectedItem) return
    const grid = 4
    updateSelected({
      x: Math.round(selectedItem.x / grid) * grid,
      y: Math.round(selectedItem.y / grid) * grid,
    })
  }

  const deleteSelected = () => {
    if (!selectedItem) return
    setItems((current) => {
      const remaining = current.filter((item) => item.id !== selectedItem.id)
      setSelectedId(remaining[remaining.length - 1]?.id ?? '')
      return remaining
    })
  }

  const applyBackgroundColor = (value) => {
    setBackground({ type: 'color', value })
  }

  const applyGradient = (value) => {
    setBackground({ type: 'gradient', value })
  }

  const removeBackgroundForSelected = async () => {
    if (!selectedItem?.src || selectedItem.type !== 'image') return
    setRemovingId(selectedItem.id)
    try {
      const response = await fetch(selectedItem.src)
      const blob = await response.blob()
      const outputBlob = await removeBackground(blob)
      const url = URL.createObjectURL(outputBlob)
      updateSelected({
        src: url,
        autoSize: false,
        cropX: 0,
        cropY: 0,
        zoom: 1,
      })
    } catch (error) {
      console.error('Background removal failed', error)
    } finally {
      setRemovingId(null)
    }
  }

  const resetCollage = () => {
    setItems([])
    setSelectedId('')
    setBackground({ type: 'color', value: '#ffffff' })
  }

  const saveDraft = () => {
    const payload = {
      mode,
      formatId,
      background,
      items,
      clips,
      timestamp: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'insta-collage-draft.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportPNG = async () => {
    if (!canvasRef.current) return
    setIsExporting(true)
    try {
      const dataUrl = await toPng(canvasRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      })
      const link = document.createElement('a')
      link.download = `collage-${formatId}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Export failed', error)
    } finally {
      setIsExporting(false)
    }
  }

  const publishToInstagram = () => {
    alert('Publishing flow coming next — export is ready for now.')
  }

  const applyFilter = (filterValue) => {
    if (!selectedItem || selectedItem.type !== 'image') return
    updateSelected({ filter: filterValue })
  }

  const applyLayout = (layoutId) => {
    const template = layoutTemplates[layoutId]
    if (!template) return
    const imageItems = items.filter((item) => item.type === 'image')
    const textItems = items.filter((item) => item.type === 'text')
    setItems((current) =>
      current.map((item) => {
        if (item.type === 'image') {
          const index = imageItems.findIndex((img) => img.id === item.id)
          const next = template[index % template.length]
          return next ? { ...item, ...next } : item
        }
        if (item.type === 'text' && layoutId === 'editorial') {
          return { ...item, x: 6, y: 74, w: 88, h: 18 }
        }
        if (item.type === 'text' && layoutId === 'story') {
          return { ...item, x: 10, y: 6, w: 80, h: 18 }
        }
        return item
      })
    )
  }

  const addClip = () => {
    const nextId = `clip-${Date.now()}`
    setClips((current) => [
      ...current,
      { id: nextId, label: 'New clip', duration: 3 },
    ])
    setSelectedClipId(nextId)
  }

  const updateClip = (clipId, updates) => {
    setClips((current) =>
      current.map((clip) => (clip.id === clipId ? { ...clip, ...updates } : clip))
    )
  }

  useEffect(() => {
    const handlePaste = (event) => {
      if (event.clipboardData?.files?.length) {
        addImagesFromFiles(event.clipboardData.files)
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedItem) {
        event.preventDefault()
        deleteSelected()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedItem])

  return (
    <div className={`app ${mode === 'video' ? 'mode-video' : 'mode-image'}`}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">IC</div>
          <div>
            <p className="brand-title">Insta Collage Maker</p>
            <p className="brand-sub">Design and publish Instagram + TikTok content</p>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="segmented">
            <button
              className={mode === 'image' ? 'active' : ''}
              onClick={() => setMode('image')}
            >
              Collage
            </button>
            <button
              className={mode === 'video' ? 'active' : ''}
              onClick={() => setMode('video')}
            >
              Video
            </button>
          </div>
          <button className="ghost" onClick={resetCollage}>
            New project
          </button>
          <button className="ghost" onClick={saveDraft}>
            Save draft
          </button>
          <button className="ghost" onClick={exportPNG}>
            Export PNG
          </button>
          <button className="primary" onClick={publishToInstagram}>
            Publish to Instagram
          </button>
        </div>
      </header>

      <main className="workspace">
        <aside className="panel panel-left">
          <section>
            <p className="panel-title">Assets</p>
            <div className="dropzone" onDrop={handleDrop} onDragOver={handleDragOver}>
              <p>Drop images here</p>
              <span>or paste with Cmd/Ctrl + V</span>
              <div className="dropzone-actions">
                <button
                  className="ghost"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload images
                </button>
                <button className="ghost" onClick={() => addPhoto(undefined)}>
                  Add placeholder photo
                </button>
              </div>
              <input
                ref={fileInputRef}
                className="file-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
            </div>
          </section>

          <section>
            <p className="panel-title">Format</p>
            <div className="preset-list">
              {formats.map((format) => (
                <button
                  key={format.id}
                  className={`preset ${formatId === format.id ? 'active' : ''}`}
                  onClick={() => setFormatId(format.id)}
                >
                  <div>
                    <p>{format.name}</p>
                    <span>
                      {format.width} x {format.height}px
                    </span>
                  </div>
                  <span>Use</span>
                </button>
              ))}
            </div>
          </section>

          {mode === 'image' ? (
            <section>
              <p className="panel-title">Layouts</p>
              <div className="preset-list">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    className="preset"
                    onClick={() => applyLayout(preset.id)}
                  >
                    <div>
                      <p>{preset.name}</p>
                      <span>{preset.note}</span>
                    </div>
                    <span>Apply</span>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <section>
              <p className="panel-title">Video tools</p>
              <div className="tool-grid">
                <button onClick={addClip}>Add clip</button>
                <button disabled>Audio (soon)</button>
                <button disabled>Transitions (soon)</button>
                <button disabled>Captions (soon)</button>
              </div>
            </section>
          )}

          <section>
            <p className="panel-title">Quick tools</p>
            <div className="tool-grid">
              <button onClick={addText}>Add text</button>
              <button disabled>Stickers (soon)</button>
              <button onClick={() => applyGradient(gradientPresets[0].value)}>
                Add gradient
              </button>
              <button onClick={() => applyBackgroundColor('#ffffff')}>
                Background
              </button>
            </div>
          </section>

          <section>
            <p className="panel-title">Background</p>
            <div className="swatch-grid">
              {backgroundPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="swatch"
                  style={{ background: preset.value }}
                  onClick={() => applyBackgroundColor(preset.value)}
                >
                  <span>{preset.label}</span>
                </button>
              ))}
              {gradientPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="swatch"
                  style={{ background: preset.value }}
                  onClick={() => applyGradient(preset.value)}
                >
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
            <label className="field">
              <span>Custom color</span>
              <input
                type="color"
                value={background.type === 'color' ? background.value : '#ffffff'}
                onChange={(event) => applyBackgroundColor(event.target.value)}
              />
            </label>
          </section>
        </aside>

        <section className="canvas-wrap">
          <div
            ref={canvasRef}
            className={`canvas ${isExporting ? 'exporting' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onPointerMove={onPointerMove}
            onPointerUp={stopDrag}
            onPointerLeave={stopDrag}
            style={{
              background:
                background.type === 'gradient'
                  ? background.value
                  : background.value,
              aspectRatio: activeFormat.ratio,
            }}
          >
            {mode === 'video' && (
              <div className="video-badge">
                Video preview mode • {activeFormat.name}
              </div>
            )}
            <div className="canvas-grid" />
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`canvas-item ${item.type} ${
                  item.id === selectedId ? 'active' : ''
                }`}
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${item.w}%`,
                  height: `${item.h}%`,
                  borderRadius: `${item.radius ?? 18}px`,
                  transform: `scale(${item.scale ?? 1}) rotate(${item.rotation ?? 0}deg)`,
                }}
                onClick={() => setSelectedId(item.id)}
                onPointerDown={(event) => startDrag(event, item.id)}
              >
                {item.type === 'image' ? (
                  <div className="image-placeholder">
                    {item.src ? (
                      <img
                        src={item.src}
                        alt={item.label}
                        style={{
                          '--crop-x': `${item.cropX ?? 0}%`,
                          '--crop-y': `${item.cropY ?? 0}%`,
                          '--zoom': item.zoom ?? 1,
                          filter: item.filter ?? 'none',
                        }}
                        onLoad={(event) => {
                          if (!item.autoSize) return
                          const { naturalWidth, naturalHeight } = event.target
                          if (!naturalWidth || !naturalHeight) return
                          const baseWidth = 36
                          const canvasRatio = 4 / 5
                          const nextHeight =
                            baseWidth * (naturalHeight / naturalWidth) * canvasRatio
                          updateItem(item.id, {
                            w: baseWidth,
                            h: Math.min(68, Math.max(20, nextHeight)),
                            autoSize: false,
                          })
                        }}
                      />
                    ) : (
                      <span>{item.label}</span>
                    )}
                  </div>
                ) : (
                  <div
                    className="text-placeholder"
                    style={{
                      color: item.color ?? '#0f172a',
                      fontSize: `${item.fontSize ?? 28}px`,
                      fontFamily: item.fontFamily ?? 'Space Grotesk',
                      backgroundColor: hexToRgba(
                        item.backgroundColor ?? '#ffffff',
                        item.backgroundOpacity ?? 0.85
                      ),
                      border: `${item.borderWidth ?? 0}px solid ${
                        item.borderColor ?? '#e2e8f0'
                      }`,
                      padding: `${item.padding ?? 12}px`,
                      textAlign: item.align ?? 'left',
                    }}
                  >
                    {item.text}
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="canvas-footer">
            <div>
              <p>{activeFormat.name}</p>
              <span>
                Resolution {activeFormat.width} x {activeFormat.height}px
              </span>
            </div>
            <div className="canvas-actions">
              <button className="ghost" onClick={duplicateSelected}>
                Duplicate
              </button>
              <button className="ghost" onClick={snapSelected}>
                Snap to grid
              </button>
              <button className="ghost" onClick={cycleLayer}>
                Reorder
              </button>
            </div>
          </div>

          {mode === 'video' && (
            <div className="timeline">
              <div className="timeline-header">
                <div>
                  <p>Timeline</p>
                  <span>Arrange clips for TikTok + IG Reels</span>
                </div>
                <button className="ghost" onClick={addClip}>
                  Add clip
                </button>
              </div>
              <div className="timeline-track">
                {clips.map((clip) => (
                  <button
                    key={clip.id}
                    className={`timeline-clip ${
                      clip.id === selectedClipId ? 'active' : ''
                    }`}
                    onClick={() => setSelectedClipId(clip.id)}
                  >
                    <p>{clip.label}</p>
                    <span>{clip.duration}s</span>
                  </button>
                ))}
              </div>
              {selectedClip && (
                <div className="timeline-controls">
                  <label className="field">
                    <span>Clip label</span>
                    <input
                      type="text"
                      value={selectedClip.label}
                      onChange={(event) =>
                        updateClip(selectedClip.id, {
                          label: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Duration (sec)</span>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      value={selectedClip.duration}
                      onChange={(event) =>
                        updateClip(selectedClip.id, {
                          duration: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="panel panel-right">
          <section>
            <p className="panel-title">Inspector</p>
            {selectedItem ? (
              <div className="inspector">
                <div>
                  <p className="label">Selected layer</p>
                  <p className="value">
                    {selectedItem.type === 'image' ? 'Photo' : 'Text'} –{' '}
                    {selectedItem.id}
                  </p>
                </div>
                {selectedItem.type === 'text' ? (
                  <>
                    <label className="field">
                      <span>Text</span>
                      <input
                        type="text"
                        value={selectedItem.text}
                        onChange={(event) =>
                          updateSelected({ text: event.target.value })
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Font</span>
                      <select
                        value={selectedItem.fontFamily ?? 'Space Grotesk'}
                        onChange={(event) =>
                          updateSelected({ fontFamily: event.target.value })
                        }
                      >
                        {fonts.map((font) => (
                          <option key={font} value={font}>
                            {font}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Font size</span>
                      <input
                        type="range"
                        min="14"
                        max="64"
                        value={selectedItem.fontSize ?? 28}
                        onChange={(event) =>
                          updateSelected({ fontSize: Number(event.target.value) })
                        }
                      />
                    </label>
                    <div className="field-row">
                      <label className="field">
                        <span>Text color</span>
                        <input
                          type="color"
                          value={selectedItem.color ?? '#0f172a'}
                          onChange={(event) =>
                            updateSelected({ color: event.target.value })
                          }
                        />
                      </label>
                      <label className="field">
                        <span>Alignment</span>
                        <select
                          value={selectedItem.align ?? 'left'}
                          onChange={(event) =>
                            updateSelected({ align: event.target.value })
                          }
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </label>
                    </div>
                    <div className="field-row">
                      <label className="field">
                        <span>Background</span>
                        <input
                          type="color"
                          value={selectedItem.backgroundColor ?? '#ffffff'}
                          onChange={(event) =>
                            updateSelected({ backgroundColor: event.target.value })
                          }
                        />
                      </label>
                      <label className="field">
                        <span>Opacity</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={selectedItem.backgroundOpacity ?? 0.85}
                          onChange={(event) =>
                            updateSelected({
                              backgroundOpacity: Number(event.target.value),
                            })
                          }
                        />
                      </label>
                    </div>
                    <div className="field-row">
                      <label className="field">
                        <span>Border width</span>
                        <input
                          type="range"
                          min="0"
                          max="6"
                          value={selectedItem.borderWidth ?? 0}
                          onChange={(event) =>
                            updateSelected({
                              borderWidth: Number(event.target.value),
                            })
                          }
                        />
                      </label>
                      <label className="field">
                        <span>Border color</span>
                        <input
                          type="color"
                          value={selectedItem.borderColor ?? '#e2e8f0'}
                          onChange={(event) =>
                            updateSelected({ borderColor: event.target.value })
                          }
                        />
                      </label>
                    </div>
                    <label className="field">
                      <span>Padding</span>
                      <input
                        type="range"
                        min="0"
                        max="32"
                        value={selectedItem.padding ?? 12}
                        onChange={(event) =>
                          updateSelected({ padding: Number(event.target.value) })
                        }
                      />
                    </label>
                  </>
                ) : (
                  <label className="field">
                    <span>Caption</span>
                    <input
                      type="text"
                      value={selectedItem.label}
                      onChange={(event) =>
                        updateSelected({ label: event.target.value })
                      }
                    />
                  </label>
                )}

                {selectedItem.type === 'image' && (
                  <>
                    <button
                      className="ghost action"
                      onClick={removeBackgroundForSelected}
                      disabled={removingId === selectedItem.id}
                    >
                      {removingId === selectedItem.id
                        ? 'Removing background...'
                        : 'Remove background'}
                    </button>
                    <p className="helper">
                      First run can take a moment while the model loads.
                    </p>
                  </>
                )}

                <label className="field">
                  <span>Scale</span>
                  <input
                    type="range"
                    min="0.6"
                    max="1.4"
                    step="0.02"
                    value={selectedItem.scale ?? 1}
                    onChange={(event) =>
                      updateSelected({ scale: Number(event.target.value) })
                    }
                  />
                </label>

                {selectedItem.type === 'image' && (
                  <>
                    <label className="field">
                      <span>Zoom</span>
                      <input
                        type="range"
                        min="1"
                        max="2"
                        step="0.02"
                        value={selectedItem.zoom ?? 1}
                        onChange={(event) =>
                          updateSelected({ zoom: Number(event.target.value) })
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Crop X</span>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={selectedItem.cropX ?? 0}
                        onChange={(event) =>
                          updateSelected({ cropX: Number(event.target.value) })
                        }
                      />
                    </label>
                    <label className="field">
                      <span>Crop Y</span>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={selectedItem.cropY ?? 0}
                        onChange={(event) =>
                          updateSelected({ cropY: Number(event.target.value) })
                        }
                      />
                    </label>
                  </>
                )}

                <label className="field">
                  <span>Rotation</span>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    value={selectedItem.rotation ?? 0}
                    onChange={(event) =>
                      updateSelected({ rotation: Number(event.target.value) })
                    }
                  />
                </label>

                <label className="field">
                  <span>Corner radius</span>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={selectedItem.radius ?? 18}
                    onChange={(event) =>
                      updateSelected({ radius: Number(event.target.value) })
                    }
                  />
                </label>

                {selectedItem.type === 'image' && (
                  <div className="filter-grid">
                    <p className="label">Filters</p>
                    <div className="filter-list">
                      {filters.map((filter) => (
                        <button
                          key={filter.id}
                          className={`filter-chip ${
                            selectedItem.filter === filter.value ? 'active' : ''
                          }`}
                          onClick={() => applyFilter(filter.value)}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="chips">
                  <button className="chip" onClick={bringToFront}>
                    Front
                  </button>
                  <button className="chip" onClick={sendToBack}>
                    Back
                  </button>
                  {selectedItem.type === 'image' && (
                    <button
                      className={`chip ${cropMode ? 'active' : ''}`}
                      onClick={() => setCropMode((current) => !current)}
                    >
                      {cropMode ? 'Crop on' : 'Crop off'}
                    </button>
                  )}
                  <button className="chip" onClick={toggleLock}>
                    {selectedItem.locked ? 'Unlock' : 'Lock'}
                  </button>
                  <button className="chip danger" onClick={deleteSelected}>
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <p className="empty">Select an item on the canvas to edit</p>
            )}
          </section>

          <section>
            <p className="panel-title">Publishing checklist</p>
            <ul className="checklist">
              <li>Aspect ratio 4:5 or 9:16</li>
              <li>Safe margins for text</li>
              <li>Cover and caption ready</li>
            </ul>
          </section>

          <section>
            <p className="panel-title">Tips</p>
            <div className="tips">
              {tips.map((tip) => (
                <p key={tip}>{tip}</p>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </div>
  )
}

export default App
