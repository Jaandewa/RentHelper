'use client'

import { useEffect, useState, useId } from 'react'
import {
  getAllProvinces,
  getDistrictsByProvince,
  getCitiesByDistrict,
  getLocationHierarchy,
} from '@/lib/location/sri-lanka'
import { MapPin, CheckCircle, AlertCircle } from 'lucide-react'

export interface LocationValue {
  province: string
  district: string
  city: string
}

export interface SriLankaLocationPickerProps {
  value?: Partial<LocationValue>
  onChange: (value: LocationValue) => void
  required?: boolean
  disabled?: boolean
  layout?: 'stacked' | 'grid'
  labelPrefix?: string
  errors?: {
    province?: string
    district?: string
    city?: string
  }
}

export default function SriLankaLocationPicker({
  value = {},
  onChange,
  required = true,
  disabled = false,
  layout = 'grid',
  labelPrefix = '',
  errors = {},
}: SriLankaLocationPickerProps) {
  const provinceId = useId()
  const districtId = useId()
  const cityId = useId()

  const [province, setProvince] = useState(value.province || '')
  const [district, setDistrict] = useState(value.district || '')
  const [city, setCity] = useState(value.city || '')

  // Auto-fill province & district if only city is initially supplied (legacy migration helper)
  useEffect(() => {
    if (value.city && (!value.province || !value.district)) {
      const hierarchy = getLocationHierarchy(value.city)
      if (hierarchy) {
        setProvince(hierarchy.province)
        setDistrict(hierarchy.district)
        setCity(hierarchy.city)
        return
      }
    }

    setProvince(value.province || '')
    setDistrict(value.district || '')
    setCity(value.city || '')
  }, [value.province, value.district, value.city])

  const provinces = getAllProvinces()
  const districts = getDistrictsByProvince(province)
  const cities = getCitiesByDistrict(district, province)

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvince = e.target.value
    setProvince(newProvince)
    setDistrict('')
    setCity('')
    onChange({
      province: newProvince,
      district: '',
      city: '',
    })
  }

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDistrict = e.target.value
    setDistrict(newDistrict)
    setCity('')
    onChange({
      province,
      district: newDistrict,
      city: '',
    })
  }

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCity = e.target.value
    setCity(newCity)
    onChange({
      province,
      district,
      city: newCity,
    })
  }

  const containerClass =
    layout === 'grid'
      ? 'grid grid-cols-1 md:grid-cols-3 gap-4'
      : 'space-y-4'

  return (
    <div className={containerClass}>
      {/* 1. Province Dropdown */}
      <div>
        <label
          htmlFor={provinceId}
          className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
        >
          {labelPrefix ? `${labelPrefix} ` : ''}Province {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <select
            id={provinceId}
            name="province"
            value={province}
            onChange={handleProvinceChange}
            disabled={disabled}
            required={required}
            aria-required={required}
            aria-invalid={Boolean(errors.province)}
            aria-describedby={errors.province ? `${provinceId}-error` : undefined}
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed appearance-none ${
              errors.province ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Province</option>
            {provinces.map((p) => (
              <option key={p} value={p}>
                {p} Province
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
            ▼
          </div>
        </div>
        {errors.province && (
          <p id={`${provinceId}-error`} className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {errors.province}
          </p>
        )}
      </div>

      {/* 2. District Dropdown */}
      <div>
        <label
          htmlFor={districtId}
          className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
        >
          {labelPrefix ? `${labelPrefix} ` : ''}District {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <select
            id={districtId}
            name="district"
            value={district}
            onChange={handleDistrictChange}
            disabled={disabled || !province}
            required={required}
            aria-required={required}
            aria-invalid={Boolean(errors.district)}
            aria-describedby={errors.district ? `${districtId}-error` : undefined}
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed appearance-none ${
              errors.district ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">
              {!province ? 'Select Province First' : 'Select District'}
            </option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d} District
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
            ▼
          </div>
        </div>
        {errors.district && (
          <p id={`${districtId}-error`} className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {errors.district}
          </p>
        )}
      </div>

      {/* 3. City Dropdown */}
      <div>
        <label
          htmlFor={cityId}
          className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
        >
          {labelPrefix ? `${labelPrefix} ` : ''}City / Town {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <select
            id={cityId}
            name="city"
            value={city}
            onChange={handleCityChange}
            disabled={disabled || !district}
            required={required}
            aria-required={required}
            aria-invalid={Boolean(errors.city)}
            aria-describedby={errors.city ? `${cityId}-error` : undefined}
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed appearance-none ${
              errors.city ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">
              {!district ? 'Select District First' : 'Select City'}
            </option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">
            ▼
          </div>
        </div>
        {errors.city && (
          <p id={`${cityId}-error`} className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {errors.city}
          </p>
        )}
      </div>
    </div>
  )
}
