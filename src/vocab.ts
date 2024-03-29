import namespace from '@rdfjs/namespace'

const g = namespace('https://vocab.mysilio.com/my/garden#')
export const noteNSUrl = 'https://vocab.mysilio.com/my/note#'
export const noteNS = namespace(noteNSUrl)
export const MY = {
  // The namespace library will automatically generate terms based on the property name
  // i.e. MY.scratch.fooo will be a NamedNode representing `.../scratch#fooo`
  scratch: namespace('https://vocab.mysilio.com/my/scratch#'),
  // We manually list all expected Garden vocab termns as a (very) basic error check against typoes
  // and to give others a quick and easy place to see all existing terms before creating a new one.
  Garden: {
    hasMetaSpace: g`hasMetaSpace`, // webId hasMetaSpace Space. For designating a Space as the Meta Space (the Space where other Spaces are stored)
    hasPodSpace: g`hasPodSpace`, // webId hasPodSpace Space. For designating a Space as the Pod Space (the Space representing the full Pod)
    holdsSpace: g`holdsSpace`, // webId holdsSpace Space. Admin of Space. Typically the owner of the webid where the gardens are stored.
    memberOf: g`memberOf`, // webId memberOf Space. Member of Space. Typically used on the profile card to indicate Spaces they wish to be a member of.

    MetaSpace: g`MetaSpace`, // A Space for community gardening on the web. May contain Gardens, and members (webids). Related: https://www.w3.org/ns/pim/space#
    Space: g`Space`, // A Space for community gardening on the web. May contain Gardens, and members (webids). Related: https://www.w3.org/ns/pim/space#
    holder: g`holder`, // Space holder WebId. Inverse of holdsSpace
    hasMember: g`hasMember`, // Space hasMember webId. Member of Space. Typically used on the Space to denote the list of members allowed.
    hasGarden: g`hasGarden`, // Space hasGarden Garden. A space may have many Gardens. Not all Gardens have to exist in the same pod.
    hasNursery: g`hasNursery`, // Space hasNursery Garden. A special kind of Garden, the Nursery, where new ideas go to blossom
    hasCompost: g`hasCompost`, // Space hasCompost Garden. A special kind of Garden, the Compost, where old ideas go to be composted
    hasPublic: g`hasPublic`, // Space hasPublic Garden. The user's default public (ie, public read, owner-only write) garden.
    hasPrivate: g`hasPrivate`, // Space hasPrivate Garden. The user's default private (ie, owner-only read/write) garden.
    hasManifest: g`hasManifest`, // Space hasManifest Manifest. A Manifest is a Resrouce that stores configuration data meant to be used by a machine.
    hasGnomesManifest: g`hasGnomesManifest`, // Space hasGnomesManifest Manifest. A machine-readable Manifest for Publications
    hasPublicationsManifest: g`hasPublicationsManifest`, // Space hasPublicationsManifest Manifest. A machine-readable Manifest for Gnomes
    spaceSlug: g`spaceSlug`, // Space has a slug, used in URLs and as the thing identifier

    Manifest: g`Manifest`, // A Resource for configuration data needed by services and bots, like Gnomes and Publications.
    Garden: g`Garden`, // A Resource for community content.

    imageStorage: g`imageStorage`, // a subclass of WS.storage for image files
    fileStorage: g`fileStorage`, // a subclass of WS.storage for downloadable files
    noteStorage: g`noteStorage`, // a subclass of WS.storage for rich text notes

    Item: g`Item`,
    Concept: g`Concept`,
    mentions: g`mentions`,
    tagged: g`tagged`,
    emojis: g`emojis`,
    references: g`references`,
    image: g`image`,
    file: g`file`,
    bookmark: g`bookmark`,
    note: g`note`,

    Image: g`Image`,
    File: g`File`,
    Note: g`Note`,
    noteValue: g`noteValue`, // Note noteValue. The value of the note's body - should be deserializable to a Slate.js value
    Bookmark: g`Bookmark`,
    Person: g`Person`,

    Collection: g`Collection`,

    Webhook: g`Webhook`, // an RDF Type representing a configured Webhook.
    subscribedTo: g`subscribedTo`, // a property of a Webhookd that indicates which Resource URL the Webhook is currently subscribed to.
    deliversTo: g`deliversTo`, // a property of a Webhook that indicates what URL the Webhook delivers notifications to.
    unsubscribeWith: g`unsubscribeWith`, // a property of a Webhook that indicates what URL to unsubscribe from this webhook with.

    hasFuseIndex: g`hasFuseIndex`, // a link to a saved json index for use with Fuse.js
  },
}

const sioc = namespace('http://rdfs.org/sioc/ns#')
export const SIOC = {
  Community: sioc`Community`,
  Site: sioc`Site`,

  Forum: sioc`Forum`,
  Container: sioc`Container`,
  has_subscriber: sioc`has_subscriber`,
  has_moderator: sioc`has_moderator`,
  container_of: sioc`container_of`,
  about: sioc`about`,

  Post: sioc`Post`,
  Item: sioc`Item`,
  content: sioc`content`,
  has_creator: sioc`has_creator`,
  has_container: sioc`has_container`,

  User: sioc`User`,
  account_of: sioc`account_of`, // webId
  subscriber_of: sioc`subscriber_of`, // Container
  moderator_of: sioc`moderator_of`, // Container
  creator_of: sioc`creatpr_of`, // Item
  email: sioc`email`,
}
