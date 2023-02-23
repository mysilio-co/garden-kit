import { SolidDataset, Thing, Url } from '@inrupt/solid-client/interfaces'
import {
  saveSolidDatasetAt,
  createSolidDataset,
} from '@inrupt/solid-client/resource/solidDataset'
import {
  getThing,
  createThing,
  setThing,
} from '@inrupt/solid-client/thing/thing'
import {
  setInteger,
  setUrl,
  setDecimal,
  setStringNoLocale,
  setBoolean,
} from '@inrupt/solid-client/thing/set'
import {
  getStringNoLocale,
  getInteger,
  getBoolean,
  getUrl,
} from '@inrupt/solid-client/thing/get'
import { addUrl } from '@inrupt/solid-client/thing/add'
import * as uuid from 'uuid'

import { arrayToThings, thingsToArray } from './collections'
import { noteNS, noteNSUrl, MY } from './vocab'
import { getUrlExpandLocalHash } from './utils'
import { Space } from './types'
import { getNoteStorage } from './spaces'

export const EmptySlateJSON = [{ children: [{ text: '' }] }]

export function newNoteResourceName(space: Space) {
  return `${getNoteStorage(space)}${uuid.v4()}.ttl`
}

export async function createNoteInSpace(
  space: Space,
  noteValue: any,
  options: any
) {
  const newNoteResourceUrl = newNoteResourceName(space)
  const noteThingName = 'note'

  const noteBodyThings = arrayToThings(
    noteValue || EmptySlateJSON,
    createThingFromSlateJSOElement
  )
  let noteBodyResource = noteBodyThings.reduce(
    (m, t) => (t ? setThing(m, t) : m),
    createSolidDataset()
  )
  let noteThing = createThing({ name: noteThingName })
  noteThing = setUrl(noteThing, MY.Garden.noteValue, noteBodyThings[0])
  noteBodyResource = setThing(noteBodyResource, noteThing)
  await saveSolidDatasetAt(newNoteResourceUrl, noteBodyResource, options)
  return `${newNoteResourceUrl}#${noteThingName}`
}

export function getNoteValue(note: Thing) {
  return getUrl(note, MY.Garden.noteValue)
}

function addKeyValToThing(
  thing: Thing,
  key: string | Url,
  value: any,
  path: number[]
): Thing[] {
  if (Array.isArray(value)) {
    const [arrayThing, ...restOfThings] = arrayToThings(
      value,
      createThingFromSlateJSOElement,
      [...path, 0]
    )
    if (arrayThing) {
      return [addUrl(thing, key, arrayThing), arrayThing, ...restOfThings]
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

export function createThingFromSlateJSOElement(
  o: any,
  path: number[]
): Thing[] {
  const thing = createThing({
    name: o.id ? `${o.id}` : `el-${path.join('-')}`,
  })
  const otherThings = Object.keys(o).reduce(
    (m: Thing[], k: string) => {
      const [mThing, ...mRest] = m
      const [thing, ...restOfThings] = addKeyValToThing(
        mThing,
        noteNS(k),
        o[k],
        path
      )
      return [thing, ...mRest, ...restOfThings]
    },
    [thing]
  )
  return [thing, ...otherThings]
}

function childrenArrayFromDataset(dataset: SolidDataset, childrenUrl: string) {
  const thing = getThing(dataset, childrenUrl)

  if (thing) {
    return thingsToArray(thing, dataset, noteThingToSlateObject)
  } else {
    return []
  }
}

const childrenPred = noteNS('children')
export function noteThingToSlateObject(thing: Thing, dataset: SolidDataset) {
  const obj: any = {}
  for (const pred in thing.predicates) {
    const [, key] = pred.split(noteNSUrl)
    if (key) {
      if (key === 'children') {
        const children = getUrlExpandLocalHash(thing, childrenPred)
        if (children) obj.children = childrenArrayFromDataset(dataset, children)
      } else {
        const literals = thing.predicates[pred].literals
        // currently just uses the first literal it can find
        if (literals) {
          if (literals['http://www.w3.org/2001/XMLSchema#string']) {
            const str = getStringNoLocale(thing, pred)
            if (str || str === '') obj[key] = str
          } else if (literals['http://www.w3.org/2001/XMLSchema#boolean']) {
            const bool = getBoolean(thing, pred)
            if (bool === true || bool === false) obj[key] = bool
          } else if (literals['http://www.w3.org/2001/XMLSchema#integer']) {
            const n = getInteger(thing, pred)
            if (n) obj[key] = n
          }
        }
      }
    }
  }

  return obj
}
