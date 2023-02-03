import { Profile, Slug, SpacePreferences } from './types';
import { getRootContainer, getSpacePreferencesFile } from './spaces';
import {
  buildThing,
  getThingAll,
  Thing,
  UrlString,
} from '@inrupt/solid-client';
import { MY } from './vocab';
import { createThingWithUUID, hasRDFType } from './utils';
import { RDF } from '@inrupt/vocab-common-rdf';

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

export function createWebhookConfig(
  subscribeTo: UrlString,
  deliverTo: UrlString,
  unsubscribeEndpoint: UrlString
) {
  return buildThing(createThingWithUUID())
    .addUrl(RDF.type, MY.Garden.Webhook)
    .addUrl(MY.Garden.unsubscribeWith, unsubscribeEndpoint)
    .addUrl(MY.Garden.deliversTo, deliverTo)
    .addUrl(MY.Garden.subscribedTo, subscribeTo)
    .build();
}
