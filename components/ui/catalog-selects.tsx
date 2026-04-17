"use client"

import { useState, useMemo, useCallback } from "react"
import { useListCategories, Category } from "@/core/catalog/category"
import { useListTags, Tag } from "@/core/catalog/tag"
import { SearchableSelect, SearchableSelectOption } from "@/components/ui/searchable-select"
import { useDebounce } from "@/lib/hooks/use-debounce"

// ===== Category Select =====

interface CategorySelectProps {
	value?: string | null
	values?: string[]
	onChange?: (value: string | null) => void
	onValuesChange?: (values: string[]) => void
	multiple?: boolean
	placeholder?: string
	disabled?: boolean
	className?: string
}

export function CategorySelect({
	value,
	values,
	onChange,
	onValuesChange,
	multiple = false,
	placeholder = "Select category",
	disabled = false,
	className,
}: CategorySelectProps) {
	const [searchQuery, setSearchQuery] = useState("")
	const debouncedSearch = useDebounce(searchQuery, 300)

	const { data, isLoading } = useListCategories({
		search: debouncedSearch || undefined,
		id: !debouncedSearch && value ? [value] : undefined,
		limit: 20,
	})

	const options: SearchableSelectOption[] = useMemo(() => {
		const categories = data?.pages.flatMap((page) => page.data) ?? []
		return categories.map((cat) => ({
			id: cat.id,
			label: cat.name,
			description: cat.description || undefined,
		}))
	}, [data])

	return (
		<SearchableSelect
			value={value}
			values={values}
			onChange={onChange}
			onValuesChange={onValuesChange}
			options={options}
			isLoading={isLoading}
			searchQuery={searchQuery}
			onSearchChange={setSearchQuery}
			placeholder={placeholder}
			emptyMessage="No categories found."
			multiple={multiple}
			disabled={disabled}
			className={className}
		/>
	)
}

// ===== Tag Select =====

interface TagSelectProps {
	value?: string | null
	values?: string[]
	onChange?: (value: string | null) => void
	onValuesChange?: (values: string[]) => void
	multiple?: boolean
	placeholder?: string
	disabled?: boolean
	className?: string
}

export function TagSelect({
	value,
	values,
	onChange,
	onValuesChange,
	multiple = true, // Tags are typically multi-select
	placeholder = "Select tags",
	disabled = false,
	className,
}: TagSelectProps) {
	const [searchQuery, setSearchQuery] = useState("")
	const debouncedSearch = useDebounce(searchQuery, 300)

	const { data, isLoading } = useListTags({
		search: debouncedSearch || undefined,
		limit: 20,
	})

	const options: SearchableSelectOption[] = useMemo(() => {
		const tags = data?.pages.flatMap((page) => page.data) ?? []
		const tagOptions = tags.map((tag) => ({
			id: tag.id,
			label: tag.id, // Tag id is typically the tag name
			description: tag.description || undefined,
		}))
		// Inject pre-filled values not in fetched results so they display
		const existingIds = new Set(tagOptions.map((t) => t.id))
		for (const v of values ?? []) {
			if (!existingIds.has(v)) {
				tagOptions.push({ id: v, label: v, description: undefined })
			}
		}
		return tagOptions
	}, [data, values])

	return (
		<SearchableSelect
			value={value}
			values={values}
			onChange={onChange}
			onValuesChange={onValuesChange}
			options={options}
			isLoading={isLoading}
			searchQuery={searchQuery}
			onSearchChange={setSearchQuery}
			placeholder={placeholder}
			emptyMessage="No tags found."
			multiple={multiple}
			disabled={disabled}
			className={className}
		/>
	)
}
