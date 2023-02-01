import { Profile, Slug, SpacePreferences } from './types';
import { getRootContainer, getSpacePreferencesFile, isSpace } from './spaces';
import { getThingAll, Thing } from '@inrupt/solid-client';
import { MY } from './vocab';
import { hasRDFType } from './utils';

export function appSettingsUrl(profile: Profile, namespace: Slug, name: Slug) {
  const base = getRootContainer(profile);
  const path = `settings/${namespace}.ttl#${name}`;
  return base && new URL(path, base).toString();
}

export function getWebhookConfigFile(profile: Profile) {
  return getSpacePreferencesFile(profile);
}

export function isWebhookConfig(thing: Thing): boolean {
  return hasRDFType(thing, MY.Garden.Webhook);
}

export function getWebhookConfigAll(spacePrefs: SpacePreferences) {
  return getThingAll(spacePrefs).filter(isWebhookConfig);
}
