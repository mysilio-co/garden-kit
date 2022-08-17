
import {
  getResourceAcl,
  setPublicResourceAccess,
  UrlString,
  saveAclFor,
  hasAccessibleAcl,
  createAclFromFallbackAcl,
  hasFallbackAcl,
  getFileWithAcl
} from '@inrupt/solid-client';


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