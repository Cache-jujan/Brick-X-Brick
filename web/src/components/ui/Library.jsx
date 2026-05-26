import React, { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils'

// ─── Button ──────────────────────────────────────────────────────────────────

export const Button = React.forwardRef(function Button(
  { className, variant = 'primary', size = 'md', isLoading, children, ...props },
  ref
) {
  const variants = {
    primary:   'bg-[#D97B2C] text-white hover:bg-[#c0681f] shadow-lg shadow-orange-900/20',
    secondary: 'bg-[#2E2E2E] text-white hover:bg-[#3E3E3E]',
    outline:   'border border-[#D97B2C] text-[#D97B2C] hover:bg-[#D97B2C] hover:text-white',
    danger:    'bg-[#E84B4B] text-white hover:bg-[#c93b3b]',
    success:   'bg-[#3EC87A] text-white hover:bg-[#32a866]',
    warning:   'bg-[#F5A623] text-white hover:bg-[#d4881a]',
    ghost:     'text-[#9A9590] hover:text-white hover:bg-[#2E2E2E]',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-[#D97B2C] focus:ring-offset-2 focus:ring-offset-[#1A1A1A]',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant] ?? variants.primary,
        sizes[size]   ?? sizes.md,
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      )}
      {children}
    </button>
  )
})
Button.displayName = 'Button'

// ─── Card ─────────────────────────────────────────────────────────────────────

export const Card = ({ className, children, ...props }) => (
  <div
    className={cn('bg-[#242424] rounded-xl border border-[#2E2E2E] p-4 shadow-sm', className)}
    {...props}
  >
    {children}
  </div>
)

// ─── Badge ────────────────────────────────────────────────────────────────────

export const Badge = ({ className, variant = 'default', children }) => {
  const variants = {
    default:    'bg-[#2E2E2E] text-[#F0EDE8]',
    success:    'bg-[#3EC87A]/20 text-[#3EC87A] border border-[#3EC87A]/30',
    warning:    'bg-[#F5A623]/20 text-[#F5A623] border border-[#F5A623]/30',
    danger:     'bg-[#E84B4B]/20 text-[#E84B4B] border border-[#E84B4B]/30',
    blockchain: 'bg-[#6C63FF]/20 text-[#6C63FF] border border-[#6C63FF]/30',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant] ?? variants.default,
        className
      )}
    >
      {children}
    </span>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────

export const Input = React.forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-[#2E2E2E] bg-[#1A1A1A]',
        'px-3 py-2 text-sm text-[#F0EDE8] placeholder:text-[#9A9590]',
        'focus:outline-none focus:border-[#D97B2C] focus:ring-1 focus:ring-[#D97B2C]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
})
Input.displayName = 'Input'

// ─── Modal ────────────────────────────────────────────────────────────────────

export const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl bg-[#242424] border border-[#2E2E2E] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2E2E2E] px-6 py-4">
          <h3 className="text-lg font-bold font-display text-[#F0EDE8]">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#9A9590] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-6">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-[#2E2E2E] px-6 py-4 bg-[#1A1A1A]/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────

export const Select = ({ className, children, ...props }) => (
  <select
    className={cn(
      'flex h-10 w-full rounded-lg border border-[#2E2E2E] bg-[#1A1A1A]',
      'px-3 py-2 text-sm text-[#F0EDE8]',
      'focus:outline-none focus:border-[#D97B2C] focus:ring-1 focus:ring-[#D97B2C]',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    {children}
  </select>
)

// ─── Textarea ─────────────────────────────────────────────────────────────────

export const Textarea = React.forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'flex w-full rounded-lg border border-[#2E2E2E] bg-[#1A1A1A]',
        'px-3 py-2 text-sm text-[#F0EDE8] placeholder:text-[#9A9590]',
        'focus:outline-none focus:border-[#D97B2C] focus:ring-1 focus:ring-[#D97B2C]',
        'disabled:cursor-not-allowed disabled:opacity-50 resize-none',
        className
      )}
      {...props}
    />
  )
})
Textarea.displayName = 'Textarea'

// ─── Label ────────────────────────────────────────────────────────────────────

export const Label = ({ className, children, ...props }) => (
  <label
    className={cn('block text-sm font-medium text-[#F0EDE8] mb-1', className)}
    {...props}
  >
    {children}
  </label>
)

// ─── Spinner ──────────────────────────────────────────────────────────────────

export const Spinner = ({ className }) => (
  <div
    className={cn(
      'h-8 w-8 animate-spin rounded-full border-2 border-[#2E2E2E] border-t-[#D97B2C]',
      className
    )}
  />
)