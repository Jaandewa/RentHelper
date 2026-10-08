import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export interface HeroSlideItem {
  id: string
  title: string
  highlightText: string
  subtitle: string
  badgeText: string
  ctaText: string
  ctaLink: string
  imageUrl: string
  doodleTop: string
  doodleBottom: string
  slideDurationSeconds: number
  isActive: boolean
}

// Default 6 slides matching the reference image + Sri Lankan clothing & themes
export const DEFAULT_HERO_SLIDES: HeroSlideItem[] = [
  {
    id: 'slide-1',
    title: 'Need an Item?',
    highlightText: 'Rent It Instead!',
    subtitle: 'From electronics to outdoor gear, find and rent the items you need — at the best prices, from people near you.',
    badgeText: 'Rent Anything, Anywhere',
    ctaText: 'Search Marketplace',
    ctaLink: '#search',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
    doodleTop: 'More Choices ✨',
    doodleBottom: 'Less Cost!',
    slideDurationSeconds: 3,
    isActive: true,
  },
  {
    id: 'slide-2',
    title: 'Latest Gadgets',
    highlightText: 'for Your Everyday',
    subtitle: 'Rent laptops, cameras, gaming consoles, and smartphones. Get the latest tech without the high price tag.',
    badgeText: 'Electronics & Tech',
    ctaText: 'Browse Electronics →',
    ctaLink: '/marketplace?category=it-equipment',
    imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1600&q=80',
    doodleTop: 'Top Tech 💻',
    doodleBottom: 'Daily Rates!',
    slideDurationSeconds: 3,
    isActive: true,
  },
  {
    id: 'slide-3',
    title: 'Gear Up for',
    highlightText: 'Your Next Adventure',
    subtitle: 'Tents, bikes, camping equipment, cameras & waterproof gear. Rent what you need, explore Sri Lanka.',
    badgeText: 'Outdoor & Sports',
    ctaText: 'Explore Outdoor Gear →',
    ctaLink: '/marketplace?category=sports-outdoors',
    imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1600&q=80',
    doodleTop: 'Travel Easy 🏕️',
    doodleBottom: 'Hassle Free!',
    slideDurationSeconds: 3,
    isActive: true,
  },
  {
    id: 'slide-4',
    title: 'Look Great',
    highlightText: 'Without Owning',
    subtitle: 'Rent traditional Sri Lankan Osari sarees, designer bridal frocks, suits, party wear & jewelry for any occasion.',
    badgeText: 'Sri Lankan Fashion & Bridal',
    ctaText: 'Browse Sarees & Frocks →',
    ctaLink: '/marketplace?category=clothing-bridal',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=80',
    doodleTop: 'Sarees & Frocks 💃',
    doodleBottom: 'Party Ready!',
    slideDurationSeconds: 3,
    isActive: true,
  },
  {
    id: 'slide-5',
    title: 'Everything for',
    highlightText: 'Your Home & Family',
    subtitle: 'From washing machines and furniture to baby gear, find home essentials — just for as long as you need.',
    badgeText: 'Home & Appliances',
    ctaText: 'Browse Home & Kids →',
    ctaLink: '/marketplace?category=furniture-appliances',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1600&q=80',
    doodleTop: 'Smart Living 🏡',
    doodleBottom: 'Pay Per Day!',
    slideDurationSeconds: 3,
    isActive: true,
  },
  {
    id: 'slide-6',
    title: 'Get the Job Done',
    highlightText: 'With the Right Tools',
    subtitle: 'Power tools, lawnmowers, pressure washers & construction equipment. Rent it. Use it. Finish it.',
    badgeText: 'Tools & Heavy Equipment',
    ctaText: 'Browse Tools & Equipment →',
    ctaLink: '/marketplace?category=tools-equipment',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1600&q=80',
    doodleTop: 'Pro Tools 🛠️',
    doodleBottom: 'Save Big!',
    slideDurationSeconds: 3,
    isActive: true,
  },
]

// GET /api/hero-slides — Fetch active hero slideshow slides & global duration
export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: '1' } }) as any
    
    if (settings?.heroSlidesConfig) {
      try {
        const parsed = JSON.parse(settings.heroSlidesConfig)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const activeSlides = parsed.filter((s: HeroSlideItem) => s.isActive !== false)
          if (activeSlides.length > 0) {
            return NextResponse.json({ slides: activeSlides, duration: settings?.heroSlideDurationSeconds || 3 })
          }
        }
      } catch {
        // Fallback to defaults if JSON parse fails
      }
    }

    return NextResponse.json({
      slides: DEFAULT_HERO_SLIDES,
      duration: settings?.heroSlideDurationSeconds || 3,
    })
  } catch (error) {
    return NextResponse.json({
      slides: DEFAULT_HERO_SLIDES,
      duration: 3,
    })
  }
}
