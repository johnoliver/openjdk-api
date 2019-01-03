const fs = require('fs');
const Q = require('q');
const GitHubFileCache = require('../app/lib/github_file_cache');

module.exports = (jdkVersions, releaseTypes) => {

  const apiDataStore = loadMockApiData();

  const cacheMock = new GitHubFileCache();

  cacheMock.cachedGet = (url) => {
    const urlRe = new RegExp(/https:\/\/api.github.com\/repos\/AdoptOpenJDK\/(\w*)-(openj9)?(?:-)?(\w*)\/releases\?per_page=10000/);
    const urlVars = urlRe.exec(url);

    const version = urlVars[1];
    const openJ9Str = urlVars[2];
    const releaseType = urlVars[3];

    const isOpenJ9 = !!openJ9Str;
    const releaseStr = isOpenJ9 ? `${version}-${openJ9Str}-${releaseType}` : `${version}-${releaseType}`;

    const deferred = Q.defer();
    const apiData = apiDataStore[releaseStr];
    if (apiData) {
      deferred.resolve(apiData);
    } else {
      return deferred.reject(`Could not match release string '${releaseStr}' for URL '${url}'`);
    }

    return deferred.promise;
  }

  function loadMockApiData() {
    const newRepoReleaseStrs = [];
    const oldRepoReleaseStrs = [];

    jdkVersions.forEach(version => {
      newRepoReleaseStrs.push(`${version}-binaries`);
      releaseTypes.forEach(type => {
        oldRepoReleaseStrs.push(`${version}-${type}`);
        oldRepoReleaseStrs.push(`${version}-openj9-${type}`);
      });
    });

    const apiDataStore = {};

    newRepoReleaseStrs.forEach(releaseStr => {
      const path = `./test/asset/githubApiMocks/newRepo/${releaseStr}.json`;
      apiDataStore[releaseStr] = JSON.parse(fs.readFileSync(path, {encoding: 'UTF-8'}))
    });

    oldRepoReleaseStrs.forEach(releaseStr => {
      const path = `./test/asset/githubApiMocks/oldRepo/${releaseStr}.json`;
      apiDataStore[releaseStr] = JSON.parse(fs.readFileSync(path, {encoding: 'UTF-8'}))
    });

    return apiDataStore;
  }

  return cacheMock
}