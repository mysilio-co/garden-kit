import namespace from '@rdfjs/namespace'

const g = namespace('https://vocab.mysilio.com/my/garden#');
export const MY = {
  // The namespace library will automatically generate terms based on the property name
  // i.e. MY.scratch.fooo will be a NamedNode representing `.../scratch#fooo`
  scratch: namespace('https://vocab.mysilio.com/my/scratch#'),
  // We manually list all expected Garden vocab termns as a (very) basic error check against typoes
  // and to give others a quick and easy place to see all existing terms before creating a new one.
  Garden: {
    holdsSpace: g`holdsSpace`, // webId holdsSpace Space. Admin of Space. Typically the owner of the webid where the gardens are stored.
    memberOf: g`memberOf`, // webId memberOf Space. Member of Space. Typically used on the profile card to indicate Spaces they wish to be a member of.

    Space: g`Space`, // A Space for community gardening on the web. May contain Gardens, and members (webids). Related: https://www.w3.org/ns/pim/space#
    hasMember: g`hasMember`, // Space hasMember webId. Member of Space. Typically used on the Space to denote the list of members allowed.
    hasGarden: g`hasGarden`, // Space hasGarden Garden. A space may have many Gardens. Not all Gardens have to exist in the same pod.

    Garden: g`Garden`, // A Garden for community content. Contains Concepts,
    inSpace: g`inSpace`,

    rootStorage: g`rootStorage`,
    imageStorage: g`imageStorage`,
    fileStorage: g`fileStorage`,
    noteStorage: g`noteStorage`,

    Concept: g`Concept`,
    mentions: g`mentions`,
    tagged: g`tagged`,
    references: g`references`,

    Image: g`Image`,
    File: g`File`,
    Note: g`Note`,
    storedAt: g`storedAt`,
    Bookmark: g`Bookmark`,
    Person: g`Person`,

    Collection: g`Collection`,
  },
};