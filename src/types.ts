import {
  Thing,
  SolidDataset,
  Url,
  UrlString,
  WebId,
  Access,
} from '@inrupt/solid-client'

export type Urn = Url
export type UUID = Urn

export type UrnString = UrlString
export type UUIDString = UrnString

export type MaybeUrl = Url | UrlString
export type MaybeUrn = Urn | UrnString
export type MaybeUUID = UUID | UUIDString

// a web-safe string that can be used in a url hash
export type Slug = string
export type Base58Slug = Slug

export type Profile = Thing
export type AppSettings = Thing
export type WebhookConfig = Thing

export type Space = Thing
export type SpacePreferences = SolidDataset
export type SpacePreferencesFile = UrlString
export type Container = UrlString

export type Garden = SolidDataset
export type GardenSettings = Thing
export type GardenFile = UrlString

export type GardenItem = Thing
export type GardenItemType =
  | 'note'
  | 'file'
  | 'image'
  | 'bookmark'
  | 'person'
  | 'collection'
export type Concept = GardenItem
export type Collection = GardenItem
// prefixed with Garden to avoid type conflicts with default TS types for File, etc
export type NoteConcept = Concept
export type ImageConcept = Concept
export type FileConcept = Concept
export type BookmarkConcept = Concept
export type PersonConcept = Concept
export type NoteBody = SolidDataset

export type AccessConfig = PublicAccessConfig | AgentAccessConfig
export type PublicAccessConfig = {
  public: true
  access: Access
}
export type AgentAccessConfig = {
  public?: false
  agent: WebId
  access: Access
}
