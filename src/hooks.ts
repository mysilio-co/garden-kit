import {
  Garden,
  GardenItem,
  Space,
  SpacePreferences,
  Slug,
  AppSettings,
  GardenConfig,
  GardenItemType,
} from './types';
import { createGarden, getConfig, getItemAll } from './garden';
import { access, Thing, getSourceUrl, createSolidDataset } from '@inrupt/solid-client';
import {
  useProfile,
  useResource,
  useThing,
  ResourceResult,
  ThingResult,
  usePublicAccess,
  useThingInResource,
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
} from './utils';
import { useCallback, useMemo, useState } from 'react';
import { getItemType, getTitle } from './items';
import Fuse from 'fuse.js';

export type GardenResult = ResourceResult & {
  garden: Garden;
  saveGarden: any;
  config: GardenConfig | null;
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
  index: SwrlitKey,
  title: string
): GardenItemResult {
  const slug = encodeBase58Slug(title);
  const ptr = useThing(index && slugToUrl(index, slug));
  ptr.thing = ptr.thing ? ensureUUID(ptr.thing) : createPtr(slug, uuidUrn());
  const uuid = getUUID(ptr.thing);
  const res = useGardenItem(index, uuid);
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
  index: SwrlitKey,
  filter: GardenFilter
): FilteredGardenResult {
  const res = useGarden(index) as FilteredGardenResult;
  const { garden } = res
  const { fuse } = useFuse(garden);
  res.filtered = useMemo(() => {
    if (filter.search) {
      const result = fuse.search(filter.search);
      return result.map(({ item }) => item.gardenItem) ;
    } else {
      return getItemAll(garden);
    }
  }, [garden, filter]);
  return res
}

export function useGarden(index: SwrlitKey): GardenResult {
  const res = useResource(index) as GardenResult;
  const config = res.garden && getConfig(res.garden);
  res.garden = res.resource;
  res.config = config;
  res.saveGarden = res.save;
  return res;
}

export function useGardenWithPublicAccess(
  index: SwrlitKey
): GardenWithPublicAccessResult {
  const res = useGarden(index) as GardenWithPublicAccessResult;
  const { access, saveAccess } = usePublicAccess(index);
  res.publicAccess = access;
  res.savePublicAccess = saveAccess;
  return res;
}

export function useGardenWithSetup(
  index: SwrlitKey,
  publicRead?: boolean
): GardenWithSetupResult {
  const res = useGardenWithPublicAccess(index) as GardenWithSetupResult;
  const setup = useCallback(async () => {
    if (res && res.error && res.error.statusCode === 404) {
      await res.saveGarden(createGarden());
      publicRead && (await res.savePublicAccess({ read: publicRead }));
    } else {
      if (res && res.garden) {
        throw new Error(
          `Garden already exists in at URL ${getSourceUrl(res.garden)}`
        );
      }
    }
  }, [res, publicRead]);
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
  const publicGarden = useGardenWithSetup(publicGardenUrl, true);
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
      privateGarden && (await privateGarden.setupGarden());
      compost && (await compost.setupGarden());
      nursery && (await nursery.setupGarden());
      publicGarden && (await publicGarden.setupGarden());
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

export function useSpacesWithSetup(
  webId: SwrlitKey
): SpacePreferencesWithSetupResult {
  const res = useSpaces(webId) as SpacePreferencesWithSetupResult;
  const { profile, save: saveProfile } = useProfile(webId)
  const meta = useMetaSpaceWithSetup(webId);
  const home = useSpaceWithSetup(webId, HomeSpaceSlug);
  const setup = useCallback(async () => {
    if (res.spaces && hasRequiredSpaces(res.spaces)) {
      throw new Error(
        `All required Spaces already exist in resource with URL ${res.spaces &&
        getSourceUrl(res.spaces)}`
      );
    } else {
      let spaces = res.spaces
      if (!spaces) {
        if (res.error && res.error.statusCode === 404){
          await saveProfile(setDefaultSpacePreferencesFile(profile))
          spaces = await res.saveSpaces(createSolidDataset())
        } else {
          throw new Error(
            `spaces undefined but not a 404. HTTP response is ${res.error && res.error.statusCode} with error ${res.error}`
          );
        }
      }
      if (!getMetaSpace(spaces)) {
        await meta.setupSpace();
      }
      if (getSpaceAll(spaces).length <= 0) {
        await home.setupSpace();
      }
    }
  }, [webId, res, meta, home]);
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
