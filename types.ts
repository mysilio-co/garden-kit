import {
  Thing,
  SolidDataset,
  Iri,
  IriString,
} from '@inrupt/solid-client';

export type Urn = Iri;
export type UUID = Urn;

export type UrnString = IriString;
export type UUIDString = UrnString;

export type Profile = Thing; // The Thing stored at a WebId

export type Space = Thing;
export type SpacePreferences = SolidDataset;
export type SpacePreferencesFile = IriString;
export type Container = IriString;

export type Garden = SolidDataset;
export type GardenConfig = Thing;
export type GardenFile = IriString;

export type GardenItem = Thing;
export type Concept = GardenItem;
export type Collection = GardenItem;
// prefixed with Garden to avoid type conflicts with default TS types for File, etc
export type NoteConcept = Concept;
export type ImageConcept = Concept;
export type FileConcept = Concept;
export type BookmarkConcept = Concept;
export type PersonConcept = Concept;
export type NoteBody = SolidDataset;