
import {
  getResourceAcl,
  saveAclFor,
  hasAccessibleAcl,
  createAclFromFallbackAcl,
  hasFallbackAcl,
  getFileWithAcl,
} from '@inrupt/solid-client/acl/acl';
import { setPublicResourceAccess } from '@inrupt/solid-client/acl/class';
import { Thing, UrlString } from '@inrupt/solid-client/interfaces'
import { getSourceUrl } from '@inrupt/solid-client/resource/resource'
import { getThing } from '@inrupt/solid-client/thing/thing'

import { getTitle } from './utils'
import { Garden } from './types'

export async function setPublicAccessBasedOnGarden(urls: UrlString[], garden: Garden, options: any) {
  // set perms based on garden name for now. custom gardens with custom permissions
  // will require more sophisticated access checking - the universal access
  // api may be enough for this but doesn't seem to be work
  const gardenUrl = getSourceUrl(garden)
  if (gardenUrl) {
    const publicRead = (getTitle(getThing(garden, gardenUrl) as Thing) === 'Public') ? true : false
    return Promise.all(
      urls.map(url =>
        setPublicAccess(url,
          { read: publicRead, append: false, write: false, control: false },
          options)
      )
    )
  } else {
    throw new Error("cannot set public access for a garden without a source url")
  }
}

export async function setPublicAccess(resourceUrl: UrlString, access: any, options: any) {
  const resource = await getFileWithAcl(resourceUrl, options)
  if (hasAccessibleAcl(resource)) {
    let acl = getResourceAcl(resource)
    if (!acl && hasFallbackAcl(resource)) {
      acl = createAclFromFallbackAcl(resource)
    }
    if (acl) {
      acl = setPublicResourceAccess(acl, access)
      return saveAclFor(resource, acl, options)
    } else {
      throw new Error(`could not find resource acl or fallback acl for resource: ${resourceUrl}`)
    }
  } else {
    throw new Error("getSolidDatasetWithAcl returned resource that did not pass hasAccessibleAcl, super weird, don't know what to do, bail bail bail")
  }
}
