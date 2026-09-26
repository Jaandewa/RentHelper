'use client'

import React from 'react'
import { CategoryFieldConfig } from '@/lib/categoryConfig'
import { AlertCircle, Lock, Calendar, Plus, X } from 'lucide-react'

interface CategoryFieldsRendererProps {
  fields: CategoryFieldConfig[]
  values: Record<string, any>
  errors: Record<string, string>
  onChange: (key: string, value: any) => void
  disabled?: boolean
}

export function CategoryFieldsRenderer({
  fields,
  values,
  errors,
  onChange,
  disabled = false,
}: CategoryFieldsRendererProps) {
  if (!fields || fields.length === 0) return null

  // Group fields by group name
  const groups: Record<string, CategoryFieldConfig[]> = {}
  fields.forEach(field => {
    const groupName = field.group || 'Category Specific Attributes'
    if (!groups[groupName]) groups[groupName] = []
    groups[groupName].push(field)
  })

  // Check date expiry helper
  const checkExpiryWarning = (dateStr: string) => {
    if (!dateStr) return null
    const expDate = new Date(dateStr)
    const today = new Date()
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24))

    if (diffDays < 0) {
      return { type: 'expired', text: '⚠️ Document has EXPIRED! Marketplace ad publication may be blocked.' }
    } else if (diffDays <= 30) {
      return { type: 'warning', text: `⚠️ Expires soon (${diffDays} days left). Please renew promptly.` }
    }
    return null
  }

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([groupTitle, groupFields]) => (
        <div key={groupTitle} className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <h3 className="text-sm font-semibold text-slate-900 tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              {groupTitle}
            </h3>
            <span className="text-xs text-slate-500 font-medium">{groupFields.length} attributes</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groupFields.map(field => {
              const val = values[field.key] ?? ''
              const error = errors[field.key]
              const isPrivate = field.visibility === 'PRIVATE'

              const expiryWarn = (field.type === 'date' && val) ? checkExpiryWarning(String(val)) : null

              return (
                <div
                  key={field.key}
                  className={`${
                    field.type === 'textarea' || field.type === 'multiselect' ? 'md:col-span-2' : ''
                  } space-y-1.5`}
                >
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>

                    {isPrivate && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200" title="This field is kept private and hidden from public marketplace ads">
                        <Lock className="w-2.5 h-2.5" /> Private
                      </span>
                    )}
                  </div>

                  {/* Render based on field.type */}
                  {field.type === 'text' && (
                    <input
                      type="text"
                      disabled={disabled}
                      value={val}
                      onChange={e => onChange(field.key, e.target.value)}
                      placeholder={field.placeholder || ''}
                      className={`w-full border ${
                        error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'
                      } rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white transition`}
                    />
                  )}

                  {field.type === 'number' && (
                    <input
                      type="number"
                      disabled={disabled}
                      value={val}
                      min={field.validation?.min}
                      max={field.validation?.max}
                      onChange={e => onChange(field.key, e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={field.placeholder || ''}
                      className={`w-full border ${
                        error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'
                      } rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white transition`}
                    />
                  )}

                  {field.type === 'date' && (
                    <div>
                      <input
                        type="date"
                        disabled={disabled}
                        value={val ? String(val).split('T')[0] : ''}
                        onChange={e => onChange(field.key, e.target.value)}
                        className={`w-full border ${
                          error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'
                        } rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white transition`}
                      />
                      {expiryWarn && (
                        <p className={`text-xs mt-1 font-medium ${expiryWarn.type === 'expired' ? 'text-red-600' : 'text-amber-600'}`}>
                          {expiryWarn.text}
                        </p>
                      )}
                    </div>
                  )}

                  {field.type === 'select' && (
                    <select
                      disabled={disabled}
                      value={val}
                      onChange={e => onChange(field.key, e.target.value)}
                      className={`w-full border ${
                        error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'
                      } rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white transition`}
                    >
                      <option value="">Select {field.label.toLowerCase()}</option>
                      {field.options?.map(opt => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === 'textarea' && (
                    <textarea
                      disabled={disabled}
                      rows={2}
                      value={val}
                      onChange={e => onChange(field.key, e.target.value)}
                      placeholder={field.placeholder || ''}
                      className={`w-full border ${
                        error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'
                      } rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white resize-none transition`}
                    />
                  )}

                  {field.type === 'boolean' && (
                    <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={Boolean(val)}
                        onChange={e => onChange(field.key, e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700">{field.label}</span>
                    </label>
                  )}

                  {field.type === 'multiselect' && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {field.options?.map(opt => {
                          const currentArr: string[] = Array.isArray(val) ? val : []
                          const isSelected = currentArr.includes(opt)

                          return (
                            <button
                              type="button"
                              key={opt}
                              onClick={() => {
                                if (isSelected) {
                                  onChange(
                                    field.key,
                                    currentArr.filter(item => item !== opt)
                                  )
                                } else {
                                  onChange(field.key, [...currentArr, opt])
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {opt} {isSelected ? '✓' : '+'}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {field.helpText && <p className="text-[11px] text-slate-500 mt-0.5">{field.helpText}</p>}
                  {error && (
                    <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" /> {error}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
