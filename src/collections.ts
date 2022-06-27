
import {
  SolidDataset, Thing,
  getThing, buildThing, createThing, getUrl,
} from '@inrupt/solid-client';
import { first, rest, nil } from '@ontologies/rdf'

type JSOToThingConverter = (obj: any, path: number[]) => Thing[]

export function arrayToThings(slateArray: object[], jsoToThing: JSOToThingConverter, path: number[] = [0]): Thing[] {
  const [el, ...restOfEls] = slateArray
  const last = path[path.length - 1]
  const [listElementThing, ...listElementSubThings] = jsoToThing(el, path)
  const [nextListThing, ...nextListSubThings] = (restOfEls.length > 0) ? arrayToThings(restOfEls, jsoToThing, [...path.slice(0, path.length - 1), last + 1]) : []
  const listThing = buildThing(createThing({ name: `li-${path.join("-")}` }))
    .addUrl(first.value, listElementThing)
    .addUrl(rest.value, nextListThing || nil.value)
    .build()

  return [listThing, listElementThing, ...listElementSubThings, nextListThing, ...nextListSubThings]
}

export type ThingToJSOConvertor = (thing: Thing, dataset: SolidDataset) => any

export function thingsToArray(thing: Thing, dataset: SolidDataset, thingToSlateObject: ThingToJSOConvertor): object[] {
  const restValue = getUrl(thing, rest.value)
  const restThing = (restValue && (restValue !== nil.value)) && getThing(dataset, restValue)
  const firstUrl = getUrl(thing, first.value)
  const firstThing = firstUrl && getThing(dataset, firstUrl)
  const firstElement = firstThing && thingToSlateObject(firstThing, dataset)
  return firstElement ? [
    firstElement,
    ...(restThing ? thingsToArray(restThing, dataset, thingToSlateObject) : [])
  ] : []
}