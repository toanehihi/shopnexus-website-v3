"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import Image from "next/image"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import { cn } from "@/lib/utils"
import {
	ChevronLeft,
	ChevronRight,
	X,
	ZoomIn,
	ZoomOut,
	RotateCcw,
} from "lucide-react"
import type { Resource } from "@/core/common/resource.type"

function isVideo(resource: Resource) {
	return resource.mime?.startsWith("video/")
}

// ===== Zoom & Pan state =====

function useZoomPan() {
	const [scale, setScale] = useState(1)
	const [translate, setTranslate] = useState({ x: 0, y: 0 })
	const [isDragging, setIsDragging] = useState(false)
	const dragRef = useRef({ startX: 0, startY: 0, txStart: 0, tyStart: 0 })
	const scaleRef = useRef(1)
	const translateRef = useRef({ x: 0, y: 0 })

	// Keep refs in sync
	scaleRef.current = scale
	translateRef.current = translate

	const reset = useCallback(() => {
		setScale(1)
		setTranslate({ x: 0, y: 0 })
	}, [])

	const zoomIn = useCallback(() => setScale((s) => Math.min(s * 1.5, 5)), [])
	const zoomOut = useCallback(() => {
		setScale((s) => {
			const next = Math.max(s / 1.5, 1)
			if (next === 1) setTranslate({ x: 0, y: 0 })
			return next
		})
	}, [])

	const onWheel = useCallback((e: React.WheelEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setScale((s) => {
			const next = e.deltaY < 0 ? Math.min(s * 1.15, 5) : Math.max(s / 1.15, 1)
			if (next === 1) setTranslate({ x: 0, y: 0 })
			return next
		})
	}, [])

	const onPointerDown = useCallback((e: React.PointerEvent) => {
		if (scaleRef.current <= 1) return
		e.preventDefault()
		setIsDragging(true)
		dragRef.current = {
			startX: e.clientX,
			startY: e.clientY,
			txStart: translateRef.current.x,
			tyStart: translateRef.current.y,
		}
		;(e.target as HTMLElement).setPointerCapture(e.pointerId)
	}, [])

	const onPointerMove = useCallback((e: React.PointerEvent) => {
		if (!(e.target as HTMLElement).hasPointerCapture?.(e.pointerId)) return
		const d = dragRef.current
		setTranslate({
			x: d.txStart + e.clientX - d.startX,
			y: d.tyStart + e.clientY - d.startY,
		})
	}, [])

	const onPointerUp = useCallback(() => setIsDragging(false), [])

	const style: React.CSSProperties = {
		transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
		cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
		transition: isDragging ? "none" : "transform 0.2s ease-out",
	}

	return {
		scale,
		style,
		reset,
		zoomIn,
		zoomOut,
		onWheel,
		onPointerDown,
		onPointerMove,
		onPointerUp,
	}
}

// ===== Full-screen viewer (Dialog) =====

export function MediaViewerDialog({
	resources,
	index,
	open,
	onOpenChange,
}: {
	resources: Resource[]
	index: number
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const [current, setCurrent] = useState(index)
	const zoom = useZoomPan()
	const zoomRef = useRef(zoom)
	zoomRef.current = zoom

	const prev = useCallback(() => {
		setCurrent((i) => (i > 0 ? i - 1 : resources.length - 1))
		zoomRef.current.reset()
	}, [resources.length])

	const next = useCallback(() => {
		setCurrent((i) => (i < resources.length - 1 ? i + 1 : 0))
		zoomRef.current.reset()
	}, [resources.length])

	// Sync index when dialog opens
	useEffect(() => {
		if (open) {
			setCurrent(index)
			zoomRef.current.reset()
		}
	}, [open, index])

	// Keyboard navigation
	useEffect(() => {
		if (!open) return
		const handler = (e: KeyboardEvent) => {
			if (e.key === "ArrowLeft") prev()
			else if (e.key === "ArrowRight") next()
			else if (e.key === "Escape") onOpenChange(false)
			else if (e.key === "+" || e.key === "=") zoomRef.current.zoomIn()
			else if (e.key === "-") zoomRef.current.zoomOut()
			else if (e.key === "0") zoomRef.current.reset()
		}
		window.addEventListener("keydown", handler)
		return () => window.removeEventListener("keydown", handler)
	}, [open, prev, next, onOpenChange])

	const resource = resources[current]
	if (!resource) return null

	return (
		<DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
			<DialogPrimitive.Portal>
				{/* Dark overlay */}
				<DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />

				<DialogPrimitive.Content
					className="fixed inset-0 z-50 flex flex-col outline-none"
					onInteractOutside={(e) => e.preventDefault()}
				>
					<VisuallyHidden.Root>
						<DialogPrimitive.Title>Media viewer</DialogPrimitive.Title>
					</VisuallyHidden.Root>
					{/* Top bar */}
					<div className="flex items-center justify-between px-4 py-3 shrink-0">
						<span className="text-white/70 text-sm">
							{resources.length > 1 && `${current + 1} / ${resources.length}`}
						</span>
						<div className="flex items-center gap-1">
							{!isVideo(resource) && (
								<>
									<button
										onClick={zoom.zoomIn}
										className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
										title="Zoom in (+)"
									>
										<ZoomIn className="h-5 w-5" />
									</button>
									<button
										onClick={zoom.zoomOut}
										className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
										title="Zoom out (-)"
									>
										<ZoomOut className="h-5 w-5" />
									</button>
									<button
										onClick={zoom.reset}
										className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
										title="Reset (0)"
									>
										<RotateCcw className="h-4 w-4" />
									</button>
									<div className="w-px h-5 bg-white/20 mx-1" />
								</>
							)}
							<DialogPrimitive.Close className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors">
								<X className="h-5 w-5" />
							</DialogPrimitive.Close>
						</div>
					</div>

					{/* Main content — clicking empty area closes dialog */}
					{/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
					<div
						className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0"
						onClick={() => onOpenChange(false)}
					>
						{isVideo(resource) ? (
							<video
								key={resource.id}
								src={resource.url}
								controls
								autoPlay
								className="max-h-full max-w-full"
								onClick={(e) => e.stopPropagation()}
							/>
						) : (
							<div
								className="relative select-none"
								style={{ width: "80%", height: "80%", ...zoom.style }}
								onWheel={zoom.onWheel}
								onPointerDown={zoom.onPointerDown}
								onPointerMove={zoom.onPointerMove}
								onPointerUp={zoom.onPointerUp}
								onDoubleClick={() =>
									zoom.scale > 1 ? zoom.reset() : zoom.zoomIn()
								}
								onClick={(e) => e.stopPropagation()}
							>
								<Image
									src={resource.url}
									alt=""
									fill
									className="object-contain pointer-events-none"
									sizes="100vw"
									draggable={false}
								/>
							</div>
						)}

						{/* Navigation arrows */}
						{resources.length > 1 && (
							<>
								<button
									onClick={(e) => {
										e.stopPropagation()
										prev()
									}}
									className="absolute left-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white transition-colors"
								>
									<ChevronLeft className="h-6 w-6" />
								</button>
								<button
									onClick={(e) => {
										e.stopPropagation()
										next()
									}}
									className="absolute right-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white transition-colors cursor-pointer"
								>
									<ChevronRight className="h-6 w-6" />
								</button>
							</>
						)}
					</div>

					{/* Thumbnail strip */}
					{resources.length > 1 && (
						<div className="flex gap-2 justify-center p-3 shrink-0 overflow-x-auto">
							{resources.map((r, i) => (
								<button
									key={r.id ?? i}
									onClick={() => {
										setCurrent(i)
										zoom.reset()
									}}
									className={cn(
										"relative h-14 w-14 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all",
										i === current
											? "border-white opacity-100"
											: "border-transparent opacity-40 hover:opacity-70",
									)}
								>
									{isVideo(r) ? (
										<div className="flex items-center justify-center h-full bg-white/10 text-white text-sm">
											&#9654;
										</div>
									) : (
										<Image
											src={r.url}
											alt=""
											fill
											className="object-cover"
											sizes="56px"
										/>
									)}
								</button>
							))}
						</div>
					)}
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	)
}

// ===== Thumbnail grid (inline) =====

export function MediaGrid({
	resources,
	size = "md",
	className,
}: {
	resources: Resource[]
	size?: "sm" | "md" | "lg"
	className?: string
}) {
	const [viewerOpen, setViewerOpen] = useState(false)
	const [viewerIndex, setViewerIndex] = useState(0)

	const sizeClasses = {
		sm: "h-16 w-16",
		md: "h-20 w-20",
		lg: "h-28 w-28",
	}

	if (!resources || resources.length === 0) return null

	return (
		<>
			<div className={cn("flex gap-2 flex-wrap", className)}>
				{resources.map((resource, idx) => (
					<button
						key={`${resource.id ?? resource.url}-${idx}`}
						onClick={() => {
							setViewerIndex(idx)
							setViewerOpen(true)
						}}
						className={cn(
							"relative rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity",
							sizeClasses[size],
						)}
					>
						{isVideo(resource) ? (
							<video
								src={resource.url}
								muted
								className="h-full w-full object-cover"
							/>
						) : (
							<Image
								src={resource.url}
								alt=""
								fill
								className="object-cover"
								sizes="112px"
							/>
						)}
						{isVideo(resource) && (
							<div className="absolute inset-0 flex items-center justify-center bg-black/20">
								<span className="text-white text-lg">&#9654;</span>
							</div>
						)}
					</button>
				))}
			</div>

			<MediaViewerDialog
				resources={resources}
				index={viewerIndex}
				open={viewerOpen}
				onOpenChange={setViewerOpen}
			/>
		</>
	)
}
