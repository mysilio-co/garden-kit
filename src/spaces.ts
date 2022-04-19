import {
  createThing,
  getThing,
  getThingAll,
  getUrl,
  WebId,
  setThing,
  Thing,
  getUrlAll,
  buildThing,
} from '@inrupt/solid-client';
import {
  Profile,
  Container,
  SpacePreferencesFile,
  SpacePreferences,
  Space,
  Slug,
  GardenFile,
} from './types';
import { WS } from '@inrupt/vocab-solid-common';
import { hasRDFType, slugToUrl } from './utils';
import { RDF } from '@inrupt/vocab-common-rdf';
import { MY } from './vocab';

export function getRootContainer(profile: Profile): Container | null {
  // TODO: What should we do if there is no storage set?
  return getUrl(profile, WS.storage);
}

export function defaultSpacePreferencesFile(
  root: Container
): SpacePreferencesFile {
  return new URL('settings/prefs.ttl', root).toString();
}

export function getSpacePreferencesFile(
  profile: Profile
): SpacePreferencesFile | null {
  const root = getRootContainer(profile);
  const defaultPath = root && defaultSpacePreferencesFile(root);
  return getUrl(profile, WS.preferencesFile) || defaultPath;
}

export function getContainer(space: Space): Container | null {
  return getUrl(space, WS.storage);
}

export function getGardenFileAll(space: Space): GardenFile[] {
  return getUrlAll(space, MY.Garden.hasGarden);
}

export function getCompostFile(space: Space): GardenFile | null {
  return getUrl(space, MY.Garden.hasCompost);
}

export function getNurseryFile(space: Space): GardenFile | null {
  return getUrl(space, MY.Garden.hasNursery);
}

export function getSpaceAll(spaces: SpacePreferences): Space[] {
  return getThingAll(spaces).filter(isSpace);
}

export function isSpace(thing: Thing): boolean {
  return hasRDFType(thing, MY.Garden.Space);
}

export function isMetaSpace(thing: Thing): boolean {
  return hasRDFType(thing, MY.Garden.MetaSpace);
}

export function getSpace(spaces: SpacePreferences, slug: Slug): Space | null {
  const thingUrl = slugToUrl(spaces, slug);
  return thingUrl ? getThing(spaces, thingUrl) : null;
}

export function setSpace(
  spaces: SpacePreferences,
  space: Space
): SpacePreferences {
  return setThing(spaces, space);
}

export function createSpace(
  holder: WebId,
  container: Container,
  slug: Slug,
  gardenUrls: {
    private: GardenFile;
    public: GardenFile;
    nursery: GardenFile;
    compost: GardenFile;
  }
): Space {
  return buildThing(createThing({ name: slug }))
    .addUrl(MY.Garden.holder, holder)
    .addUrl(RDF.type, WS.Workspace)
    .addUrl(RDF.type, MY.Garden.Space)
    .addUrl(WS.storage, container)
    .addUrl(MY.Garden.imageStorage, new URL('images/', container).toString())
    .addUrl(MY.Garden.fileStorage, new URL('files/', container).toString())
    .addUrl(MY.Garden.noteStorage, new URL('notes/', container).toString())
    .addUrl(MY.Garden.hasGarden, gardenUrls.private)
    .addUrl(MY.Garden.hasGarden, gardenUrls.public)
    .addUrl(MY.Garden.hasNursery, gardenUrls.nursery)
    .addUrl(MY.Garden.hasCompost, gardenUrls.compost)
    .addUrl(
      MY.Garden.hasPublicationsManifest,
      new URL('publications.ttl', container).toString()
    )
    .addUrl(
      MY.Garden.hasGnomesManifest,
      new URL('gnomes.ttl', container).toString()
    )
    .build();
}

export const MetaSpaceSlug = 'spaces';
export const HomeSpaceSlug = 'home'
export function getMetaSpace(spaces: SpacePreferences): Space | null {
  return getSpace(spaces, MetaSpaceSlug);
}

export function setMetaSpace(
  spaces: SpacePreferences,
  space: Space
): SpacePreferences {
  console.assert(isMetaSpace(space));
  return setSpace(spaces, space);
}

export function hasRequiredSpaces(spaces: SpacePreferences): boolean {
  return !!getMetaSpace(spaces) && getSpaceAll(spaces).length > 0;
}

export function createMetaSpace(holder: WebId, profile: Profile) {
  const root = getRootContainer(profile);
  if (root) {
    return buildThing(createThing({ name: MetaSpaceSlug }))
      .addUrl(MY.Garden.holder, holder)
      .addUrl(RDF.type, WS.MasterWorkspace)
      .addUrl(RDF.type, MY.Garden.MetaSpace)
      .addUrl(WS.storage, new URL('spaces/', root).toString())
      .build();
  } else {
    throw new Error(`No storage found in WebID: ${holder}`);
  }
}
