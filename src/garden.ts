import { Garden, GardenItem, GardenFile, UUIDString, Slug } from './types'
import { getThing, getThingAll, setThing } from '@inrupt/solid-client'
import {
  getUUID,
  encodeBase58Slug,
  createPtr,
  slugToUrl,
  addUUID,
} from './utils'
import { isItem } from './items'

export function getItemWithUUID(
  garden: Garden,
  uuid: UUIDString
): GardenItem | null {
  return getThing(garden, uuid)
}

export function getItemWithSlug(garden: Garden, slug: Slug): GardenItem | null {
  const thingUrl = slugToUrl(garden, slug)
  const ptr = thingUrl && getThing(garden, thingUrl)
  const uuid = ptr && getUUID(ptr)
  return uuid ? getItemWithUUID(garden, uuid) : null
}

export function getItemWithTitle(
  garden: Garden,
  title: string
): GardenItem | null {
  const slug = encodeBase58Slug(title)
  return getItemWithSlug(garden, slug)
}

export function getItemAll(garden: Garden): GardenItem[] {
  return getThingAll(garden).filter(isItem)
}

export function setItemWithUUID(garden: Garden, item: GardenItem): Garden {
  if (!getUUID(item)) {
    item = addUUID(item)
  }
  return setThing(garden, item)
}

export function setItemWithSlug(
  garden: Garden,
  slug: Slug,
  item: GardenItem
): Garden {
  garden = setItemWithUUID(garden, item)
  // setItemWithUUID adds a UUID if there isn't one, so this should never be null
  const uuid = getUUID(item) as UUIDString
  garden = setThing(garden, createPtr(slug, uuid))
  return garden
}

export function setItemWithTitle(
  garden: Garden,
  title: string,
  item: GardenItem
): Garden {
  const slug = encodeBase58Slug(title)
  return setItemWithSlug(garden, slug, item)
}
