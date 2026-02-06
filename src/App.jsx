import { useEffect, useMemo, useRef, useState } from 'react'
import { removeBackground } from '@imgly/background-removal'
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

function App() {
  const [items, setItems] = useState(starterItems)
  const [selectedId, setSelectedId] = useState('img-1')
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)
  const dragStateRef = useRef(null)
  const [background, setBackground] = useState({
    type: 'color',
    value: '#ffffff',
  })
  const [cropMode, setCropMode] = useState(false)
  const [removingId, setRemovingId] = useState(null)

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId),
    [items, selectedId]
  )

  const addText = () => {
    const nextId = `text-${items.length + 1}`
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
    setItems((current) =>
      current.map((item) =>
        item.id === selectedId ? { ...item, ...updates } : item
      )
    )
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
    if (!item) return
    if (item.locked) return

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

  const toggleLock = () => {
    if (!selectedItem) return
    updateSelected({ locked: !selectedItem.locked })
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
      if (
        (event.key === 'Delete' || event.key === 'Backspace') &&
        selectedItem
      ) {
        event.preventDefault()
        deleteSelected()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedItem])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">IC</div>
          <div>
            <p className="brand-title">Insta Collage Maker</p>
            <p className="brand-sub">Design and publish Instagram-ready collages</p>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="ghost">New collage</button>
          <button className="ghost">Save draft</button>
          <button className="ghost">Export PNG</button>
          <button className="primary">Publish to Instagram</button>
        </div>
      </header>

      <main className="workspace">
        <aside className="panel panel-left">
          <section>
            <p className="panel-title">Assets</p>
            <div
              className="dropzone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
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
            <p className="panel-title">Layouts</p>
            <div className="preset-list">
              {presets.map((preset) => (
                <button key={preset.id} className="preset">
                  <div>
                    <p>{preset.name}</p>
                    <span>{preset.note}</span>
                  </div>
                  <span>Apply</span>
                </button>
              ))}
            </div>
          </section>

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
            className="canvas"
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
            }}
          >
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
                  <div className="text-placeholder">
                    {item.text}
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="canvas-footer">
            <div>
              <p>Canvas size: Instagram portrait 4:5</p>
              <span>Resolution 1080 x 1350 px</span>
            </div>
            <div className="canvas-actions">
              <button className="ghost">Duplicate</button>
              <button className="ghost">Snap to grid</button>
              <button className="ghost">Reorder</button>
            </div>
          </div>
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
              <li>Aspect ratio 4:5 or 1:1</li>
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
