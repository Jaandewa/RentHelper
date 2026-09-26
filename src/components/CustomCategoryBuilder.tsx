'use client'

import React, { useState } from 'react'
import { CategoryFieldConfig } from '@/lib/categoryConfig'
import { Plus, Trash2, Settings, Tag } from 'lucide-react'

interface CustomCategoryBuilderProps {
  customCategoryName: string
  customFields: CategoryFieldConfig[]
  onNameChange: (name: string) => void
  onFieldsChange: (fields: CategoryFieldConfig[]) => void
}

export function CustomCategoryBuilder({
  customCategoryName,
  customFields,
  onNameChange,
  onFieldsChange,
}: CustomCategoryBuilderProps) {
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType] = useState<CategoryFieldConfig['type']>('text')
  const [newRequired, setNewRequired] = useState(false)
  const [newOptionsInput, setNewOptionsInput] = useState('')

  const handleAddField = () => {
    if (!newLabel.trim()) return

    const key = newLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')

    const options =
      newType === 'select'
        ? newOptionsInput
            .split(',')
            .map(o => o.trim())
            .filter(Boolean)
        : undefined

    const newFieldConfig: CategoryFieldConfig = {
      key: key || `field_${Date.now()}`,
      label: newLabel.trim(),
      type: newType,
      required: newRequired,
      options,
      visibility: 'PUBLIC',
      group: 'Custom Category Attributes',
    }

    onFieldsChange([...customFields, newFieldConfig])
    setNewLabel('')
    setNewType('text')
    setNewRequired(false)
    setNewOptionsInput('')
  }

  const handleRemoveField = (index: number) => {
    onFieldsChange(customFields.filter((_, i) => i !== index))
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl p-5 space-y-4 shadow-2xs">
      <div className="flex items-center gap-2 border-b border-amber-200/60 pb-3">
        <Tag className="w-5 h-5 text-amber-600" />
        <div>
          <h3 className="text-sm font-bold text-amber-950">Custom Category Configuration</h3>
          <p className="text-xs text-amber-800">Specify your custom category name and define custom fields for your inventory</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-amber-950 mb-1">
            Custom Category Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={customCategoryName}
            onChange={e => onNameChange(e.target.value)}
            placeholder="e.g. Musical Instruments, Drone Equipment"
            className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Existing Custom Fields */}
        {customFields.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-amber-950">Defined Custom Fields ({customFields.length})</label>
            <div className="space-y-2">
              {customFields.map((field, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white border border-amber-200 rounded-lg p-3 text-xs shadow-2xs">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                      {field.label}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-medium">
                        {field.type}
                      </span>
                      {field.required && <span className="text-red-500 font-bold">*Required</span>}
                    </p>
                    {field.options && field.options.length > 0 && (
                      <p className="text-slate-500">Options: {field.options.join(', ')}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveField(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Remove field"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Custom Field Control */}
        <div className="bg-white border border-amber-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-amber-600" /> Add New Custom Field
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Field Label *</label>
              <input
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="e.g. Number of Strings, Case Included"
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Field Type</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as CategoryFieldConfig['type'])}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="select">Select Dropdown</option>
                <option value="boolean">Checkbox / Yes-No</option>
                <option value="textarea">Textarea</option>
              </select>
            </div>
            <div className="flex items-center pt-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={newRequired}
                  onChange={e => setNewRequired(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                Required Field
              </label>
            </div>
          </div>

          {newType === 'select' && (
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Dropdown Options (Comma-separated)</label>
              <input
                type="text"
                value={newOptionsInput}
                onChange={e => setNewOptionsInput(e.target.value)}
                placeholder="e.g. Acoustic, Electric, Bass, Classical"
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleAddField}
            disabled={!newLabel.trim()}
            className="w-full sm:w-auto px-4 py-2 bg-amber-600 text-white font-medium rounded-lg text-xs hover:bg-amber-700 disabled:opacity-50 transition shadow-2xs flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Field to Category
          </button>
        </div>
      </div>
    </div>
  )
}
