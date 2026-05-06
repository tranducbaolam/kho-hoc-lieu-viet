'use client'

import type { ElementType } from 'react'
import { Search, X, ChevronDown, FolderOpen } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { CONTENT_TYPE_LABELS } from '@/features/education/types'

interface ToolbarProps {
  search: string
  onSearch: (val: string) => void
  categories: { id: string; name: string }[]
  categoryFilter: string | null
  onCategoryFilter: (id: string | null) => void
  statusFilter: string | null
  onStatusFilter: (value: string | null) => void
  contentTypeFilter: string | null
  onContentTypeFilter: (value: string | null) => void
  grades: { id: string; name: string }[]
  gradeFilter: string | null
  onGradeFilter: (value: string | null) => void
  subjects: { id: string; name: string }[]
  subjectFilter: string | null
  onSubjectFilter: (value: string | null) => void
  chapters: { id: string; name: string }[]
  chapterFilter: string | null
  onChapterFilter: (value: string | null) => void
  hasFilters: boolean
  onClearFilters: () => void
}

function FilterMenu({
  label,
  icon: Icon,
  value,
  options,
  onChange,
}: {
  label: string
  icon: ElementType
  value: string | null
  options: { id: string; name: string }[]
  onChange: (value: string | null) => void
}) {
  const selected = options.find((item) => item.id === value)?.name
  if (options.length === 0) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(
        'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm transition-colors cursor-pointer',
        value ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
      )}>
        <Icon className="h-3.5 w-3.5" />
        {selected ?? label}
        <ChevronDown className="h-3.5 w-3.5 ml-0.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={() => onChange(null)}>Tất cả</DropdownMenuItem>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuItem key={option.id} onClick={() => onChange(option.id)} className={cn(value === option.id && 'text-blue-600 font-medium')}>
            {option.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function PostTableToolbar({
  search,
  onSearch,
  categories,
  categoryFilter,
  onCategoryFilter,
  statusFilter,
  onStatusFilter,
  contentTypeFilter,
  onContentTypeFilter,
  grades,
  gradeFilter,
  onGradeFilter,
  subjects,
  subjectFilter,
  onSubjectFilter,
  chapters,
  chapterFilter,
  onChapterFilter,
  hasFilters,
  onClearFilters,
}: ToolbarProps) {
  const selectedCategoryName = categories.find(c => c.id === categoryFilter)?.name

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Tìm bài viết..."
          className="pl-9 h-9 text-sm"
        />
        {search && (
          <button
            onClick={() => onSearch('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100 text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(
            'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm transition-colors cursor-pointer',
            categoryFilter
              ? 'border-blue-300 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          )}>
            <FolderOpen className="h-3.5 w-3.5" />
            {selectedCategoryName ?? 'Chuyên mục phụ'}
            <ChevronDown className="h-3.5 w-3.5 ml-0.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem onClick={() => onCategoryFilter(null)}>
              Tất cả chuyên mục
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {categories.map(cat => (
              <DropdownMenuItem
                key={cat.id}
                onClick={() => onCategoryFilter(cat.id)}
                className={cn(categoryFilter === cat.id && 'text-blue-600 font-medium')}
              >
                {cat.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <FilterMenu
        label="Trạng thái"
        icon={FolderOpen}
        value={statusFilter}
        onChange={onStatusFilter}
        options={[
          { id: 'published', name: 'Đã đăng' },
          { id: 'draft', name: 'Bản nháp' },
        ]}
      />

      <FilterMenu
        label="Loại nội dung"
        icon={FolderOpen}
        value={contentTypeFilter}
        onChange={onContentTypeFilter}
        options={Object.entries(CONTENT_TYPE_LABELS).map(([id, name]) => ({ id, name }))}
      />

      <FilterMenu label="Lớp" icon={FolderOpen} value={gradeFilter} onChange={onGradeFilter} options={grades} />
      <FilterMenu label="Môn" icon={FolderOpen} value={subjectFilter} onChange={onSubjectFilter} options={subjects} />
      <FilterMenu label="Chương" icon={FolderOpen} value={chapterFilter} onChange={onChapterFilter} options={chapters} />

      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-muted-foreground hover:bg-gray-50 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Xóa lọc
        </button>
      )}
    </div>
  )
}
