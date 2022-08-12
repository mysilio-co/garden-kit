import {
  createThing,
  getThing,
  getThingAll,
  getUrl,
  setUrl,
  WebId,
  setThing,
  Thing,
  getUrlAll,
  buildThing,
  getStringNoLocale,
  UrlString,
} from '@inrupt/solid-client';
import {
  Profile,
  Container,
  SpacePreferencesFile,
  SpacePreferences,
  Space,
  Slug,
  GardenFile,
  GardenSettings,
  Garden,
} from './types';
import { WS } from '@inrupt/vocab-solid-common';
import { hasRDFType, slugToUrl } from './utils';
import { RDF, DCTERMS } from '@inrupt/vocab-common-rdf';
import { MY } from './vocab';

export function getRootContainer(profile: Profile): Container {
  const root = getUrl(profile, WS.storage);
  if (!root) {
    // TODO: Wha should we do if there is no storage set?
    throw new Error('Profile has no storage predicate');
  } else {
    return root;
  }
}

export function defaultSpacePreferencesFile(
  root: Container
): SpacePreferencesFile {
  return new URL('settings/prefs.ttl', root).toString();
}

export function setDefaultSpacePreferencesFile(profile: Profile) {
  const root = getRootContainer(profile)
  const defaultUrl = root && defaultSpacePreferencesFile(root);
  return setUrl(profile, WS.preferencesFile, defaultUrl);
}

export function getSpacePreferencesFile(
  profile: Profile
): SpacePreferencesFile | null {
  const root = getRootContainer(profile);
  const defaultUrl = root && defaultSpacePreferencesFile(root);
  return getUrl(profile, WS.preferencesFile) || defaultUrl;
}

export function getContainer(space: Space): Container | null {
  return getUrl(space, WS.storage);
}

export function getGardenMap(
  spaces: SpacePreferences,
  space: Space
): { [key: GardenFile]: GardenSettings } {
  const gardenUrls = getGardenFileAll(space);
  const nursery = getNurseryFile(space);
  const compost = getCompostFile(space);
  const allGardenUrls =
    nursery && compost ? [...gardenUrls, nursery, compost] : gardenUrls;
  const gardenMap = allGardenUrls.reduce((gardenMap, gardenKey) => {
    const gardenSettings = getThing(spaces, gardenKey);
    return { ...gardenMap, [gardenKey as string]: gardenSettings };
  }, {});

  return gardenMap;
}

export function getGardenFileAll(space: Space): GardenFile[] {
  const files = [
    getNurseryFile(space), getPublicFile(space), getPrivateFile(space), getCompostFile(space),
    ...getUrlAll(space, MY.Garden.hasGarden)
  ];
  return files.filter(x => !!x) as GardenFile[]
}

export function getCompostFile(space: Space): GardenFile | null {
  return getUrl(space, MY.Garden.hasCompost);
}

export function getNurseryFile(space: Space): GardenFile | null {
  return getUrl(space, MY.Garden.hasNursery);
}

export function getPublicFile(space: Space): GardenFile | null {
  return getUrl(space, MY.Garden.hasPublic);
}

export function getPrivateFile(space: Space): GardenFile | null {
  return getUrl(space, MY.Garden.hasPrivate);
}

export function getSpaceSlug(space: Space): UrlString | null {
  return getStringNoLocale(space, MY.Garden.spaceSlug)
}

export function getNoteStorage(space: Space): UrlString | null {
  return getUrl(space, MY.Garden.noteStorage)
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
  return (spaces && thingUrl) ? getThing(spaces, thingUrl) : null;
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
  title: string,
  gardenUrls: {
    private: GardenFile;
    public: GardenFile;
    nursery: GardenFile;
    compost: GardenFile;
  }
): Space {
  return buildThing(createThing({ name: slug }))
    .addStringNoLocale(MY.Garden.spaceSlug, slug)
    .addStringNoLocale(DCTERMS.title, title)
    .addUrl(MY.Garden.holder, holder)
    .addUrl(RDF.type, WS.Workspace)
    .addUrl(RDF.type, MY.Garden.Space)
    .addUrl(WS.storage, container)
    .addUrl(MY.Garden.imageStorage, new URL('images/', container).toString())
    .addUrl(MY.Garden.fileStorage, new URL('files/', container).toString())
    .addUrl(MY.Garden.noteStorage, new URL('notes/', container).toString())
    .addUrl(MY.Garden.hasPrivate, gardenUrls.private)
    .addUrl(MY.Garden.hasPublic, gardenUrls.public)
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

export function gardenMetadataInSpacePrefs(space: Space, spacePrefs: SpacePreferences): GardenSettings[] | null {
  const gardenUrls = getGardenFileAll(space)
  return gardenUrls && gardenUrls.map(gardenUrl => {
    return getThing(spacePrefs, gardenUrl) as GardenSettings
  })
}

export const MetaSpaceSlug = 'spaces';
export const HomeSpaceSlug = 'home';
export const HomeSpaceDefaultName = 'Home';
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
