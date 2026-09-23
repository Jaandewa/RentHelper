'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Save, X, Tag, Package } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  description: string | null
  sortOrder: number
  _count: { items: number }
}

const EMOJI_OPTIONS = [
  '📦','🚗','🏠','🎉','🔧','📸','⚽','🎮','🏕️','🚲',
  '🎸','💻','👗','🛏️','🌿','🔊','🏥','⚙️','🎯','🛒',
  '🚐','🏍️','✂️','🔬','📷','🎤','🎪','🌊','🏋️','🎭',
]

const defaultForm = { name: '', slug: '', icon: '📦', description: '', sortOrder: 0 }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchCategories = async () => {
    const res = await fetch('/api/admin/categories')
    if (res.ok) {
      const data = await res.json()
      setCategories(data.categories || [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchCategories() }, [])

  const openCreate = () => {
    setForm(defaultForm)
    setError('')
    setEditCat(null)
    setShowCreate(true)
  }

  const openEdit = (cat: Category) => {
    setEditCat(cat)
    setForm({ name: cat.name, slug: cat.slug, icon: cat.icon || '📦', description: cat.description || '', sortOrder: cat.sortOrder })
    setError('')
    setShowCreate(true)
  }

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setForm(f => ({
      ...f,
      name,
      slug: editCat ? f.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }))
  }

  const saveCategory = async () => {
    if (!form.name || !form.slug) { setError('Name and slug are required'); return }
    setSubmitting(true)
    setError('')

    const url = editCat ? `/api/admin/categories/${editCat.id}` : '/api/admin/categories'
    const method = editCat ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.message || 'Failed to save')
      setSubmitting(false)
      return
    }
    setShowCreate(false)
    await fetchCategories()
    setSubmitting(false)
  }

  const deleteCategory = async (id: string) => {
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) {
      alert(data.message)
      return
    }
    setDeleteConfirm(null)
    await fetchCategories()
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="admin-page-header" style={{ margin: 0 }}>
          <h1 className="admin-page-title">Categories</h1>
          <p className="admin-page-subtitle">Manage item categories that providers can use</p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={openCreate}>
          <Plus size={15} /> Add Category
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#475569' }}>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {categories.map(cat => (
            <div key={cat.id} className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px', fontSize: '24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(59,130,246,0.1)', flexShrink: 0,
                }}>
                  {cat.icon || '📦'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>{cat.name}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#475569', fontFamily: 'monospace' }}>/{cat.slug}</p>
                </div>
              </div>

              {cat.description && (
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{cat.description}</p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={13} color="#475569" />
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{cat._count.items} items</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => openEdit(cat)}>
                    <Edit2 size={13} />
                  </button>
                  <button
                    className="admin-btn admin-btn--danger admin-btn--sm"
                    onClick={() => setDeleteConfirm(cat.id)}
                    disabled={cat._count.items > 0}
                    title={cat._count.items > 0 ? `Cannot delete — ${cat._count.items} items use this category` : 'Delete'}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#475569' }}>Sort: {cat.sortOrder}</span>
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="admin-empty" style={{ gridColumn: '1 / -1' }}>
              <div className="admin-empty-icon"><Tag size={40} color="#334155" /></div>
              <p>No categories yet — add your first one</p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreate && (
        <div className="admin-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="admin-modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <h3 className="admin-modal__title">{editCat ? '✏️ Edit Category' : '➕ Add New Category'}</h3>
            <p className="admin-modal__subtitle">{editCat ? `Editing: ${editCat.name}` : 'Create a new item category for providers to use'}</p>

            {/* Icon Picker */}
            <div className="admin-form-group">
              <label className="admin-form-label">Icon / Emoji</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, icon: emoji }))}
                    style={{
                      width: '38px', height: '38px', fontSize: '20px', borderRadius: '8px', cursor: 'pointer',
                      background: form.icon === emoji ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.04)',
                      border: form.icon === emoji ? '2px solid rgba(59,130,246,0.5)' : '2px solid transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
                <input
                  style={{ width: '38px', height: '38px', fontSize: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }}
                  value={EMOJI_OPTIONS.includes(form.icon) ? '' : form.icon}
                  onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                  placeholder="✏️"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Category Name *</label>
              <input
                className="admin-form-input"
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Camera & Photography"
                autoFocus
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Slug * <span style={{ color: '#475569', fontWeight: 400, textTransform: 'none' }}>(URL-friendly, lowercase)</span></label>
              <input
                className="admin-form-input"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                placeholder="camera-photography"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Description</label>
              <textarea
                className="admin-form-textarea"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of what items belong here..."
                rows={2}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Sort Order <span style={{ color: '#475569', fontWeight: 400, textTransform: 'none' }}>(lower = first)</span></label>
              <input
                className="admin-form-input"
                type="number"
                value={form.sortOrder}
                onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
              />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#f87171', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <div className="admin-modal__actions">
              <button className="admin-btn admin-btn--ghost" onClick={() => setShowCreate(false)}>
                <X size={14} /> Cancel
              </button>
              <button className="admin-btn admin-btn--primary" onClick={saveCategory} disabled={submitting}>
                <Save size={14} /> {submitting ? 'Saving...' : editCat ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3 className="admin-modal__title">🗑️ Delete Category</h3>
            <p className="admin-modal__subtitle">This action cannot be undone.</p>
            <div className="admin-modal__actions">
              <button className="admin-btn admin-btn--ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="admin-btn admin-btn--danger" onClick={() => deleteCategory(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
