import {
  SolidDataset,
  Thing,
  getThing,
  createThing,
  addUrl,
  setInteger,
  setDecimal,
  setStringNoLocale,
  setBoolean,
  getStringNoLocale,
  getInteger,
  getBoolean,
  getUrl,
  Url
} from '@inrupt/solid-client';

import { arrayToThings, thingsToArray } from './collections';
import { noteNS, noteNSUrl } from './vocab'

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
    );
    if (arrayThing) {
      return [addUrl(thing, key, arrayThing), arrayThing, ...restOfThings];
    } else {
      // TODO: is this the right thing to do? arrayThing should never be falsy so maybe throw an error?
      return [];
    }
  } else {
    switch (typeof value) {
      case 'string':
        return [setStringNoLocale(thing, key, value)];
      case 'boolean':
        return [setBoolean(thing, key, value)];
      case 'number':
        if (Number.isInteger(value)) {
          return [setInteger(thing, key, value)];
        } else {
          return [setDecimal(thing, key, value)];
        }
      default:
        return [thing];
    }
  }
}

export function createThingFromSlateJSOElement(
  o: any,
  path: number[]
): Thing[] {
  const thing = createThing({
    name: o.id ? `${o.id}` : `el-${path.join('-')}`,
  });
  const otherThings = Object.keys(o).reduce(
    (m: Thing[], k: string) => {
      const [mThing, ...mRest] = m;
      const [thing, ...restOfThings] = addKeyValToThing(
        mThing,
        noteNS(k),
        o[k],
        path
      );
      return [thing, ...mRest, ...restOfThings];
    },
    [thing]
  );
  return [thing, ...otherThings];
}

function childrenArrayFromDataset(dataset: SolidDataset, childrenUrl: string) {
  const thing = getThing(dataset, childrenUrl);

  if (thing) {
    return thingsToArray(thing, dataset, noteThingToSlateObject);
  } else {
    return [];
  }
}

const childrenPred = noteNS('children');
export function noteThingToSlateObject(thing: Thing, dataset: SolidDataset) {
  const obj: any = {};
  for (const pred in thing.predicates) {
    const [, key] = pred.split(noteNSUrl);
    if (key) {
      if (key === 'children') {
        const children = getUrl(thing, childrenPred);
        if (children)
          obj.children = childrenArrayFromDataset(dataset, children);
      } else {
        const literals = thing.predicates[pred].literals;
        // currently just uses the first literal it can find
        if (literals) {
          if (literals['http://www.w3.org/2001/XMLSchema#string']) {
            const str = getStringNoLocale(thing, pred);
            if (str || str === '') obj[key] = str;
          } else if (literals['http://www.w3.org/2001/XMLSchema#boolean']) {
            const bool = getBoolean(thing, pred);
            if (bool === true || bool === false) obj[key] = bool;
          } else if (literals['http://www.w3.org/2001/XMLSchema#integer']) {
            const n = getInteger(thing, pred);
            if (n) obj[key] = n;
          }
        }
      }
    }
  }

  return obj;
}
