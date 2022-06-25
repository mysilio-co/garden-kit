import {
  SolidDataset, Thing,
  getThing, buildThing, createThing, setThing,
  createSolidDataset,
  addUrl,
  setInteger, setDecimal, setStringNoLocale, setBoolean,
  getStringNoLocale, getInteger, getBoolean, getUrl,
  saveSolidDatasetAt,
} from '@inrupt/solid-client';
import { createNS } from "@ontologies/core"
import { first, rest, nil } from '@ontologies/rdf'

const noteBody = [{ "children": [{ "text": "Hi everybody!" }], "type": "h1" }, { "type": "p", "id": 1651696062634, "children": [{ "text": "" }] }, { "children": [{ "text": "" }], "type": "h1" }, { "children": [{ "text": "thanks", "bold": true }, { "text": " for coming to the " }, { "text": "digital gardening party", "italic": true }, { "text": "." }], "type": "h2" }, { "children": [{ "text": "" }], "type": "h2" }, { "children": [{ "text": "I'm " }, { "type": "concept", "children": [{ "text": "[[Travis]]" }], "name": "Travis" }, { "text": "." }], "type": "h2" }, { "children": [{ "text": "" }], "type": "h2" }, { "children": [{ "text": "This is not a cat:" }], "type": "h2" }, { "children": [{ "text": "" }], "type": "h2" }, { "children": [{ "text": "" }], "type": "h2" }, { "type": "img", "children": [{ "text": "" }], "url": "https://travis.mysilio.me/public/itme/online/images/1cd18da0-6c9e-11eb-b09e-dd1bdda70e9f.jpg", "originalUrl": "https://travis.mysilio.me/public/itme/online/images/1cd18da0-6c9e-11eb-b09e-dd1bdda70e9f.original.jpg", "alt": "", "mime": "image/jpeg" }]
const noteNSUrl = "https://mysilio.garden/ontologies/note#"
const noteNS = createNS(noteNSUrl)

function addKeyValToThing(thing: Thing, key: string, value: any, path: number[]): Thing[] {
  if (Array.isArray(value)) {
    const [arrayThing, ...restOfThings] = slateArrayToThings(value, [...path, 0])
    if (arrayThing) {
      return [
        addUrl(thing, key, arrayThing),
        arrayThing,
        ...restOfThings
      ]
    } else {
      // TODO: is this the right thing to do? arrayThing should never be falsy so maybe throw an error?
      return []
    }
  } else {

    switch (typeof value) {
      case 'string':
        return [setStringNoLocale(thing, key, value)]
      case 'boolean':
        return [setBoolean(thing, key, value)]
      case 'number':
        if (Number.isInteger(value)) {
          return [setInteger(thing, key, value)]
        } else {
          return [setDecimal(thing, key, value)]
        }
      default:
        return [thing]
    }
  }

}

function createThingFromSlateJSOElement(o: object, path: number[]): Thing[] {
  const thing = createThing({ name: ((o as any).id ? `${(o as any).id}` : `el-${path.join("-")}`) })
  const otherThings = Object.keys(o).reduce((m: Thing[], k: string) => {
    const [mThing, ...mRest] = m;
    const [thing, ...restOfThings] = addKeyValToThing(mThing, noteNS(k).value, (o as any)[k], path)
    return [thing, ...mRest, ...restOfThings]
  }, [thing])
  return [thing, ...otherThings]
}

function slateArrayToThings(slateArray: object[], path: number[] = [0]): Thing[] {
  const [el, ...restOfEls] = slateArray
  const last = path[path.length - 1]
  const [listElementThing, ...listElementSubThings] = createThingFromSlateJSOElement(el, path)
  const [nextListThing, ...nextListSubThings] = (restOfEls.length > 0) ? slateArrayToThings(restOfEls, [...path.slice(0, path.length - 1), last + 1]) : []
  const listThing = buildThing(createThing({ name: `li-${path.join("-")}` }))
    .addUrl(first.value, listElementThing)
    .addUrl(rest.value, nextListThing || nil.value)
    .build()

  return [listThing, listElementThing, ...listElementSubThings, nextListThing, ...nextListSubThings]
}

function childrenArrayFromDataset(dataset: SolidDataset, childrenUrl: string) {
  const thing = getThing(dataset, childrenUrl);

  if (thing) {
    return thingsToSlateArray(thing, dataset)
  } else {
    return []
  }
}

const typePred = noteNS('type')
const childrenPred = noteNS('children')
const textPred = noteNS('text')
const idPred = noteNS('id')
const altPred = noteNS('alt')
const mimePred = noteNS('mime')
const originalUrlPred = noteNS('originalUrl')
const urlPred = noteNS('url')
const namePred = noteNS('name')
const boldPred = noteNS('bold')
const italicPred = noteNS('italic')

function thingToSlateObject(thing: Thing, dataset: SolidDataset) {
  const obj = {}
  const type = getStringNoLocale(thing, typePred.value)
  if (type) (obj as any).type = type
  const text = getStringNoLocale(thing, textPred.value)
  if (text || (text === "")) (obj as any).text = text
  const id = getInteger(thing, idPred.value)
  if (id) (obj as any).id = id
  const children = getUrl(thing, childrenPred.value)
  if (children) (obj as any).children = childrenArrayFromDataset(dataset, children)

  // image

  const alt = getStringNoLocale(thing, altPred.value)
  if (alt || (alt === "")) (obj as any).alt = alt
  const mime = getStringNoLocale(thing, mimePred.value)
  if (mime) (obj as any).mime = mime
  const originalUrl = getStringNoLocale(thing, originalUrlPred.value)
  if (originalUrl) (obj as any).originalUrl = originalUrl
  const url = getStringNoLocale(thing, urlPred.value)
  if (url) (obj as any).url = url

  // concept
  const name = getStringNoLocale(thing, namePred.value)
  if (name) (obj as any).name = name

  // marks
  const bold = getBoolean(thing, boldPred.value)
  if (bold) (obj as any).bold = bold
  const italic = getBoolean(thing, italicPred.value)
  if (italic) (obj as any).italic = italic
  return obj
}

function thingsToSlateArray(thing: Thing, dataset: SolidDataset): object[] {
  const restValue = getUrl(thing, rest.value)
  const restThing = (restValue && (restValue !== nil.value)) && getThing(dataset, restValue)
  const firstThing = getThing(dataset, getUrl(thing, first.value))
  const firstElement = firstThing && thingToSlateObject(firstThing, dataset)
  return firstElement ? [
    firstElement,
    ...(restThing ? thingsToSlateArray(restThing, dataset) : [])
  ] : []
}



describe('a JSON note body', () => {
  it('can be serialized and deserialized to and from RDF', async () => {
    const things: Thing[] = slateArrayToThings(noteBody)
    const listUrl = things[0].url

    let dataset = things.filter(x => !!x).reduce(setThing, createSolidDataset())

    // need to save this to resolve the various local references in Thing objects
    dataset = await saveSolidDatasetAt("https://example.com/note", dataset, {
      fetch: jest.fn(() =>
        Promise.resolve({
          ok: true,
          url: "https://example.com/note",
          headers: new Headers(),
        }),
      ) as jest.Mock
    })

    const listThing = getThing(dataset, listUrl)
    const newNoteBody = listThing && thingsToSlateArray(listThing, dataset)
    expect(newNoteBody).toEqual(noteBody);
  });
});
