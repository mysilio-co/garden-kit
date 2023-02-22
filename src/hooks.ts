import {
  Garden,
  GardenItem,
  Space,
  SpacePreferences,
  Slug,
  AppSettings,
  GardenSettings,
  GardenFile,
  WebhookConfig,
  AccessConfig,
} from './types';
import { access, getUrl, setUrl, Thing, UrlString } from '@inrupt/solid-client';
import { subscribe, unsubscribe } from 'solid-webhook-client';
import {
  saveSolidDatasetAt,
  createSolidDataset,
  createContainerAt,
} from '@inrupt/solid-client/resource/solidDataset';
import {
  setThing,
  createThing,
  getThingAll,
  removeThing,
} from '@inrupt/solid-client/thing/thing';
import {
  FetchError,
  getSourceUrl,
} from '@inrupt/solid-client/resource/resource';
import {
  useProfile,
  useResource,
  useThing,
  useWebId,
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
  HomeSpaceDefaultName,
  setMetaSpace,
  setDefaultSpacePreferencesFile,
  setSpace,
  getCompostFile,
  getNurseryFile,
  getPublicFile,
  getPrivateFile,
  getImageStorage,
  getFileStorage,
  getNoteStorage,
} from './spaces';
import {
  appSettingsUrl,
  createWebhookConfig,
  getWebhookConfigAll,
} from './settings';
import { slugToUrl, getTitle, setTitle, getUUID } from './utils';
import { useCallback, useMemo } from 'react';
import { setAccess, setPublicAccess } from './acl';
import { MY } from './vocab';

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
export type WebhooksResult = {
  webhooks: WebhookConfig[];
  addWebhookSubscription: any;
  unsubscribeFromWebhook: any;
};

export function useGardenItem(
  gardenUrl: SwrlitKey,
  uuid: SwrlitKey
): GardenItemResult {
  const res = useThingInResource(uuid, gardenUrl) as GardenItemResult;
  res.item = res.thing;
  return res;
}

export function useTitledGardenItem(
  gardenUrl: SwrlitKey,
  title: string
): GardenItemResult {
  const res = useResource(gardenUrl) as GardenItemResult;
  res.saveResource = res.save;
  const gardenResource = res.resource;

  const item = useMemo(
    function () {
      return (
        gardenResource &&
        title &&
        getThingAll(gardenResource).find((item) => {
          const itemTitle = getTitle(item);
          return itemTitle && itemTitle.toLowerCase() === title.toLowerCase();
        })
      );
    },
    [gardenResource, title]
  );

  res.save = useCallback(
    async (newThing: Thing) => {
      let resource = gardenResource || createSolidDataset();
      resource = setThing(resource, newThing);
      return await res.saveResource(resource);
    },
    [res.saveResource, gardenResource]
  );

  if (item) {
    res.thing = item;
    res.item = item;
  }
  return res;
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
  res.settings = settings; // merge?
  res.saveSettings = async (newSettings: Thing) => {
    await saveSettings(newSettings);
    await saveCopy(newSettings);
  };
  res.saveGarden = res.save;
  return res;
}

export function useSpace(webId: SwrlitKey, slug: Slug): SpaceResult {
  const { spaces } = useSpaces(webId);
  const res = useThing(slugToUrl(spaces, slug)) as SpaceResult;
  res.space = res.thing;
  res.saveSpace = res.save;
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

function createSpaceInSpaces(
  spaces: SpacePreferences,
  slug: Slug,
  webId: string,
  title: string
) {
  const metaspace = getMetaSpace(spaces);
  const parent = metaspace && getContainer(metaspace);
  if (parent) {
    const container = new URL(`${slug}/`, parent).toString();
    const publicGardenUrl =
      container && new URL('public.ttl', container).toString();
    const privateGardenUrl =
      container && new URL('private.ttl', container).toString();
    const nurseryUrl =
      container && new URL('nursery.ttl', container).toString();
    const compostUrl =
      container && new URL('compost.ttl', container).toString();
    return createSpace(webId, container, slug, title, {
      compost: compostUrl,
      nursery: nurseryUrl,
      private: privateGardenUrl,
      public: publicGardenUrl,
    });
  } else {
    throw new Error(
      'meta space not configured or container not specified inside metaspace, cannot create home space'
    );
  }
}

function defaultFuseIndexUrl(gardenUrl: GardenFile) {
  return gardenUrl.replace(/(\.ttl$)/, '-fuse.json');
}

function createGardenSettings(gardenKey: GardenFile, title: string) {
  let settings = createThing({ url: gardenKey });
  settings = setTitle(settings, title);
  settings = setUrl(
    settings,
    MY.Garden.hasFuseIndex,
    defaultFuseIndexUrl(gardenKey)
  );
  return settings;
}

declare const fetchOptions: {
  fetch: ((
    input: RequestInfo,
    init?: RequestInit | undefined
  ) => Promise<Response>) &
    typeof globalThis.fetch;
};

declare const accessOptions: {
  publicRead: boolean;
};

async function initializeGarden(
  spaces: SpacePreferences,
  saveSpaces: any,
  gardenKey: GardenFile,
  title: string,
  gardenWebhooks: (gardenUrl: GardenFile) => UrlString[],
  options: Partial<typeof fetchOptions & typeof accessOptions> = {}
) {
  let settings = createGardenSettings(gardenKey, title);
  let gardenDataset = createSolidDataset();
  gardenDataset = setThing(gardenDataset, settings);
  let gardenResource;
  try {
    gardenResource = await saveSolidDatasetAt(
      gardenKey,
      gardenDataset,
      options
    );
  } catch (e) {
    // don't throw an error on 412, this just means the resource is already there
    if (e instanceof FetchError && e.statusCode === 412) {
      return null;
    } else {
      throw e;
    }
  }

  if (options.publicRead) {
    await setPublicAccess(
      gardenKey,
      { read: true, append: false, write: false, control: false },
      options
    );
  }

  for (const webhookUrl of gardenWebhooks(gardenKey)) {
    await addWebhookSubscription(
      spaces,
      saveSpaces,
      gardenKey,
      webhookUrl,
      options
    );
  }

  return gardenResource;
}

const COMPOST_DEFAULT_NAME = 'Compost';
const NURSERY_DEFAULT_NAME = 'Nursery';
const PRIVATE_DEFAULT_NAME = 'Private';
const PUBLIC_DEFAULT_NAME = 'Public';

async function maybeCreateContainerAt(file: string, options: any) {
  console.log('trying to create container', file);
  try {
    return await createContainerAt(file, options);
  } catch (e) {
    // don't throw an error on 412, this just means the resource is already there
    if (e instanceof FetchError && e.statusCode === 412) {
      return null;
    } else {
      throw e;
    }
  }
}

async function initializeSpace(
  spaces: SpacePreferences,
  saveSpaces: any,
  slug: Slug,
  defaultAccess: AccessConfig[],
  gardenWebhooks: (gardenUrl: GardenFile) => UrlString[],
  options?: Partial<typeof fetchOptions>
) {
  const space = getSpace(spaces, slug);
  if (space) {
    const container = getContainer(space);
    if (container) {
      for (const access of defaultAccess) {
        await setAccess(container, access, options);
      }
    }
    const compost = getCompostFile(space);
    const nursery = getNurseryFile(space);
    const priv = getPrivateFile(space);
    const pub = getPublicFile(space);
    const images = getImageStorage(space);
    const files = getFileStorage(space);
    const notes = getNoteStorage(space);
    await Promise.all([
      compost &&
        initializeGarden(
          spaces,
          saveSpaces,
          compost,
          COMPOST_DEFAULT_NAME,
          gardenWebhooks,
          options
        ),
      nursery &&
        initializeGarden(
          spaces,
          saveSpaces,
          nursery,
          NURSERY_DEFAULT_NAME,
          gardenWebhooks,
          options
        ),
      priv &&
        initializeGarden(
          spaces,
          saveSpaces,
          priv,
          PRIVATE_DEFAULT_NAME,
          gardenWebhooks,
          options
        ),
      pub &&
        initializeGarden(
          spaces,
          saveSpaces,
          pub,
          PUBLIC_DEFAULT_NAME,
          gardenWebhooks,
          {
            ...options,
            publicRead: true,
          }
        ),
      images && maybeCreateContainerAt(images, options),
      files && maybeCreateContainerAt(files, options),
      notes && maybeCreateContainerAt(notes, options),
    ]);
    // we track garden settings in the space preferences as well
    if (compost)
      spaces = setThing(
        spaces,
        createGardenSettings(compost, COMPOST_DEFAULT_NAME)
      );
    if (nursery)
      spaces = setThing(
        spaces,
        createGardenSettings(nursery, NURSERY_DEFAULT_NAME)
      );
    if (priv)
      spaces = setThing(
        spaces,
        createGardenSettings(priv, PRIVATE_DEFAULT_NAME)
      );
    if (pub)
      spaces = setThing(spaces, createGardenSettings(pub, PUBLIC_DEFAULT_NAME));
    return spaces;
  } else {
    throw new Error(
      `could not find space ${slug} in spaces preference file to configure`
    );
  }
}

export function useSpacesWithSetup(
  webId: SwrlitKey
): SpacePreferencesWithSetupResult {
  const res = useSpaces(webId) as SpacePreferencesWithSetupResult;
  const { profile, save: saveProfile } = useProfile(webId);
  const { fetch } = useAuthentication();
  const setup = useCallback(
    async (defaultAccess, gardenWebhooks) => {
      if (res.spaces && hasRequiredSpaces(res.spaces)) {
        throw new Error(
          `All required Spaces already exist in resource with URL ${
            res.spaces && getSourceUrl(res.spaces)
          }`
        );
      } else {
        if (!webId) {
          throw new Error('cannot set up spaces for null or undefined webId!');
        }
        let spaces = res.spaces;
        if (!spaces) {
          if (res.error && res.error.statusCode === 404) {
            await saveProfile(setDefaultSpacePreferencesFile(profile));
            spaces = createSolidDataset();
          } else {
            throw new Error(
              `spaces undefined but not a 404. HTTP response is ${
                res.error && res.error.statusCode
              } with error ${res.error}`
            );
          }
        }
        if (!getMetaSpace(spaces)) {
          spaces = setMetaSpace(spaces, createMetaSpace(webId, profile));
        }
        if (getSpaceAll(spaces).length <= 0) {
          const homeSpace = createSpaceInSpaces(
            spaces,
            HomeSpaceSlug,
            webId,
            HomeSpaceDefaultName
          );
          spaces = setSpace(spaces, homeSpace);
          spaces = await initializeSpace(
            spaces,
            res.saveSpaces,
            HomeSpaceSlug,
            defaultAccess,
            gardenWebhooks,
            {
              fetch,
            }
          );
        }
        return res.saveSpaces(spaces);
      }
    },
    [webId, res, profile, fetch]
  );
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

async function addWebhookSubscription(
  spaces: SpacePreferences,
  saveSpaces: any,
  subscribeTo: UrlString,
  deliverTo: UrlString,
  options: any
) {
  console.log(`Subscribing to webhook...`);
  const { unsubscribeEndpoint } = await subscribe(subscribeTo, deliverTo, {
    fetch: options.fetch,
  });
  console.log(`Added webhook for ${subscribeTo} that delivers to ${deliverTo}`);
  const webhook = createWebhookConfig(
    subscribeTo,
    deliverTo,
    unsubscribeEndpoint
  );
  console.log(
    `Webhook configured with unsubscribe Url: ${unsubscribeEndpoint}`
  );
  await saveSpaces(setThing(spaces, webhook));
  console.log(`Saved Webhook config ${getUUID(webhook)}`);
  return webhook;
}

async function unsubscribeFromWebhook(
  spaces: SpacePreferences,
  saveSpaces: any,
  webhook: WebhookConfig,
  options: any
) {
  const unsubscribeWith = getUrl(webhook, MY.Garden.unsubscribeWith);
  if (!unsubscribeWith) {
    throw new Error(`Unsubscribe url not preset in conifg ${getUUID(webhook)}`);
  }

  console.log(`Unsubscribing from webhook...`);
  await unsubscribe(unsubscribeWith, {
    authenticatedFetch: options.fetch,
  });
  console.log(`Unsubscribed from webhook using url: ${getUUID(webhook)}`);
  await saveSpaces(removeThing(spaces, webhook));
  console.log(`Deleted webhook config ${getUUID(webhook)}`);
  return webhook;
}

export function useWebhooks(): WebhooksResult {
  const { fetch } = useAuthentication();
  const webId = useWebId();
  const { spaces, save } = useSpaces(webId);
  const webhooks = spaces && getWebhookConfigAll(spaces);
  const sub = async (subscribeTo: UrlString, deliversTo: UrlString) => {
    return await addWebhookSubscription(spaces, save, subscribeTo, deliversTo, {
      fetch,
    });
  };
  const unsub = async (webhook: WebhookConfig) => {
    return await unsubscribeFromWebhook(spaces, save, webhook, { fetch });
  };
  return {
    webhooks,
    addWebhookSubscription: sub,
    unsubscribeFromWebhook: unsub,
  };
}
