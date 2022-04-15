import {
  Garden,
  GardenItem,
  GardenConfig,
  UUID,
  Slug,
} from './types';
import { createSolidDataset, createThing, getThing, getThingAll, setThing, setUrl } from '@inrupt/solid-client';
import { OWL } from '@inrupt/vocab-common-rdf';
import {
  getUUID,
  encodeBase58Slug,
  createPtr,
  uuidUrn,
  slugToUrl,
} from './utils';
import { isItem } from './items';

export function getItemWithUUID(garden: Garden, uuid: UUID): GardenItem | null {
  return garden && getThing(garden, uuid);
}

export function getItemWithSlug(garden: Garden, slug: Slug): GardenItem | null {
  const ptr = garden && getThing(garden, slugToUrl(garden, slug));
  const uuid = garden && ptr && getUUID(ptr);
  return garden && uuid && getItemWithUUID(garden, uuid);
}

export function getItemWithTitle(garden: Garden, title: string): GardenItem | null {
  const slug = encodeBase58Slug(title);
  return garden && getItemWithSlug(garden, slug);
}

export function getItemAll(garden: Garden): GardenItem[] {
  return garden && getThingAll(garden).filter(isItem);
}

export function setItemWithUUID(garden: Garden, item: GardenItem): Garden {
  if (!getUUID(item)) {
    item = item && setUrl(item, OWL.sameAs, uuidUrn());
  }
  return garden && setThing(garden, item);
}

export function setItemWithSlug(
  garden: Garden,
  slug: Slug,
  item: GardenItem
): Garden {
  const uuid = item && getUUID(item);
  garden = garden && setItemWithUUID(garden, item);
  garden = garden && setThing(garden, createPtr(slug, uuid));
  return garden;
}

export function setItemWithTitle(
  garden: Garden,
  title: string,
  item: GardenItem
): Garden {
  const slug = encodeBase58Slug(title);
  return garden && setItemWithSlug(garden, slug, item);
}

const ConfigSlug = 'garden';
export function getConfig(garden: Garden): GardenConfig | null {
  return garden && getItemWithSlug(garden, ConfigSlug);
}

export function createGarden(): Garden {
  const config = createThing({ name: ConfigSlug });
  return setThing(createSolidDataset(), config);
}