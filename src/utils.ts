import {
  createThing,
  asUrl,
  getUrlAll,
  addUrl,
  buildThing,
  Thing,
  UrlString,
  getSourceUrl,
  SolidDataset,
  isThingLocal,
} from '@inrupt/solid-client';
import { RDF, OWL } from '@inrupt/vocab-common-rdf';
import * as uuid from 'uuid';
import { base58 } from '@scure/base';
import { UUIDString, Base58Slug, Slug, MaybeUrl } from './types';

export function uuidUrn(): UUIDString {
  // https://stackoverflow.com/questions/20342058/which-uuid-version-to-use
  return `urn:uuid:${uuid.v4()}`;
}

export function encodeBase58Slug(s: string): Base58Slug {
  return base58.encode(Buffer.from(s));
}

export function decodeBase58Slug(s: Base58Slug): string {
  return base58.decode(s).toString();
}

export function asUrlString(url: MaybeUrl): string {
  return typeof url === 'string' ? url : url.value;
}

export function isUUID(maybeUrl: MaybeUrl): boolean {
  const url = new URL(asUrlString(maybeUrl));
  return (
    url.protocol == 'urn:' &&
    url.pathname.indexOf('uuid:') == 0 &&
    uuid.validate(url.pathname.substring(5))
  );
}

export function addUUID(thing: Thing): Thing {
  return addUrl(thing, OWL.sameAs, uuidUrn());
}

export function getUUID(thing: Thing): UUIDString | null {
  if (!isThingLocal(thing)) {
    const url = asUrl(thing);
    if (isUUID(url)) {
      return url;
    }
  }

  return getUrlAll(thing, OWL.sameAs).find(isUUID) || null;
}

export function ensureUUID(thing: Thing): Thing {
  if (getUUID(thing)) {
    return thing;
  } else {
    return addUUID(thing);
  }
}

export function createThingWithUUID(): Thing {
  return createThing({ url: uuidUrn() });
}

export function slugToUrl(
  resourceOrUrl: SolidDataset | UrlString,
  slug: Slug
): UrlString | null {
  const url =
    typeof resourceOrUrl === 'string'
      ? resourceOrUrl
      : getSourceUrl(resourceOrUrl);
  return url && new URL(`#${slug}`, url).toString();
}

export function createPtr(slug: Slug, uuid: UUIDString) {
  return buildThing(createThing({ name: slug }))
    .addUrl(OWL.sameAs, uuid)
    .build();
}

export function hasRDFTypes(thing: Thing, ts: MaybeUrl[]) {
  const types = getUrlAll(thing, RDF.type);
  let hasAllTypes = true;
  for (let t of ts) {
    hasAllTypes = hasAllTypes && types.includes(asUrlString(t));
  }
  return hasAllTypes;
}

export function hasRDFType(thing: Thing, t: MaybeUrl) {
  return hasRDFTypes(thing, [t]);
}

export function addRDFTypes(thing: Thing, ts: MaybeUrl[]) {
  for (const t of ts) {
    thing = addRDFType(thing, t);
  }
  return thing;
};

export function addRDFType(thing: Thing, t: MaybeUrl) {
  return addUrl(thing, RDF.type, t);
};