import {
  Thing,
  getThing,
  setThing,
  createSolidDataset,
  saveSolidDatasetAt,
} from '@inrupt/solid-client'

import { arrayToThings, thingsToArray } from '../src/collections'
import {
  createThingFromSlateJSOElement,
  noteThingToSlateObject,
} from '../src/note'

const noteBody = [
  { children: [{ text: 'Hi everybody!' }], type: 'h1' },
  { type: 'p', id: 1651696062634, children: [{ text: '' }] },
  { children: [{ text: '' }], type: 'h1' },
  {
    children: [
      { text: 'thanks', bold: true },
      { text: ' for coming to the ' },
      { text: 'digital gardening party', italic: true },
      { text: '.' },
    ],
    type: 'h2',
  },
  { children: [{ text: '' }], type: 'h2' },
  {
    children: [
      { text: "I'm " },
      { type: 'concept', children: [{ text: '[[Travis]]' }], name: 'Travis' },
      { text: '.' },
    ],
    type: 'h2',
  },
  { children: [{ text: '' }], type: 'h2' },
  { children: [{ text: 'This is not a cat:' }], type: 'h2' },
  { children: [{ text: '' }], type: 'h2' },
  { children: [{ text: '' }], type: 'h2' },
  {
    type: 'img',
    children: [{ text: '' }],
    url: 'https://travis.mysilio.me/public/itme/online/images/1cd18da0-6c9e-11eb-b09e-dd1bdda70e9f.jpg',
    originalUrl:
      'https://travis.mysilio.me/public/itme/online/images/1cd18da0-6c9e-11eb-b09e-dd1bdda70e9f.original.jpg',
    alt: '',
    mime: 'image/jpeg',
  },
]

describe('a JSON note body', () => {
  it('can be serialized and deserialized to and from RDF', async () => {
    const things: Thing[] = arrayToThings(
      noteBody,
      createThingFromSlateJSOElement
    )
    const listUrl = things[0].url

    let dataset = things
      .filter((x) => !!x)
      .reduce(setThing, createSolidDataset())

    // need to save this to resolve the various local references in Thing objects
    dataset = await saveSolidDatasetAt('https://example.com/note', dataset, {
      fetch: jest.fn(() =>
        Promise.resolve({
          ok: true,
          url: 'https://example.com/note',
          headers: new Headers(),
        })
      ) as jest.Mock,
    })

    const listThing = getThing(dataset, listUrl)
    const newNoteBody =
      listThing && thingsToArray(listThing, dataset, noteThingToSlateObject)
    expect(newNoteBody).toEqual(noteBody)
  })
})
