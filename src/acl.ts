import {
  getResourceAcl,
  saveAclFor,
  hasAccessibleAcl,
  createAclFromFallbackAcl,
  hasFallbackAcl,
  getFileWithAcl,
  getResourceInfoWithAcl,
  hasResourceAcl,
  createAcl,
  Access,
} from '@inrupt/solid-client/acl/acl';
import {
  setPublicDefaultAccess,
  setPublicResourceAccess,
} from '@inrupt/solid-client/acl/class';
import { Thing, UrlString } from '@inrupt/solid-client/interfaces';
import {
  FetchError,
  getSourceUrl,
} from '@inrupt/solid-client/resource/resource';
import { getThing } from '@inrupt/solid-client/thing/thing';

import { getTitle } from './utils';
import { AccessConfig, Garden } from './types';
import {
  overwriteFile,
  setAgentDefaultAccess,
  setAgentResourceAccess,
} from '@inrupt/solid-client';

export async function setPublicAccessBasedOnGarden(
  urls: UrlString[],
  garden: Garden,
  options: any
) {
  // set perms based on garden name for now. custom gardens with custom permissions
  // will require more sophisticated access checking - the universal access
  // api may be enough for this but doesn't seem to be work
  const gardenUrl = getSourceUrl(garden);
  if (gardenUrl) {
    const publicRead =
      getTitle(getThing(garden, gardenUrl) as Thing) === 'Public'
        ? true
        : false;
    return Promise.all(
      urls.map((url) =>
        setPublicAccess(
          url,
          { read: publicRead, append: false, write: false, control: false },
          options
        )
      )
    );
  } else {
    throw new Error(
      'cannot set public access for a garden without a source url'
    );
  }
}

export async function setAccess(
  resourceUrl: UrlString,
  access: AccessConfig,
  options: any
) {
  if (resourceUrl) {
    let resourceWithAcl;
    try {
      resourceWithAcl = await getFileWithAcl(resourceUrl, options);
    } catch (e) {
      if (e instanceof FetchError && e.statusCode === 404) {
        // create empty file
        await overwriteFile(resourceUrl, new Blob([]), options);
        resourceWithAcl = await getResourceInfoWithAcl(resourceUrl, options);
      } else {
        throw e;
      }
    }
    let acl;
    if (!hasAccessibleAcl(resourceWithAcl)) {
      throw new Error(
        'The current user does not have permission to change access rights to this Resource.'
      );
    } else if (hasResourceAcl(resourceWithAcl)) {
      acl = getResourceAcl(resourceWithAcl);
    } else if (hasFallbackAcl(resourceWithAcl)) {
      acl = createAclFromFallbackAcl(resourceWithAcl);
    } else {
      acl = createAcl(resourceWithAcl);
    }
    // In most cases, we want to set both the default access for a folder
    // and the resource access to the container itself.
    if (access.public) {
      acl = setPublicDefaultAccess(acl, options.default.access);
      acl = setPublicResourceAccess(acl, options.default.access);
    } else {
      acl = setAgentDefaultAccess(acl, access.agent, access.access);
      acl = setAgentResourceAccess(
        acl,
        options.default.agent,
        options.default.access
      );
    }
    await saveAclFor(resourceWithAcl, acl, options);
  } else {
    throw new Error('Cannot ensureAcl for unknown resource');
  }
}

export async function setAgentAccess(
  resourceUrl: UrlString,
  agent: UrlString,
  access: Access,
  options: any
) {
  return await setAccess(resourceUrl, { agent, access }, options);
}

export async function setPublicAccess(
  resourceUrl: UrlString,
  access: Access,
  options: any
) {
  return await setAccess(resourceUrl, { public: true, access }, options);
}
