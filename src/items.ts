import {
  Concept,
  ImageConcept,
  FileConcept,
  BookmarkConcept,
  NoteConcept,
  PersonConcept,
  Collection,
  GardenItem,
  GardenItemType,
} from './types';
import {
  buildThing,
  setStringNoLocale,
  getUrl,
  setUrl,
  UrlString,
  WebId,
  Thing,
} from '@inrupt/solid-client';
import { SKOS, FOAF, DCTERMS } from '@inrupt/vocab-common-rdf';
import { MY, SIOC } from './vocab';
import {
  hasRDFType,
  createThingWithUUID,
  addRDFTypes,
  addRDFType,
  setTitle,
  setDescription,
  setDepiction
} from './utils';

interface CreateItemOptions {
  title?: string;
  description?: string;
  depiction?: UrlString;
}

interface UploadOptions {
  format?: string;
}

interface PersonOptions {
  nick?: string;
}

type CreateUploadOptions = CreateItemOptions & UploadOptions;
type CreatePersonOptions = CreateItemOptions & PersonOptions;
type Options = CreatePersonOptions & CreateUploadOptions;

export function isItem(thing: Thing): boolean {
  return hasRDFType(thing, MY.Garden.Item);
}

export function getItemType(item: GardenItem): GardenItemType | null {
  if (isNote(item)) {
    return 'note';
  } else if (isFile(item)) {
    return 'file';
  } else if (isImage(item)) {
    return 'image';
  } else if (isBookmark(item)) {
    return 'bookmark';
  } else if (isPerson(item)) {
    return 'person';
  } else if (isCollection(item)) {
    return 'collection';
  }
  return null;
}

export function isImage(concept: Concept): boolean {
  return hasRDFType(concept, MY.Garden.Image);
}

export function isFile(concept: Concept): boolean {
  return hasRDFType(concept, MY.Garden.File);
}

export function isBookmark(concept: Concept): boolean {
  return hasRDFType(concept, MY.Garden.Bookmark);
}

export function isNote(concept: Concept): boolean {
  return hasRDFType(concept, MY.Garden.Note);
}

export function isPerson(concept: Concept): boolean {
  return hasRDFType(concept, MY.Garden.Person);
}

export function isCollection(item: GardenItem): boolean {
  return hasRDFType(item, MY.Garden.Collection);
}

export function getAbout(concept: Concept): UrlString | null {
  return getUrl(concept, SIOC.about);
}

export function setAbout(concept: Concept, about: UrlString): Concept {
  return setUrl(concept, SIOC.about, about);
}

export function createItem(webId?: WebId) {
  const builder = buildThing(createThingWithUUID())
    .addDatetime(DCTERMS.created, new Date())
    .addDatetime(DCTERMS.modified, new Date());
  if (webId) {
    builder.addUrl(DCTERMS.creator, webId);
  }
  const item = addRDFType(builder.build(), MY.Garden.Item);
  return item;
}

function setOptions(item: GardenItem, options?: Options): GardenItem {
  if (options && options.title) {
    item = setTitle(item, options.title);
  }
  if (options && options.format) {
    item = setStringNoLocale(item, DCTERMS.format, options.format);
  }
  if (options && options.description) {
    item = setDescription(item, options.description);
  }
  if (options && options.depiction) {
    item = setDepiction(item, options.depiction);
  }
  if (options && options.nick) {
    item = setStringNoLocale(item, FOAF.nick, options.nick);
  }
  return item;
}

export function createConcept(
  webId: WebId,
  about: UrlString,
  options?: Options
): Concept {
  let concept = createItem(webId);
  concept = addRDFTypes(concept, [SKOS.Concept, MY.Garden.Concept]);
  if (options) {
    concept = setOptions(concept, options);
  }
  concept = setAbout(concept, about);
  return concept;
}

export function createImage(
  webId: WebId,
  about: UrlString,
  options?: CreateUploadOptions
): ImageConcept {
  let image = createConcept(webId, about, options);
  image = image && addRDFType(image, MY.Garden.Image);
  return image;
}

export function createFile(
  webId: WebId,
  about: UrlString,
  options?: CreateUploadOptions
): FileConcept {
  let file = createConcept(webId, about, options);
  file = file && addRDFType(file, MY.Garden.File);
  return file;
}

export function createBookmark(
  webId: WebId,
  about: UrlString,
  options?: CreateItemOptions
): BookmarkConcept {
  let bookmark = createConcept(webId, about, options);
  bookmark = bookmark && addRDFType(bookmark, MY.Garden.Bookmark);
  return bookmark;
}

export function createNote(
  webId: WebId,
  about: UrlString,
  options?: CreateItemOptions
): NoteConcept {
  let note = createConcept(webId, about, options);
  note = note && addRDFType(note, MY.Garden.Note);
  return note;
}

export function createPerson(
  webId: WebId,
  about: WebId,
  options?: CreatePersonOptions
): PersonConcept {
  let person = createConcept(webId, about, options);
  person = addRDFType(person, MY.Garden.Person);
  return person;
}

export function createCollection(
  webId: WebId,
  options?: CreateItemOptions
): Collection {
  let collection = createItem(webId);
  if (options) {
    collection = setOptions(collection, options);
  }
  collection = addRDFTypes(collection, [SKOS.Collection, MY.Garden.Collection]);
  return collection;
}
