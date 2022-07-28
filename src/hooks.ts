import {
  Garden,
  GardenItem,
  Space,
  SpacePreferences,
  Slug,
  AppSettings,
  GardenSettings,
  GardenItemType,
  GardenFile,
} from './types';
import { getItemAll } from './garden';
import { access, getResourceAcl, getSolidDatasetWithAcl, setPublicResourceAccess, createAcl, Thing, UrlString, saveAclFor, WithAccessibleAcl, hasAccessibleAcl } from '@inrupt/solid-client';
import { saveSolidDatasetAt, createSolidDataset } from '@inrupt/solid-client/resource/solidDataset'
import { setThing, createThing } from '@inrupt/solid-client/thing/thing'
import { getSourceUrl } from '@inrupt/solid-client/resource/resource'
//import { setPublicAccess } from '@inrupt/solid-client/universal'
import {
  useProfile,
  useResource,
  useThing,
  ResourceResult,
  ThingResult,
  usePublicAccess,
  useThingInResource,
  useAuthentication,
  SwrlitKey,
} from 'swrlit';

import {
  createMetaSpace,
  createSpace,
  MetaSpaceSlug,
  getContainer,
  getMetaSpace,
  getSpace,
  getSpaceAll,
  getSpacePreferencesFile,
  hasRequiredSpaces,
  HomeSpaceSlug,
  setMetaSpace,
  setDefaultSpacePreferencesFile,
  setSpace,
  getCompostFile,
  getNurseryFile,
  getPublicFile,
  getPrivateFile,
} from './spaces';
import { appSettingsUrl } from './settings';
import {
  createPtr,
  createThingWithUUID,
  encodeBase58Slug,
  ensureUUID,
  getUUID,
  slugToUrl,
  uuidUrn,
  getTitle,
  setTitle
} from './utils';
import { useCallback, useMemo, useState } from 'react';
import { getItemType } from './items';
import Fuse from 'fuse.js';

export type GardenResult = ResourceResult & {
  garden: Garden;
  saveGarden: any;
  settings: GardenSettings;
  saveSettings: any;
};
export type GardenWithPublicAccessResult = GardenResult & {
  publicAccess: access.Access;
  savePublicAccess: any;
};
export type GardenWithSetupResult = GardenWithPublicAccessResult & {
  setupGarden: any;
};
export type FilteredGardenResult = GardenResult & { filtered: GardenItem[] };
export type GardenItemResult = ThingResult & {
  item: GardenItem;
  saveToGarden: any;
};
export type SpaceResult = ThingResult & { space: Space; saveSpace: any };
export type SpaceWithSetupResult = SpaceResult & {
  setupSpace: any;
};
export type SpacePreferencesResult = ResourceResult & {
  spaces: SpacePreferences;
  saveSpaces: any;
};
export type SpacePreferencesWithSetupResult = SpacePreferencesResult & {
  setupDefaultSpaces: any;
};
export type AppSettingsResult = ThingResult & {
  settings: AppSettings;
  saveSettings: any;
};
export type GardenFilter = {
  // right now, we only support search based filtering
  // but leave room for additional filter criteria later.
  search: string;
};
type FuseEntry = {
  name: string | null;
  type: GardenItemType | null;
  gardenItem: GardenItem;
};

export function useGardenItem(
  index: SwrlitKey,
  uuid: SwrlitKey
): GardenItemResult {
  const res = useThingInResource(index, uuid) as GardenItemResult;
  res.item = res.thing || createThingWithUUID();
  res.saveToGarden = res.save;
  return res;
}

export function useTitledGardenItem(
  gardenItemKey: SwrlitKey,
  title: string
): GardenItemResult {
  const slug = encodeBase58Slug(title);
  const ptr = useThing(gardenItemKey && slugToUrl(gardenItemKey, slug));
  ptr.thing = ptr.thing ? ensureUUID(ptr.thing) : createPtr(slug, uuidUrn());
  const uuid = getUUID(ptr.thing);
  const res = useGardenItem(gardenItemKey, uuid);
  res.saveToGarden = useCallback(
    async (newThing: Thing) => {
      res.mutate(newThing, false);
      await ptr.save(ptr.thing);
      await res.saveToGarden(newThing);
      res.mutate(newThing);
    },
    [res, ptr, slug, uuid]
  );
  return res;
}

function fuseEntryFromGardenItem(item: GardenItem): FuseEntry {
  return {
    gardenItem: item,
    type: getItemType(item),
    name: getTitle(item),
  };
}

function fuseFromGarden(garden: Garden): FuseEntry[] {
  return garden && getItemAll(garden).map(fuseEntryFromGardenItem);
}

export function useFuse(garden: Garden) {
  const options: Fuse.IFuseOptions<FuseEntry> = {
    includeScore: true,
    threshold: 0.3,
    keys: ['name'],
  };
  const [fuse] = useState(new Fuse([], options));
  return useMemo(() => {
    fuse.setCollection(fuseFromGarden(garden) || []);
    return { fuse };
  }, [garden]);
}

export function useFilteredGarden(
  gardenKey: SwrlitKey,
  filter: GardenFilter
): FilteredGardenResult {
  const res = useGarden(gardenKey) as FilteredGardenResult;
  const { garden } = res
  const { fuse } = useFuse(garden);
  res.filtered = useMemo(() => {
    if (filter.search) {
      const result = fuse.search(filter.search);
      return result.map(({ item }) => item.gardenItem);
    } else {
      return getItemAll(garden);
    }
  }, [garden, filter]);
  return res
}

export function useGarden(
  gardenKey: SwrlitKey,
  webId?: SwrlitKey
): GardenResult {
  // Will read and set settings on a Garden
  // Will persist settings to
  const { profile } = useProfile(webId);
  const res = useResource(gardenKey) as GardenResult;
  const { thing: settings, save: saveSettings } = useThing(gardenKey);
  const { save: saveCopy } = useThingInResource(
    profile && getSpacePreferencesFile(profile),
    gardenKey
  );
  res.garden = res.resource;
  res.settings = settings // merge?
  res.saveSettings = async (newSettings: Thing) => {
    await saveSettings(newSettings);
    await saveCopy(newSettings);
  };
  res.saveGarden = res.save;
  return res;
}

export function useGardenWithPublicAccess(
  gardenKey: SwrlitKey,
  webId?: SwrlitKey
): GardenWithPublicAccessResult {
  const res = useGarden(gardenKey, webId) as GardenWithPublicAccessResult;
  const { access, saveAccess } = usePublicAccess(gardenKey);
  res.publicAccess = access;
  res.savePublicAccess = saveAccess;
  return res;
}

export function useGardenWithSetup(
  gardenKey: SwrlitKey,
  webId?: SwrlitKey
): GardenWithSetupResult {
  const res = useGardenWithPublicAccess(gardenKey, webId) as GardenWithSetupResult;
  const setup = useCallback(
    async (title: string, publicRead?: boolean) => {
      if (res && res.error && res.error.statusCode === 404) {
        gardenKey = gardenKey as GardenFile;
        let settings = createThing({ url: gardenKey });
        settings = setTitle(settings, title)
        await res.saveGarden(createSolidDataset());
        // persists to SpacePreferences
        await res.saveSettings(settings)
        publicRead && (await res.savePublicAccess({ read: publicRead }));
      } else {
        if (res && res.garden) {
          throw new Error(
            `Garden already exists in at URL ${getSourceUrl(res.garden)}`
          );
        }
      }
    },
    [res]
  );
  res.setupGarden = setup;
  return res;
}

export function useSpace(webId: SwrlitKey, slug: Slug): SpaceResult {
  const { spaces } = useSpaces(webId);
  const res = useThing(slugToUrl(spaces, slug)) as SpaceResult;
  res.space = res.thing;
  res.saveSpace = res.save;
  return res;
}

export function useSpaceWithSetup(
  webId: SwrlitKey,
  slug: Slug
): SpaceWithSetupResult {
  const { spaces } = useSpaces(webId);
  const res = useSpace(webId, slug) as SpaceWithSetupResult;
  const metaspace = getMetaSpace(spaces);
  const parent = metaspace && getContainer(metaspace);
  const container = parent && new URL(`${slug}/`, parent).toString();
  const publicGardenUrl =
    container && new URL('public.ttl', container).toString();
  const privateGardenUrl =
    container && new URL('private.ttl', container).toString();
  const nurseryUrl = container && new URL('nursery.ttl', container).toString();
  const compostUrl = container && new URL('compost.ttl', container).toString();
  const publicGarden = useGardenWithSetup(publicGardenUrl);
  const privateGarden = useGardenWithSetup(privateGardenUrl);
  const nursery = useGardenWithSetup(nurseryUrl);
  const compost = useGardenWithSetup(compostUrl);
  const setup = useCallback(async () => {
    if (spaces && getSpace(spaces, slug)) {
      throw new Error(
        `Space with slug ${slug} already exists in resource with URL ${getSourceUrl(
          spaces
        )}`
      );
    } else {
      privateGarden && (await privateGarden.setupGarden('Private'));
      compost && (await compost.setupGarden('Compost'));
      nursery && (await nursery.setupGarden('Nursery'));
      publicGarden && (await publicGarden.setupGarden('Public', true));
      spaces &&
        container &&
        webId &&
        compostUrl &&
        nurseryUrl &&
        privateGardenUrl &&
        publicGardenUrl &&
        (await res.saveSpace(
          createSpace(webId, container, HomeSpaceSlug, {
            compost: compostUrl,
            nursery: nurseryUrl,
            private: privateGardenUrl,
            public: publicGardenUrl,
          })
        ));
    }
  }, [
    spaces,
    slug,
    publicGarden,
    privateGarden,
    compost,
    nursery,
    res,
    container,
    webId,
  ]);
  res.setupSpace = setup;
  return res;
}

export function useMetaSpace(webId: SwrlitKey): SpaceResult {
  return useSpace(webId, MetaSpaceSlug);
}

export function useMetaSpaceWithSetup(webId: SwrlitKey): SpaceWithSetupResult {
  const { spaces, saveSpaces } = useSpaces(webId);
  const res = useMetaSpace(webId) as SpaceWithSetupResult;
  const { profile } = useProfile(webId);
  const setup = useCallback(async () => {
    if (spaces && getMetaSpace(spaces)) {
      throw new Error(
        `MetaSpace already exists in resource with URL ${spaces &&
        getSourceUrl(spaces)}`
      );
    } else {
      spaces &&
        webId &&
        (await saveSpaces(
          setMetaSpace(spaces, createMetaSpace(webId, profile))
        ));
    }
  }, [spaces, webId, profile, res]);
  res.setupSpace = setup;
  return res;
}

export function useSpaces(webId: SwrlitKey): SpacePreferencesResult {
  const { profile } = useProfile(webId);
  const res = useResource(
    profile && getSpacePreferencesFile(profile)
  ) as SpacePreferencesResult;
  res.spaces = res.resource;
  res.saveSpaces = res.save;
  return res;
}

function createSpaceInSpaces(spaces: SpacePreferences, slug: Slug, webId: string) {
  const metaspace = getMetaSpace(spaces);
  const parent = metaspace && getContainer(metaspace);
  if (parent) {
    const container = new URL(`${slug}/`, parent).toString();
    const publicGardenUrl =
      container && new URL('public.ttl', container).toString();
    const privateGardenUrl =
      container && new URL('private.ttl', container).toString();
    const nurseryUrl = container && new URL('nursery.ttl', container).toString();
    const compostUrl = container && new URL('compost.ttl', container).toString();
    return createSpace(webId, container, slug, {
      compost: compostUrl,
      nursery: nurseryUrl,
      private: privateGardenUrl,
      public: publicGardenUrl,
    })
  } else {
    throw new Error("meta space not configured or container not specified inside metaspace, cannot create home space")
  }
}

function createGardenSettings(gardenKey: GardenFile, title: string) {
  let settings = createThing({ url: gardenKey });
  settings = setTitle(settings, title)
  return settings
}

declare const fetchOptions: {
  fetch: ((input: RequestInfo, init?: RequestInit | undefined) => Promise<Response>) & typeof globalThis.fetch;
};

declare const accessOptions: {
  publicRead: boolean
}

async function setPublicAccess(resourceUrl: UrlString, access: any, options: any) {
  const resource = await getSolidDatasetWithAcl(resourceUrl, options)
  if (hasAccessibleAcl(resource)) {
    let acl = getResourceAcl(resource) || createAcl(resource)
    acl = setPublicResourceAccess(acl, { read: true, append: false, write: false, control: false })
    return saveAclFor(resource, acl, options)
  } else {
    throw new Error("getSolidDatasetWithAcl returned resource that did not pass hasAccessibleAcl, super weird, don't know what to do, bail bail bail")
  }
}

async function initializeGarden(gardenKey: GardenFile, title: string, options: Partial<typeof fetchOptions & typeof accessOptions> = {}) {
  let settings = createGardenSettings(gardenKey, title);
  let gardenDataset = createSolidDataset()
  gardenDataset = setThing(gardenDataset, settings)
  const gardenResource = await saveSolidDatasetAt(gardenKey, gardenDataset, options);
  if (options.publicRead) {
    await setPublicAccess(gardenKey, { read: true }, options)
  }
  return gardenResource
}

const COMPOST_DEFAULT_NAME = "Compost"
const NURSERY_DEFAULT_NAME = "Nursery"
const PRIVATE_DEFAULT_NAME = "Private"
const PUBLIC_DEFAULT_NAME = "Public"

async function initializeSpace(spaces: SpacePreferences, slug: Slug, options?: Partial<typeof fetchOptions>) {
  const space = getSpace(spaces, slug)
  if (space) {
    const compost = getCompostFile(space)
    const nursery = getNurseryFile(space)
    const priv = getPrivateFile(space)
    const pub = getPublicFile(space)
    await Promise.all([
      compost && initializeGarden(compost, COMPOST_DEFAULT_NAME, options),
      nursery && initializeGarden(nursery, NURSERY_DEFAULT_NAME, options),
      priv && initializeGarden(priv, PRIVATE_DEFAULT_NAME, options),
      pub && initializeGarden(pub, PUBLIC_DEFAULT_NAME, { ...options, publicRead: true })
    ])
    // we track garden settings in the space preferences as well
    if (compost) spaces = setThing(spaces, createGardenSettings(compost, COMPOST_DEFAULT_NAME))
    if (nursery) spaces = setThing(spaces, createGardenSettings(nursery, NURSERY_DEFAULT_NAME))
    if (priv) spaces = setThing(spaces, createGardenSettings(priv, PRIVATE_DEFAULT_NAME))
    if (pub) spaces = setThing(spaces, createGardenSettings(pub, PUBLIC_DEFAULT_NAME))
    return spaces
  } else {
    throw new Error(`could not find space ${slug} in spaces preference file to configure`)
  }
}

export function useSpacesWithSetup(
  webId: SwrlitKey
): SpacePreferencesWithSetupResult {
  const res = useSpaces(webId) as SpacePreferencesWithSetupResult;
  const { profile, save: saveProfile } = useProfile(webId)
  const { fetch } = useAuthentication()
  const setup = useCallback(async () => {
    if (res.spaces && hasRequiredSpaces(res.spaces)) {
      throw new Error(
        `All required Spaces already exist in resource with URL ${res.spaces &&
        getSourceUrl(res.spaces)}`
      );
    } else {
      if (!webId) {
        throw new Error("cannot set up spaces for null or undefined webId!")
      }
      let spaces = res.spaces
      if (!spaces) {
        if (res.error && res.error.statusCode === 404) {
          await saveProfile(setDefaultSpacePreferencesFile(profile))
          spaces = createSolidDataset()
        } else {
          throw new Error(
            `spaces undefined but not a 404. HTTP response is ${res.error && res.error.statusCode} with error ${res.error}`
          );
        }
      }
      if (!getMetaSpace(spaces)) {
        console.log("SETTING META", spaces)
        spaces = setMetaSpace(spaces, createMetaSpace(webId, profile))
        console.log("SET META", spaces)
        console.log("META IS", getMetaSpace(spaces))
      }
      if (getSpaceAll(spaces).length <= 0) {
        const homeSpace = createSpaceInSpaces(spaces, HomeSpaceSlug, webId)
        spaces = setSpace(spaces, homeSpace)
        spaces = await initializeSpace(spaces, HomeSpaceSlug, { fetch })
      }
      return res.saveSpaces(spaces)
    }
  }, [webId, res, profile, fetch]);
  res.setupDefaultSpaces = setup;
  return res;
}

export function useAppSettings(
  webId: SwrlitKey,
  appNamespace: Slug,
  appName: Slug
): AppSettingsResult {
  const { profile } = useProfile(webId);
  const res = useThing(
    appSettingsUrl(profile, appNamespace, appName)
  ) as AppSettingsResult;
  res.settings = res.thing;
  res.saveSettings = res.save;
  return res;
}
